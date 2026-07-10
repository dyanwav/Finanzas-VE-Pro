// ====================================================================
// Finanzas VE Pro — TypeScript Type Definitions
// ====================================================================

// ---- Auth ----
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
}

// ---- Categories ----
export interface Category {
  id: string
  user_id: string
  name: string
  created_at: string
}

export type CategoryInsert = Omit<Category, 'id' | 'created_at'>

// ---- Customers ----
export interface Customer {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  document_id: string | null
  created_at: string
}

export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'user_id'>

export interface Supplier {
  id: string
  user_id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  created_at: string
}

export type SupplierInsert = Omit<Supplier, 'id' | 'created_at' | 'user_id'>

// ---- Products ----
export interface Product {
  id: string
  user_id: string
  category_id: string | null
  supplier_id: string | null
  name: string
  sku?: string | null
  cost_usd: number
  custom_effective_price?: number | null
  created_at: string
  updated_at: string
  // Joined
  category?: Category | null
  supplier?: Supplier | null
}

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>

// ---- Rate History ----
export interface RateHistory {
  id: string
  user_id: string
  rate_date: string
  rate_usdt: number
  rate_bcv: number
  profit_margin: number
  created_at: string
}

export type RateHistoryInsert = Omit<RateHistory, 'id' | 'created_at'>

// ---- Sales ----
export type PaymentType = 'cash_usd' | 'bcv_bs'

export interface Sale {
  id: string
  user_id: string
  product_id: string | null
  customer_id?: string | null
  quantity: number
  payment_type: PaymentType
  rate_usdt_at_sale: number
  rate_bcv_at_sale: number
  margin_at_sale: number
  product_name_snapshot: string
  product_cost_snapshot: number
  sale_date: string
  created_at: string
  // Joined
  product?: Product | null
  customer?: Customer | null
}

export type SaleInsert = Omit<Sale, 'id' | 'created_at' | 'product' | 'customer'>

// ---- Calculated Pricing ----
export interface ProductPricing {
  costUsd: number
  costBs: number
  effectivePriceUsd: number
  priceBs: number
  priceBcvUsd: number
  profitUsd: number
  profitPercent: number
}

// ---- Dashboard KPIs ----
export interface DashboardKPIs {
  totalInvested: number
  totalRevenue: number
  totalProfit: number
  profitMarginPercent: number
  totalSalesCount: number
}

// ---- Config / Rates ----
export interface RateConfig {
  rateUsdt: number
  rateBcv: number
  profitMargin: number
}

// ---- Chart Data ----
export interface ChartDataPoint {
  date: string
  revenue: number
  profit: number
  investment: number
}

export interface GapDataPoint {
  date: string
  rateUsdt: number
  rateBcv: number
  gap: number
}

// ---- Period Filter ----
export type PeriodFilter = 'today' | 'week' | 'month' | 'custom'

export interface DateRange {
  from: Date
  to: Date
}
