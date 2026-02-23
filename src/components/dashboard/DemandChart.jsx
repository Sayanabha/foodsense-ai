import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import Card from '../ui/Card'

const FALLBACK = [
  { day: 'Mon', actual: 85,  predicted: 82  },
  { day: 'Tue', actual: 92,  predicted: 90  },
  { day: 'Wed', actual: 78,  predicted: 80  },
  { day: 'Thu', actual: 88,  predicted: 87  },
  { day: 'Fri', actual: 95,  predicted: 98  },
  { day: 'Sat', actual: 110, predicted: 108 },
  { day: 'Sun', actual: 105, predicted: 102 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '0.65rem 0.9rem',
      boxShadow: 'var(--shadow-lg)',
      fontSize: '0.78rem',
    }}>
      <p style={{ color: 'var(--text-3)', marginBottom: '0.4rem', fontWeight: 500 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-2)' }}>{p.name}:</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function DemandChart({ data, loading }) {
  const chartData = (data && data.some(d => d.actual > 0)) ? data : FALLBACK

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            Demand Forecast
          </h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>
            Predicted vs actual servings this week
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.72rem', color: 'var(--text-3)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent)', display: 'inline-block' }} />
            Actual
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--border2)', display: 'inline-block' }} />
            Predicted
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '0.8rem' }}>
          Loading chart data...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barGap={3} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: 'var(--text-3)', fontSize: 12, fontFamily: 'Geist, sans-serif' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-3)', fontSize: 12, fontFamily: 'Geist, sans-serif' }}
              axisLine={false} tickLine={false} width={30}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg2)', radius: 4 }} />
            <Bar dataKey="actual"    name="Actual"    fill="var(--accent)"  radius={[4,4,0,0]} />
            <Bar dataKey="predicted" name="Predicted" fill="var(--border2)" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}