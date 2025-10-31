import * as React from 'react'
import type { TokenResponse, User } from '@/types/dto'
import { AUTH_EVENTS } from '@/lib/api'

const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'phm.token'

type AuthState = {
  token: string | null
  user: User | null
}

type AuthContextType = {
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  user: User | null
  setAuth: (t: TokenResponse | null, user?: User | null) => void
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialToken = React.useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(TOKEN_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as TokenResponse
      return parsed.access_token ?? null
    } catch {
      return null
    }
  }, [])

  const [state, setState] = React.useState<AuthState>({ token: initialToken, user: null })
  const [isLoading] = React.useState<boolean>(false)

  const setAuth = React.useCallback((t: TokenResponse | null, user?: User | null) => {
    if (t?.access_token) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(t))
      setState({ token: t.access_token, user: user ?? null })
    } else {
      localStorage.removeItem(TOKEN_KEY)
      setState({ token: null, user: null })
    }
  }, [])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const handleForcedLogout = () => setAuth(null)
    window.addEventListener(AUTH_EVENTS.LOGOUT, handleForcedLogout)
    return () => {
      window.removeEventListener(AUTH_EVENTS.LOGOUT, handleForcedLogout)
    }
  }, [setAuth])

  const logout = React.useCallback(() => {
    setAuth(null)
  }, [setAuth])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!state.token,
        isLoading,
        token: state.token,
        user: state.user,
        setAuth,
        logout,
      }}
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
