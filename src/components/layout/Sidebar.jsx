import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, Package,
  MessageSquare, BarChart3, Leaf,
  Camera, Heart, FlaskConical
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { modelStatus } from '../../lib/gemini'

const groups = [
  {
    label: 'Main',
    links: [
      { to: '/',            icon: LayoutDashboard, label: 'Overview'     },
      { to: '/predictions', icon: TrendingUp,       label: 'Predictions'  },
      { to: '/inventory',   icon: Package,          label: 'Inventory'    },
      { to: '/reports',     icon: BarChart3,        label: 'Reports'      },
    ],
  },
  {
    label: 'AI Features',
    links: [
      { to: '/photo-waste', icon: Camera,       label: 'Photo Logging'    },
      { to: '/donations',   icon: Heart,        label: 'NGO Matcher'      },
      { to: '/scenarios',   icon: FlaskConical, label: 'Scenario Planner' },
      { to: '/assistant',   icon: MessageSquare, label: 'AI Assistant'    },
    ],
  },
]
function ModelStatusPill() {
  const [model, setModel] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setModel(modelStatus.lastUsed)
    }, 800)
    return () => clearInterval(interval)
  }, [])

  const isGroq    = model === 'groq'
  const hasModel  = model !== null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.5rem 0.75rem',
      background: isGroq ? 'var(--amber-bg)' : 'var(--accent-bg)',
      border: `1px solid ${isGroq ? 'var(--amber-border)' : 'var(--accent-border)'}`,
      borderRadius: 8,
      transition: 'all 0.3s ease',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: isGroq ? 'var(--amber)' : 'var(--accent)',
        flexShrink: 0,
      }} className="pulse-dot" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{
          fontSize: '0.7rem',
          color: isGroq ? 'var(--amber)' : 'var(--accent)',
          fontFamily: 'Geist Mono, monospace',
          fontWeight: 600,
          lineHeight: 1,
        }}>
          {isGroq ? 'Llama 3.3 · Groq' : 'Gemini 2.5 · Live'}
        </span>
        {hasModel && (
          <span style={{
            fontSize: '0.58rem',
            color: isGroq ? 'var(--amber)' : 'var(--accent)',
            opacity: 0.7,
            fontFamily: 'Geist Mono, monospace',
            lineHeight: 1,
          }}>
            {isGroq ? 'fallback active' : 'primary model'}
          </span>
        )}
      </div>
    </div>
  )
}
export default function Sidebar() {
  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '0.6rem',
      }}>
        <div style={{
          width: 28, height: 28, background: 'var(--accent)',
          borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <Leaf size={14} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            FoodSense
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontFamily: 'Geist Mono, monospace' }}>
            AI · v1.0
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
        {groups.map(({ label, links }) => (
          <div key={label}>
            <p style={{
              fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-3)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '0 0.75rem', marginBottom: '0.35rem',
            }}>
              {label}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {links.map(({ to, icon: Icon, label: lbl }) => (
                <NavLink
                  key={to} to={to} end={to === '/'}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.48rem 0.75rem', borderRadius: 8,
                    fontSize: '0.845rem', fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--accent)' : 'var(--text-2)',
                    background: isActive ? 'var(--accent-bg)' : 'transparent',
                    textDecoration: 'none', letterSpacing: '-0.01em',
                  })}
                  onMouseEnter={e => {
                    if (!e.currentTarget.getAttribute('aria-current')) {
                      e.currentTarget.style.background = 'var(--bg2)'
                      e.currentTarget.style.color = 'var(--text)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!e.currentTarget.getAttribute('aria-current')) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-2)'
                    }
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={15} strokeWidth={isActive ? 2 : 1.75} />
                      {lbl}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Status */}
<div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
  <ModelStatusPill />
</div>
    </aside>
  )
}