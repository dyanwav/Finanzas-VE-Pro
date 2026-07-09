import { useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import type { Product } from '@/types'
import { useConfigStore } from '@/stores/config-store'
import { useExport } from '@/hooks/useExport'
import { calculateProductPricing, formatCurrency } from '@/lib/calculations'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Plus, Search, Download, Trash2, Package, Loader2 } from 'lucide-react'

const productSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  sku: z.string().optional().nullable(),
  cost_usd: z.coerce.number().positive('El costo debe ser mayor a 0'),
  custom_effective_price: z.union([z.string(), z.number()]).optional().nullable()
    .transform(v => {
       if (v === '' || v === null || v === undefined) return null;
       const num = Number(v);
       return isNaN(num) ? null : num;
    }),
  category_id: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

export default function ProductsPage() {
  const { products, categories, loading, search, setSearch, categoryFilter, setCategoryFilter, createProduct, updateProduct, deleteProduct, createCategory } = useProducts()
  const { rateUsdt, rateBcv, profitMargin } = useConfigStore()
  const { exportProducts } = useExport()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')

  const form = useForm<ProductFormValues>({
    // @ts-ignore
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      cost_usd: 0,
      custom_effective_price: null,
      category_id: 'none',
    }
  })

  const handleCreate = () => {
    setEditingProductId(null)
    form.reset({ name: '', sku: '', cost_usd: 0, custom_effective_price: null, category_id: 'none' })
    setIsDialogOpen(true)
  }

  const handleEdit = (p: Product) => {
    setEditingProductId(p.id)
    form.reset({
      name: p.name,
      sku: p.sku || '',
      cost_usd: p.cost_usd,
      custom_effective_price: p.custom_effective_price || null,
      category_id: p.category_id || 'none'
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (values: ProductFormValues) => {
    let catId = values.category_id === 'none' ? undefined : values.category_id

    if (values.category_id === 'new' && newCategoryName) {
      const { data, error } = await createCategory(newCategoryName)
      if (error) {
        toast.error(error)
        return
      }
      catId = data?.id
      setNewCategoryName('')
    }

    const payload = {
      name: values.name,
      sku: values.sku || null,
      cost_usd: values.cost_usd,
      custom_effective_price: values.custom_effective_price,
      category_id: catId || null,
    }

    if (editingProductId) {
      const { error } = await updateProduct(editingProductId, payload)
      if (error) toast.error(error)
      else {
        toast.success('Producto actualizado exitosamente')
        setIsDialogOpen(false)
      }
    } else {
      const { error } = await createProduct(payload)
      if (error) toast.error(error)
      else {
        toast.success('Producto creado exitosamente')
        setIsDialogOpen(false)
        form.reset()
      }
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Productos</h1>
          <Badge variant="outline" className="text-zinc-400 border-zinc-700 bg-zinc-900/50">
            Total: {products.length}
          </Badge>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={() => exportProducts(products)} className="flex-1 md:flex-none border-border">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={
              <Button className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white" onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Producto
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px] border-border bg-card">
              <DialogHeader>
                <DialogTitle>{editingProductId ? 'Editar Producto' : 'Añadir Producto'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre / Descripción</Label>
                    <Input id="name" {...form.register('name')} placeholder="Ej. Filtro de aceite" className="border-border bg-background" />
                    {form.formState.errors.name && <p className="text-sm text-rose-500">{form.formState.errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU (Opcional)</Label>
                    <Input id="sku" {...form.register('sku')} placeholder="Ej. FL-820S" className="border-border bg-background" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost_usd">Costo Unitario (USD)</Label>
                    <Input id="cost_usd" type="number" step="0.01" {...form.register('cost_usd')} className="border-border bg-background" />
                    {form.formState.errors.cost_usd && <p className="text-sm text-rose-500">{form.formState.errors.cost_usd.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom_effective_price">Precio Ef. Manual (Opcional)</Label>
                    <Input id="custom_effective_price" type="number" step="0.01" {...form.register('custom_effective_price')} placeholder="Automático" className="border-border bg-background" />
                    {form.formState.errors.custom_effective_price && <p className="text-sm text-rose-500">{form.formState.errors.custom_effective_price.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select onValueChange={(val) => form.setValue('category_id', val || 'none')} defaultValue={form.getValues('category_id') || 'none'}>
                    <SelectTrigger className="border-border bg-background">
                      <SelectValue placeholder="Selecciona una categoría">
                        {form.watch('category_id') === 'none' || !form.watch('category_id') ? 'Sin categoría' :
                         form.watch('category_id') === 'new' ? '+ Crear nueva categoría' :
                         categories.find((c) => c.id === form.watch('category_id'))?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="p-1" alignItemWithTrigger={true}>
                      <SelectItem value="none">Sin categoría</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                      <SelectItem value="new">+ Crear nueva categoría</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.watch('category_id') === 'new' && (
                  <div className="space-y-2 pt-2 animate-slide-up">
                    <Label htmlFor="newCategory">Nombre de nueva categoría</Label>
                    <Input id="newCategory" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ej. Lubricantes" className="border-border bg-background" />
                  </div>
                )}

                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={form.formState.isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                    {form.formState.isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Guardar Producto
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Buscar productos..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-border bg-card-glass"
          />
        </div>
        <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? null : v)}>
          <SelectTrigger className="w-full sm:w-[200px] border-border bg-card-glass">
            <SelectValue placeholder="Filtrar por categoría">
              {categoryFilter === 'all' || !categoryFilter ? 'Todas las categorías' : categories.find((c) => c.id === categoryFilter)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="p-1" alignItemWithTrigger={true}>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full bg-zinc-800/50" />
          <Skeleton className="h-12 w-full bg-zinc-800/50" />
          <Skeleton className="h-12 w-full bg-zinc-800/50" />
        </div>
      ) : products.length === 0 ? (
        <Card className="border-border bg-card-glass border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <Package className="w-12 h-12 mb-4 opacity-20" />
            <p>No se encontraron productos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border bg-card-glass overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-bold">Producto</TableHead>
                  <TableHead className="font-bold">SKU</TableHead>
                  <TableHead className="font-bold text-center">Costo USD</TableHead>
                  <TableHead className="font-bold text-center">Costo Bs</TableHead>
                  <TableHead className="font-bold text-center text-emerald-400">Precio Efectivo. ($)</TableHead>
                  <TableHead className="font-bold text-center text-cyan-400">Precio Bs</TableHead>
                  <TableHead className="font-bold text-center text-amber-400">Precio BCV ($)</TableHead>
                  <TableHead className="font-bold text-right">Ganancia ($)</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const pricing = calculateProductPricing(p.cost_usd, profitMargin, rateUsdt, rateBcv, p.custom_effective_price)
                  return (
                    <TableRow key={p.id} className="border-border hover:bg-zinc-800/50 transition-colors">
                      <TableCell>
                        <p className="font-medium text-zinc-200">{p.name}</p>
                        <p className="text-xs text-zinc-500">{p.category?.name || 'Sin categoría'}</p>
                      </TableCell>
                      <TableCell>
                        {p.sku ? <Badge variant="outline" className="text-zinc-400 bg-zinc-900/50">{p.sku}</Badge> : <span className="text-xs text-zinc-500">N/A</span>}
                      </TableCell>
                      <TableCell className="text-center">{formatCurrency(pricing.costUsd)}</TableCell>
                      <TableCell className="text-center text-zinc-500">{formatCurrency(pricing.costBs, 'BS')}</TableCell>
                      <TableCell className="text-center font-bold text-emerald-400">{formatCurrency(pricing.effectivePriceUsd)}</TableCell>
                      <TableCell className="text-center font-bold text-cyan-400">{formatCurrency(pricing.priceBs, 'BS')}</TableCell>
                      <TableCell className="text-center font-semibold text-amber-400">{formatCurrency(pricing.priceBcvUsd)}</TableCell>
                      <TableCell className="text-right text-zinc-400">{formatCurrency(pricing.profitUsd)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="text-zinc-400 hover:text-zinc-300 h-8 w-8">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              }
                            />
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esto eliminará "{p.name}" permanentemente. Las ventas asociadas no perderán los datos históricos del precio en ese momento.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteProduct(p.id)} className="bg-rose-600 hover:bg-rose-500 text-white">Eliminar</AlertDialogAction>
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

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border">
            {products.map((p) => {
              const pricing = calculateProductPricing(p.cost_usd, profitMargin, rateUsdt, rateBcv, p.custom_effective_price)
              return (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-zinc-200 flex items-center gap-2">
                        {p.name}
                        {p.sku && <Badge variant="outline" className="text-[10px] py-0 bg-zinc-900/50 text-zinc-400">{p.sku}</Badge>}
                      </h3>
                      <span className="text-xs text-zinc-500">{p.category?.name || 'Sin categoría'}</span>
                    </div>
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="text-zinc-400 h-8 w-8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button variant="ghost" size="icon" className="text-rose-500 h-8 w-8">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <AlertDialogContent className="bg-card border-border w-[90%] rounded-xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
                            <AlertDialogDescription>¿Seguro que deseas eliminar "{p.name}"?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteProduct(p.id)} className="bg-rose-600 text-white">Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-background p-3 rounded-lg border border-border">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">Costo USD</span>
                      <span className="font-medium">{formatCurrency(pricing.costUsd)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">Precio Ef. USD</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(pricing.effectivePriceUsd)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">Precio Bs</span>
                      <span className="font-bold text-cyan-400">{formatCurrency(pricing.priceBs, 'BS')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">Precio BCV USD</span>
                      <span className="font-bold text-amber-400">{formatCurrency(pricing.priceBcvUsd)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
