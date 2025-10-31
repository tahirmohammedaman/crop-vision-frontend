import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { toast } from 'sonner'
import { useLocation, useNavigate } from 'react-router-dom'

const schema = z.object({
  username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })
  const { setAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTarget = (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    if (typeof document !== 'undefined') {
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = previousOverflow
      }
    }
    return () => {}
  }, [])

  const closeModal = () => {
    navigate('/', { replace: true })
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const token = await authApi.login(values)
      setAuth(token)
      toast.success('Logged in')
      navigate(redirectTarget ?? '/upload', { replace: true })
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? 'Login failed')
    }
  }

  return (
    <div
      className={
        'fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm px-4 transition-opacity duration-150' +
        (isMounted ? ' opacity-100' : ' opacity-0')
      }
    >
      <div className="absolute inset-0" onClick={closeModal} aria-hidden="true" />
      <Card className="relative w-full max-w-sm shadow-2xl">
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 text-muted-foreground transition hover:text-foreground"
          aria-label="Close login dialog"
        >
          X
        </button>
        <CardHeader className="pb-4">
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Access your CropVision account</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" {...form.register('username')} autoComplete="username" autoFocus />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...form.register('password')} autoComplete="current-password" />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button disabled={form.formState.isSubmitting} className="w-full" type="submit">
              {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </CardFooter>
        </form>
        <div className="px-6 pb-6 text-center text-xs text-muted-foreground">
          Need help? Contact the platform administrator.
        </div>
      </Card>
    </div>
  )
}
