/**
 * AuthContext — Global Authentication State
 * ==========================================
 * React Context that provides auth state and actions to the entire app.
 *
 * KEY CONCEPT — React Context:
 * Context is React's way of sharing data across many components without
 * passing props down through every level. Think of it as "global state".
 *
 * HOW IT WORKS:
 * 1. AuthProvider wraps the entire app (in main.jsx)
 * 2. Any component can call useAuth() to access:
 *    - user: the current user object (or null if not logged in)
 *    - token: the JWT token (or null)
 *    - loading: true while we're checking if the user is logged in
 *    - login(email, password): log in and store the token
 *    - register(email, username, password): create account and log in
 *    - logout(): clear the token and redirect to login
 *
 * WHY CHECK ON MOUNT?
 * When the page refreshes, React state is lost. But the JWT token is
 * in localStorage (survives refreshes). On mount, we check if there's
 * a stored token and, if so, fetch the user's profile from the backend.
 */

import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

// Create the context (default value is null — will be overridden by Provider)
const AuthContext = createContext(null)

/**
 * AuthProvider — wraps the app and provides auth state
 *
 * Usage in main.jsx:
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  const [loading, setLoading] = useState(true)

  // ─── Check existing token on mount ─────────────────
  useEffect(() => {
    if (token) {
      // We have a stored token — try to fetch the user's profile
      api.get('/api/users/me')
        .then((res) => {
          setUser(res.data)
          setLoading(false)
        })
        .catch(() => {
          // Token is expired or invalid — clean up
          localStorage.removeItem('access_token')
          setToken(null)
          setUser(null)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Login ──────────────────────────────────────────
  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    const accessToken = res.data.access_token

    // Store token in localStorage (survives page refresh)
    localStorage.setItem('access_token', accessToken)
    setToken(accessToken)

    // Fetch the user's profile
    const userRes = await api.get('/api/users/me')
    setUser(userRes.data)

    return userRes.data
  }

  // ─── Register ───────────────────────────────────────
  const register = async (email, username, password) => {
    // Create the account
    await api.post('/api/auth/register', { email, username, password })

    // Automatically log in after registration
    return login(email, password)
  }

  // ─── Logout ─────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('access_token')
    setToken(null)
    setUser(null)
  }

  // ─── Update User Profile in State ────────────────────
  const updateUser = (updatedData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : updatedData))
  }

  // ─── Context Value ─────────────────────────────────
  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth — hook to access auth state from any component
 *
 * Usage:
 *   const { user, login, logout, isAuthenticated } = useAuth()
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
