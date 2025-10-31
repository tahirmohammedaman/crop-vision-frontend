import * as React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { TranslationProvider } from '@/translations/translation-provider'
import { router } from '@/routes'
import { AuthProvider } from '@/store/auth'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TranslationProvider>
      <AuthProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <Toaster richColors position="top-right" />
          </QueryClientProvider>
        </ThemeProvider>
      </AuthProvider>
    </TranslationProvider>
  </React.StrictMode>
)
