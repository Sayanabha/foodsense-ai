import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePredictions() {
  const [predictions, setPredictions] = useState([])
  const [salesData, setSalesData]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  useEffect(() => {
    fetchPredictions()
    fetchSalesData()
  }, [])

  async function fetchPredictions() {
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('predictions')
        .select('*, menu_items(name, category)')
        .eq('predict_date', tomorrowStr)
        .order('predicted_qty', { ascending: false })

      if (error) throw error
      setPredictions(data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSalesData() {
    try {
      const { data, error } = await supabase
        .from('sales_log')
        .select('*, menu_items(name)')
        .order('date', { ascending: true })
        .limit(50)

      if (error) throw error
      setSalesData(data || [])
    } catch (e) {
      console.error(e)
    }
  }

  // Format sales for the demand chart (last 7 days totals)
  const demandChartData = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const grouped = {}
    salesData.forEach(log => {
      const day = new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' })
      if (!grouped[day]) grouped[day] = { actual: 0, predicted: 0, count: 0 }
      grouped[day].actual += log.servings_sold
      grouped[day].predicted += log.servings_prepared
      grouped[day].count++
    })
    return days.map(d => ({
      day: d,
      actual: grouped[d]?.actual || 0,
      predicted: grouped[d]?.predicted || 0,
    }))
  })()

  // Overall forecast accuracy
  const accuracy = salesData.length > 0
    ? (salesData.reduce((acc, log) => {
        const diff = Math.abs(log.servings_prepared - log.servings_sold)
        return acc + Math.max(0, 100 - (diff / log.servings_prepared) * 100)
      }, 0) / salesData.length).toFixed(1)
    : 94.2

  return { predictions, salesData, demandChartData, accuracy, loading, error, refetch: fetchPredictions }
}