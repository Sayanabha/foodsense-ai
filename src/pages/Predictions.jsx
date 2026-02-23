import { useState } from 'react'
import { usePredictions } from '../hooks/usePredictions'
import { useAIPredictions } from '../hooks/useAIPredictions'
import Card from '../components/ui/Card'
import { TrendingUp, Loader, Zap, CheckCircle } from 'lucide-react'

export default function Predictions() {
  const { predictions, accuracy, loading, error, refetch } = usePredictions()
  const { runPredictions, generating, progress, results } = useAIPredictions()
  const [ran, setRan] = useState(false)

  async function handleRun() {
    await runPredictions()
    setRan(true)
    await refetch()
  }

  if (error) return (
    <p style={{ color: '#ff5c5c', padding: '2rem', fontSize: '0.8rem' }}>Error: {error}</p>
  )

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto">

      {/* Run AI Predictions Button */}
      <Card style={{ background: 'rgba(61,220,104,0.04)', borderColor: '#3ddc68' }}>
        <div className="flex items-start justify-between">
          <div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8f0e9', fontSize: '0.9rem', marginBottom: 4 }}>
              Run AI Demand Forecast
            </p>
            <p style={{ color: '#7a9980', fontSize: '0.72rem', lineHeight: 1.6, maxWidth: 480 }}>
              Gemini 2.5 Flash will analyze your last 7 days of sales data for each menu item
              and generate tomorrow's demand predictions with confidence scores.
            </p>
          </div>
          <button
            onClick={handleRun}
            disabled={generating}
            style={{
              background: generating ? '#1a221b' : '#3ddc68',
              color: generating ? '#4a5e4b' : '#0a0e0b',
              border: '1px solid #3ddc68',
              borderRadius: 6, padding: '0.5rem 1.2rem',
              fontSize: '0.75rem', fontWeight: 700,
              cursor: generating ? 'not-allowed' : 'pointer',
              fontFamily: 'Syne, sans-serif',
              display: 'flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 16,
            }}>
            {generating
              ? <><Loader size={13} className="animate-spin" /> Running...</>
              : <><Zap size={13} /> Generate Predictions</>}
          </button>
        </div>

        {/* Progress */}
        {generating && (
          <div style={{ marginTop: '1rem', padding: '0.6rem 0.8rem', background: '#0f1410', borderRadius: 6, fontSize: '0.72rem', color: '#3ddc68', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader size={12} className="animate-spin" />
            {progress}
          </div>
        )}

        {/* Results preview after running */}
        {ran && !generating && results.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.8rem' }}>
              <CheckCircle size={14} color="#3ddc68" />
              <span style={{ color: '#3ddc68', fontSize: '0.72rem', fontWeight: 700 }}>
                {results.length} predictions generated successfully
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.map((r, i) => (
                <div key={i} style={{
                  background: '#0f1410', borderRadius: 6,
                  padding: '0.6rem 0.8rem', fontSize: '0.72rem',
                  border: '1px solid #2a352b',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ color: '#e8f0e9', fontWeight: 600 }}>{r.name}</span>
                    <span style={{ color: '#3ddc68', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
                      {r.predicted_qty} servings
                    </span>
                  </div>
                  <span style={{ color: '#4a5e4b' }}>
                    {r.confidence}% confidence · {r.reasoning}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Saved predictions from DB */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={16} color="#3ddc68" />
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8f0e9' }}>
            Tomorrow's Forecast
          </p>
          <span style={{ color: '#4a5e4b', fontSize: '0.65rem', marginLeft: 'auto' }}>
            Accuracy: {accuracy}%
          </span>
        </div>
        <p style={{ color: '#4a5e4b', fontSize: '0.7rem', marginBottom: '1.5rem' }}>
          Saved predictions from Supabase · updates after each AI run
        </p>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2rem 0', color: '#7a9980', fontSize: '0.8rem' }}>
            <Loader size={14} color="#3ddc68" className="animate-spin" />
            Loading...
          </div>
        ) : predictions.length === 0 ? (
          <p style={{ color: '#4a5e4b', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 0' }}>
            No predictions yet. Click "Generate Predictions" above.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {predictions.map(({ id, menu_items, predicted_qty, confidence }) => (
              <div key={id}
                style={{ background: '#202a21', border: '1px solid #2a352b', borderRadius: 6 }}
                className="flex items-center justify-between p-3 hover:border-[#3ddc68] transition-colors">
                <div>
                  <p style={{ color: '#e8f0e9', fontSize: '0.82rem', fontWeight: 500 }}>
                    {menu_items?.name || 'Unknown'}
                  </p>
                  <p style={{ color: '#4a5e4b', fontSize: '0.65rem', marginTop: 2 }}>
                    Confidence: {Number(confidence).toFixed(0)}%
                    {/* Confidence bar */}
                    <span style={{ display: 'inline-block', marginLeft: 8, width: 60, height: 4, background: '#2a352b', borderRadius: 2, verticalAlign: 'middle', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${confidence}%`, background: Number(confidence) > 85 ? '#3ddc68' : '#f5a623', borderRadius: 2 }} />
                    </span>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#e8f0e9' }}>
                    {predicted_qty}
                  </p>
                  <p style={{ color: '#4a5e4b', fontSize: '0.6rem' }}>servings</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}