/**
 * NetworkStatusWidget Component
 * =============================
 * Displays the server's network status on the dashboard.
 *
 * SPRINT 5 — LAN DEPLOYMENT:
 * This widget shows users exactly how to access their personal cloud
 * from other devices on the same network.
 *
 * Shows:
 * - Server hostname and platform
 * - LAN mode status (enabled/disabled)
 * - Access URLs (local + LAN)
 * - Copy-to-clipboard for the LAN URL
 * - Connection health indicator
 *
 * WHY IS THIS USEFUL?
 * When your cloud is running on a laptop and you want to access it
 * from your phone or tablet, you need to know the URL. This widget
 * tells you exactly what to type on the other device's browser.
 */

import React, { useState, useEffect } from 'react'
import { getNetworkInfo } from '../api/network'

export default function NetworkStatusWidget() {
  const [networkInfo, setNetworkInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedField, setCopiedField] = useState(null)

  useEffect(() => {
    fetchNetworkInfo()
  }, [])

  async function fetchNetworkInfo() {
    try {
      setLoading(true)
      setError(null)
      const res = await getNetworkInfo()
      setNetworkInfo(res.data)
    } catch (err) {
      console.error('Failed to fetch network info:', err)
      setError('Unable to reach the server')
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard(text, field) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // Fallback for non-HTTPS contexts (common on LAN)
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  // ─── Loading State ─────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-surface-800/70 backdrop-blur-xl border border-surface-600/50 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-surface-700 animate-pulse" />
          <div className="h-4 w-36 bg-surface-700 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-3 w-full bg-surface-700 rounded animate-pulse" />
          <div className="h-3 w-3/4 bg-surface-700 rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-surface-700 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  // ─── Error State ───────────────────────────────────────
  if (error) {
    return (
      <div className="bg-surface-800/70 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Globe icon */}
            <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Network Status</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/15 border border-red-500/30 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Offline
          </span>
        </div>
        <p className="text-xs text-red-300 mb-3">{error}</p>
        <button
          onClick={fetchNetworkInfo}
          className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-medium transition-colors border border-red-500/30"
        >
          Retry Connection
        </button>
      </div>
    )
  }

  const info = networkInfo
  const isLanActive = info?.lan_accessible

  return (
    <div className="bg-surface-800/70 backdrop-blur-xl border border-surface-600/50 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
            isLanActive
              ? 'bg-cyan-500/15 border-cyan-500/25 text-cyan-400'
              : 'bg-brand-500/15 border-brand-500/25 text-brand-400'
          }`}>
            {/* Globe / Network icon */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Network Status</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={fetchNetworkInfo}
            title="Refresh network info"
            className="w-7 h-7 rounded-lg bg-surface-700/60 hover:bg-surface-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isLanActive
              ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              isLanActive ? 'bg-cyan-400' : 'bg-emerald-400'
            }`} />
            {isLanActive ? 'LAN Active' : 'Local Only'}
          </span>
        </div>
      </div>

      {/* Network Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Server Host */}
        <div className="bg-surface-900/50 rounded-xl p-3 border border-surface-700/50">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">Server Host</span>
          <span className="text-sm font-mono text-slate-200">{info?.hostname || '—'}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{info?.platform}</span>
        </div>

        {/* LAN IP */}
        <div className="bg-surface-900/50 rounded-xl p-3 border border-surface-700/50">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">LAN IP Address</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-slate-200">{info?.lan_ip || '—'}</span>
            {info?.lan_ip && (
              <button
                onClick={() => copyToClipboard(info.lan_ip, 'ip')}
                title="Copy IP"
                className="text-slate-500 hover:text-brand-400 transition-colors"
              >
                {copiedField === 'ip' ? (
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Local URL */}
        <div className="bg-surface-900/50 rounded-xl p-3 border border-surface-700/50">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">Local Access</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-emerald-400">{info?.local_url || '—'}</span>
            {info?.local_url && (
              <button
                onClick={() => copyToClipboard(info.local_url, 'local')}
                title="Copy URL"
                className="text-slate-500 hover:text-brand-400 transition-colors"
              >
                {copiedField === 'local' ? (
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* LAN URL or LAN Hint */}
        <div className="bg-surface-900/50 rounded-xl p-3 border border-surface-700/50">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">LAN Access</span>
          {isLanActive && info?.frontend_lan_url ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-cyan-400">{info.frontend_lan_url}</span>
              <button
                onClick={() => copyToClipboard(info.frontend_lan_url, 'lan')}
                title="Copy LAN URL"
                className="text-slate-500 hover:text-brand-400 transition-colors"
              >
                {copiedField === 'lan' ? (
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                  </svg>
                )}
              </button>
            </div>
          ) : (
            <div>
              <span className="text-sm text-slate-500">Not enabled</span>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Set <code className="bg-surface-700 px-1 py-0.5 rounded text-[9px] text-slate-400">LAN_MODE=true</code> in backend .env
              </p>
            </div>
          )}
        </div>
      </div>

      {/* LAN Instructions (only when LAN is active) */}
      {isLanActive && (
        <div className="mt-4 p-3 rounded-xl bg-cyan-500/8 border border-cyan-500/20">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <p className="text-xs text-cyan-300/80 leading-relaxed">
              <strong className="text-cyan-300">LAN Access Active.</strong>{' '}
              Open <span className="font-mono bg-cyan-500/15 px-1.5 py-0.5 rounded text-cyan-300">{info.frontend_lan_url}</span> on
              any device connected to the same Wi-Fi or Ethernet network to access your cloud.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
