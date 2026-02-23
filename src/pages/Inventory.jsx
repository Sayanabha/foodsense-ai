import { useState } from 'react'
import { useInventory } from '../hooks/useInventory'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { Package, Plus, X, Loader } from 'lucide-react'

const statusLabel = { red: 'Critical', amber: 'Warning', green: 'Good' }

const FIELD = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.5rem 0.75rem',
  color: 'var(--text)',
  fontSize: '0.845rem',
  width: '100%',
  outline: 'none',
  fontFamily: 'Geist, sans-serif',
}

const Label = ({ children }) => (
  <label style={{
    display: 'block', marginBottom: 6,
    fontSize: '0.72rem', fontWeight: 600,
    color: 'var(--text-2)', letterSpacing: '0.01em',
  }}>
    {children}
  </label>
)

export default function Inventory() {
  const { inventory, loading, error, addItem, deleteItem, getStatus } = useInventory()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Vegetable', quantity: '', unit: 'kg', expires_at: '', cost_per_unit: '' })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleAdd() {
    if (!form.name || !form.quantity || !form.expires_at) return
    setSaving(true)
    try {
      await addItem({ ...form, quantity: Number(form.quantity), cost_per_unit: Number(form.cost_per_unit) || 0 })
      setForm({ name: '', category: 'Vegetable', quantity: '', unit: 'kg', expires_at: '', cost_per_unit: '' })
      setShowForm(false)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  if (error) return <p style={{ color: 'var(--red)', padding: '2rem', fontSize: '0.85rem' }}>Error: {error}</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 900 }} className="fade-in">

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Inventory
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>
            {inventory.length} items tracked
          </p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{
            height: 34, padding: '0 1rem',
            background: showForm ? 'var(--bg2)' : 'var(--accent)',
            color: showForm ? 'var(--text-2)' : 'white',
            border: '1px solid ' + (showForm ? 'var(--border)' : 'var(--accent)'),
            borderRadius: 8, cursor: 'pointer',
            fontSize: '0.82rem', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: showForm ? 'none' : 'var(--shadow)',
          }}
        >
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Item</>}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="fade-in">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1.25rem' }}>
            New Inventory Item
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <Label>Item Name *</Label>
              <input style={FIELD} value={form.name} onChange={set('name')} placeholder="e.g. Tomatoes"
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <Label>Category</Label>
              <select style={FIELD} value={form.category} onChange={set('category')}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}>
                {['Vegetable','Dairy','Grain','Legume','Bakery','Meat','Fruit','Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Quantity *</Label>
              <input style={FIELD} type="number" value={form.quantity} onChange={set('quantity')} placeholder="5"
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <Label>Unit</Label>
              <select style={FIELD} value={form.unit} onChange={set('unit')}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}>
                {['kg','g','L','ml','pcs','dozen','packets'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <Label>Expiry Date *</Label>
              <input style={FIELD} type="date" value={form.expires_at} onChange={set('expires_at')}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <Label>Cost per Unit (₹)</Label>
              <input style={FIELD} type="number" value={form.cost_per_unit} onChange={set('cost_per_unit')} placeholder="40"
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: 10 }}>
            <button onClick={handleAdd} disabled={saving} style={{
              height: 36, padding: '0 1.25rem',
              background: 'var(--accent)', color: 'white',
              border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.82rem', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? <><Loader size={13} className="animate-spin" /> Saving...</> : 'Save Item'}
            </button>
            <button onClick={() => setShowForm(false)} style={{
              height: 36, padding: '0 1.25rem',
              background: 'var(--bg2)', color: 'var(--text-2)',
              border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer',
              fontSize: '0.82rem',
            }}>
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card padding="0">
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.82rem' }}>
            Loading inventory...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Item', 'Quantity', 'Category', 'Cost/Unit', 'Expires', 'Status', ''].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '0.7rem 1.25rem',
                    fontSize: '0.68rem', fontWeight: 600,
                    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventory.map(({ id, name, quantity, unit, category, cost_per_unit, expires_at }) => {
                const status = getStatus(expires_at)
                const days = Math.ceil((new Date(expires_at) - new Date()) / 86400000)
                const exp = days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`
                return (
                  <tr key={id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.querySelector('.del-btn').style.opacity = 1 }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.querySelector('.del-btn').style.opacity = 0 }}
                  >
                    <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.845rem', fontWeight: 500, color: 'var(--text)' }}>{name}</td>
                    <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.82rem', color: 'var(--text-2)', fontFamily: 'Geist Mono, monospace' }}>{quantity} {unit}</td>
                    <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.82rem', color: 'var(--text-2)' }}>{category}</td>
                    <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.82rem', color: 'var(--text-2)', fontFamily: 'Geist Mono, monospace' }}>₹{cost_per_unit}</td>
                    <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.82rem', color: status === 'red' ? 'var(--red)' : 'var(--text-2)', fontFamily: 'Geist Mono, monospace' }}>{exp}</td>
                    <td style={{ padding: '0.75rem 1.25rem' }}><Badge variant={status}>{statusLabel[status]}</Badge></td>
                    <td style={{ padding: '0.75rem 1.25rem' }}>
                      <button
                        className="del-btn"
                        onClick={() => deleteItem(id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-3)', opacity: 0, transition: 'all 0.15s',
                          padding: 4, borderRadius: 4,
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}