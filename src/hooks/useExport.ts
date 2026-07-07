import { useCallback } from 'react'
import type { Product, Sale, RateHistory } from '@/types'

type ExportableData = 'products' | 'sales' | 'rates'

function convertToCSV(data: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  const headerRow = headers.map((h) => h.label).join(',')
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h.key]
      // Escape commas and quotes in strings
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return String(val ?? '')
    }).join(',')
  )
  return [headerRow, ...rows].join('\n')
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const productHeaders = [
  { key: 'name', label: 'Producto' },
  { key: 'cost_usd', label: 'Costo USD' },
  { key: 'category_name', label: 'Categoría' },
  { key: 'created_at', label: 'Fecha Creación' },
]

const saleHeaders = [
  { key: 'sale_date', label: 'Fecha' },
  { key: 'product_name_snapshot', label: 'Producto' },
  { key: 'quantity', label: 'Cantidad' },
  { key: 'payment_type', label: 'Tipo Pago' },
  { key: 'product_cost_snapshot', label: 'Costo USD' },
  { key: 'rate_usdt_at_sale', label: 'Tasa USDT' },
  { key: 'rate_bcv_at_sale', label: 'Tasa BCV' },
  { key: 'margin_at_sale', label: 'Margen %' },
]

const rateHeaders = [
  { key: 'rate_date', label: 'Fecha' },
  { key: 'rate_usdt', label: 'Tasa USDT' },
  { key: 'rate_bcv', label: 'Tasa BCV' },
  { key: 'profit_margin', label: 'Margen %' },
  { key: 'gap', label: 'Brecha %' },
]

export function useExport() {
  const exportProducts = useCallback((products: Product[]) => {
    const data = products.map((p) => ({
      ...p,
      category_name: p.category?.name ?? 'Sin categoría',
    }))
    const csv = convertToCSV(data as unknown as Record<string, unknown>[], productHeaders)
    downloadCSV(csv, 'productos')
  }, [])

  const exportSales = useCallback((sales: Sale[]) => {
    const data = sales.map((s) => ({
      ...s,
      sale_date: new Date(s.sale_date).toLocaleDateString('es-VE'),
      payment_type: s.payment_type === 'cash_usd' ? 'Efectivo $' : 'Bolívares BCV',
    }))
    const csv = convertToCSV(data as unknown as Record<string, unknown>[], saleHeaders)
    downloadCSV(csv, 'ventas')
  }, [])

  const exportRates = useCallback((rates: RateHistory[]) => {
    const data = rates.map((r) => ({
      ...r,
      gap: ((Number(r.rate_usdt) - Number(r.rate_bcv)) / Number(r.rate_bcv) * 100).toFixed(2),
    }))
    const csv = convertToCSV(data as unknown as Record<string, unknown>[], rateHeaders)
    downloadCSV(csv, 'historial_tasas')
  }, [])

  return { exportProducts, exportSales, exportRates }
}

export type { ExportableData }
