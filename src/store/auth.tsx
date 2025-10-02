import * as React from 'react'
import type { TokenResponse, User } from '@/types/dto'

const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'phm.token'

type AuthState = {
  token: string | null
  user: User | null
}

type AuthContextType = {
  isAuthenticated: boolean
  token: string | null
  user: User | null
  setAuth: (t: TokenResponse | null, user?: User | null) => void
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>(() => {
    const raw = localStorage.getItem(TOKEN_KEY)
    const token = raw ? JSON.parse(raw).access_token as string : null
    return { token, user: null }
  })

  const setAuth = (t: TokenResponse | null, user?: User | null) => {
    if (t?.access_token) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(t))
      setState((s) => ({ ...s, token: t.access_token, user: user ?? s.user }))
    } else {
      localStorage.removeItem(TOKEN_KEY)
      setState({ token: null, user: null })
    }
  }

  const logout = () => setAuth(null)

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: !!state.token, token: state.token, user: state.user, setAuth, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
