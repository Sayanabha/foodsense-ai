import { useState, useRef, useEffect } from 'react'
import { askGemini } from '../lib/gemini'
import { useInventory } from '../hooks/useInventory'
import { useWasteLog } from '../hooks/useWasteLog'
import { Send, Bot, User, Loader, Database } from 'lucide-react'

const SUGGESTIONS = [
  "What should I cook today to use expiring items?",
  "How can I reduce waste this week?",
  "Which items am I over-ordering?",
  "Give me a 3-day meal plan to clear my stock",
]

export default function AIAssistantPage() {
  const { inventory, atRisk } = useInventory()
  const { thisWeekWaste, thisWeekCostLost } = useWasteLog()

  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: "Hi! I'm FoodSense AI powered by Gemini 2.5 Flash.\n\nI can see your live inventory, waste logs, and predictions. Ask me anything — I'll give you specific, actionable advice for your kitchen.",
  }])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [useContext, setUseContext] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Build live context from real Supabase data
  const liveContext = useContext ? {
    inventory_summary: {
      total_items: inventory.length,
      at_risk_items: atRisk.map(i => ({ name: i.name, qty: i.quantity, unit: i.unit, expires: i.expires_at })),
    },
    waste_this_week: { total_kg: thisWeekWaste, cost_lost_inr: thisWeekCostLost },
  } : null

  async function handleSend(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const reply = await askGemini(msg, liveContext)
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: '⚠️ Error: ' + e.message + '\n\nCheck your VITE_GEMINI_API_KEY in .env',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Context toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0.5rem 0.8rem', background: '#1a221b',
        border: '1px solid #2a352b', borderRadius: 6, fontSize: '0.7rem',
      }}>
        <Database size={12} color={useContext ? '#3ddc68' : '#4a5e4b'} />
        <span style={{ color: '#7a9980' }}>Live kitchen data:</span>
        <span style={{ color: useContext ? '#3ddc68' : '#4a5e4b' }}>
          {useContext
            ? `${inventory.length} inventory items · ₹${thisWeekCostLost.toLocaleString('en-IN')} cost lost this week`
            : 'disabled'}
        </span>
        <button
          onClick={() => setUseContext(c => !c)}
          style={{
            marginLeft: 'auto', background: 'none', border: '1px solid #2a352b',
            borderRadius: 4, padding: '0.15rem 0.5rem',
            color: '#4a5e4b', fontSize: '0.62rem', cursor: 'pointer',
          }}>
          {useContext ? 'Disable' : 'Enable'}
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10,
        background: '#0f1410', border: '1px solid #2a352b', borderRadius: 10, padding: '1rem',
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: m.role === 'user' ? '#2a352b' : '#3ddc68',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {m.role === 'user'
                ? <User size={12} color="#7a9980" />
                : <Bot size={12} color="#0a0e0b" />}
            </div>
            <div style={{
              background: m.role === 'user' ? '#1a221b' : '#202a21',
              border: '1px solid #2a352b',
              borderRadius: m.role === 'user' ? '10px 2px 10px 10px' : '2px 10px 10px 10px',
              padding: '0.6rem 0.9rem', maxWidth: '82%',
              fontSize: '0.78rem', color: '#e8f0e9', lineHeight: 1.65, whiteSpace: 'pre-wrap',
            }}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#3ddc68', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={12} color="#0a0e0b" />
            </div>
            <div style={{
              background: '#202a21', border: '1px solid #2a352b',
              borderRadius: '2px 10px 10px 10px', padding: '0.6rem 0.9rem',
              display: 'flex', gap: 6, alignItems: 'center',
            }}>
              <Loader size={12} color="#3ddc68" className="animate-spin" />
              <span style={{ fontSize: '0.72rem', color: '#7a9980' }}>Gemini is thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length < 3 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => handleSend(s)}
              style={{
                background: '#1a221b', border: '1px solid #2a352b', borderRadius: 5,
                padding: '0.3rem 0.7rem', fontSize: '0.67rem', color: '#7a9980',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#3ddc68'; e.target.style.color = '#3ddc68' }}
              onMouseLeave={e => { e.target.style.borderColor = '#2a352b'; e.target.style.color = '#7a9980' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask about your inventory, waste, menu ideas..."
          style={{
            flex: 1, background: '#1a221b', border: '1px solid #2a352b',
            borderRadius: 8, padding: '0.65rem 1rem',
            color: '#e8f0e9', fontSize: '0.78rem', outline: 'none',
            fontFamily: 'DM Mono, monospace',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = '#3ddc68'}
          onBlur={e => e.target.style.borderColor = '#2a352b'}
        />
        <button onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? '#1a221b' : '#3ddc68',
            border: 'none', borderRadius: 8, padding: '0 1rem',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}>
          <Send size={15} color={loading || !input.trim() ? '#4a5e4b' : '#0a0e0b'} />
        </button>
      </div>
    </div>
  )
}