import { useState, useRef } from 'react'
import { identifyWasteFromPhoto } from '../lib/gemini'
import { supabase } from '../lib/supabase'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import {
  Camera, Upload, Loader, CheckCircle,
  AlertTriangle, RotateCcw, Save, ImageIcon
} from 'lucide-react'

const FIELD = {
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--text)',
  fontSize: '0.845rem', width: '100%', outline: 'none',
  fontFamily: 'Geist, sans-serif',
}

export default function PhotoWaste() {
  const [image, setImage]         = useState(null)      // base64
  const [preview, setPreview]     = useState(null)      // object URL
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult]       = useState(null)
  const [edited, setEdited]       = useState(null)      // user-edited result
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState(null)
  const fileRef = useRef()
  const cameraRef = useRef()

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setResult(null); setSaved(false); setError(null)

    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target.result
      const base64  = dataUrl.split(',')[1]
      setImage({ base64, mimeType: file.type })
      setPreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  async function analyze() {
    if (!image) return
    setAnalyzing(true); setError(null); setResult(null)
    try {
      const data = await identifyWasteFromPhoto(image.base64, image.mimeType)
      if (!data.identified) {
        setError("Gemini couldn't identify food in this photo. Try a clearer image with better lighting.")
        setAnalyzing(false); return
      }
      setResult(data)
      setEdited(data)
    } catch (e) {
      setError('Error analyzing image: ' + e.message)
    } finally {
      setAnalyzing(false)
    }
  }

  async function saveWaste() {
    if (!edited) return
    setSaving(true)
    try {
      const { error } = await supabase.from('waste_log').insert([{
        item_name:  edited.item_name,
        quantity:   Number(edited.estimated_quantity),
        unit:       edited.unit,
        reason:     edited.reason,
        cost_lost:  Number(edited.estimated_cost_inr),
        date:       new Date().toISOString().split('T')[0],
      }])
      if (error) throw error
      setSaved(true)
    } catch (e) {
      setError('Save failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setImage(null); setPreview(null); setResult(null)
    setEdited(null); setSaved(false); setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const set = k => e => setEdited(v => ({ ...v, [k]: e.target.value }))

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="fade-in">

      {/* Explainer */}
      <Card style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Camera size={17} color="white" strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem', marginBottom: 4 }}>
              AI Photo Waste Logger
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
              Take or upload a photo of leftover food. Gemini Vision identifies the item, estimates quantity and cost, then logs it to your waste database — no typing needed.
            </p>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Upload zone */}
        <Card>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>
            Step 1 — Add Photo
          </p>

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)' }}
            onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border)'; handleFile(e.dataTransfer.files[0]) }}
            style={{
              border: '2px dashed var(--border)', borderRadius: 12,
              minHeight: 200, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '0.75rem', cursor: 'pointer',
              background: preview ? 'transparent' : 'var(--bg2)',
              overflow: 'hidden', position: 'relative',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => { if (!preview) e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => { if (!preview) e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            {preview ? (
              <img src={preview} alt="waste" style={{ width: '100%', height: 220, objectFit: 'cover' }} />
            ) : (
              <>
                <div style={{ width: 48, height: 48, background: 'var(--bg3)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={22} color="var(--text-3)" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-2)' }}>Drop photo here</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>or click to browse</p>
                </div>
              </>
            )}
          </div>

          {/* Hidden inputs */}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button onClick={() => fileRef.current?.click()}
              style={{
                flex: 1, height: 36, background: 'var(--bg2)',
                border: '1px solid var(--border)', borderRadius: 8,
                color: 'var(--text-2)', fontSize: '0.78rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}>
              <Upload size={13} /> Upload
            </button>
            <button onClick={() => cameraRef.current?.click()}
              style={{
                flex: 1, height: 36, background: 'var(--bg2)',
                border: '1px solid var(--border)', borderRadius: 8,
                color: 'var(--text-2)', fontSize: '0.78rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}>
              <Camera size={13} /> Camera
            </button>
            {preview && (
              <button onClick={reset}
                style={{
                  width: 36, height: 36, background: 'var(--red-bg)',
                  border: '1px solid var(--red-border)', borderRadius: 8,
                  color: 'var(--red)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                <RotateCcw size={13} />
              </button>
            )}
          </div>

          {/* Analyze button */}
          {preview && !result && (
            <button onClick={analyze} disabled={analyzing}
              style={{
                width: '100%', marginTop: '0.75rem', height: 40,
                background: analyzing ? 'var(--bg3)' : 'var(--accent)',
                color: analyzing ? 'var(--text-3)' : 'white',
                border: 'none', borderRadius: 8, cursor: analyzing ? 'not-allowed' : 'pointer',
                fontSize: '0.845rem', fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: analyzing ? 'none' : 'var(--shadow)',
              }}>
              {analyzing
                ? <><Loader size={14} className="animate-spin" /> Gemini is analyzing...</>
                : <><Camera size={14} /> Identify Waste</>}
            </button>
          )}

          {error && (
            <div style={{
              marginTop: '0.75rem', padding: '0.65rem 0.85rem',
              background: 'var(--red-bg)', border: '1px solid var(--red-border)',
              borderRadius: 8, fontSize: '0.75rem', color: 'var(--red)',
              display: 'flex', gap: 6, alignItems: 'flex-start',
            }}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}
        </Card>

        {/* Result & Edit */}
        <Card>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>
            Step 2 — Review & Log
          </p>

          {!result && !analyzing && (
            <div style={{
              height: 200, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-3)', gap: '0.5rem',
            }}>
              <Camera size={32} strokeWidth={1} />
              <p style={{ fontSize: '0.78rem' }}>AI results will appear here</p>
            </div>
          )}

          {analyzing && (
            <div style={{
              height: 200, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            }}>
              <Loader size={28} color="var(--accent)" className="animate-spin" />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-2)' }}>Analyzing photo...</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>Gemini Vision is identifying the food</p>
              </div>
            </div>
          )}

          {result && edited && !saved && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Confidence badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Badge variant={result.confidence > 80 ? 'green' : 'amber'}>
                  {result.confidence}% confidence
                </Badge>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                  Edit any field before saving
                </span>
              </div>

              {/* Editable fields */}
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Item Name</label>
                <input style={FIELD} value={edited.item_name} onChange={set('item_name')}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Quantity</label>
                  <input style={FIELD} type="number" value={edited.estimated_quantity} onChange={set('estimated_quantity')}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Unit</label>
                  <select style={FIELD} value={edited.unit} onChange={set('unit')}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}>
                    {['kg','g','L','ml','pcs','plates'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Reason</label>
                  <select style={FIELD} value={edited.reason} onChange={set('reason')}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}>
                    {['overproduction','expired','spoiled','cancelled_order','other'].map(r => (
                      <option key={r} value={r}>{r.replace('_',' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Cost Lost (₹)</label>
                  <input style={FIELD} type="number" value={edited.estimated_cost_inr} onChange={set('estimated_cost_inr')}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              </div>

              {/* AI notes */}
              {result.notes && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  Gemini: "{result.notes}"
                </p>
              )}

              <button onClick={saveWaste} disabled={saving}
                style={{
                  width: '100%', height: 40, marginTop: 4,
                  background: saving ? 'var(--bg3)' : 'var(--accent)',
                  color: saving ? 'var(--text-3)' : 'white',
                  border: 'none', borderRadius: 8,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.845rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: saving ? 'none' : 'var(--shadow)',
                }}>
                {saving
                  ? <><Loader size={14} className="animate-spin" /> Saving...</>
                  : <><Save size={14} /> Log to Waste Database</>}
              </button>
            </div>
          )}

          {saved && (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '0.75rem', height: 200,
            }}>
              <div style={{ width: 52, height: 52, background: 'var(--accent-bg)', border: '2px solid var(--accent-border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={24} color="var(--accent)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Waste Logged!</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                  {edited.item_name} · {edited.estimated_quantity}{edited.unit} · ₹{edited.estimated_cost_inr}
                </p>
              </div>
              <button onClick={reset}
                style={{
                  height: 34, padding: '0 1.25rem',
                  background: 'var(--accent)', color: 'white',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                <Camera size={13} /> Log Another
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Tips */}
      <Card style={{ background: 'var(--bg2)', boxShadow: 'none' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.5rem' }}>
          📸 Tips for best results
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          {[
            'Good lighting — natural or bright kitchen light',
            'Show the container so AI can estimate quantity',
            'Include a hand or object for scale reference',
          ].map(t => (
            <div key={t} style={{ fontSize: '0.72rem', color: 'var(--text-3)', padding: '0.5rem 0.75rem', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
              {t}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}