import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import { Splash } from '@/pages/Splash'
import { Plan } from '@/pages/Plan'
import { Loading } from '@/pages/Loading'

function LegacyRouteDetailRedirect() {
  const { variantId } = useParams<{ variantId: string }>()
  return <Navigate to={`/plan/results/${variantId ?? ''}`} replace />
}

export const router = createBrowserRouter([
  { path: '/', element: <Splash /> },
  {
    path: '/plan',
    element: <Plan />,
    children: [
      { index: true },
      { path: 'interests' },
      { path: 'location' },
      { path: 'results' },
      { path: 'results/:variantId' },
    ],
  },
  { path: '/plan/loading', element: <Loading /> },
  { path: '/results', element: <Navigate to="/plan/results" replace /> },
  { path: '/results/:variantId', element: <LegacyRouteDetailRedirect /> },
])
