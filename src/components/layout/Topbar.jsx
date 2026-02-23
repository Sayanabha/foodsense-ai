import { useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { Sun, Moon, Bell } from 'lucide-react'

const meta = {
  '/':            { title: 'Overview',          sub: "Today's food waste intelligence"           },
  '/predictions': { title: 'Predictions',        sub: 'AI-powered demand forecasting'            },
  '/inventory':   { title: 'Inventory',          sub: 'Stock levels & expiry tracking'           },
  '/assistant':   { title: 'AI Assistant',       sub: 'Powered by Gemini 2.5 Flash'              },
  '/reports':     { title: 'Reports',            sub: 'Insights, orders & waste logs'            },
  '/photo-waste': { title: 'Photo Waste Logger', sub: 'Point, snap, log — AI does the rest'      },
  '/donations':   { title: 'NGO Donation Matcher', sub: 'Turn surplus into community impact'     },
  '/scenarios':   { title: 'Scenario Planner',   sub: 'Model menu changes before you make them' },
}
const IconBtn = ({ onClick, children, label }) => (
  <button
    onClick={onClick}
    title={label}
    style={{
      width: 32, height: 32,
      borderRadius: 8,
      border: '1px solid var(--border)',
      background: 'var(--surface)',
      color: 'var(--text-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: 'var(--shadow-sm)',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = 'var(--bg2)'
      e.currentTarget.style.color = 'var(--text)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = 'var(--surface)'
      e.currentTarget.style.color = 'var(--text-2)'
    }}
  >
    {children}
  </button>
)

export default function Topbar() {
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()
  const { title, sub } = meta[pathname] || meta['/']

  const date = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <header style={{
      height: 56,
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2.5rem',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
        <h1 style={{
          fontSize: '0.95rem',
          fontWeight: 600,
          color: 'var(--text)',
          letterSpacing: '-0.02em',
        }}>
          {title}
        </h1>
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--text-3)',
        }}>
          {sub}
        </span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          fontSize: '0.72rem',
          color: 'var(--text-3)',
          fontFamily: 'Geist Mono, monospace',
          marginRight: '0.5rem',
        }}>
          {date}
        </span>

        <IconBtn label="Notifications"><Bell size={14} strokeWidth={1.75} /></IconBtn>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title="Toggle theme"
          style={{
            height: 32,
            padding: '0 0.75rem',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-2)',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 500,
            boxShadow: 'var(--shadow-sm)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
        >
          {theme === 'light'
            ? <><Moon size={13} strokeWidth={1.75} /> Dark</>
            : <><Sun  size={13} strokeWidth={1.75} /> Light</>
          }
        </button>

        {/* Avatar */}
        <div style={{
          width: 28, height: 28,
          borderRadius: '50%',
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.72rem', fontWeight: 600, color: 'white',
          marginLeft: 4,
          flexShrink: 0,
        }}>
          M
        </div>
      </div>
    </header>
  )
}