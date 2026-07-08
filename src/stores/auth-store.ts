import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { insforge } from '@/lib/insforge'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: true,
      initialized: false,

      initialize: async () => {
        try {
          // 1. Check for OAuth callback in URL
          const urlParams = new URLSearchParams(window.location.search)
          const code = urlParams.get('insforge_code')
          
          if (code) {
            const verifier = localStorage.getItem('oauth_code_verifier')
            if (verifier) {
              const { data, error } = await insforge.auth.exchangeOAuthCode(code, verifier)
              localStorage.removeItem('oauth_code_verifier')
              
              // Clean URL
              window.history.replaceState({}, document.title, window.location.pathname)
              
              if (!error && data?.accessToken && data?.user) {
                set({
                  user: {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.profile?.name ?? data.user.email.split('@')[0],
                    avatar_url: data.user.profile?.avatar_url,
                  },
                  accessToken: data.accessToken,
                  refreshToken: data.refreshToken,
                  loading: false,
                  initialized: true,
                })
                return
              }
            }
          }

          // 2. Try to refresh existing session using stored refreshToken
          const state = get()
          if (state.refreshToken) {
            const { data, error } = await insforge.auth.refreshSession({ refreshToken: state.refreshToken })
            if (!error && data?.accessToken && data?.user) {
              set({
                user: {
                  id: data.user.id,
                  email: data.user.email,
                  name: data.user.profile?.name ?? data.user.email.split('@')[0],
                  avatar_url: data.user.profile?.avatar_url,
                },
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                loading: false,
                initialized: true,
              })
              return
            }
          }
          
          // If no session or refresh failed
          set({ user: null, accessToken: null, refreshToken: null, loading: false, initialized: true })
        } catch (err) {
          console.error("Auth init error:", err)
          set({ user: null, accessToken: null, refreshToken: null, loading: false, initialized: true })
        }
      },

      signIn: async (email, password) => {
        set({ loading: true })
        const { data, error } = await insforge.auth.signInWithPassword({ email, password })
        if (error || !data || !data.user || !data.accessToken) {
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
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
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
        
        if (error || !data) {
          set({ loading: false })
          return { error: error?.message || 'Error al registrarse' }
        }
        if (data.requireEmailVerification) {
          set({ loading: false })
          return { requireVerification: true }
        }
        
        // If no verification required and we got tokens
        if (data.accessToken && data.user) {
          set({
            user: {
              id: data.user.id,
              email: data.user.email,
              name: data.user.profile?.name ?? name,
              avatar_url: data.user.profile?.avatar_url,
            },
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            loading: false,
          })
        } else {
           set({ loading: false })
        }
        return {}
      },

      verifyEmail: async (email, otp) => {
        set({ loading: true })
        const { data, error } = await insforge.auth.verifyEmail({ email, otp })
        if (error) {
          set({ loading: false })
          return { error: error.message || 'Código de verificación inválido' }
        }
        
        if (data?.accessToken && data?.user) {
          set({
            user: {
              id: data.user.id,
              email: data.user.email,
              name: data.user.profile?.name ?? data.user.email.split('@')[0],
              avatar_url: data.user.profile?.avatar_url,
            },
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            loading: false,
          })
        } else {
           set({ loading: false })
        }
        return {}
      },

      signInWithGoogle: async () => {
        const { data, error } = await insforge.auth.signInWithOAuth('google', {
          redirectTo: window.location.origin + '/dashboard',
          additionalParams: { prompt: 'select_account' },
          skipBrowserRedirect: true,
        })
        if (error) throw error
        
        if (data?.url && data?.codeVerifier) {
          localStorage.setItem('oauth_code_verifier', data.codeVerifier)
          window.location.assign(data.url)
        }
      },

      signOut: async () => {
        await insforge.auth.signOut()
        set({ user: null, accessToken: null, refreshToken: null })
      },
    }),
    {
      name: 'auth-storage',
      // only persist tokens, don't persist loading/initialized state directly to avoid UI freezing
      partialize: (state) => ({ 
        refreshToken: state.refreshToken, 
        accessToken: state.accessToken 
      }),
    }
  )
)
