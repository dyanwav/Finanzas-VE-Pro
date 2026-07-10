import { useState } from 'react'
import { useCustomers } from '@/hooks/useCustomers'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { Plus, Search, Trash2, Users, Loader2, History } from 'lucide-react'
import { formatCurrency, calculateSaleRevenue } from '@/lib/calculations'
import type { Sale, Customer } from '@/types'

const customerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  document_id: z.string().optional().or(z.literal('')),
})

type CustomerFormValues = z.infer<typeof customerSchema>

export default function CustomersPage() {
  const { customers, loading, search, setSearch, createCustomer, updateCustomer, deleteCustomer, fetchCustomerSales } = useCustomers()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [historyCustomerName, setHistoryCustomerName] = useState('')
  const [customerSales, setCustomerSales] = useState<Sale[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      document_id: '',
    }
  })

  const handleCreate = () => {
    setEditingCustomerId(null)
    form.reset({ name: '', email: '', phone: '', document_id: '' })
    setIsDialogOpen(true)
  }

  const handleEdit = (c: Customer) => {
    setEditingCustomerId(c.id)
    form.reset({
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      document_id: c.document_id || '',
    })
    setIsDialogOpen(true)
  }

  const handleOpenHistory = async (c: Customer) => {
    setHistoryCustomerName(c.name)
    setIsHistoryOpen(true)
    setLoadingHistory(true)
    const { data, error } = await fetchCustomerSales(c.id)
    if (error) {
      toast.error('Error al cargar historial')
    } else {
      setCustomerSales(data || [])
    }
    setLoadingHistory(false)
  }

  const onSubmit = async (values: CustomerFormValues) => {
    const payload = {
      name: values.name,
      email: values.email || null,
      phone: values.phone || null,
      document_id: values.document_id || null,
    }

    if (editingCustomerId) {
      const { error } = await updateCustomer(editingCustomerId, payload)
      if (error) toast.error(error)
      else {
        toast.success('Cliente actualizado')
        setIsDialogOpen(false)
      }
    } else {
      const { error } = await createCustomer(payload)
      if (error) toast.error(error)
      else {
        toast.success('Cliente registrado')
        setIsDialogOpen(false)
        form.reset()
      }
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Clientes</h1>
          <Badge variant="outline" className="text-zinc-400 border-zinc-700 bg-zinc-900/50">
            Total: {customers.length}
          </Badge>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={
              <Button className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white" onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px] card-glass border-border">
              <DialogHeader>
                <DialogTitle>{editingCustomerId ? 'Editar Cliente' : 'Registrar Cliente'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre / Razón Social</Label>
                  <Input id="name" {...form.register('name')} placeholder="Ej. Juan Pérez" className="border-border bg-zinc-900/50" />
                  {form.formState.errors.name && <p className="text-sm text-rose-500">{form.formState.errors.name.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="document_id">Cédula / RIF (Opcional)</Label>
                  <Input id="document_id" {...form.register('document_id')} placeholder="Ej. V-12345678" className="border-border bg-zinc-900/50" />
                  {form.formState.errors.document_id && <p className="text-sm text-rose-500">{form.formState.errors.document_id.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono (Opcional)</Label>
                    <Input id="phone" {...form.register('phone')} placeholder="0414-1234567" className="border-border bg-zinc-900/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Opcional)</Label>
                    <Input id="email" type="email" {...form.register('email')} placeholder="correo@ejemplo.com" className="border-border bg-zinc-900/50" />
                    {form.formState.errors.email && <p className="text-sm text-rose-500">{form.formState.errors.email.message}</p>}
                  </div>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={form.formState.isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                    {form.formState.isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Guardar Cliente
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input 
          placeholder="Buscar clientes por nombre, cédula o email..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 border-border bg-card-glass max-w-md"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full bg-zinc-800/50" />
          <Skeleton className="h-12 w-full bg-zinc-800/50" />
          <Skeleton className="h-12 w-full bg-zinc-800/50" />
        </div>
      ) : customers.length === 0 ? (
        <Card className="border-border bg-card-glass border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <Users className="w-12 h-12 mb-4 opacity-20" />
            <p>No se encontraron clientes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border bg-card-glass overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-bold">Cliente</TableHead>
                  <TableHead className="font-bold">Cédula/RIF</TableHead>
                  <TableHead className="font-bold">Contacto</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} className="border-border hover:bg-zinc-800/50 transition-colors">
                    <TableCell>
                      <p className="font-medium text-zinc-200">{c.name}</p>
                    </TableCell>
                    <TableCell>
                      {c.document_id ? <span className="text-zinc-300">{c.document_id}</span> : <span className="text-zinc-500 text-xs">N/A</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {c.phone ? <span className="text-sm text-zinc-300">{c.phone}</span> : null}
                        {c.email ? <span className="text-xs text-zinc-500">{c.email}</span> : null}
                        {!c.phone && !c.email && <span className="text-zinc-500 text-xs">Sin contacto</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenHistory(c)} className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 h-8 w-8" title="Historial de compras">
                          <History className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="text-zinc-400 hover:text-zinc-300 h-8 w-8">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger render={
                            <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          } />
                          <AlertDialogContent className="card-glass border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de eliminar a {c.name}? Sus compras anteriores se mantendrán como "Venta Rápida".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCustomer(c.id)} className="bg-rose-600 hover:bg-rose-500 text-white">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* History Drawer/Sheet */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent className="card-glass border-l-border w-full sm:max-w-md overflow-y-auto p-4 sm:p-6">
          <SheetHeader className="mb-6">
            <SheetTitle>Historial de Compras</SheetTitle>
            <SheetDescription>
              Ventas registradas para {historyCustomerName}
            </SheetDescription>
          </SheetHeader>

          {loadingHistory ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          ) : customerSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-zinc-500 text-center border border-dashed border-border rounded-xl">
              <History className="w-8 h-8 mb-3 opacity-20" />
              <p className="text-sm">No hay compras registradas para este cliente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerSales.map((s) => {
                const res = calculateSaleRevenue(
                  Number(s.product_cost_snapshot),
                  s.quantity,
                  s.payment_type,
                  Number(s.rate_usdt_at_sale),
                  Number(s.rate_bcv_at_sale),
                  Number(s.margin_at_sale)
                )

                return (
                  <div key={s.id} className="p-3 rounded-xl card-glass">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm text-zinc-200">{s.product_name_snapshot}</p>
                        <p className="text-[10px] text-zinc-500">{format(new Date(s.sale_date), 'dd/MM/yyyy HH:mm')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-cyan-400 text-sm">{formatCurrency(res.revenue)}</p>
                        <p className="text-xs text-zinc-400">Cant: {s.quantity}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/50">
                      <Badge variant="outline" className={s.payment_type === 'cash_usd' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10'}>
                        {s.payment_type === 'cash_usd' ? 'Efectivo USD' : 'Tasa BCV'}
                      </Badge>
                      <span className="text-xs text-emerald-400 font-medium">+{formatCurrency(res.profit)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
