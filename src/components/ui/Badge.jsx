const variants = {
  green: { background: 'var(--accent-bg)',  color: 'var(--accent)', border: '1px solid var(--accent-border)' },
  amber: { background: 'var(--amber-bg)',   color: 'var(--amber)',  border: '1px solid var(--amber-border)'  },
  red:   { background: 'var(--red-bg)',     color: 'var(--red)',    border: '1px solid var(--red-border)'    },
  dim:   { background: 'var(--bg2)',        color: 'var(--text-3)', border: '1px solid var(--border)'        },
}

export default function Badge({ children, variant = 'dim' }) {
  return (
    <span style={{
      ...variants[variant],
      fontSize: '0.68rem',
      fontWeight: 500,
      padding: '0.2rem 0.55rem',
      borderRadius: 6,
      letterSpacing: '0.01em',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}