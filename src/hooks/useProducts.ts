import { useState, useCallback, useEffect } from 'react'
import { insforge } from '@/lib/insforge'
import { useAuthStore } from '@/stores/auth-store'
import type { Product, ProductInsert, Category } from '@/types'

export function useProducts() {
  const user = useAuthStore((s) => s.user)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const query = insforge.database
      .from('products')
      .select('*, category:categories(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data, error } = await query
    if (!error && data) {
      setProducts(data as unknown as Product[])
    }
    setLoading(false)
  }, [user])

  const fetchCategories = useCallback(async () => {
    if (!user) return
    const { data } = await insforge.database
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (data) setCategories(data as unknown as Category[])
  }, [user])

  const createProduct = useCallback(async (product: Omit<ProductInsert, 'user_id'>) => {
    if (!user) return { error: 'No autenticado' }
    const { error } = await insforge.database
      .from('products')
      .insert([{ ...product, user_id: user.id }])

    if (error) return { error: error.message }
    await fetchProducts()
    return {}
  }, [user, fetchProducts])

  const updateProduct = useCallback(async (id: string, updates: Partial<Pick<Product, 'name' | 'cost_usd' | 'category_id' | 'custom_effective_price'>>) => {
    if (!user) return { error: 'No autenticado' }
    const { error } = await insforge.database
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }
    await fetchProducts()
    return {}
  }, [user, fetchProducts])

  const deleteProduct = useCallback(async (id: string) => {
    if (!user) return { error: 'No autenticado' }
    const { error } = await insforge.database
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }
    await fetchProducts()
    return {}
  }, [user, fetchProducts])

  const createCategory = useCallback(async (name: string) => {
    if (!user) return { error: 'No autenticado' }
    const { data, error } = await insforge.database
      .from('categories')
      .insert([{ user_id: user.id, name }])
      .select()

    if (error) return { error: error.message }
    await fetchCategories()
    return { data: data?.[0] }
  }, [user, fetchCategories])

  const deleteCategory = useCallback(async (id: string) => {
    if (!user) return { error: 'No autenticado' }
    const { error } = await insforge.database
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }
    await fetchCategories()
    await fetchProducts()
    return {}
  }, [user, fetchCategories, fetchProducts])

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === null || p.category_id === categoryFilter
    return matchesSearch && matchesCategory
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  return {
    products: filteredProducts,
    allProducts: products,
    categories,
    loading,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    deleteCategory,
    refreshProducts: fetchProducts,
  }
}
