# FoodSense AI

A food waste prediction and reduction platform for restaurants and hostels. It watches your inventory, learns your kitchen's patterns, predicts tomorrow's demand, and tells you what to cook before you end up tipping perfectly good dal into a bin at 11pm.

Built with React, Vite, Supabase, and Gemini 2.5 Flash. Hosted free. Costs nothing to run.

---

## The problem it solves

Restaurants and hostels waste somewhere between 30-40% of the food they prepare. Not because anyone wants to — but because nobody has a reliable way to know how much to cook on a Tuesday in February when there's a cricket match on and half the guests ordered in. FoodSense fixes that. It looks at your history, factors in what it knows, and gives you a number. You cook that number. Less ends up in the bin.

---

## What it does

**Demand forecasting** — Gemini 2.5 Flash analyzes your last 7 days of sales per menu item and predicts how many servings to prepare tomorrow. Not a static formula. An actual language model reasoning about your specific patterns.

**Inventory tracking** — You log what you have and when it expires. The system tells you what's at risk before it becomes compost.

**Photo waste logging** — Staff points a phone at leftover food. Gemini Vision identifies the item, estimates the quantity, and logs it. The goal was to make waste logging take less effort than throwing the food away. It does.

**NGO donation matcher** — When surplus is detected, it generates a full donation plan: what to donate, which types of organizations to contact, food safety notes, and a pre-written WhatsApp message to send. The food goes somewhere useful instead of nowhere.

**What-If scenario planner** — Before you make a decision ("what if we drop Gulab Jamun from the weekday menu?"), you run it through the planner. Gemini models the impact on waste, cost, and demand using your real data, then tells you whether to proceed, tread carefully, or just not do it.

**AI assistant** — A chat interface with your live inventory and waste data injected as context. Ask it anything. It knows what's expiring, what you've been wasting, and what the numbers look like.

**Weekly reports and purchase orders** — Gemini reads your full week of waste and sales data and writes a management report. It also generates a purchase order based on what you actually need, not what you always order.

---

## System architecture

This is a fully static frontend application. There is no backend server. That is not a compromise — it is the architecture.

```
Browser (React + Vite)
    |
    |-- Supabase (Postgres database + Auth + Realtime)
    |       |-- inventory table
    |       |-- waste_log table
    |       |-- sales_log table
    |       |-- predictions table
    |       |-- menu_items table
    |
    |-- Google Gemini API (AI inference)
            |-- gemini-2.5-flash (text + reasoning)
            |-- gemini-2.5-flash (vision, for photo logging)
```

### Why no backend

The Supabase anon key is public by design. Row Level Security policies on the database handle authorization. Gemini API keys are rate-limited by Google's free tier. Neither requires a server to mediate. Adding one would mean paying for a server, maintaining a server, and watching a server crash at the worst possible moment. The current setup scales to zero and costs nothing.

### Data flow — demand prediction

```
User clicks "Generate Predictions"
    |
    v
Fetch active menu_items from Supabase
    |
    v
For each item: fetch last 7 days of sales_log
    |
    v
Send sales history + item name to Gemini 2.5 Flash
    |
    v
Gemini returns { predicted_qty, confidence, reasoning }
    |
    v
Upsert into predictions table (keyed by menu_item_id + date)
    |
    v
Predictions page re-renders with live data
```

### Data flow — photo waste logging

```
Staff captures/uploads photo
    |
    v
FileReader converts to base64
    |
    v
base64 image + prompt sent to Gemini Vision
    |
    v
Gemini returns { item_name, estimated_quantity, unit, reason, cost_inr }
    |
    v
User reviews and edits if needed
    |
    v
Confirmed entry inserted into waste_log
```

### Data flow — real-time inventory

Supabase's Postgres changes feature is used to subscribe to the inventory table. When any row changes — from any browser, on any device — the UI updates without a page refresh. This is handled in `useInventory.js` via a Supabase channel subscription.

### Frontend structure

```
src/
  components/
    layout/       Sidebar, Topbar
    dashboard/    KPICards, DemandChart, WasteChart, InventoryTable
    ui/           Card, Badge (the only two primitives you need)
  pages/
    Dashboard       Overview with live KPIs and charts
    Predictions     Tomorrow's AI-generated forecast
    Inventory       Full stock management with add/delete
    Reports         Weekly report, menu suggestions, purchase orders, waste logger
    AIAssistant     Chat with live kitchen context injected
    PhotoWaste      Camera/upload interface for visual waste logging
    DonationMatcher Surplus analysis and NGO coordination
    ScenarioPlanner What-if modeling with real data
  hooks/
    useInventory    Fetches inventory, computes at-risk items, Realtime subscription
    useWasteLog     Fetches waste history, computes weekly totals and chart data
    usePredictions  Fetches tomorrow's predictions, computes demand chart and accuracy
    useAIPredictions Orchestrates the per-item Gemini prediction run
    useWasteLogger  Writes waste entries and sales logs to Supabase
  lib/
    supabase.js     Client initialization
    gemini.js       All Gemini API calls in one place
  context/
    ThemeContext    Light/dark mode with localStorage persistence
```

### Theme system

Both light and dark modes are implemented entirely in CSS custom properties. No JavaScript computes colors. Toggling the theme sets a `data-theme` attribute on the `<html>` element. Every color in the application is a CSS variable. Switching is instantaneous and has no flash.

### AI model

All AI features use `gemini-2.5-flash`. The choice is deliberate: it supports text and vision in the same model, has a 1 million token context window (useful for long sales histories), and the free tier gives 15 requests per minute — sufficient for a single-location restaurant with realistic usage patterns.

---

## Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | React 18 + Vite | Fast dev, static output |
| Styling | CSS custom properties + inline styles | Zero runtime, theme-aware |
| Charts | Recharts | Composable, works with CSS vars |
| Database | Supabase (Postgres) | Free tier, Realtime, no server needed |
| AI | Gemini 2.5 Flash | Text + vision, generous free tier |
| Routing | React Router v6 | Standard |
| Icons | Lucide React | Consistent, tree-shakeable |
| Hosting | Netlify | Auto-deploy from GitHub, free |

---

## Getting started

### Prerequisites

Node.js 18 or higher. A Supabase account (free). A Gemini API key from Google AI Studio (free).

### Setup

```bash
git clone https://github.com/yourusername/foodsense-ai
cd foodsense-ai
npm install
```

Create a `.env` file in the root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Run the database schema from `schema.sql` in the Supabase SQL editor. Then:

```bash
npm run dev
```

Open `http://localhost:5173`.

### Getting your keys

**Supabase:** Create a project at supabase.com. Keys are under Project Settings > API.

**Gemini:** Go to aistudio.google.com, sign in, click "Get API key". That's genuinely it.

---

## Deployment

The project deploys to Netlify automatically on every push to `main`.

```bash
git add .
git commit -m "your message"
git push
```

Netlify runs `npm run build`, publishes `dist/`, and your changes are live in about 60 seconds. Environment variables are set in the Netlify dashboard under Site Configuration > Environment Variables.

---

## Free tier limits

This application is designed to run entirely within free tiers.

| Service | Free limit | Typical usage |
|---|---|---|
| Netlify | 100GB bandwidth, 300 build minutes/month | Well under for a single location |
| Supabase | 500MB database, 2GB bandwidth/month | Sufficient for 1-2 years of data |
| Gemini | 15 requests/minute | Fine for manual prediction runs |

The only scenario where you'd hit limits is running predictions continuously in a loop, which nobody should be doing.

---

## License

MIT. Do whatever you want with it. Attribution appreciated but not required.