import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useExport } from '@/hooks/useExport'
import { useProducts } from '@/hooks/useProducts'
import { useSales } from '@/hooks/useSales'
import { useCustomers } from '@/hooks/useCustomers'
import {
  calculateBsPrice,
  calculateEffectivePrice,
  calculateSaleRevenue,
  formatCurrency,
} from '@/lib/calculations'
import { useConfigStore } from '@/stores/config-store'
import type { PaymentType, Sale } from '@/types'
import { format } from 'date-fns'
import { Download, Loader2, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const PAYMENT_METHODS = [
  { id: 'cash_usd', name: 'Efectivo ($)' },
  { id: 'bcv_bs', name: 'Tasa BCV (Bs)' },
]

export default function SalesPage() {
  const { sales, loading: salesLoading, deleteSale, createSale, updateSale } = useSales()
  const { allProducts } = useProducts()
  const { allCustomers } = useCustomers()
  const { rateUsdt, profitMargin } = useConfigStore()
  const { exportSales } = useExport()

  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('none')
  const [quantity, setQuantity] = useState<number>(1)
  const [paymentType, setPaymentType] = useState<PaymentType>('cash_usd')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [editQuantity, setEditQuantity] = useState<number>(1)
  const [editPaymentType, setEditPaymentType] = useState<PaymentType>('cash_usd')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const selectedProduct = allProducts.find(p => p.id === selectedProductId)

  // Preview Calculations
  let previewRevenue = 0
  let previewPriceBs = 0
  let previewPriceUsd = 0

  if (selectedProduct && rateUsdt > 0) {
    const effectiveUsd = selectedProduct.custom_effective_price ?? calculateEffectivePrice(
      selectedProduct.cost_usd,
      profitMargin,
    )
    previewPriceUsd = effectiveUsd
    previewPriceBs = calculateBsPrice(effectiveUsd, rateUsdt)

    if (paymentType === 'cash_usd') {
      previewRevenue = effectiveUsd * quantity
    } else {
      previewRevenue = (previewPriceBs / rateUsdt) * quantity
    }
  }

  const handleEditClick = (sale: Sale) => {
    setEditingSale(sale)
    setEditQuantity(sale.quantity)
    setEditPaymentType(sale.payment_type)
    setIsEditDialogOpen(true)
  }

  const handleUpdateSale = async () => {
    if (!editingSale) return
    setIsSubmitting(true)
    const { error } = await updateSale(editingSale.id, {
      quantity: editQuantity,
      payment_type: editPaymentType
    })
    setIsSubmitting(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Venta actualizada')
      setIsEditDialogOpen(false)
    }
  }

  const handleRegisterSale = async () => {
    if (!selectedProduct) return
    setIsSubmitting(true)
    const custId = selectedCustomerId === 'none' ? undefined : selectedCustomerId
    const { error } = await createSale(selectedProduct, quantity, paymentType, custId)
    setIsSubmitting(false)

    if (error) {
      toast.error(error)
    } else {
      toast.success('Venta registrada con éxito')
      setQuantity(1)
      setSelectedProductId('')
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            Registro de Ventas
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Asienta tus ventas diarias indicando el método de pago.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => exportSales(sales)}
          className="border-border"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Historial
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sale Form */}
        <Card className="lg:col-span-1 card-glass border-border h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              Nueva Venta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Producto</Label>
              <Select
                value={selectedProductId}
                onValueChange={v => setSelectedProductId(v || '')}
              >
                <SelectTrigger className="bg-zinc-900/50 border-border w-full">
                  <SelectValue placeholder="Selecciona un producto...">
                    {allProducts.find(p => p.id === selectedProductId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="p-1" alignItemWithTrigger={false}>
                  {allProducts.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cliente (Opcional)</Label>
              <Select
                value={selectedCustomerId}
                onValueChange={v => setSelectedCustomerId(v || 'none')}
              >
                <SelectTrigger className="bg-zinc-900/50 border-border w-full">
                  <SelectValue placeholder="Selecciona un cliente">
                    {selectedCustomerId === 'none' ? 'Venta Rápida' : allCustomers.find(c => c.id === selectedCustomerId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="p-1" alignItemWithTrigger={false}>
                  <SelectItem value="none">Venta Rápida</SelectItem>
                  {allCustomers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-r-none border-r-0 h-10 w-10 bg-zinc-900/50 border-border text-zinc-400 hover:text-zinc-200"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setQuantity(Number(e.target.value) || 1)
                    }
                    className="rounded-none border-x-0 h-10 text-center bg-zinc-900/50 border-border focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-l-none border-l-0 h-10 w-10 bg-zinc-900/50 border-border text-zinc-400 hover:text-zinc-200"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Medio de Pago</Label>
                <Select
                  value={paymentType}
                  onValueChange={v =>
                    setPaymentType((v as PaymentType ) || 'cash_usd')
                  }
                >
                  <SelectTrigger className="bg-zinc-900/50 border-border w-full">
                    <SelectValue>
                      {paymentType ? PAYMENT_METHODS.find(p => p.id === paymentType)?.name : 'Medio de pago'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="p-1" alignItemWithTrigger={false}>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedProduct && (
              <div className="mt-4 p-4 rounded-xl card-glass space-y-3 animate-slide-up">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Precio Unitario:</span>
                  <span className="font-medium text-zinc-200">
                    {paymentType === 'cash_usd'
                      ? formatCurrency(previewPriceUsd)
                      : formatCurrency(previewPriceBs, 'BS')}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-border">
                  <span className="text-zinc-300 font-medium">
                    Ingreso Neto Calculado (USD):
                  </span>
                  <span className="font-bold text-cyan-400">
                    {formatCurrency(previewRevenue)}
                  </span>
                </div>
              </div>
            )}

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white mt-2"
              onClick={handleRegisterSale}
              disabled={!selectedProduct || isSubmitting || rateUsdt <= 0}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Registrar Venta
            </Button>
          </CardContent>
        </Card>

        {/* Sales History */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-lg text-zinc-200 pl-1">
            Historial Reciente
          </h3>

          {salesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full bg-zinc-800/50" />
              <Skeleton className="h-16 w-full bg-zinc-800/50" />
            </div>
          ) : sales.length === 0 ? (
            <Card className="border-border bg-card-glass border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                <p>No se han registrado ventas.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border border-border bg-card-glass overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-900/50">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="font-bold">Fecha</TableHead>
                      <TableHead className="font-bold">Producto</TableHead>
                      <TableHead className="font-bold">Cliente</TableHead>
                      <TableHead className="font-bold text-center">
                        Cant.
                      </TableHead>
                      <TableHead className="font-bold text-center">
                        Pago
                      </TableHead>
                      <TableHead className="font-bold text-right text-cyan-400">
                        Ingreso ($)
                      </TableHead>
                      <TableHead className="font-bold text-right text-emerald-400">
                        Ganancia ($)
                      </TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map(s => {
                      const res = calculateSaleRevenue(
                        Number(s.product_cost_snapshot),
                        s.quantity,
                        s.payment_type,
                        Number(s.rate_usdt_at_sale),
                        Number(s.rate_bcv_at_sale),
                        Number(s.margin_at_sale),
                      )
                      return (
                        <TableRow
                          key={s.id}
                          className="border-border hover:bg-zinc-800/50"
                        >
                          <TableCell className="text-zinc-400 text-xs">
                            {format(new Date(s.sale_date), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="font-medium text-zinc-200">
                            {s.product_name_snapshot}
                          </TableCell>
                          <TableCell className="text-zinc-400 text-sm">
                            {s.customer?.name || 'Venta Rápida'}
                          </TableCell>
                          <TableCell className="text-center">
                            {s.quantity}
                          </TableCell>
                          <TableCell className="text-center">
                            {s.payment_type === 'cash_usd' ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10">
                                Efectivo
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/10">
                                BCV
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold text-cyan-400">
                            {formatCurrency(res.revenue)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-400">
                            {formatCurrency(res.profit)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditClick(s)} className="text-zinc-400 hover:text-zinc-300 h-8 w-8">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  }
                                />
                                <AlertDialogContent className="card-glass border-border">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      ¿Eliminar venta?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción descontará el ingreso y la
                                      ganancia de tu dashboard de forma
                                      permanente.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-border">
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteSale(s.id)}
                                      className="bg-rose-600 hover:bg-rose-500 text-white"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Sales List */}
              <div className="md:hidden divide-y divide-border">
                {sales.map(s => {
                  const res = calculateSaleRevenue(
                    Number(s.product_cost_snapshot),
                    s.quantity,
                    s.payment_type,
                    Number(s.rate_usdt_at_sale),
                    Number(s.rate_bcv_at_sale),
                    Number(s.margin_at_sale),
                  )
                  return (
                    <div
                      key={s.id}
                      className="p-4 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <h4 className="font-medium text-zinc-200 leading-none">
                          {s.product_name_snapshot}
                        </h4>
                        <div className="text-xs text-zinc-400 mt-0.5">{s.customer?.name || 'Venta Rápida'}</div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span>
                            {format(new Date(s.sale_date), 'dd/MM/yy')}
                          </span>
                          <span>•</span>
                          <span>x{s.quantity}</span>
                          <span>•</span>
                          {s.payment_type === 'cash_usd' ? (
                            <span className="text-emerald-400 font-medium">
                              Efectivo
                            </span>
                          ) : (
                            <span className="text-amber-400 font-medium">
                              BCV
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="block font-bold text-cyan-400">
                            {formatCurrency(res.revenue)}
                          </span>
                          <span className="block text-[10px] text-emerald-400">
                            +{formatCurrency(res.profit)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(s)} className="text-zinc-400 h-8 w-8 -mr-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-rose-500 h-8 w-8 -mr-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              }
                            />
                            <AlertDialogContent className="card-glass border-border w-[90%] rounded-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Eliminar venta?
                                </AlertDialogTitle>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-border">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteSale(s.id)}
                                  className="bg-rose-600 text-white"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] card-glass border-border">
          <DialogHeader>
            <DialogTitle>Editar Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Producto</Label>
              <Input disabled value={editingSale?.product_name_snapshot || ''} className="bg-zinc-900/50 border-border text-zinc-500" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-r-none border-r-0 h-10 w-10 bg-zinc-900/50 border-border text-zinc-400 hover:text-zinc-200"
                    onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                    disabled={editQuantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Number(e.target.value) || 1)}
                    className="rounded-none border-x-0 h-10 text-center bg-zinc-900/50 border-border focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-l-none border-l-0 h-10 w-10 bg-zinc-900/50 border-border text-zinc-400 hover:text-zinc-200"
                    onClick={() => setEditQuantity(editQuantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Medio de Pago</Label>
                <Select
                  value={editPaymentType}
                  onValueChange={(v) => setEditPaymentType(v as PaymentType)}
                >
                  <SelectTrigger className="bg-zinc-900/50 border-border w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="p-1" alignItemWithTrigger={false}>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateSale} disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
