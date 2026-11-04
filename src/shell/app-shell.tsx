import * as React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Sun, Moon, Scan, Camera, History, ClipboardCheck, BookOpen, Cpu, Menu, LogOut, LogIn, WifiOff } from 'lucide-react'
import { useTranslation } from '@/translations/translation-provider'

import { ThemeContext } from '@/components/theme-provider'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useAuth } from '@/store/auth'
import { useOnlineStatus } from '@/lib/use-online-status'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: React.ReactNode }) {
  const theme = React.useContext(ThemeContext)!
  const { isAuthenticated, username, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const online = useOnlineStatus()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const navItems = [
    { to: '/upload', label: t.nav.upload, short: 'Check', icon: Camera },
    { to: '/history', label: t.nav.history, short: t.nav.history, icon: History },
    { to: '/review', label: t.nav.review, short: t.nav.review, icon: ClipboardCheck },
    { to: '/catalog', label: t.nav.catalog, short: t.nav.catalog, icon: BookOpen },
    { to: '/devices', label: t.nav.devices, short: t.nav.devices, icon: Cpu },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 bg-shell text-shell-foreground">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/" className="mr-auto flex min-h-[44px] items-center gap-2 text-lg font-bold">
            <Scan className="h-6 w-6" aria-hidden />
            <span>{t.app.name}</span>
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex h-11 items-center rounded-lg px-3 text-[0.9375rem] font-medium text-shell-foreground/85 hover:bg-white/10 hover:text-shell-foreground',
                    isActive && 'bg-white/15 font-semibold text-shell-foreground'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1 [&_button]:h-11 [&_button]:text-shell-foreground hover:[&_button]:bg-white/10">
            <LanguageSwitcher />
            <DropdownMenu.Root>
              <DropdownMenu.Trigger
                aria-label="Account and settings"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10"
              >
                <Menu className="h-6 w-6" aria-hidden />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 min-w-[14rem] rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-[0_8px_24px_-8px_rgb(0_0_0/0.25)]"
                >
                  {isAuthenticated && (
                    <DropdownMenu.Label className="px-3 py-2 text-sm text-muted-foreground">
                      Signed in as <span className="font-semibold text-foreground">{username ?? 'you'}</span>
                    </DropdownMenu.Label>
                  )}
                  <DropdownMenu.Item
                    onSelect={() => theme.setTheme(theme.theme === 'dark' ? 'light' : 'dark')}
                    className="flex h-12 cursor-pointer items-center gap-3 rounded-lg px-3 text-base outline-none data-[highlighted]:bg-accent"
                  >
                    {theme.theme === 'dark' ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
                    {theme.theme === 'dark' ? 'Light mode (best in sun)' : 'Dark mode'}
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  {isAuthenticated ? (
                    <DropdownMenu.Item
                      onSelect={handleLogout}
                      className="flex h-12 cursor-pointer items-center gap-3 rounded-lg px-3 text-base outline-none data-[highlighted]:bg-accent"
                    >
                      <LogOut className="h-5 w-5" aria-hidden />
                      {t.nav.logout}
                    </DropdownMenu.Item>
                  ) : (
                    <DropdownMenu.Item
                      onSelect={() => navigate('/login')}
                      className="flex h-12 cursor-pointer items-center gap-3 rounded-lg px-3 text-base outline-none data-[highlighted]:bg-accent"
                    >
                      <LogIn className="h-5 w-5" aria-hidden />
                      {t.nav.login}
                    </DropdownMenu.Item>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
        {!online && (
          <div role="status" className="bg-possible-tint text-possible">
            <div className="container flex min-h-[44px] items-center gap-2 py-2 text-sm font-semibold">
              <WifiOff className="h-5 w-5 shrink-0" aria-hidden />
              <span>You're offline. Checking a leaf needs a connection; the disease catalog still works.</span>
            </div>
          </div>
        )}
      </header>

      <main className="container flex-1 pb-28 pt-6 md:pb-10">{children}</main>

      <footer className="hidden border-t text-sm text-muted-foreground md:block">
        <div className="container py-4">© {new Date().getFullYear()} {t.app.name}</div>
      </footer>

      <nav
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-card md:hidden"
      >
        <ul className="grid grid-cols-5">
          {navItems.map(({ to, short, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground',
                    isActive && 'font-bold text-primary'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                        isActive && 'bg-likely-tint'
                      )}
                    >
                      <Icon className="h-6 w-6" aria-hidden strokeWidth={isActive ? 2.5 : 2} />
                    </span>
                    <span className="max-w-full truncate px-1">{short}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
