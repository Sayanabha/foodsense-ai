import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { generatePrediction } from '../lib/gemini'

export function useAIPredictions() {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress]     = useState('')
  const [results, setResults]       = useState([])
  const [error, setError]           = useState(null)

  async function runPredictions() {
    setGenerating(true)
    setResults([])
    setError(null)

    try {
      // 1. Fetch all active menu items
      setProgress('Fetching menu items...')
      const { data: menuItems, error: menuErr } = await supabase
        .from('menu_items')
        .select('*')
        .eq('active', true)

      if (menuErr) throw menuErr

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      const dayOfWeek = tomorrow.toLocaleDateString('en-US', { weekday: 'long' })

      const newResults = []

      // 2. For each menu item, get sales history + ask Gemini
      for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i]
        setProgress(`Predicting: ${item.name} (${i + 1}/${menuItems.length})...`)

        // Get last 7 days of sales for this item
        const { data: sales } = await supabase
          .from('sales_log')
          .select('servings_sold, servings_prepared, date')
          .eq('menu_item_id', item.id)
          .order('date', { ascending: false })
          .limit(7)

        // Ask Gemini to predict
        const prediction = await generatePrediction(
          item.name,
          sales || [],
          { dayOfWeek, season: 'Normal' }
        )

        // Upsert into predictions table
        await supabase.from('predictions').upsert({
          menu_item_id: item.id,
          predict_date: tomorrowStr,
          predicted_qty: prediction.predicted_qty,
          confidence: prediction.confidence,
        }, { onConflict: 'menu_item_id,predict_date' })

        newResults.push({
          name: item.name,
          ...prediction,
        })
      }

      setResults(newResults)
      setProgress('Done!')
    } catch (e) {
      setError(e.message)
      setProgress('')
    } finally {
      setGenerating(false)
    }
  }

  return { runPredictions, generating, progress, results, error }
}