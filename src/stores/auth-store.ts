import { create } from 'zustand'
import { insforge } from '@/lib/insforge'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean

  // Actions
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ requireVerification?: boolean; error?: string }>
  verifyEmail: (email: string, otp: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    try {
      const { data, error } = await insforge.auth.getCurrentUser()
      if (error || !data || !data.user) {
        set({ user: null, loading: false, initialized: true })
        return
      }
      set({
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.profile?.name ?? data.user.email.split('@')[0],
          avatar_url: data.user.profile?.avatar_url,
        },
        loading: false,
        initialized: true,
      })
    } catch {
      set({ user: null, loading: false, initialized: true })
    }
  },

  signIn: async (email, password) => {
    set({ loading: true })
    const { data, error } = await insforge.auth.signInWithPassword({ email, password })
    if (error || !data || !data.user) {
      set({ loading: false })
      if (error?.statusCode === 403) {
        return { error: 'Email no verificado. Por favor verifica tu correo.' }
      }
      return { error: error?.message || 'Error al iniciar sesión' }
    }
    set({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.profile?.name ?? data.user.email.split('@')[0],
        avatar_url: data.user.profile?.avatar_url,
      },
      loading: false,
    })
    return {}
  },

  signUp: async (email, password, name) => {
    set({ loading: true })
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name,
      redirectTo: window.location.origin + '/dashboard',
    })
    set({ loading: false })
    if (error || !data) {
      return { error: error?.message || 'Error al registrarse' }
    }
    if (data.requireEmailVerification) {
      return { requireVerification: true }
    }
    // If no verification required, user is signed in
    if (data.accessToken) {
      const { data: userData } = await insforge.auth.getCurrentUser()
      if (userData?.user) {
        set({
          user: {
            id: userData.user.id,
            email: userData.user.email,
            name: userData.user.profile?.name ?? name,
            avatar_url: userData.user.profile?.avatar_url,
          },
        })
      }
    }
    return {}
  },

  verifyEmail: async (email, otp) => {
    set({ loading: true })
    const { error } = await insforge.auth.verifyEmail({ email, otp })
    if (error) {
      set({ loading: false })
      return { error: error.message || 'Código de verificación inválido' }
    }
    // After verify, user is auto-signed in
    const { data: userData } = await insforge.auth.getCurrentUser()
    if (userData?.user) {
      set({
        user: {
          id: userData.user.id,
          email: userData.user.email,
          name: userData.user.profile?.name ?? userData.user.email.split('@')[0],
          avatar_url: userData.user.profile?.avatar_url,
        },
        loading: false,
      })
    }
    return {}
  },

  signInWithGoogle: async () => {
    const { error } = await insforge.auth.signInWithOAuth('google', {
      redirectTo: window.location.origin + '/dashboard',
      additionalParams: { prompt: 'select_account' },
    })
    if (error) throw error
  },

  signOut: async () => {
    await insforge.auth.signOut()
    set({ user: null })
  },
}))
