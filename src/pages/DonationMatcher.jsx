import { useState } from 'react'
import { useInventory } from '../hooks/useInventory'
import { analyzeSurplusForDonation } from '../lib/gemini'
import { supabase } from '../lib/supabase'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import {
  Heart, Loader, MapPin, Clock, Users,
  CheckCircle, Package, AlertCircle, Phone
} from 'lucide-react'

const NGOS = [
  { name: 'Robin Hood Army',      type: 'Food rescue',    phone: '+91-9999-999-001', areas: 'Pan India', active: true  },
  { name: 'No Food Waste',        type: 'Food bank',      phone: '+91-9999-999-002', areas: 'South India', active: true },
  { name: 'Feeding India (Zomato)', type: 'Large scale',  phone: '+91-9999-999-003', areas: 'Major cities', active: true },
  { name: 'Local Orphanage',      type: 'Direct feeding', phone: '+91-9999-999-004', areas: 'Local',       active: false },
  { name: 'Old Age Home',         type: 'Senior care',    phone: '+91-9999-999-005', areas: 'Local',       active: false },
]

export default function DonationMatcher() {
  const { inventory, atRisk } = useInventory()
  const [analysis, setAnalysis]   = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [donated, setDonated]     = useState({})
  const [location, setLocation]   = useState('Kolkata, West Bengal')

  // Surplus = at-risk items + items with quantity > 5
  const surplus = [
    ...atRisk,
    ...inventory.filter(i => Number(i.quantity) > 5 && !atRisk.find(a => a.id === i.id)).slice(0, 3),
  ]

  async function analyze() {
    setAnalyzing(true)
    try {
      const data = await analyzeSurplusForDonation(surplus, location)
      setAnalysis(data)
    } catch (e) {
      console.error(e)
    } finally {
      setAnalyzing(false)
    }
  }

  async function markDonated(ngoName) {
    setDonated(d => ({ ...d, [ngoName]: true }))
    // Log to Supabase waste_log as "donated"
    if (analysis?.donation_items) {
      for (const item of analysis.donation_items) {
        const qty = parseFloat(item.quantity) || 0
        await supabase.from('waste_log').insert([{
          item_name: item.item,
          quantity: qty,
          unit: item.quantity.replace(/[0-9.]/g, '').trim() || 'kg',
          reason: 'donated',
          cost_lost: 0,
          date: new Date().toISOString().split('T')[0],
        }]).catch(() => {})
      }
    }
  }

  const feasibility = analysis?.recommendation === 'proceed' ? 'green'
    : analysis?.feasibility === 'high' ? 'green'
    : analysis?.feasibility === 'medium' ? 'amber' : 'red'

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="fade-in">

      {/* Header card */}
      <Card style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Heart size={17} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem', marginBottom: 4 }}>
              NGO Donation Matcher
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
              Gemini analyzes your surplus inventory and generates a donation plan — including what to donate, which NGOs to contact, and food safety guidelines.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'Geist Mono, monospace', lineHeight: 1 }}>
              {surplus.length}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>surplus items</div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Left — Surplus inventory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>
              Available to Donate
            </p>

            {surplus.length === 0 ? (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.78rem' }}>
                <Package size={28} strokeWidth={1} style={{ margin: '0 auto 0.5rem' }} />
                No surplus detected today
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {surplus.map(item => {
                  const days = Math.ceil((new Date(item.expires_at) - new Date()) / 86400000)
                  return (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.6rem 0.75rem',
                      background: 'var(--bg2)', borderRadius: 8,
                      border: '1px solid var(--border)',
                    }}>
                      <div>
                        <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text)' }}>{item.name}</p>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} />
                          {days <= 0 ? 'Expires today' : `${days}d left`}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'Geist Mono, monospace' }}>
                          {item.quantity} {item.unit}
                        </p>
                        <Badge variant={days <= 0 ? 'red' : days <= 2 ? 'amber' : 'green'}>
                          {days <= 0 ? 'Urgent' : days <= 2 ? 'Soon' : 'Good'}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Location & Analyze */}
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.75rem', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <MapPin size={13} color="var(--text-3)" />
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.78rem', color: 'var(--text-2)', fontFamily: 'Geist, sans-serif', flex: 1 }}
                  placeholder="Your location"
                />
              </div>
              <button onClick={analyze} disabled={analyzing || surplus.length === 0}
                style={{
                  height: 38, background: analyzing ? 'var(--bg3)' : 'var(--accent)',
                  color: analyzing ? 'var(--text-3)' : 'white',
                  border: 'none', borderRadius: 8,
                  cursor: (analyzing || surplus.length === 0) ? 'not-allowed' : 'pointer',
                  fontSize: '0.82rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  opacity: surplus.length === 0 ? 0.5 : 1,
                  boxShadow: analyzing ? 'none' : 'var(--shadow)',
                }}>
                {analyzing
                  ? <><Loader size={13} className="animate-spin" /> Analyzing surplus...</>
                  : <><Heart size={13} /> Generate Donation Plan</>}
              </button>
            </div>
          </Card>

          {/* NGO Directory */}
          <Card>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>
              NGO Directory
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {NGOS.map(ngo => (
                <div key={ngo.name} style={{
                  padding: '0.65rem 0.75rem',
                  background: donated[ngo.name] ? 'var(--accent-bg)' : 'var(--bg2)',
                  border: `1px solid ${donated[ngo.name] ? 'var(--accent-border)' : 'var(--border)'}`,
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}>
                  <div>
                    <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text)' }}>{ngo.name}</p>
                    <p style={{ fontSize: '0.66rem', color: 'var(--text-3)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={9} />{ngo.areas} · {ngo.type}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {donated[ngo.name] ? (
                      <Badge variant="green"><CheckCircle size={9} /> Donated</Badge>
                    ) : (
                      <a href={`tel:${ngo.phone}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: '0.68rem', color: 'var(--accent)',
                          textDecoration: 'none', fontWeight: 500,
                        }}>
                        <Phone size={10} /> Call
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right — AI donation plan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!analysis && !analyzing && (
            <Card style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <div style={{ width: 52, height: 52, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={22} strokeWidth={1.5} color="var(--text-3)" />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', textAlign: 'center' }}>
                Click "Generate Donation Plan" to see<br />AI-powered NGO recommendations
              </p>
            </Card>
          )}

          {analyzing && (
            <Card style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <Loader size={28} color="var(--accent)" className="animate-spin" />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>Gemini is building your donation plan...</p>
            </Card>
          )}

          {analysis && (
            <>
              {/* Impact summary */}
              <Card style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Users size={20} color="var(--accent)" />
                  <div>
                    <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1, fontFamily: 'Geist Mono, monospace' }}>
                      ~{analysis.total_meals_estimated}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginTop: 2 }}>
                      {analysis.impact_summary}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Donation items */}
              <Card>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.85rem' }}>
                  Donation Plan
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {analysis.donation_items?.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.6rem 0.75rem',
                      background: item.safe_to_donate ? 'var(--bg2)' : 'var(--red-bg)',
                      border: `1px solid ${item.safe_to_donate ? 'var(--border)' : 'var(--red-border)'}`,
                      borderRadius: 8,
                    }}>
                      <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text)' }}>{item.item}</p>
                        <p style={{ fontSize: '0.67rem', color: 'var(--text-3)', marginTop: 1 }}>{item.reason}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'Geist Mono, monospace' }}>{item.quantity}</span>
                        <Badge variant={item.safe_to_donate ? 'green' : 'red'}>
                          {item.safe_to_donate ? 'Safe' : 'Check'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Timing */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.75rem', background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', borderRadius: 8, marginBottom: '0.85rem' }}>
                  <Clock size={13} color="var(--amber)" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--amber)', fontWeight: 500 }}>
                    Best time: {analysis.best_time_to_donate}
                  </span>
                </div>

                {/* Food safety */}
                <div style={{ padding: '0.65rem 0.75rem', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 3 }}>
                    🛡️ Food Safety
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                    {analysis.food_safety_notes}
                  </p>
                </div>

                {/* Suggested NGO types */}
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.4rem' }}>
                    Contact these types of organizations:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {analysis.ngo_types_to_contact?.map(t => (
                      <Badge key={t} variant="dim">{t}</Badge>
                    ))}
                  </div>
                </div>

                {/* Draft message */}
                <div style={{ padding: '0.75rem', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    WhatsApp message draft
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                    {analysis.donation_message}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(analysis.donation_message)}
                    style={{
                      marginTop: '0.5rem', background: 'var(--bg3)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '0.25rem 0.6rem', fontSize: '0.68rem',
                      color: 'var(--text-2)', cursor: 'pointer',
                    }}>
                    Copy
                  </button>
                </div>

                {/* Mark donated buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {NGOS.filter(n => n.active).map(ngo => (
                    <button key={ngo.name} onClick={() => markDonated(ngo.name)}
                      disabled={donated[ngo.name]}
                      style={{
                        height: 36,
                        background: donated[ngo.name] ? 'var(--accent-bg)' : 'var(--surface)',
                        border: `1px solid ${donated[ngo.name] ? 'var(--accent-border)' : 'var(--border)'}`,
                        borderRadius: 8, cursor: donated[ngo.name] ? 'default' : 'pointer',
                        fontSize: '0.78rem', fontWeight: 500,
                        color: donated[ngo.name] ? 'var(--accent)' : 'var(--text-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                      {donated[ngo.name]
                        ? <><CheckCircle size={13} /> Donated to {ngo.name}</>
                        : <><Heart size={13} /> Mark as donated to {ngo.name}</>}
                    </button>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}