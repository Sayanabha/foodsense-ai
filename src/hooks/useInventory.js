import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useInventory() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    fetchInventory()

    // Real-time listener — updates instantly when data changes
    const channel = supabase
      .channel('inventory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        fetchInventory()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchInventory() {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('expires_at', { ascending: true })

      if (error) throw error
      setInventory(data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function addItem(item) {
    const { error } = await supabase.from('inventory').insert([item])
    if (error) throw error
    await fetchInventory()
  }

  async function updateItem(id, updates) {
    const { error } = await supabase
      .from('inventory')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    await fetchInventory()
  }

  async function deleteItem(id) {
    const { error } = await supabase.from('inventory').delete().eq('id', id)
    if (error) throw error
    await fetchInventory()
  }

  // Derived: items expiring today or tomorrow
  const atRisk = inventory.filter(item => {
    const daysUntilExpiry = Math.ceil(
      (new Date(item.expires_at) - new Date()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiry <= 2
  })

  function getStatus(expiresAt) {
    const days = Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
    if (days <= 0)  return 'red'
    if (days <= 2)  return 'amber'
    return 'green'
  }

  return { inventory, atRisk, loading, error, addItem, updateItem, deleteItem, getStatus }
}