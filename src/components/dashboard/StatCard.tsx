import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

type AccentColor = 'emerald' | 'cyan' | 'rose' | 'amber' | 'default'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  accentColor?: AccentColor
}

const accentStyles: Record<AccentColor, { bg: string; text: string; ring: string }> = {
  emerald: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    ring: 'ring-emerald-500/25',
  },
  cyan: {
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-400',
    ring: 'ring-cyan-500/25',
  },
  rose: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    ring: 'ring-rose-500/25',
  },
  amber: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    ring: 'ring-amber-500/25',
  },
  default: {
    bg: 'bg-muted/50',
    text: 'text-muted-foreground',
    ring: 'ring-border',
  },
}

const trendConfig = {
  up: { icon: TrendingUp, color: 'text-emerald-400' },
  down: { icon: TrendingDown, color: 'text-rose-400' },
  neutral: { icon: Minus, color: 'text-muted-foreground' },
} as const

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  accentColor = 'default',
}: StatCardProps) {
  const accent = accentStyles[accentColor]

  return (
    <div
      className={cn(
        'card-glass rounded-xl p-5',
        'animate-fade-in transition-all duration-200',
        'hover:border-border/80 hover:shadow-lg hover:shadow-black/20'
      )}
    >
      {/* Header: icon + title */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            'ring-1',
            accent.bg,
            accent.ring
          )}
        >
          <Icon className={cn('h-4.5 w-4.5', accent.text)} />
        </div>
        <span className="text-sm font-medium text-muted-foreground truncate">
          {title}
        </span>
      </div>

      {/* Value */}
      <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>

      {/* Footer: subtitle / trend */}
      <div className="mt-1.5 flex items-center justify-between gap-2">
        {subtitle && (
          <span className="text-xs text-muted-foreground truncate">
            {subtitle}
          </span>
        )}

        {trend && trendValue && (
          <div className={cn('ml-auto flex items-center gap-1 text-xs font-medium', trendConfig[trend].color)}>
            {(() => {
              const TrendIcon = trendConfig[trend].icon
              return <TrendIcon className="h-3.5 w-3.5" />
            })()}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  )
}
