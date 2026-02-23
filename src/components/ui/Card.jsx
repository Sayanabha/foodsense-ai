export default function Card({ children, className = '', style = {}, hover = false, padding = '1.5rem' }) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding,
        boxShadow: 'var(--shadow)',
        ...style,
      }}
      onMouseEnter={hover ? e => e.currentTarget.style.boxShadow = 'var(--shadow-md)' : undefined}
      onMouseLeave={hover ? e => e.currentTarget.style.boxShadow = 'var(--shadow)' : undefined}
    >
      {children}
    </div>
  )
}