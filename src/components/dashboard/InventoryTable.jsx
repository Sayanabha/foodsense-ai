import Card from '../ui/Card'
import Badge from '../ui/Badge'

const statusLabel = { red: 'Critical', amber: 'Warning', green: 'Good' }

export default function InventoryTable({ inventory, getStatus, loading }) {
  const display = inventory.slice(0, 7)

  return (
    <Card padding="0">
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          Inventory Status
        </h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>
          Items sorted by expiry date
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.8rem' }}>
          Loading inventory...
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Item', 'Stock', 'Expires', 'Status'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '0.6rem 1.25rem',
                  fontSize: '0.68rem', fontWeight: 600,
                  color: 'var(--text-3)', textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.map(({ id, name, quantity, unit, expires_at }) => {
              const status = getStatus(expires_at)
              const days = Math.ceil((new Date(expires_at) - new Date()) / 86400000)
              const expiryLabel = days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`
              return (
                <tr
                  key={id}
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '0.7rem 1.25rem', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text)' }}>{name}</td>
                  <td style={{ padding: '0.7rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-2)', fontFamily: 'Geist Mono, monospace' }}>{quantity} {unit}</td>
                  <td style={{ padding: '0.7rem 1.25rem', fontSize: '0.8rem', color: status === 'red' ? 'var(--red)' : 'var(--text-2)', fontFamily: 'Geist Mono, monospace' }}>{expiryLabel}</td>
                  <td style={{ padding: '0.7rem 1.25rem' }}><Badge variant={status}>{statusLabel[status]}</Badge></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </Card>
  )
}