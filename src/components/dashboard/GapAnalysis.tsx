import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react'
import { formatPercent, formatCurrency } from '@/lib/calculations'
import { cn } from '@/lib/utils'

interface GapAnalysisProps {
  gapPercent: number
  rateUsdt: number
  rateBcv: number
}

export function GapAnalysis({ gapPercent, rateUsdt, rateBcv }: GapAnalysisProps) {
  const isPositiveGap = gapPercent > 0

  return (
    <Card className="card-glass animate-fade-in border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <ShieldAlert className="h-5 w-5 text-rose-400" />
          Análisis de Brecha Cambiaria
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Gap percentage ──────────────────────────────────── */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-rose-400">
            {formatPercent(Math.abs(gapPercent))}
          </span>
          <span className="text-sm text-muted-foreground">de brecha</span>
          {isPositiveGap ? (
            <TrendingUp className="ml-auto h-5 w-5 text-rose-400" />
          ) : (
            <TrendingDown className="ml-auto h-5 w-5 text-emerald-400" />
          )}
        </div>

        {/* ── Side-by-side rates ──────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {/* USDT Rate */}
          <div
            className={cn(
              'rounded-lg border border-border/50 p-3',
              'bg-amber-500/5'
            )}
          >
            <p className="text-xs font-medium text-muted-foreground">
              Tasa USDT
            </p>
            <p className="mt-1 text-lg font-bold text-amber-400">
              {formatCurrency(rateUsdt, 'BS')}
            </p>
            <p className="text-[11px] text-muted-foreground">Reposición</p>
          </div>

          {/* BCV Rate */}
          <div
            className={cn(
              'rounded-lg border border-border/50 p-3',
              'bg-cyan-500/5'
            )}
          >
            <p className="text-xs font-medium text-muted-foreground">
              Tasa BCV
            </p>
            <p className="mt-1 text-lg font-bold text-cyan-400">
              {formatCurrency(rateBcv, 'BS')}
            </p>
            <p className="text-[11px] text-muted-foreground">Oficial</p>
          </div>
        </div>

        {/* ── Explanation ─────────────────────────────────────── */}
        <p className="text-xs leading-relaxed text-muted-foreground">
          La brecha cambiaria del{' '}
          <span className="font-semibold text-rose-400">
            {formatPercent(Math.abs(gapPercent))}
          </span>{' '}
          indica que el dólar paralelo (USDT) es más caro que la tasa oficial (BCV).
          Al cobrar en bolívares a tasa BCV, el sistema compensa automáticamente
          esta diferencia para proteger tu margen de ganancia real.
        </p>

        {/* ── Status badge ────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Ajuste de brecha
          </span>
          <Badge
            variant="outline"
            className={cn(
              'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
              'text-[11px] font-medium'
            )}
          >
            Aplicado Automáticamente
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
