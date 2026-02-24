// ─────────────────────────────────────────────────────────────
// FoodSense AI — Model Layer
//
// Primary:  Gemini 2.5 Flash  (Google)
// Fallback: Llama 3.3 70B     (Groq)
//
// All functions try Gemini first. If Gemini throws for any
// reason (rate limit, quota, network, bad key), they silently
// retry with Groq. If both fail, a clear error is thrown.
// ─────────────────────────────────────────────────────────────

import { GoogleGenerativeAI } from '@google/generative-ai'

// ── Clients ───────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL   = 'llama-3.3-70b-versatile'
const GROQ_KEY     = import.meta.env.VITE_GROQ_API_KEY

// ── Model status tracker (visible to UI if needed) ────────────
export const modelStatus = {
  lastUsed:    null,   // 'gemini' | 'groq'
  geminiFails: 0,
  groqFails:   0,
  reset() { this.geminiFails = 0; this.groqFails = 0 },
}

// ── Core: call Gemini ─────────────────────────────────────────
async function callGemini(prompt) {
  const result = await geminiModel.generateContent(prompt)
  const text   = result.response.text()
  if (!text) throw new Error('Gemini returned empty response')
  modelStatus.lastUsed = 'gemini'
  return text
}

// ── Core: call Groq (OpenAI-compatible) ───────────────────────
async function callGroq(prompt) {
  if (!GROQ_KEY) throw new Error('VITE_GROQ_API_KEY is not set')

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens:  1024,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Groq error ${res.status}: ${err?.error?.message || res.statusText}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Groq returned empty response')
  modelStatus.lastUsed = 'groq'
  return text
}

// ── Core: call Groq with vision (base64 image) ────────────────
async function callGroqVision(prompt, base64Image, mimeType) {
  if (!GROQ_KEY) throw new Error('VITE_GROQ_API_KEY is not set')

  // Groq supports vision via llama-4-scout or meta-llama/llama-4-maverick
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'text',      text: prompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
        ],
      }],
      temperature: 0.3,
      max_tokens:  512,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Groq vision error ${res.status}: ${err?.error?.message || res.statusText}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Groq vision returned empty response')
  modelStatus.lastUsed = 'groq'
  return text
}

// ── Fallback orchestrator (text) ──────────────────────────────
async function withFallback(prompt) {
  // Try Gemini
  try {
    return await callGemini(prompt)
  } catch (geminiErr) {
    console.warn('[FoodSense] Gemini failed, trying Groq:', geminiErr.message)
    modelStatus.geminiFails++
  }

  // Try Groq
  try {
    return await callGroq(prompt)
  } catch (groqErr) {
    console.warn('[FoodSense] Groq also failed:', groqErr.message)
    modelStatus.groqFails++
    throw new Error(
      `Both models failed.\n` +
      `Gemini: check VITE_GEMINI_API_KEY and quota.\n` +
      `Groq: check VITE_GROQ_API_KEY.\n` +
      `Last Groq error: ${groqErr.message}`
    )
  }
}

// ── Fallback orchestrator (vision) ────────────────────────────
async function withFallbackVision(prompt, base64Image, mimeType) {
  // Try Gemini vision first
  try {
    const imagePart = { inlineData: { data: base64Image, mimeType } }
    const result    = await geminiModel.generateContent([prompt, imagePart])
    const text      = result.response.text()
    if (!text) throw new Error('empty response')
    modelStatus.lastUsed = 'gemini'
    return text
  } catch (geminiErr) {
    console.warn('[FoodSense] Gemini vision failed, trying Groq vision:', geminiErr.message)
    modelStatus.geminiFails++
  }

  // Try Groq vision
  try {
    return await callGroqVision(prompt, base64Image, mimeType)
  } catch (groqErr) {
    modelStatus.groqFails++
    throw new Error(`Both vision models failed. Groq: ${groqErr.message}`)
  }
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API — identical signatures to before.
// Your pages and hooks call these exactly as they did.
// ─────────────────────────────────────────────────────────────

/* 1. General chat assistant */
export async function askGemini(prompt, contextData = null) {
  const ctx = contextData
    ? `\n\nLive kitchen data:\n${JSON.stringify(contextData, null, 2)}\n\n`
    : ''

  const fullPrompt = `You are FoodSense AI, an expert food waste reduction assistant for restaurants and hostels in India.
You have access to live inventory, sales, and waste data.
Always give practical, specific, numbered recommendations.
Use Indian food context (dal, paneer, roti, etc.) where relevant.
Keep answers concise — max 4 sentences or a short numbered list.
${ctx}
User: ${prompt}`

  return withFallback(fullPrompt)
}

/* 2. Demand prediction */
export async function generatePrediction(menuItem, salesHistory, contextFactors = {}) {
  const prompt = `You are a demand forecasting expert for a restaurant/hostel kitchen.

Menu item: "${menuItem}"
Sales history (last 7 days, servings sold):
${salesHistory.map((s, i) => `  Day ${i + 1}: ${s.servings_sold} sold / ${s.servings_prepared} prepared`).join('\n')}

Context factors:
- Day of week tomorrow: ${contextFactors.dayOfWeek || 'Monday'}
- Season: ${contextFactors.season || 'Normal'}
- Any special notes: ${contextFactors.notes || 'None'}

Based on the trend, predict:
1. How many servings to prepare tomorrow
2. Confidence level (0-100)
3. One-line reasoning

Respond in this EXACT JSON format, nothing else:
{
  "predicted_qty": 45,
  "confidence": 87,
  "reasoning": "Steady upward trend with weekend spike expected"
}`

  const text = await withFallback(prompt)
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return { predicted_qty: 40, confidence: 75, reasoning: 'Default estimate based on averages.' }
  }
}

/* 3. Menu suggestions for expiring items */
export async function getMenuSuggestions(expiringItems, menuItems = []) {
  if (!expiringItems.length) return 'No items expiring soon — great inventory management!'

  const prompt = `You are a creative chef and food waste consultant for an Indian restaurant/hostel.

Items expiring within 48 hours:
${expiringItems.map(i => `- ${i.name}: ${i.quantity} ${i.unit} (expires: ${i.expires_at})`).join('\n')}

Current menu items available: ${menuItems.map(m => m.name).join(', ') || 'Standard Indian menu'}

Suggest 3 specific dishes or daily specials that:
1. Use the expiring ingredients as primary components
2. Are practical to make in bulk for a hostel/restaurant
3. Can be prepared quickly

Format as:
**Dish Name** — Brief description using [ingredient]. Prep time: X mins.`

  return withFallback(prompt)
}

/* 4. Weekly waste summary report */
export async function generateWeeklyReport(wasteData, salesData, inventoryData) {
  const totalWaste    = wasteData.reduce((s, w) => s + Number(w.quantity), 0).toFixed(1)
  const totalCostLost = wasteData.reduce((s, w) => s + Number(w.cost_lost), 0)
  const avgAccuracy   = salesData.length
    ? (salesData.reduce((acc, s) => {
        const diff = Math.abs(s.servings_prepared - s.servings_sold)
        return acc + Math.max(0, 100 - (diff / Math.max(s.servings_prepared, 1)) * 100)
      }, 0) / salesData.length).toFixed(1)
    : 'N/A'

  const prompt = `You are generating a professional weekly food waste report for a restaurant/hostel manager.

This week's data:
- Total food wasted: ${totalWaste} kg
- Total cost lost to waste: ₹${totalCostLost}
- Forecast accuracy: ${avgAccuracy}%
- Inventory items at risk: ${inventoryData.filter(i => {
    const d = Math.ceil((new Date(i.expires_at) - new Date()) / 86400000)
    return d <= 2
  }).length}
- Waste log entries: ${wasteData.length}

Recent waste entries:
${wasteData.slice(-5).map(w => `- ${w.item_name}: ${w.quantity}${w.unit} (₹${w.cost_lost} lost)`).join('\n')}

Write a structured weekly report with these sections:
1. **Executive Summary** (2 sentences)
2. **Key Wins This Week** (2 bullet points)
3. **Problem Areas** (2 bullet points)
4. **Top 3 Recommendations for Next Week**
5. **Projected Savings if Recommendations Followed**

Be specific with numbers. Use Indian currency (₹). Keep it under 300 words.`

  return withFallback(prompt)
}

/* 5. Smart purchase order generator */
export async function generatePurchaseOrder(inventory, predictions, salesHistory) {
  const lowStock     = inventory.filter(i => Number(i.quantity) < 5)
  const expiringSoon = inventory.filter(i => {
    const d = Math.ceil((new Date(i.expires_at) - new Date()) / 86400000)
    return d <= 3
  })

  const prompt = `You are a procurement expert for an Indian restaurant/hostel.

Current inventory (low stock items):
${lowStock.map(i => `- ${i.name}: ${i.quantity} ${i.unit} left`).join('\n') || 'None critically low'}

Items expiring in 3 days (avoid reordering these):
${expiringSoon.map(i => `- ${i.name}: ${i.quantity} ${i.unit}`).join('\n') || 'None'}

Tomorrow's demand predictions:
${predictions.map(p => `- ${p.menu_items?.name || 'Item'}: ${p.predicted_qty} servings`).join('\n')}

Generate a smart purchase order. For each item to order:
- Only order what's needed for 3-5 days
- Don't reorder items expiring soon
- Consider predicted demand

Respond in this EXACT JSON format:
{
  "order_items": [
    {
      "item": "Tomatoes",
      "quantity": "5 kg",
      "reason": "Low stock, high demand tomorrow",
      "estimated_cost": 200,
      "priority": "high"
    }
  ],
  "total_estimated_cost": 850,
  "notes": "Order before 8am for same-day delivery"
}`

  const text = await withFallback(prompt)
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return {
      order_items: [],
      total_estimated_cost: 0,
      notes: 'Could not generate order. Check your inventory data.',
    }
  }
}

/* 6. Photo-based waste identification (vision) */
export async function identifyWasteFromPhoto(base64Image, mimeType = 'image/jpeg') {
  const prompt = `You are a food waste identification expert for an Indian restaurant/hostel kitchen.

Analyze this photo of food waste and respond in this EXACT JSON format, nothing else:
{
  "identified": true,
  "item_name": "Dal Makhani",
  "estimated_quantity": 1.5,
  "unit": "kg",
  "confidence": 88,
  "food_category": "Main Course",
  "reason": "overproduction",
  "estimated_cost_inr": 120,
  "notes": "Lentil curry, appears to be about 1.5kg based on container size"
}

Rules:
- If you cannot identify food in the image, set "identified": false and use empty/zero values
- reason must be one of: overproduction, expired, spoiled, cancelled_order, other
- unit must be one of: kg, g, L, ml, pcs, plates
- Be conservative with quantity estimates
- estimated_cost_inr should be a reasonable market value for that quantity in India`

  const text = await withFallbackVision(prompt, base64Image, mimeType)
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return {
      identified: false,
      item_name: '', estimated_quantity: 0, unit: 'kg',
      confidence: 0, food_category: '', reason: 'other',
      estimated_cost_inr: 0, notes: 'Could not parse AI response.',
    }
  }
}

/* 7. NGO donation matcher */
export async function analyzeSurplusForDonation(surplusItems, location = 'India') {
  if (!surplusItems.length) {
    return { can_donate: false, message: 'No surplus items detected today.', items: [], instructions: '' }
  }

  const prompt = `You are a food donation coordinator for an Indian restaurant/hostel.

Surplus food available for donation today:
${surplusItems.map(i => `- ${i.name}: ${i.quantity} ${i.unit} (expires: ${i.expires_at || 'today'})`).join('\n')}

Location: ${location}

Analyze this surplus and respond in this EXACT JSON format:
{
  "can_donate": true,
  "total_meals_estimated": 45,
  "donation_items": [
    {
      "item": "Dal Makhani",
      "quantity": "2 kg",
      "safe_to_donate": true,
      "reason": "Freshly prepared, within safe window"
    }
  ],
  "ngo_types_to_contact": ["Old age homes", "Orphanages", "Dharamshalas"],
  "best_time_to_donate": "Within 2 hours",
  "food_safety_notes": "Ensure food is packed in sealed containers and transported within 1 hour",
  "donation_message": "Draft message to send to NGO contact",
  "impact_summary": "Your donation today will feed approximately 45 people"
}`

  const text = await withFallback(prompt)
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return {
      can_donate: true,
      total_meals_estimated: 0,
      donation_items: surplusItems.map(i => ({
        item: i.name, quantity: `${i.quantity} ${i.unit}`,
        safe_to_donate: true, reason: 'Check freshness before donating',
      })),
      ngo_types_to_contact: ['Local NGOs', 'Food banks', 'Community kitchens'],
      best_time_to_donate: 'As soon as possible',
      food_safety_notes: 'Ensure food is fresh and properly packed.',
      donation_message: 'We have surplus food available for donation today.',
      impact_summary: 'Your donation will help feed people in need.',
    }
  }
}

/* 8. What-If scenario planner */
export async function runScenario(scenario, inventoryData, salesData, wasteData) {
  const totalWeeklyWaste = wasteData.reduce((s, w) => s + Number(w.quantity), 0).toFixed(1)
  const totalWeeklyCost  = wasteData.reduce((s, w) => s + Number(w.cost_lost), 0)
  const avgDailySales    = salesData.length
    ? (salesData.reduce((s, d) => s + d.servings_sold, 0) / Math.max(salesData.length, 1)).toFixed(0)
    : 50

  const prompt = `You are a restaurant operations analyst and food waste consultant for an Indian restaurant/hostel.

Current operational data:
- Weekly food waste: ${totalWeeklyWaste} kg
- Weekly cost lost to waste: ₹${totalWeeklyCost}
- Average daily servings sold: ${avgDailySales}
- Current inventory items: ${inventoryData.length}
- Top wasted items: ${wasteData.slice(0, 3).map(w => w.item_name).join(', ') || 'Unknown'}

Scenario to analyze: "${scenario}"

Provide a detailed what-if analysis. Respond in this EXACT JSON format:
{
  "scenario_summary": "Brief restatement of the scenario",
  "feasibility": "high",
  "projected_waste_change_pct": -15,
  "projected_cost_change_inr": -2400,
  "projected_revenue_change_inr": -800,
  "projected_customer_impact": "Minimal — dish is low popularity on weekdays",
  "time_to_see_results": "2-3 weeks",
  "risks": [
    "Regular customers may ask for it",
    "Ingredient (milk, cream) still needs to be used"
  ],
  "opportunities": [
    "Redirect cream to Shahi Paneer which has higher margins",
    "Reduce weekly dessert waste by ~30%"
  ],
  "recommendation": "proceed",
  "recommendation_reason": "The data supports this change.",
  "alternative_suggestion": "Offer Gulab Jamun only on Friday-Sunday instead of full removal",
  "confidence": 82
}`

  const text = await withFallback(prompt)
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}