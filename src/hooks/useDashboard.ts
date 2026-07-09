import { useMemo } from 'react'
import { calculateSaleRevenue, calculateGap } from '@/lib/calculations'
import type { Sale, DashboardKPIs, ChartDataPoint, PeriodFilter } from '@/types'
import { startOfDay, startOfWeek, startOfMonth, isAfter, format } from 'date-fns'
import { es } from 'date-fns/locale'

function getDateRangeStart(period: PeriodFilter): Date {
  const now = new Date()
  switch (period) {
    case 'today':
      return startOfDay(now)
    case 'week':
      return startOfWeek(now, { locale: es })
    case 'month':
      return startOfMonth(now)
    case 'custom':
      return new Date(0) // All time
  }
}

export function useDashboard(
  sales: Sale[],
  period: PeriodFilter = 'month',
  customRange?: { from: Date; to: Date }
) {
  const filteredSales = useMemo(() => {
    if (period === 'custom' && customRange) {
      return sales.filter((s) => {
        const date = new Date(s.sale_date)
        return date >= customRange.from && date <= customRange.to
      })
    }

    const rangeStart = getDateRangeStart(period)
    return sales.filter((s) => isAfter(new Date(s.sale_date), rangeStart))
  }, [sales, period, customRange])

  const kpis = useMemo<DashboardKPIs>(() => {
    let totalInvested = 0
    let totalRevenue = 0
    let totalProfit = 0

    for (const sale of filteredSales) {
      const result = calculateSaleRevenue(
        Number(sale.product_cost_snapshot),
        sale.quantity,
        sale.payment_type,
        Number(sale.rate_usdt_at_sale),
        Number(sale.rate_bcv_at_sale),
        Number(sale.margin_at_sale)
      )
      totalInvested += result.cost
      totalRevenue += result.revenue
      totalProfit += result.profit
    }

    return {
      totalInvested,
      totalRevenue,
      totalProfit,
      profitMarginPercent: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      totalSalesCount: filteredSales.length,
    }
  }, [filteredSales])

  const chartData = useMemo<ChartDataPoint[]>(() => {
    // Group sales by day
    const byDay = new Map<string, { revenue: number; profit: number; investment: number }>()

    for (const sale of filteredSales) {
      const day = format(new Date(sale.sale_date), 'yyyy-MM-dd')
      const existing = byDay.get(day) || { revenue: 0, profit: 0, investment: 0 }

      const result = calculateSaleRevenue(
        Number(sale.product_cost_snapshot),
        sale.quantity,
        sale.payment_type,
        Number(sale.rate_usdt_at_sale),
        Number(sale.rate_bcv_at_sale),
        Number(sale.margin_at_sale)
      )

      existing.revenue += result.revenue
      existing.profit += result.profit
      existing.investment += result.cost
      byDay.set(day, existing)
    }

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: format(new Date(date), 'dd MMM', { locale: es }),
        revenue: Number(data.revenue.toFixed(2)),
        profit: Number(data.profit.toFixed(2)),
        investment: Number(data.investment.toFixed(2)),
      }))
  }, [filteredSales])

  const currentGap = useMemo(() => {
    if (filteredSales.length === 0) return 0
    // Use the most recent sale's rates for gap calculation
    const latest = filteredSales[0]
    return calculateGap(Number(latest.rate_usdt_at_sale), Number(latest.rate_bcv_at_sale))
  }, [filteredSales])

  const topProducts = useMemo(() => {
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()
    
    for (const s of filteredSales) {
      const res = calculateSaleRevenue(
        Number(s.product_cost_snapshot),
        s.quantity,
        s.payment_type,
        Number(s.rate_usdt_at_sale),
        Number(s.rate_bcv_at_sale),
        Number(s.margin_at_sale)
      )

      const pid = s.product_id || s.product_name_snapshot
      const existing = productMap.get(pid) || { name: s.product_name_snapshot, quantity: 0, revenue: 0 }
      
      existing.quantity += s.quantity
      existing.revenue += res.revenue
      
      productMap.set(pid, existing)
    }

    return Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [filteredSales])

  return {
    kpis,
    chartData,
    currentGap,
    filteredSalesCount: filteredSales.length,
    topProducts,
  }
}
