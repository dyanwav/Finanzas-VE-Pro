import { useState } from 'react'
import { useSuppliers } from '@/hooks/useSuppliers'
import type { Supplier } from '@/types'
import { Plus, Search, Loader2, Building, Trash2, Edit2, Mail, Phone, MapPin, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  contact_name: z.string().nullable(),
  email: z.string().email('Email inválido').nullable().or(z.literal('')),
  phone: z.string().nullable(),
  address: z.string().nullable(),
})

type SupplierFormValues = z.infer<typeof supplierSchema>

export default function SuppliersPage() {
  const { filteredSuppliers, loading, search, setSearch, createSupplier, updateSupplier, deleteSupplier } = useSuppliers()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
    },
  })

  const handleOpenNew = () => {
    setEditingId(null)
    form.reset({ name: '', contact_name: '', email: '', phone: '', address: '' })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingId(supplier.id)
    form.reset({
      name: supplier.name,
      contact_name: supplier.contact_name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: SupplierFormValues) => {
    // Convert empty strings to null for optional fields
    const parsedData = {
      name: data.name,
      contact_name: data.contact_name || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
    }

    if (editingId) {
      await updateSupplier(editingId, parsedData)
    } else {
      await createSupplier(parsedData)
    }
    setIsDialogOpen(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el proveedor "${name}"?`)) {
      await deleteSupplier(id)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Building className="w-6 h-6 text-emerald-400" />
            Proveedores
          </h1>
          <p className="text-zinc-400">Gestiona los proveedores de tu inventario.</p>
        </div>
        <Button onClick={handleOpenNew} className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Buscar proveedores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-zinc-900/50 border-border"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-12 card-glass border-border rounded-xl">
          <Building className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300">No hay proveedores</h3>
          <p className="text-zinc-500">
            {search ? 'No se encontraron resultados para tu búsqueda.' : 'Aún no has registrado ningún proveedor.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="card-glass border-border flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-zinc-100">{supplier.name}</CardTitle>
                    {supplier.contact_name && (
                      <CardDescription className="flex items-center gap-1 mt-1 text-zinc-400">
                        <User className="w-3.5 h-3.5" /> {supplier.contact_name}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 text-sm">
                {supplier.email && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Mail className="w-4 h-4 text-zinc-500" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Phone className="w-4 h-4 text-zinc-500" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start gap-2 text-zinc-300">
                    <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{supplier.address}</span>
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t border-border flex justify-end gap-2 mt-auto">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(supplier)} className="h-8">
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(supplier.id, supplier.name)} className="h-8 text-rose-400 hover:text-rose-400 hover:bg-rose-500/10 border-border">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] card-glass border-border">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
            <DialogDescription>
              Completa la información del proveedor.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre / Razón Social <span className="text-rose-500">*</span></Label>
              <Input {...form.register('name')} className="bg-zinc-900/50" placeholder="Ej. Distribuidora XYZ" />
              {form.formState.errors.name && (
                <p className="text-xs text-rose-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Nombre de Contacto</Label>
              <Input {...form.register('contact_name')} className="bg-zinc-900/50" placeholder="Ej. Juan Pérez" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...form.register('email')} type="email" className="bg-zinc-900/50" placeholder="ejemplo@correo.com" />
                {form.formState.errors.email && (
                  <p className="text-xs text-rose-500">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input {...form.register('phone')} className="bg-zinc-900/50" placeholder="Ej. 0414-1234567" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input {...form.register('address')} className="bg-zinc-900/50" placeholder="Dirección del proveedor" />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                {form.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
