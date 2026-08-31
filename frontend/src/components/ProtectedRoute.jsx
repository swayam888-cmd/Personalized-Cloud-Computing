/**
 * ProtectedRoute — Guards routes that require authentication
 * ===========================================================
 *
 * HOW IT WORKS:
 * 1. Checks if the user is authenticated (via AuthContext)
 * 2. If still loading (checking stored token), shows a spinner
 * 3. If not authenticated, redirects to /login
 * 4. If authenticated, renders the child component
 *
 * USAGE:
 *   <Route path="/dashboard" element={
 *     <ProtectedRoute>
 *       <DashboardPage />
 *     </ProtectedRoute>
 *   } />
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  // Still checking if the user has a valid stored token
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in → redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Authenticated → render the protected page
  return children
}
