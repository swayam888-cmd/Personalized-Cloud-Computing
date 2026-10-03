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
 *
 * SPRINT 5 — LAN-AWARE BASE URL:
 * Instead of hardcoding "http://localhost:8000", we now dynamically
 * resolve the API URL based on how the user accessed the frontend.
 *
 * WHY?
 * When a user on another device opens http://192.168.1.42:5173,
 * the frontend needs to call http://192.168.1.42:8000 — NOT localhost.
 * "localhost" on their device would point to THEIR machine, not the server.
 *
 * HOW IT WORKS:
 * 1. If VITE_API_URL env var is set → use that (manual override)
 * 2. Otherwise → use window.location.hostname (the same IP/host
 *    the user typed to reach the frontend) with port 8000
 *
 * This means:
 * - From the server itself: browser at localhost:5173 → API at localhost:8000 ✅
 * - From a phone on LAN:   browser at 192.168.1.42:5173 → API at 192.168.1.42:8000 ✅
 * - No configuration needed — it just works.
 */

import axios from 'axios'

/**
 * Resolve the backend API base URL dynamically.
 *
 * Priority:
 * 1. VITE_API_URL environment variable (set in .env or at build time)
 * 2. Same hostname as the current page, port 8000
 */
function resolveApiUrl() {
  // Check for manual override via environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // Dynamic: use the same hostname the user typed to reach the frontend
  // e.g., if they're at http://192.168.1.42:5173, API is at http://192.168.1.42:8000
  const protocol = window.location.protocol  // "http:" or "https:"
  const hostname = window.location.hostname   // "localhost" or "192.168.1.42"
  return `${protocol}//${hostname}:8000`
}

const API_URL = resolveApiUrl()

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
// Runs AFTER every response — handles errors globally
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

    // Network error — server unreachable (LAN connectivity issue)
    if (!error.response && error.code === 'ERR_NETWORK') {
      console.error(
        `[Cloud API] Cannot reach server at ${API_URL}. ` +
        `If accessing via LAN, ensure the backend is running with HOST=0.0.0.0`
      )
    }

    return Promise.reject(error)
  }
)

export { API_URL }
export default api
