import { useState, useCallback, useEffect, useMemo } from 'react'
import { insforge } from '@/lib/insforge'
import { useAuthStore } from '@/stores/auth-store'
import type { Supplier, SupplierInsert } from '@/types'
import { toast } from 'sonner'

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const user = useAuthStore((s) => s.user)

  const fetchSuppliers = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await insforge.database
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setSuppliers(data || [])
    } catch (error: any) {
      console.error('Error fetching suppliers:', error)
      toast.error('Error al cargar los proveedores')
    } finally {
      setLoading(false)
    }
  }, [user])

  const createSupplier = async (supplier: SupplierInsert) => {
    if (!user) return null
    try {
      const { data, error } = await insforge.database
        .from('suppliers')
        .insert([{ ...supplier, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      setSuppliers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success('Proveedor creado exitosamente')
      return data
    } catch (error: any) {
      console.error('Error creating supplier:', error)
      toast.error('Error al crear proveedor')
      return null
    }
  }

  const updateSupplier = async (id: string, updates: Partial<SupplierInsert>) => {
    try {
      const { data, error } = await insforge.database
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setSuppliers((prev) => prev.map((s) => (s.id === id ? data : s)).sort((a, b) => a.name.localeCompare(b.name)))
      toast.success('Proveedor actualizado')
      return data
    } catch (error: any) {
      console.error('Error updating supplier:', error)
      toast.error('Error al actualizar proveedor')
      return null
    }
  }

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await insforge.database
        .from('suppliers')
        .delete()
        .eq('id', id)
      if (error) throw error
      setSuppliers((prev) => prev.filter((s) => s.id !== id))
      toast.success('Proveedor eliminado')
      return true
    } catch (error: any) {
      console.error('Error deleting supplier:', error)
      toast.error('Error al eliminar proveedor')
      return false
    }
  }

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (search === '') return true
      const term = search.toLowerCase()
      return (
        s.name.toLowerCase().includes(term) ||
        (s.contact_name && s.contact_name.toLowerCase().includes(term)) ||
        (s.email && s.email.toLowerCase().includes(term)) ||
        (s.phone && s.phone.toLowerCase().includes(term))
      )
    })
  }, [suppliers, search])

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  return {
    suppliers,
    filteredSuppliers,
    loading,
    search,
    setSearch,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  }
}
