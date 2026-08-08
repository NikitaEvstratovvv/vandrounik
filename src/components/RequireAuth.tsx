import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { isAuthenticated } from '@/lib/storage/auth'

/** Редирект на `/`, если нет mock-сессии. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }
  return children
}

/** Редирект на `/plan`, если сессия уже есть (экраны входа). */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  if (isAuthenticated()) {
    return <Navigate to="/plan" replace />
  }
  return children
}
