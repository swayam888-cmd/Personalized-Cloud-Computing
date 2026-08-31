/**
 * App.jsx — Main Application Component
 * =====================================
 * This is the root React component.
 *
 * WHAT IT DOES:
 * 1. On page load, calls GET /api/health on the backend
 * 2. Displays the backend connection status
 * 3. Shows a branded landing page for "Personalized Cloud Computing"
 *
 * KEY CONCEPT — useEffect + fetch:
 * - useEffect(..., []) runs once when the component first mounts
 * - fetch() makes an HTTP request to the backend
 * - We store the result in state using useState()
 * - React re-renders the component whenever state changes
 */

import { useState, useEffect } from 'react'

// The backend URL — in development, FastAPI runs on port 8000
const API_URL = 'http://localhost:8000'

function App() {
  // ─── State ──────────────────────────────────────────
  // null = still loading, object = got a response, 'error' = fetch failed
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  // ─── Fetch health check on mount ────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((response) => {
        if (!response.ok) throw new Error('Backend returned an error')
        return response.json()
      })
      .then((data) => {
        setHealth(data)
        setLoading(false)
      })
      .catch(() => {
        setHealth(null)
        setLoading(false)
      })
  }, []) // Empty array = run only once on mount

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-accent-500/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 animate-fade-in text-center max-w-lg w-full">
        {/* Logo / Icon */}
        <div className="mx-auto mb-8 w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-400 flex items-center justify-center shadow-lg shadow-brand-500/25">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold tracking-tight mb-3 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Personalized Cloud
        </h1>
        <p className="text-slate-400 mb-10 text-lg">
          Your own cloud platform — built from scratch
        </p>

        {/* Status card */}
        <div className="animate-slide-up bg-surface-800/80 backdrop-blur-xl border border-surface-600/50 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            System Status
          </h2>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-2">
              <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-300">Connecting to backend...</span>
            </div>
          ) : health ? (
            <div className="space-y-3">
              <StatusRow
                label="Backend"
                value={health.status}
                ok={health.status === 'healthy'}
              />
              <StatusRow
                label="Database"
                value={health.database}
                ok={health.database === 'connected'}
              />
              <StatusRow
                label="Version"
                value={health.version}
                ok={true}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 py-2">
              <div className="w-3 h-3 rounded-full bg-danger animate-pulse-soft" />
              <span className="text-danger">
                Backend unreachable — is the server running on port 8000?
              </span>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <p className="mt-8 text-sm text-slate-500">
          Sprint 1 — Foundation •{' '}
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 hover:text-brand-300 transition-colors underline underline-offset-2"
          >
            API Docs
          </a>
        </p>
      </div>
    </div>
  )
}

/**
 * StatusRow — displays a single status line
 * Shows a green or red dot, a label, and a value.
 */
function StatusRow({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface-700/50">
      <div className="flex items-center gap-2.5">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            ok ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]'
          }`}
        />
        <span className="text-slate-300 font-medium">{label}</span>
      </div>
      <span className={`text-sm font-mono ${ok ? 'text-success' : 'text-danger'}`}>
        {value}
      </span>
    </div>
  )
}

export default App
