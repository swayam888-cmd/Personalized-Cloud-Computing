/**
 * App.jsx — Application Root with Routing
 * =========================================
 * Sets up React Router for page navigation.
 *
 * KEY CONCEPT — Client-Side Routing:
 * In a single-page app (SPA), the browser doesn't reload the page
 * when you navigate. React Router intercepts URL changes and renders
 * the appropriate component without a server round-trip.
 *
 * ROUTES:
 * /login     → LoginPage (public)
 * /signup    → SignupPage (public)
 * /dashboard → DashboardPage (protected — requires auth)
 * /          → Redirects to /dashboard (or /login if not authenticated)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import FilesPage from './pages/FilesPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/files"
          element={
            <ProtectedRoute>
              <FilesPage />
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Catch-all → redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

/**
 * RootRedirect — Sends users to the right place
 * If logged in → /dashboard
 * If not logged in → /login
 */
function RootRedirect() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

export default App
