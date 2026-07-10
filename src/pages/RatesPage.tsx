import { useState } from 'react'
import { useRates } from '@/hooks/useRates'
import { useConfigStore } from '@/stores/config-store'
import { useAuthStore } from '@/stores/auth-store'
import { useExport } from '@/hooks/useExport'
import { calculateGap, formatPercent } from '@/lib/calculations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Save, Download, Trash2, Loader2, AlertTriangle, Lock, Unlock } from 'lucide-react'
import { format } from 'date-fns'

export default function RatesPage() {
  const { user } = useAuthStore()
  const { rateHistory, loading: ratesLoading, deleteRate, refreshRates } = useRates()
  const { 
    rateUsdt, rateBcv, profitMargin, lastUpdatedAt,
    setRateUsdt, setRateBcv, setProfitMargin, 
    isCustomUsdt, isCustomBcv, setIsCustomUsdt, setIsCustomBcv,
    saveTodayRates 
  } = useConfigStore()
  const { exportRates } = useExport()

  const [isSaving, setIsSaving] = useState(false)

  const currentGap = calculateGap(rateUsdt, rateBcv)

  const handleSaveRates = async () => {
    if (!user) return
    if (rateUsdt <= 0 || rateBcv <= 0) {
      toast.error('Ambas tasas deben ser mayores a 0')
      return
    }

    setIsSaving(true)
    await saveTodayRates(user.id)
    setIsSaving(false)
    toast.success('Configuración guardada exitosamente')
    refreshRates()
  }

  // Prepara datos para el gráfico invirtiendo el historial (cronológico)
  const chartData = [...rateHistory].reverse().map(r => ({
    date: format(new Date(r.rate_date), 'dd MMM'),
    gap: Number((((Number(r.rate_usdt) - Number(r.rate_bcv)) / Number(r.rate_bcv)) * 100).toFixed(2))
  }))

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Tasas y Configuración</h1>
          <p className="text-sm text-zinc-400 mt-1">Configura las tasas diarias para el cálculo automático de precios.</p>
        </div>
        <Button variant="outline" onClick={() => exportRates(rateHistory)} className="border-border">
          <Download className="w-4 h-4 mr-2" />
          Exportar Historial
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario Configuración */}
        <Card className="lg:col-span-1 card-glass border-border h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Parámetros Actuales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-zinc-400 uppercase tracking-wider text-xs font-bold">Tasa USDT / Paralelo (Bs)</Label>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="custom-usdt" 
                    checked={isCustomUsdt} 
                    onCheckedChange={(checked: boolean) => setIsCustomUsdt(checked)} 
                  />
                  <Label htmlFor="custom-usdt" className="text-[10px] text-zinc-400 cursor-pointer">
                    Personalizada
                  </Label>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">Bs</span>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={rateUsdt || ''} 
                  onChange={(e) => setRateUsdt(Number(e.target.value))} 
                  className="pl-9 pr-9 bg-zinc-900/50 border-border font-medium disabled:opacity-50"
                  disabled={!isCustomUsdt}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  {isCustomUsdt ? <Unlock className="w-4 h-4 text-amber-400" /> : <Lock className="w-4 h-4 text-emerald-400" />}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-zinc-400 uppercase tracking-wider text-xs font-bold">Tasa Oficial BCV (Bs)</Label>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="custom-rate" 
                    checked={isCustomBcv} 
                    onCheckedChange={(checked: boolean) => setIsCustomBcv(checked)} 
                  />
                  <Label htmlFor="custom-rate" className="text-[10px] text-zinc-400 cursor-pointer">
                    Usar tasa personalizada
                  </Label>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">Bs</span>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={rateBcv || ''} 
                  onChange={(e) => setRateBcv(Number(e.target.value))} 
                  className="pl-9 pr-9 bg-zinc-900/50 border-border font-medium disabled:opacity-50"
                  disabled={!isCustomBcv}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  {isCustomBcv ? <Unlock className="w-4 h-4 text-amber-400" /> : <Lock className="w-4 h-4 text-emerald-400" />}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400 uppercase tracking-wider text-xs font-bold">Margen Global Deseado (%)</Label>
              <div className="relative">
                <Input 
                  type="number" 
                  value={profitMargin || ''} 
                  onChange={(e) => setProfitMargin(Number(e.target.value))} 
                  className="pr-9 bg-zinc-900/50 border-border font-medium"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">%</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Margen fijado:</span>
                <span className="font-bold text-zinc-200">{profitMargin}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Brecha actual:</span>
                <span className={`font-extrabold ${currentGap > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatPercent(currentGap)}
                </span>
              </div>
              {lastUpdatedAt && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Última actualización:</span>
                  <span className="text-zinc-400">
                    {format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
              )}
            </div>

            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
              onClick={handleSaveRates}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar para Hoy
            </Button>
          </CardContent>
        </Card>

        {/* Historial y Gráfico */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-glass border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Evolución de Brecha Cambiaria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 1 ? (
                <div className="h-[200px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#fb7185' }}
                        formatter={(value: any) => [`${value}%`, 'Brecha']}
                      />
                      <Line type="monotone" dataKey="gap" stroke="#fb7185" strokeWidth={2} dot={{ fill: '#fb7185', r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-zinc-500 text-sm">
                  Se requieren al menos 2 días de registro para graficar.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="rounded-xl border border-border bg-card-glass overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-900/50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="font-bold">Fecha</TableHead>
                    <TableHead className="font-bold text-center">Tasa USDT</TableHead>
                    <TableHead className="font-bold text-center">Tasa BCV</TableHead>
                    <TableHead className="font-bold text-center">Brecha %</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-500" />
                      </TableCell>
                    </TableRow>
                  ) : rateHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-zinc-500">
                        No hay historial de tasas registrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rateHistory.map((r) => {
                      const gap = calculateGap(Number(r.rate_usdt), Number(r.rate_bcv))
                      return (
                        <TableRow key={r.id} className="border-border hover:bg-zinc-800/50">
                          <TableCell className="font-medium text-zinc-300">
                            {format(new Date(r.rate_date), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="text-center font-bold text-zinc-100">{Number(r.rate_usdt).toFixed(2)} Bs</TableCell>
                          <TableCell className="text-center font-bold text-zinc-100">{Number(r.rate_bcv).toFixed(2)} Bs</TableCell>
                          <TableCell className="text-center">
                            <span className={`font-bold ${gap > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {formatPercent(gap)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteRate(r.id)}
                              className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
