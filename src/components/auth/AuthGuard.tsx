import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'
import { Loader2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, initialized } = useAuthStore()

  // ── Loading / Initializing ──────────────────────────────────────
  if (!initialized || loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background">
        {/* Brand logo animation */}
        <div className="relative flex items-center justify-center">
          <div
            className={cn(
              'absolute h-20 w-20 rounded-full',
              'bg-emerald-500/20 animate-ping'
            )}
          />
          <div
            className={cn(
              'relative flex h-16 w-16 items-center justify-center rounded-2xl',
              'bg-gradient-to-br from-emerald-500 to-cyan-500',
              'shadow-lg shadow-emerald-500/25'
            )}
          >
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Brand name */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-gradient-brand">
            Finanzas VE Pro
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando...</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Not authenticated → redirect to login ───────────────────────
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // ── Authenticated → render children ─────────────────────────────
  return <>{children}</>
}
