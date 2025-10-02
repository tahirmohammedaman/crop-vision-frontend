import { createBrowserRouter, Outlet } from 'react-router-dom'
import { LandingPage } from '@/pages/landing'
import { LoginPage } from '@/pages/auth/login'
import { UploadPage } from '@/pages/upload'
import { HistoryPage } from '@/pages/history'
import { StatsPage } from '@/pages/stats'
import { ReviewQueuePage } from '@/pages/review-queue'
import { CatalogPage } from '@/pages/catalog'
import { DiseaseDetailPage } from '@/pages/disease-detail'
import { ModelInfoPage } from '@/pages/model-info'
import { ProfilePage } from '@/pages/profile'
import { AppShell } from '@/shell/app-shell'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell><Outlet /></AppShell>,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'model', element: <ModelInfoPage /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'diseases/:id', element: <DiseaseDetailPage /> },
      { path: 'upload', element: <UploadPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'stats', element: <StatsPage /> },
      { path: 'review', element: <ReviewQueuePage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
])
