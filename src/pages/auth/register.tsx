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
import { useNavigate, Link } from 'react-router-dom'

const schema = z.object({
  username: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 chars'),
  full_name: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })
  const { setAuth } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (values: FormValues) => {
    try {
      const token = await authApi.register(values)
      setAuth(token)
      toast.success('Registered')
      navigate('/upload')
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? 'Register failed')
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Join Plant Health to start predicting diseases</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" {...form.register('username')} autoComplete="username" />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register('email')} autoComplete="email" />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...form.register('password')} autoComplete="new-password" />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...form.register('full_name')} autoComplete="name" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button disabled={form.formState.isSubmitting} className="w-full" type="submit">Create account</Button>
            <p className="text-sm">Already have an account? <Link to="/login" className="underline">Login</Link></p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
