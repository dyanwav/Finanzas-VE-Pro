import { useState, useCallback, useEffect, useMemo } from 'react'
import { insforge } from '@/lib/insforge'
import { useAuthStore } from '@/stores/auth-store'
import type { Customer, CustomerInsert } from '@/types'

export function useCustomers() {
  const user = useAuthStore((s) => s.user)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchCustomers = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data, error } = await insforge.database
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setCustomers(data as unknown as Customer[])
    }
    setLoading(false)
  }, [user])

  const createCustomer = useCallback(async (customer: Omit<CustomerInsert, 'user_id'>) => {
    if (!user) return { error: 'No autenticado' }
    const { error } = await insforge.database
      .from('customers')
      .insert([{ ...customer, user_id: user.id }])

    if (error) return { error: error.message }
    await fetchCustomers()
    return {}
  }, [user, fetchCustomers])

  const updateCustomer = useCallback(async (id: string, updates: Partial<Pick<Customer, 'name' | 'email' | 'phone' | 'document_id'>>) => {
    if (!user) return { error: 'No autenticado' }
    const { error } = await insforge.database
      .from('customers')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }
    await fetchCustomers()
    return {}
  }, [user, fetchCustomers])

  const deleteCustomer = useCallback(async (id: string) => {
    if (!user) return { error: 'No autenticado' }
    const { error } = await insforge.database
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }
    await fetchCustomers()
    return {}
  }, [user, fetchCustomers])

  const fetchCustomerSales = useCallback(async (customerId: string) => {
    if (!user) return { error: 'No autenticado' }
    const { data, error } = await insforge.database
      .from('sales')
      .select('*')
      .eq('user_id', user.id)
      .eq('customer_id', customerId)
      .order('sale_date', { ascending: false })
    return { data, error: error?.message }
  }, [user])

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch = search === '' || 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
        (c.document_id && c.document_id.toLowerCase().includes(search.toLowerCase()))
      return matchesSearch
    })
  }, [customers, search])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  return {
    customers: filteredCustomers,
    allCustomers: customers,
    loading,
    search,
    setSearch,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers: fetchCustomers,
    fetchCustomerSales,
  }
}
