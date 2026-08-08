import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import { AuthCodePage, AuthEmailPage } from '@/pages/Auth'
import { Plan } from '@/pages/Plan'
import { Loading } from '@/pages/Loading'
import { Trips } from '@/pages/Trips'
import { Profile } from '@/pages/Profile'
import { RequireAuth } from '@/components/RequireAuth'
import { TabShell } from '@/components/TabShell'

function LegacyRouteDetailRedirect() {
  const { variantId } = useParams<{ variantId: string }>()
  return <Navigate to={`/plan/results/${variantId ?? ''}`} replace />
}

export const router = createBrowserRouter([
  { path: '/', element: <AuthEmailPage /> },
  { path: '/auth/code', element: <AuthCodePage /> },
  { path: '/auth/username', element: <Navigate to="/" replace /> },
  {
    element: (
      <RequireAuth>
        <TabShell />
      </RequireAuth>
    ),
    children: [
      {
        path: 'plan',
        element: <Plan />,
        children: [
          { path: 'interests' },
          { path: 'location' },
          { path: 'results' },
          { path: 'results/saved' },
          { path: 'results/:variantId' },
        ],
      },
      {
        path: 'trips',
        element: <Trips />,
        children: [{ path: ':tripId' }],
      },
      {
        path: 'profile',
        element: <Profile />,
        children: [
          { path: 'settings' },
          { path: 'settings/photo' },
          { path: 'settings/name' },
          { path: 'settings/email' },
          { path: 'settings/email/code' },
          { path: 'settings/email/done' },
        ],
      },
    ],
  },
  {
    path: '/plan/loading',
    element: (
      <RequireAuth>
        <Loading />
      </RequireAuth>
    ),
  },
  { path: '/results', element: <Navigate to="/plan/results" replace /> },
  { path: '/results/:variantId', element: <LegacyRouteDetailRedirect /> },
])
