import { Outlet, NavLink, useLocation } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'
import { useConfigStore } from '@/stores/config-store'
import { calculateGap, formatCurrency, formatPercent } from '@/lib/calculations'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Navigation config
// ---------------------------------------------------------------------------

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/sales', label: 'Ventas', icon: ShoppingCart },
  { to: '/rates', label: 'Tasas', icon: TrendingUp },
] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AppLayout() {
  const location = useLocation()
  const { user, signOut } = useAuthStore()
  const { rateUsdt, rateBcv } = useConfigStore()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const gap = calculateGap(rateUsdt, rateBcv)

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* ================================================================
          SIDEBAR — desktop only
          ================================================================ */}
      <aside
        className={cn(
          'hidden flex-col border-r border-border bg-sidebar transition-all duration-200 md:flex',
          sidebarCollapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* brand */}
        <div
          className={cn(
            'flex h-14 items-center border-b border-border px-4',
            sidebarCollapsed ? 'justify-center' : 'gap-2',
          )}
        >
          <TrendingUp className="h-6 w-6 shrink-0 text-primary" />
          {!sidebarCollapsed && (
            <span className="text-gradient-brand text-lg font-bold tracking-tight">
              Finanzas VE
            </span>
          )}
        </div>

        {/* nav links */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  sidebarCollapsed && 'justify-center px-0',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* collapse toggle */}
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Colapsar
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* ================================================================
          MOBILE SIDEBAR OVERLAY
          ================================================================ */}
      {mobileMenuOpen && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar md:hidden">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                <span className="text-gradient-brand text-lg font-bold">Finanzas VE</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 p-3">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </>
      )}

      {/* ================================================================
          MAIN COLUMN (header + content)
          ================================================================ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ---------- TOP HEADER BAR ---------- */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card/60 px-4 backdrop-blur-xl">
          {/* mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* rate indicators */}
          <div className="hidden items-center gap-4 text-xs sm:flex">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">USDT</span>
              <span className="font-semibold text-foreground">
                {rateUsdt > 0 ? formatCurrency(rateUsdt, 'BS') : '—'}
              </span>
            </div>

            <Separator orientation="vertical" className="h-4" />

            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">BCV</span>
              <span className="font-semibold text-foreground">
                {rateBcv > 0 ? formatCurrency(rateBcv, 'BS') : '—'}
              </span>
            </div>

            <Separator orientation="vertical" className="h-4" />

            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Brecha</span>
              <span
                className={cn(
                  'font-semibold',
                  gap > 0 ? 'text-amber-400' : 'text-primary',
                )}
              >
                {rateUsdt > 0 && rateBcv > 0 ? formatPercent(gap) : '—'}
              </span>
            </div>
          </div>

          {/* spacer */}
          <div className="flex-1" />

          {/* user dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar_url} alt={user?.name} />
                  <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            } />

            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Separator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* ---------- MAIN CONTENT ---------- */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* ================================================================
          MOBILE BOTTOM TAB BAR
          ================================================================ */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border bg-card/95 backdrop-blur-xl md:hidden">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center gap-0.5 py-1"
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
