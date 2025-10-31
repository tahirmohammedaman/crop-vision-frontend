import * as React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ThemeContext } from '@/components/theme-provider'
import { useAuth } from '@/store/auth'

export function AppShell({ children }: { children: React.ReactNode }) {
  const theme = React.useContext(ThemeContext)!
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.full_name || user?.username || 'Account'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="font-semibold">🌿 Plant Health</Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink to="/upload" className={({ isActive }) => (isActive ? 'text-primary' : '')}>Upload</NavLink>
            <NavLink to="/history" className={({ isActive }) => (isActive ? 'text-primary' : '')}>History</NavLink>
            {/* <NavLink to="/stats" className={({ isActive }) => (isActive ? 'text-primary' : '')}>Stats</NavLink> */}
            <NavLink to="/review" className={({ isActive }) => (isActive ? 'text-primary' : '')}>Review</NavLink>
            <NavLink to="/catalog" className={({ isActive }) => (isActive ? 'text-primary' : '')}>Catalog</NavLink>
            {/* <NavLink to="/model" className={({ isActive }) => (isActive ? 'text-primary' : '')}>Model</NavLink> */}
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Toggle theme"
              onClick={() => theme.setTheme(theme.theme === 'dark' ? 'light' : 'dark')}
            >
              {theme.theme === 'dark' ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
            </Button>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="text-sm font-medium">{displayName}</Link>
                <Button size="sm" variant="outline" onClick={handleLogout}>Logout</Button>
              </div>
            ) : (
              <Link to="/login" className="text-sm">Login</Link>
            )}
          </div>
        </div>
      </header>
      <main className="container py-6 flex-1">{children}</main>
      <footer className="border-t text-xs text-muted-foreground">
        <div className="container py-4">© {new Date().getFullYear()} Plant Health Monitoring</div>
      </footer>
    </div>
  )
}
