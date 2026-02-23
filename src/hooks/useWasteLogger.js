import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useWasteLogger() {
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  async function logWaste({ itemName, quantity, unit, reason, costPerUnit }) {
    setSaving(true)
    setError(null)
    try {
      const costLost = Number(quantity) * Number(costPerUnit || 0)
      const { error } = await supabase.from('waste_log').insert([{
        item_name: itemName,
        quantity:  Number(quantity),
        unit,
        reason,
        cost_lost: costLost,
        date: new Date().toISOString().split('T')[0],
      }])
      if (error) throw error
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function logSales({ menuItemId, servingsSold, servingsPrepared, notes }) {
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase.from('sales_log').insert([{
        menu_item_id: menuItemId,
        servings_sold: Number(servingsSold),
        servings_prepared: Number(servingsPrepared),
        notes,
        date: new Date().toISOString().split('T')[0],
      }])
      if (error) throw error
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setSaving(false)
    }
  }

  return { logWaste, logSales, saving, error }
}