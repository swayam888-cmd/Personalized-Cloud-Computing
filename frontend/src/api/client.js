/**
 * API Client
 * ==========
 * A configured Axios instance for making HTTP requests to the backend.
 *
 * WHY AXIOS INSTEAD OF FETCH?
 * - Automatic JSON parsing (no need to call response.json())
 * - Request/response interceptors (we use this to attach the JWT token)
 * - Better error handling (throws on non-2xx status codes)
 * - Cleaner syntax for setting headers
 *
 * HOW THE TOKEN INTERCEPTOR WORKS:
 * Before every request, the interceptor checks localStorage for a token.
 * If found, it automatically adds "Authorization: Bearer <token>" to the
 * request headers. This means components don't need to worry about
 * auth headers — it's handled in one place.
 */

import axios from 'axios'

const API_URL = 'http://localhost:8000'

// Create a configured Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request Interceptor ────────────────────────────────
// Runs BEFORE every request — attaches the JWT token if we have one
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor ───────────────────────────────
// Runs AFTER every response — handles 401 (unauthorized) globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401, the token is expired or invalid
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      // If we're not already on the login page, redirect there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
