/**
 * AdminRoute — Guards routes that require administrator privileges
 * ================================================================
 *
 * HOW IT WORKS:
 * 1. Checks if the user is authenticated
 * 2. If loading, displays a loading spinner
 * 3. If not authenticated, redirects to /login
 * 4. If authenticated but role !== 'admin', redirects to /dashboard
 * 5. If user is an admin, renders child components
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
