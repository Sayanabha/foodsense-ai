import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Card from '../ui/Card'

const FALLBACK = [
  { week: 'W1', waste: 12.4 }, { week: 'W2', waste: 10.8 },
  { week: 'W3', waste: 9.2  }, { week: 'W4', waste: 8.5  },
  { week: 'W5', waste: 7.1  }, { week: 'W6', waste: 6.3  },
  { week: 'W7', waste: 5.8  }, { week: 'W8', waste: 4.9  },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '0.65rem 0.9rem',
      boxShadow: 'var(--shadow-lg)', fontSize: '0.78rem',
    }}>
      <p style={{ color: 'var(--text-3)', marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--accent)', fontWeight: 600 }}>{payload[0].value} kg wasted</p>
    </div>
  )
}

export default function WasteChart({ data, loading }) {
  const chartData = data?.length ? data : FALLBACK
  const first = chartData[0]?.waste || 1
  const last  = chartData[chartData.length - 1]?.waste || 1
  const pct   = (((first - last) / first) * 100).toFixed(0)

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            Waste Reduction Trend
          </h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>
            Total kg wasted per week
          </p>
        </div>
        <div style={{
          padding: '0.2rem 0.65rem',
          background: 'var(--accent-bg)',
          border: '1px solid var(--accent-border)',
          borderRadius: 6,
          fontSize: '0.72rem',
          fontWeight: 600,
          color: 'var(--accent)',
        }}>
          ↓ {pct}% over 8 weeks
        </div>
      </div>

      {loading ? (
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '0.8rem' }}>
          Loading...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="var(--accent)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area type="monotone" dataKey="waste" stroke="var(--accent)" strokeWidth={2}
              fill="url(#wasteGrad)" dot={{ fill: 'var(--accent)', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: 'var(--accent)', strokeWidth: 2, stroke: 'var(--surface)' }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}