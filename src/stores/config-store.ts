import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { insforge } from '@/lib/insforge'
import { fetchBcvRate, fetchUsdtRate } from '@/hooks/useRates'
import type { RateConfig } from '@/types'

interface ConfigState extends RateConfig {
  loading: boolean
  isCustomUsdt: boolean
  isCustomBcv: boolean
  lastUpdatedAt: string | null

  // Actions
  setRateUsdt: (rate: number) => void
  setRateBcv: (rate: number) => void
  setIsCustomUsdt: (val: boolean) => void
  setIsCustomBcv: (val: boolean) => void
  setProfitMargin: (margin: number) => void
  setAll: (config: RateConfig) => void
  
  fetchLiveRates: () => Promise<void>
  loadTodayRates: (userId: string) => Promise<void>
  saveTodayRates: (userId: string) => Promise<void>
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      rateUsdt: 0,
      rateBcv: 0,
      profitMargin: 40,
      loading: false,
      isCustomUsdt: false,
      isCustomBcv: false,
      lastUpdatedAt: null,

      setRateUsdt: (rate) => set({ rateUsdt: rate }),
      setRateBcv: (rate) => set({ rateBcv: rate }),
      setIsCustomUsdt: (val) => {
        set({ isCustomUsdt: val })
        if (!val) get().fetchLiveRates()
      },
      setIsCustomBcv: (val) => {
        set({ isCustomBcv: val })
        if (!val) get().fetchLiveRates()
      },
      setProfitMargin: (margin) => set({ profitMargin: margin }),
      setAll: (config) => set(config),

      fetchLiveRates: async () => {
        const { isCustomUsdt, isCustomBcv } = get()
        let updated = false
        
        if (!isCustomUsdt) {
          const { rate } = await fetchUsdtRate()
          if (rate) {
            set({ rateUsdt: rate })
            updated = true
          }
        }
        
        if (!isCustomBcv) {
          const { rate } = await fetchBcvRate()
          if (rate) {
            set({ rateBcv: rate })
            updated = true
          }
        }
        
        if (updated) {
          set({ lastUpdatedAt: new Date().toISOString() })
        }
      },

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

      // Automatically fetch API rates if they are not customized
      await get().fetchLiveRates()

      // Auto-save the fetched/loaded rates for today to build the history graph
      await get().saveTodayRates(userId)
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
  }),
  {
    name: 'config-storage',
    partialize: (state) => ({ 
      isCustomUsdt: state.isCustomUsdt, 
      isCustomBcv: state.isCustomBcv,
      profitMargin: state.profitMargin
    }),
  }
)
)
