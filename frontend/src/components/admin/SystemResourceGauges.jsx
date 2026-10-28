/**
 * SystemResourceGauges Component
 * ==============================
 * Real-time host telemetry meters:
 * - CPU utilization (%) with core counts & frequency
 * - RAM consumption (Used / Total GB, available)
 * - Disk storage partition capacity (Used / Free GB)
 * - Server uptime & health status
 * - Process memory footprint (FastAPI RSS & threads)
 *
 * Includes live polling auto-refresh controls and status alerts.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSystemMetrics } from '../../api/admin'

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

function formatUptime(seconds) {
  if (!seconds || seconds <= 0) return '0m'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0 || days > 0) parts.push(`${hours}h`)
  parts.push(`${minutes}m`)
  if (days === 0 && hours === 0) parts.push(`${secs}s`)
  return parts.join(' ')
}

function getStatusColor(percent) {
  if (percent >= 85) return { text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500/30', glow: 'shadow-rose-500/20', badge: 'bg-rose-500/15 text-rose-300' }
  if (percent >= 65) return { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500/30', glow: 'shadow-amber-500/20', badge: 'bg-amber-500/15 text-amber-300' }
  return { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20', badge: 'bg-emerald-500/15 text-emerald-300' }
}

export default function SystemResourceGauges() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [autoRefreshSecs, setAutoRefreshSecs] = useState(5) // 0 = paused, 3, 5, 10
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

  const fetchMetrics = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true)
      const res = await getSystemMetrics()
      setMetrics(res.data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      console.error('Failed to fetch system metrics:', err)
      setError(err.response?.data?.detail || 'Unable to communicate with host telemetry service')
    } finally {
      setLoading(false)
      if (isManual) setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // Polling timer
  useEffect(() => {
    if (autoRefreshSecs > 0) {
      timerRef.current = setInterval(() => {
        fetchMetrics(false)
      }, autoRefreshSecs * 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [autoRefreshSecs, fetchMetrics])

  if (loading && !metrics) {
    return (
      <div className="p-12 rounded-2xl bg-surface-800/60 border border-surface-700/50 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Sampling host hardware metrics...</span>
      </div>
    )
  }

  const cpuPercent = metrics?.cpu?.percent ?? 0
  const cpuStatus = getStatusColor(cpuPercent)

  const memPercent = metrics?.memory?.percent ?? 0
  const memStatus = getStatusColor(memPercent)

  const diskPercent = metrics?.disk?.percent ?? 0
  const diskStatus = getStatusColor(diskPercent)

  return (
    <div className="space-y-6">
      {/* Top Header / Polling Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-800/60 border border-surface-700/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-400/50" />
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Host Telemetry Engine
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-md">
                Live
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Host: <span className="text-slate-200 font-mono font-medium">{metrics?.hostname}</span> ({metrics?.platform} {metrics?.os_version})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 hidden md:inline">
              Sampled: {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          {/* Refresh interval selector */}
          <div className="flex items-center bg-surface-900/80 rounded-xl p-1 border border-surface-700/60 text-xs">
            <span className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Poll:</span>
            {[
              { label: '3s', val: 3 },
              { label: '5s', val: 5 },
              { label: '10s', val: 10 },
              { label: 'Off', val: 0 },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => setAutoRefreshSecs(opt.val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  autoRefreshSecs === opt.val
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Manual refresh button */}
          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-surface-700/60 hover:bg-surface-700 text-slate-200 hover:text-white border border-surface-600/50 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
            title="Refresh now"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.8"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchMetrics(true)} className="underline hover:text-white ml-2">Retry</button>
        </div>
      )}

      {/* Primary 4 Metric Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. CPU Gauge */}
        <div className="p-5 rounded-2xl bg-surface-800/60 border border-surface-700/50 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CPU Utilization</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${cpuStatus.badge}`}>
              {cpuPercent < 65 ? 'Normal' : cpuPercent < 85 ? 'Elevated' : 'High Load'}
            </span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold tracking-tight ${cpuStatus.text}`}>
                {cpuPercent.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">load</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-surface-900 rounded-full overflow-hidden mt-3 p-0.5 border border-surface-700/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${cpuStatus.bg}`}
                style={{ width: `${Math.min(100, Math.max(2, cpuPercent))}%` }}
              />
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-surface-700/50 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{metrics?.cpu?.cores_logical} Cores ({metrics?.cpu?.cores_physical} Physical)</span>
            <span>{metrics?.cpu?.frequency_mhz ? `${(metrics.cpu.frequency_mhz / 1000).toFixed(2)} GHz` : 'Base freq'}</span>
          </div>
        </div>

        {/* 2. RAM (Memory) Gauge */}
        <div className="p-5 rounded-2xl bg-surface-800/60 border border-surface-700/50 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Memory (RAM)</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${memStatus.badge}`}>
              {memPercent < 75 ? 'Healthy' : memPercent < 90 ? 'Constrained' : 'Critical'}
            </span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold tracking-tight ${memStatus.text}`}>
                {memPercent.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">
                {formatBytes(metrics?.memory?.used_bytes)} / {formatBytes(metrics?.memory?.total_bytes)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-surface-900 rounded-full overflow-hidden mt-3 p-0.5 border border-surface-700/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${memStatus.bg}`}
                style={{ width: `${Math.min(100, Math.max(2, memPercent))}%` }}
              />
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-surface-700/50 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Available:</span>
            <span className="text-slate-200 font-medium">{formatBytes(metrics?.memory?.available_bytes)}</span>
          </div>
        </div>

        {/* 3. Disk Storage Gauge */}
        <div className="p-5 rounded-2xl bg-surface-800/60 border border-surface-700/50 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Storage Volume</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${diskStatus.badge}`}>
              {diskPercent < 80 ? 'Optimal' : diskPercent < 90 ? 'Warning' : 'Full'}
            </span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold tracking-tight ${diskStatus.text}`}>
                {diskPercent.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">
                {formatBytes(metrics?.disk?.used_bytes)} / {formatBytes(metrics?.disk?.total_bytes)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-surface-900 rounded-full overflow-hidden mt-3 p-0.5 border border-surface-700/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${diskStatus.bg}`}
                style={{ width: `${Math.min(100, Math.max(2, diskPercent))}%` }}
              />
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-surface-700/50 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Free Space:</span>
            <span className="text-slate-200 font-medium">{formatBytes(metrics?.disk?.free_bytes)}</span>
          </div>
        </div>

        {/* 4. Server Uptime & Process */}
        <div className="p-5 rounded-2xl bg-surface-800/60 border border-surface-700/50 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Host Uptime</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              Online
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {formatUptime(metrics?.uptime_seconds)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Booted: {metrics?.boot_time ? new Date(metrics.boot_time).toLocaleDateString() : 'N/A'}
            </p>
          </div>

          <div className="pt-3 mt-2 border-t border-surface-700/50 text-[11px] text-slate-400 flex items-center justify-between">
            <span>API RSS Memory:</span>
            <span className="text-indigo-300 font-mono font-medium">{formatBytes(metrics?.process?.memory_rss_bytes)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
