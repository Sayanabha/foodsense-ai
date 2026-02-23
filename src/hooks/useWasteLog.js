import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useWasteLog() {
  const [wasteLogs, setWasteLogs] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => { fetchWasteLogs() }, [])

  async function fetchWasteLogs() {
    try {
      const { data, error } = await supabase
        .from('waste_log')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error
      setWasteLogs(data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function addWasteEntry(entry) {
    const { error } = await supabase.from('waste_log').insert([entry])
    if (error) throw error
    await fetchWasteLogs()
  }

  // Total waste this week (kg)
  const thisWeekWaste = wasteLogs
    .filter(log => {
      const logDate = new Date(log.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return logDate >= weekAgo
    })
    .reduce((sum, log) => sum + Number(log.quantity), 0)

  // Total cost lost this week
  const thisWeekCostLost = wasteLogs
    .filter(log => {
      const logDate = new Date(log.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return logDate >= weekAgo
    })
    .reduce((sum, log) => sum + Number(log.cost_lost), 0)

  // Format for chart — last 8 entries grouped by date
  const chartData = wasteLogs.slice(-8).map((log, i) => ({
    week: `W${i + 1}`,
    waste: Number(log.quantity),
    date: log.date,
  }))

  return {
    wasteLogs, loading, error,
    thisWeekWaste, thisWeekCostLost,
    chartData, addWasteEntry, refetch: fetchWasteLogs,
  }
}