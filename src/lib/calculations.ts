// ====================================================================
// Finanzas VE Pro — Pure Financial Calculation Functions
// ====================================================================
// All functions are pure (no side effects) and testable in isolation.

import type { ProductPricing, DashboardKPIs, PaymentType } from '@/types'

/**
 * Calculate the exchange rate gap (brecha cambiaria) as a percentage.
 * Represents how much more expensive the USDT rate is vs BCV official rate.
 */
export function calculateGap(rateUsdt: number, rateBcv: number): number {
  if (rateBcv <= 0) return 0
  return ((rateUsdt - rateBcv) / rateBcv) * 100
}

/**
 * Calculate the effective sale price in USD, given a cost and desired profit margin.
 * Uses the margin-on-sale formula: price = cost / (1 - margin/100)
 * Example: cost $10, margin 40% → price = 10 / 0.6 = $16.67
 */
export function calculateEffectivePrice(costUsd: number, marginPercent: number): number {
  const factor = 1 - marginPercent / 100
  if (factor <= 0) return costUsd // Prevent division by zero
  return costUsd / factor
}

/**
 * Convert a USD price to Bolívares using the USDT (reposition) rate.
 */
export function calculateBsPrice(priceUsd: number, rateUsdt: number): number {
  return priceUsd * rateUsdt
}

/**
 * Calculate the equivalent USD value when paying in Bs at BCV rate.
 * This is the "inflated" dollar price that clients see when paying via BCV.
 */
export function calculateBcvEquivalent(priceBs: number, rateBcv: number): number {
  if (rateBcv <= 0) return 0
  return priceBs / rateBcv
}

/**
 * Calculate the full pricing breakdown for a product.
 */
export function calculateProductPricing(
  costUsd: number,
  marginPercent: number,
  rateUsdt: number,
  rateBcv: number
): ProductPricing {
  const effectivePriceUsd = calculateEffectivePrice(costUsd, marginPercent)
  const priceBs = calculateBsPrice(effectivePriceUsd, rateUsdt)
  const priceBcvUsd = calculateBcvEquivalent(priceBs, rateBcv)
  const costBs = calculateBsPrice(costUsd, rateUsdt)
  const profitUsd = effectivePriceUsd - costUsd
  const profitPercent = costUsd > 0 ? (profitUsd / costUsd) * 100 : 0

  return {
    costUsd,
    costBs,
    effectivePriceUsd,
    priceBs,
    priceBcvUsd,
    profitUsd,
    profitPercent,
  }
}

/**
 * Calculate the real revenue in USD for a sale, depending on payment type.
 * - cash_usd: Client pays the effective USD price directly.
 * - bcv_bs: Client pays in Bs at BCV rate. Real USD = priceBs / rateUsdt.
 */
export function calculateSaleRevenue(
  costUsd: number,
  quantity: number,
  paymentType: PaymentType,
  rateUsdt: number,
  _rateBcv: number,
  marginPercent: number
): { revenue: number; cost: number; profit: number } {
  const effectivePriceUsd = calculateEffectivePrice(costUsd, marginPercent)
  const priceBs = calculateBsPrice(effectivePriceUsd, rateUsdt)

  let revenuePerUnit: number
  if (paymentType === 'cash_usd') {
    revenuePerUnit = effectivePriceUsd
  } else {
    // bcv_bs: The client pays priceBs in bolívares, but to restock
    // we convert back to USD at the reposition rate (USDT)
    revenuePerUnit = priceBs / rateUsdt
  }

  const totalRevenue = revenuePerUnit * quantity
  const totalCost = costUsd * quantity
  const totalProfit = totalRevenue - totalCost

  return {
    revenue: totalRevenue,
    cost: totalCost,
    profit: totalProfit,
  }
}

/**
 * Aggregate an array of sale calculations into dashboard KPIs.
 */
export function calculateDashboardKPIs(
  sales: Array<{
    costUsd: number
    quantity: number
    paymentType: PaymentType
    rateUsdt: number
    rateBcv: number
    margin: number
  }>
): DashboardKPIs {
  let totalInvested = 0
  let totalRevenue = 0
  let totalProfit = 0

  for (const sale of sales) {
    const result = calculateSaleRevenue(
      sale.costUsd,
      sale.quantity,
      sale.paymentType,
      sale.rateUsdt,
      sale.rateBcv,
      sale.margin
    )
    totalInvested += result.cost
    totalRevenue += result.revenue
    totalProfit += result.profit
  }

  const profitMarginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  return {
    totalInvested,
    totalRevenue,
    totalProfit,
    profitMarginPercent,
    totalSalesCount: sales.length,
  }
}

/**
 * Format a number as currency string.
 */
export function formatCurrency(value: number, currency: 'USD' | 'BS' = 'USD'): string {
  if (currency === 'USD') {
    return `$${value.toFixed(2)}`
  }
  return `${value.toFixed(2)} Bs`
}

/**
 * Format a number as percentage string.
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}
