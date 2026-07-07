import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Link, useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Loader2, Mail, Lock, User, ShieldCheck } from 'lucide-react'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const signupSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type SignupFormValues = z.infer<typeof signupSchema>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SignupPage() {
  const navigate = useNavigate()
  const { signUp, verifyEmail, signInWithGoogle, loading } = useAuthStore()

  const [error, setError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Step management: 'form' → 'otp'
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [savedEmail, setSavedEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  // ---- Step 1: Register ----
  const onSubmit = async (data: SignupFormValues) => {
    setError(null)
    const result = await signUp(data.email, data.password, data.name)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.requireVerification) {
      setSavedEmail(data.email)
      setStep('otp')
      return
    }
    navigate('/dashboard')
  }

  // ---- Step 2: Verify OTP ----
  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Ingresa el código de 6 dígitos')
      return
    }
    setError(null)
    setOtpLoading(true)
    const result = await verifyEmail(savedEmail, otp)
    setOtpLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate('/dashboard')
  }

  // ---- Google ----
  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión con Google')
      setGoogleLoading(false)
    }
  }

  const busy = isSubmitting || loading

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4">
      {/* ---------- background gradient orbs ---------- */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-emerald-glow/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-0 h-[360px] w-[360px] rounded-full bg-cyan-glow/10 blur-[100px]"
      />

      {/* ---------- card ---------- */}
      <Card className="card-glass w-full max-w-md animate-fade-in">
        <CardHeader className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <CardTitle className="text-gradient-brand text-3xl font-bold tracking-tight">
              Finanzas VE Pro
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            {step === 'form'
              ? 'Crea tu cuenta y toma el control de tus finanzas'
              : 'Verifica tu correo electrónico'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* error */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ==================== STEP 1: FORM ==================== */}
          {step === 'form' && (
            <>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Tu nombre"
                      className="pl-10"
                      autoComplete="name"
                      disabled={busy}
                      {...register('name')}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10"
                      autoComplete="email"
                      disabled={busy}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      autoComplete="new-password"
                      disabled={busy}
                      {...register('password')}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                {/* submit */}
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando cuenta…
                    </>
                  ) : (
                    'Crear Cuenta'
                  )}
                </Button>
              </form>

              {/* divider */}
              <div className="relative flex items-center">
                <span className="flex-1 border-t border-border" />
                <span className="mx-4 text-xs text-muted-foreground">o continuar con</span>
                <span className="flex-1 border-t border-border" />
              </div>

              {/* google */}
              <Button
                variant="outline"
                className="w-full"
                disabled={busy || googleLoading}
                onClick={handleGoogle}
              >
                {googleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Continuar con Google
              </Button>

              {/* login link */}
              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Inicia sesión
                </Link>
              </p>
            </>
          )}

          {/* ==================== STEP 2: OTP ==================== */}
          {step === 'otp' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enviamos un código de 6 dígitos a{' '}
                  <span className="font-medium text-foreground">{savedEmail}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Código de verificación</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em]"
                  value={otp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={otpLoading}
                />
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={otpLoading || otp.length !== 6}
                onClick={handleVerify}
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando…
                  </>
                ) : (
                  'Verificar Correo'
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => {
                  setStep('form')
                  setOtp('')
                  setError(null)
                }}
              >
                ← Volver al registro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
