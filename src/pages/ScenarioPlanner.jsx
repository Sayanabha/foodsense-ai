import { useState } from 'react'
import { runScenario } from '../lib/gemini'
import { useInventory } from '../hooks/useInventory'
import { useWasteLog } from '../hooks/useWasteLog'
import { usePredictions } from '../hooks/usePredictions'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import {
  FlaskConical, Loader, TrendingUp, TrendingDown,
  CheckCircle, AlertTriangle, XCircle,
  Lightbulb, ChevronRight, RotateCcw
} from 'lucide-react'

const PRESETS = [
  "What if we remove Gulab Jamun from the weekday menu?",
  "What if we reduce roti production by 20% on weekdays?",
  "What if we add a lunch buffet instead of à la carte?",
  "What if we switch to smaller portion sizes for dal?",
  "What if we stop serving non-veg on Mondays?",
  "What if we buy vegetables every 2 days instead of daily?",
]

function ResultChip({ label, value, dir }) {
  const isGood = dir === 'good'
  const isNeutral = dir === 'neutral'
  return (
    <div style={{
      padding: '0.75rem 1rem',
      background: isNeutral ? 'var(--bg2)' : isGood ? 'var(--accent-bg)' : 'var(--red-bg)',
      border: `1px solid ${isNeutral ? 'var(--border)' : isGood ? 'var(--accent-border)' : 'var(--red-border)'}`,
      borderRadius: 10,
    }}>
      <p style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        {label}
      </p>
      <p style={{
        fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em',
        color: isNeutral ? 'var(--text)' : isGood ? 'var(--accent)' : 'var(--red)',
        fontFamily: 'Geist Mono, monospace', lineHeight: 1,
      }}>
        {value}
      </p>
    </div>
  )
}

export default function ScenarioPlanner() {
  const { inventory }  = useInventory()
  const { wasteLogs }  = useWasteLog()
  const { salesData }  = usePredictions()

  const [scenario, setScenario] = useState('')
  const [running, setRunning]   = useState(false)
  const [result, setResult]     = useState(null)
  const [history, setHistory]   = useState([])
  const [error, setError]       = useState(null)

  async function analyze() {
    const q = scenario.trim()
    if (!q || running) return
    setRunning(true); setResult(null); setError(null)
    try {
      const data = await runScenario(q, inventory, salesData, wasteLogs)
      if (!data) throw new Error('Could not parse AI response')
      setResult({ ...data, scenario: q })
      setHistory(h => [{ scenario: q, recommendation: data.recommendation, confidence: data.confidence }, ...h.slice(0, 4)])
    } catch (e) {
      setError('Analysis failed: ' + e.message)
    } finally {
      setRunning(false)
    }
  }

  const recColor = {
    proceed: 'green',
    caution: 'amber',
    avoid:   'red',
  }
  const recIcon = {
    proceed: <CheckCircle size={14} />,
    caution: <AlertTriangle size={14} />,
    avoid:   <XCircle size={14} />,
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="fade-in">

      {/* Header */}
      <Card style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FlaskConical size={17} color="white" />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem', marginBottom: 4 }}>
              What-If Scenario Planner
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
              Ask any "what if" question about your menu, ordering, or operations. Gemini models the impact using your real waste, sales, and inventory data before you make costly changes.
            </p>
          </div>
        </div>
      </Card>

      {/* Input */}
      <Card>
        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.85rem' }}>
          Describe your scenario
        </p>
        <textarea
          value={scenario}
          onChange={e => setScenario(e.target.value)}
          placeholder="e.g. What if we remove Gulab Jamun from the weekday menu?"
          rows={3}
          style={{
            width: '100%', background: 'var(--bg)',
            border: '1px solid var(--border)', borderRadius: 8,
            padding: '0.75rem', color: 'var(--text)',
            fontSize: '0.845rem', fontFamily: 'Geist, sans-serif',
            resize: 'vertical', outline: 'none', lineHeight: 1.5,
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />

        {/* Presets */}
        <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Quick scenarios
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {PRESETS.map(p => (
              <button key={p} onClick={() => setScenario(p)}
                style={{
                  background: scenario === p ? 'var(--accent-bg)' : 'var(--bg2)',
                  border: `1px solid ${scenario === p ? 'var(--accent-border)' : 'var(--border)'}`,
                  borderRadius: 6, padding: '0.28rem 0.65rem',
                  fontSize: '0.72rem', color: scenario === p ? 'var(--accent)' : 'var(--text-2)',
                  cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => { if (scenario !== p) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}}
                onMouseLeave={e => { if (scenario !== p) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={analyze} disabled={running || !scenario.trim()}
            style={{
              height: 38, padding: '0 1.25rem',
              background: running || !scenario.trim() ? 'var(--bg3)' : 'var(--accent)',
              color: running || !scenario.trim() ? 'var(--text-3)' : 'white',
              border: 'none', borderRadius: 8,
              cursor: running || !scenario.trim() ? 'not-allowed' : 'pointer',
              fontSize: '0.82rem', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: running || !scenario.trim() ? 'none' : 'var(--shadow)',
            }}>
            {running
              ? <><Loader size={13} className="animate-spin" /> Modeling scenario...</>
              : <><FlaskConical size={13} /> Run Analysis</>}
          </button>
          {(scenario || result) && (
            <button onClick={() => { setScenario(''); setResult(null); setError(null) }}
              style={{
                height: 38, padding: '0 1rem',
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 8, cursor: 'pointer',
                fontSize: '0.82rem', color: 'var(--text-2)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
              <RotateCcw size={13} /> Reset
            </button>
          )}
        </div>

        {error && (
          <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--red)' }}>
            {error}
          </div>
        )}
      </Card>

      {/* Results */}
      {running && (
        <Card style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexDirection: 'column' }}>
          <Loader size={28} color="var(--accent)" className="animate-spin" />
          <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
            Gemini is modeling this scenario against your real data...
          </p>
        </Card>
      )}

      {result && !running && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="fade-in">

          {/* Recommendation banner */}
          <Card style={{
            background: result.recommendation === 'proceed' ? 'var(--accent-bg)' : result.recommendation === 'caution' ? 'var(--amber-bg)' : 'var(--red-bg)',
            borderColor: result.recommendation === 'proceed' ? 'var(--accent-border)' : result.recommendation === 'caution' ? 'var(--amber-border)' : 'var(--red-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Badge variant={recColor[result.recommendation]}>
                    {recIcon[result.recommendation]}
                    &nbsp;{result.recommendation.toUpperCase()}
                  </Badge>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                    {result.confidence}% confidence · {result.feasibility} feasibility
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.4rem' }}>
                  {result.scenario_summary}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                  {result.recommendation_reason}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginBottom: 2 }}>Results in</p>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{result.time_to_see_results}</p>
              </div>
            </div>
          </Card>

          {/* Impact grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            <ResultChip
              label="Waste Change"
              value={`${result.projected_waste_change_pct > 0 ? '+' : ''}${result.projected_waste_change_pct}%`}
              dir={result.projected_waste_change_pct <= 0 ? 'good' : 'bad'}
            />
            <ResultChip
              label="Cost Change"
              value={`₹${Math.abs(result.projected_cost_change_inr).toLocaleString('en-IN')}`}
              dir={result.projected_cost_change_inr <= 0 ? 'good' : 'bad'}
            />
            <ResultChip
              label="Revenue Impact"
              value={`₹${Math.abs(result.projected_revenue_change_inr).toLocaleString('en-IN')}`}
              dir={result.projected_revenue_change_inr >= 0 ? 'good' : 'bad'}
            />
            <ResultChip
              label="Customer Impact"
              value={result.projected_customer_impact.split(' ').slice(0, 2).join(' ')}
              dir="neutral"
            />
          </div>

          {/* Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.85rem' }}>
                <TrendingDown size={14} color="var(--accent)" />
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>Risks</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {result.risks?.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', flexShrink: 0, marginTop: 6 }} />
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.5 }}>{r}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.85rem' }}>
                <TrendingUp size={14} color="var(--accent)" />
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>Opportunities</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {result.opportunities?.map((o, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 6 }} />
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.5 }}>{o}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Alternative suggestion */}
          {result.alternative_suggestion && (
            <Card style={{ background: 'var(--bg2)', boxShadow: 'none' }}>
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                <Lightbulb size={15} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--amber)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Alternative to consider
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                    {result.alternative_suggestion}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.75rem' }}>
            Recent Scenarios
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {history.map((h, i) => (
              <button key={i} onClick={() => setScenario(h.scenario)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%',
                }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>{h.scenario}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <Badge variant={recColor[h.recommendation]}>{h.recommendation}</Badge>
                  <ChevronRight size={13} color="var(--text-3)" />
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}