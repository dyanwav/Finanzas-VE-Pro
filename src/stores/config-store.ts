import { create } from 'zustand'
import { insforge } from '@/lib/insforge'
import type { RateConfig } from '@/types'

interface ConfigState extends RateConfig {
  loading: boolean

  // Actions
  setRateUsdt: (rate: number) => void
  setRateBcv: (rate: number) => void
  setProfitMargin: (margin: number) => void
  setAll: (config: RateConfig) => void
  loadTodayRates: (userId: string) => Promise<void>
  saveTodayRates: (userId: string) => Promise<void>
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  rateUsdt: 0,
  rateBcv: 0,
  profitMargin: 40,
  loading: false,

  setRateUsdt: (rate) => set({ rateUsdt: rate }),
  setRateBcv: (rate) => set({ rateBcv: rate }),
  setProfitMargin: (margin) => set({ profitMargin: margin }),
  setAll: (config) => set(config),

  loadTodayRates: async (userId) => {
    set({ loading: true })
    const today = new Date().toISOString().split('T')[0]

    const { data } = await insforge.database
      .from('rate_history')
      .select('*')
      .eq('user_id', userId)
      .eq('rate_date', today)
      .limit(1)

    if (data && data.length > 0) {
      const rate = data[0]
      set({
        rateUsdt: Number(rate.rate_usdt),
        rateBcv: Number(rate.rate_bcv),
        profitMargin: Number(rate.profit_margin),
        loading: false,
      })
    } else {
      // Load last known rates
      const { data: lastRates } = await insforge.database
        .from('rate_history')
        .select('*')
        .eq('user_id', userId)
        .order('rate_date', { ascending: false })
        .limit(1)

      if (lastRates && lastRates.length > 0) {
        const rate = lastRates[0]
        set({
          rateUsdt: Number(rate.rate_usdt),
          rateBcv: Number(rate.rate_bcv),
          profitMargin: Number(rate.profit_margin),
          loading: false,
        })
      } else {
        set({ loading: false })
      }
    }
  },

  saveTodayRates: async (userId) => {
    const { rateUsdt, rateBcv, profitMargin } = get()
    if (rateUsdt <= 0 || rateBcv <= 0) return

    const today = new Date().toISOString().split('T')[0]

    // Upsert: try to update first, if no rows affected, insert
    const { data: existing } = await insforge.database
      .from('rate_history')
      .select('id')
      .eq('user_id', userId)
      .eq('rate_date', today)
      .limit(1)

    if (existing && existing.length > 0) {
      await insforge.database
        .from('rate_history')
        .update({
          rate_usdt: rateUsdt,
          rate_bcv: rateBcv,
          profit_margin: profitMargin,
        })
        .eq('id', existing[0].id)
    } else {
      await insforge.database
        .from('rate_history')
        .insert([{
          user_id: userId,
          rate_date: today,
          rate_usdt: rateUsdt,
          rate_bcv: rateBcv,
          profit_margin: profitMargin,
        }])
    }
  },
}))
