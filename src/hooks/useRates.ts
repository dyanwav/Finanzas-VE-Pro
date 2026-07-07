import { useState, useCallback, useEffect } from 'react'
import { insforge } from '@/lib/insforge'
import { useAuthStore } from '@/stores/auth-store'
import type { RateHistory } from '@/types'

export function useRates() {
  const user = useAuthStore((s) => s.user)
  const [rateHistory, setRateHistory] = useState<RateHistory[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRateHistory = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data, error } = await insforge.database
      .from('rate_history')
      .select('*')
      .eq('user_id', user.id)
      .order('rate_date', { ascending: false })
      .limit(90) // Last 3 months

    if (!error && data) {
      setRateHistory(data as unknown as RateHistory[])
    }
    setLoading(false)
  }, [user])

  const deleteRate = useCallback(async (id: string) => {
    if (!user) return { error: 'No autenticado' }
    const { error } = await insforge.database
      .from('rate_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }
    await fetchRateHistory()
    return {}
  }, [user, fetchRateHistory])

  useEffect(() => {
    fetchRateHistory()
  }, [fetchRateHistory])

  return {
    rateHistory,
    loading,
    deleteRate,
    refreshRates: fetchRateHistory,
  }
}

/**
 * Attempt to fetch the current BCV rate from a public API.
 * Falls back gracefully if the API is unreachable.
 */
export async function fetchBcvRate(): Promise<{ rate: number | null; error?: string }> {
  try {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return { rate: null, error: 'No se pudo obtener la tasa BCV' }
    }

    const data = await response.json()

    // The API returns 'promedio' for the BCV rate
    const bcvRate = data?.promedio
    if (typeof bcvRate === 'number' && bcvRate > 0) {
      return { rate: bcvRate }
    }

    return { rate: null, error: 'Formato de respuesta inesperado' }
  } catch {
    return { rate: null, error: 'No se pudo conectar con el servicio de tasas' }
  }
}

/**
 * Attempt to fetch the current parallel/USDT rate from a public API.
 * Falls back gracefully if the API is unreachable.
 */
export async function fetchUsdtRate(): Promise<{ rate: number | null; error?: string }> {
  try {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/paralelo', {
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return { rate: null, error: 'No se pudo obtener la tasa USDT paralelo' }
    }

    const data = await response.json()

    const usdtRate = data?.promedio
    if (typeof usdtRate === 'number' && usdtRate > 0) {
      return { rate: usdtRate }
    }

    return { rate: null, error: 'Formato de respuesta inesperado' }
  } catch {
    return { rate: null, error: 'No se pudo conectar con el servicio de tasas' }
  }
}
