import { useState, useCallback, useEffect } from 'react'
import { insforge } from '@/lib/insforge'
import { useAuthStore } from '@/stores/auth-store'
import { useConfigStore } from '@/stores/config-store'
import type { Sale, PaymentType, Product } from '@/types'

export function useSales() {
  const user = useAuthStore((s) => s.user)
  const { rateUsdt, rateBcv, profitMargin } = useConfigStore()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string } | null>(null)
  const [paymentFilter, setPaymentFilter] = useState<PaymentType | null>(null)

  const fetchSales = useCallback(async () => {
    if (!user) return
    setLoading(true)

    let query = insforge.database
      .from('sales')
      .select('*, customer:customers(*)')
      .eq('user_id', user.id)
      .order('sale_date', { ascending: false })

    if (dateFilter) {
      query = query.gte('sale_date', dateFilter.from).lte('sale_date', dateFilter.to + 'T23:59:59')
    }
    if (paymentFilter) {
      query = query.eq('payment_type', paymentFilter)
    }

    const { data, error } = await query
    if (!error && data) {
      setSales(data as unknown as Sale[])
    }
    setLoading(false)
  }, [user, dateFilter, paymentFilter])

  const createSale = useCallback(async (
    product: Product,
    quantity: number,
    paymentType: PaymentType,
    customerId?: string | null
  ) => {
    if (!user) return { error: 'No autenticado' }
    if (rateUsdt <= 0 || rateBcv <= 0) return { error: 'Configura las tasas cambiarias primero' }

    let actualMargin = profitMargin;
    if (product.custom_effective_price && product.custom_effective_price > 0 && product.cost_usd > 0) {
      actualMargin = 100 * (1 - (product.cost_usd / product.custom_effective_price));
    }

    const { error } = await insforge.database
      .from('sales')
      .insert([{
        user_id: user.id,
        product_id: product.id,
        customer_id: customerId || null,
        quantity,
        payment_type: paymentType,
        rate_usdt_at_sale: rateUsdt,
        rate_bcv_at_sale: rateBcv,
        margin_at_sale: actualMargin,
        product_name_snapshot: product.name,
        product_cost_snapshot: product.cost_usd,
        sale_date: new Date().toISOString(),
      }])

    if (error) return { error: error.message }
    await fetchSales()
    return {}
  }, [user, rateUsdt, rateBcv, profitMargin, fetchSales])

  const updateSale = useCallback(async (id: string, updates: Partial<Pick<Sale, 'quantity' | 'payment_type'>>) => {
    if (!user) return { error: 'No autenticado' }
    const { error } = await insforge.database
      .from('sales')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }
    await fetchSales()
    return {}
  }, [user, fetchSales])

  const deleteSale = useCallback(async (id: string) => {
    if (!user) return { error: 'No autenticado' }
    const { error } = await insforge.database
      .from('sales')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }
    await fetchSales()
    return {}
  }, [user, fetchSales])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  return {
    sales,
    loading,
    dateFilter,
    setDateFilter,
    paymentFilter,
    setPaymentFilter,
    createSale,
    updateSale,
    deleteSale,
    refreshSales: fetchSales,
  }
}
