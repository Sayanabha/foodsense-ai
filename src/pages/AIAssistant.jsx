import { useState, useRef, useEffect } from 'react'
import { askGemini } from '../lib/gemini'
import { useInventory } from '../hooks/useInventory'
import { useWasteLog } from '../hooks/useWasteLog'
import { Send, Bot, User, Loader, Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  'What should I cook today to use expiring items?',
  'How can I reduce waste this week?',
  'Which items am I over-ordering?',
  'Give me a 3-day meal plan to clear my stock',
]

export default function AIAssistantPage() {
  const { inventory, atRisk } = useInventory()
  const { thisWeekWaste, thisWeekCostLost } = useWasteLog()

  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: "Hi! I'm FoodSense AI, powered by Gemini 2.5 Flash.\n\nI can see your live inventory and waste data. Ask me anything about your kitchen — I'll give you specific, actionable advice.",
  }])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [useCtx, setUseCtx]   = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const liveContext = useCtx ? {
    inventory: { total: inventory.length, at_risk: atRisk.map(i => ({ name: i.name, qty: i.quantity, unit: i.unit, expires: i.expires_at })) },
    waste_this_week: { total_kg: thisWeekWaste, cost_lost_inr: thisWeekCostLost },
  } : null

  async function handleSend(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages(p => [...p, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const reply = await askGemini(msg, liveContext)
      setMessages(p => [...p, { role: 'assistant', text: reply }])
    } catch (e) {
      setMessages(p => [...p, { role: 'assistant', text: '⚠️ Error: ' + e.message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="fade-in">

      {/* Context bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.5rem 0.85rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        boxShadow: 'var(--shadow-sm)',
        fontSize: '0.72rem',
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={11} color="var(--accent)" />
        </div>
        <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>Live context:</span>
        <span style={{ color: useCtx ? 'var(--accent)' : 'var(--text-3)' }}>
          {useCtx
            ? `${inventory.length} items · ₹${thisWeekCostLost.toLocaleString('en-IN')} wasted this week`
            : 'disabled — AI has no kitchen data'}
        </span>
        <button
          onClick={() => setUseCtx(c => !c)}
          style={{
            marginLeft: 'auto', background: 'none',
            border: '1px solid var(--border)', borderRadius: 6,
            padding: '0.2rem 0.6rem', color: 'var(--text-3)',
            fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'Geist, sans-serif',
          }}
        >
          {useCtx ? 'Disable' : 'Enable'}
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '0.75rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '1.25rem',
        boxShadow: 'var(--shadow)',
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', gap: '0.65rem',
            flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: m.role === 'user' ? 'var(--bg3)' : 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {m.role === 'user'
                ? <User size={13} color="var(--text-2)" />
                : <Bot  size={13} color="white" />}
            </div>
            <div style={{
              maxWidth: '78%',
              background: m.role === 'user' ? 'var(--bg2)' : 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: m.role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
              padding: '0.65rem 0.9rem',
              fontSize: '0.82rem', lineHeight: 1.65,
              color: 'var(--text)', whiteSpace: 'pre-wrap',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={13} color="white" />
            </div>
            <div style={{
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: '2px 12px 12px 12px',
              padding: '0.65rem 0.9rem',
              display: 'flex', gap: '0.5rem', alignItems: 'center',
              fontSize: '0.78rem', color: 'var(--text-3)',
            }}>
              <Loader size={13} color="var(--accent)" className="animate-spin" />
              Gemini is thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length < 3 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => handleSend(s)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '0.35rem 0.85rem',
                fontSize: '0.75rem', color: 'var(--text-2)',
                cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask about inventory, waste, menu planning..."
          style={{
            flex: 1, background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10, padding: '0.7rem 1rem',
            color: 'var(--text)', fontSize: '0.845rem',
            outline: 'none', fontFamily: 'Geist, sans-serif',
            boxShadow: 'var(--shadow-sm)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          style={{
            width: 44, height: 44, borderRadius: 10,
            background: !input.trim() || loading ? 'var(--bg3)' : 'var(--accent)',
            border: 'none', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: !input.trim() || loading ? 'none' : 'var(--shadow)',
          }}
        >
          <Send size={15} color={!input.trim() || loading ? 'var(--text-3)' : 'white'} />
        </button>
      </div>
    </div>
  )
}