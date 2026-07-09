import { useState } from 'react'
import { useSales } from '@/hooks/useSales'
import { useDashboard } from '@/hooks/useDashboard'
import { useConfigStore } from '@/stores/config-store'
import { StatCard } from '@/components/dashboard/StatCard'
import { GapAnalysis } from '@/components/dashboard/GapAnalysis'
import { formatCurrency, formatPercent } from '@/lib/calculations'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, TrendingUp, Wallet, Percent, Info, Package } from 'lucide-react'
import type { PeriodFilter } from '@/types'

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodFilter>('month')
  const { sales } = useSales()
  const { rateUsdt, rateBcv } = useConfigStore()
  
  const { kpis, chartData, currentGap, topProducts } = useDashboard(sales, period)

  // Utilizar las tasas configuradas globalmente si no hay ventas recientes, 
  // de lo contrario useDashboard usa la más reciente.
  const displayGap = currentGap > 0 ? currentGap : (rateBcv > 0 ? ((rateUsdt - rateBcv) / rateBcv) * 100 : 0)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-1">Resumen de rentabilidad y operaciones.</p>
        </div>
        
        <Tabs value={period} onValueChange={(v: string) => setPeriod(v as PeriodFilter)} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-4 bg-zinc-900/50">
            <TabsTrigger value="today">Hoy</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
            <TabsTrigger value="custom">Todo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Invertido" 
          value={formatCurrency(kpis.totalInvested)} 
          subtitle="Costo de mercancía vendida"
          icon={DollarSign} 
        />
        <StatCard 
          title="Total Ingresos" 
          value={formatCurrency(kpis.totalRevenue)} 
          subtitle="Ingresos brutos reales"
          icon={TrendingUp} 
          accentColor="cyan" 
        />
        <StatCard 
          title="Ganancia Neta" 
          value={formatCurrency(kpis.totalProfit)} 
          subtitle="Ganancia limpia real"
          icon={Wallet} 
          accentColor="emerald" 
        />
        <StatCard 
          title="Margen Real %" 
          value={formatPercent(kpis.profitMarginPercent)} 
          subtitle="Rentabilidad promedio"
          icon={Percent} 
          accentColor="amber" 
        />
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <Card className="card-glass border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              Productos Más Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {topProducts.map((p, i) => {
                const maxQuantity = topProducts[0].quantity;
                const percentage = Math.max(5, (p.quantity / maxQuantity) * 100);
                
                return (
                  <div key={i} className="flex flex-col gap-3 p-4 rounded-xl card-glass hover:bg-zinc-900/80 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Badge variant="outline" className="text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shrink-0">
                          #{i + 1}
                        </Badge>
                        <span className="font-medium text-zinc-200 truncate" title={p.name}>{p.name}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1 mt-auto">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400">{p.quantity} unids.</span>
                        <span className="font-bold text-cyan-400">{formatCurrency(p.revenue)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Principal */}
        <Card className="lg:col-span-2 card-glass border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Evolución de Ingresos y Ganancias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#475569" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Area type="monotone" dataKey="revenue" name="Ingresos" stroke="#06b6d4" fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="profit" name="Ganancia" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] w-full flex items-center justify-center text-zinc-500 flex-col gap-2 mt-4">
                <Info className="w-8 h-8 opacity-50" />
                <p>No hay datos de ventas para este período.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <GapAnalysis 
            gapPercent={displayGap} 
            rateUsdt={rateUsdt} 
            rateBcv={rateBcv} 
          />

          <Card className="card-glass border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                Operatividad del Cálculo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li className="flex gap-2">
                  <span className="text-zinc-50 font-medium">1.</span>
                  <p>Se establece el costo de adquisición unitario en dólares.</p>
                </li>
                <li className="flex gap-2">
                  <span className="text-zinc-50 font-medium">2.</span>
                  <p>Se calcula el precio efectivo agregando el margen de ganancia deseado.</p>
                </li>
                <li className="flex gap-2">
                  <span className="text-zinc-50 font-medium">3.</span>
                  <p>El sistema divide el precio final en Bolívares por la Tasa BCV oficial para calcular el precio inflado que debe cobrar para cubrir la brecha.</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
