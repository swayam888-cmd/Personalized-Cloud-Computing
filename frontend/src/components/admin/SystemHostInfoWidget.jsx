/**
 * SystemHostInfoWidget Component
 * ===============================
 * Detailed breakdown of server platform specifications, process threading,
 * and hardware partition paths.
 */

import { useState, useEffect } from 'react'
import { getSystemMetrics } from '../../api/admin'

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default function SystemHostInfoWidget() {
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    getSystemMetrics()
      .then((res) => setMetrics(res.data))
      .catch((err) => console.error('Failed to load host info:', err))
  }, [])

  if (!metrics) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Host Architecture Card */}
      <div className="p-5 rounded-2xl bg-surface-800/60 border border-surface-700/50 backdrop-blur-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.75 5.1a4.5 4.5 0 0 1 3.6-1.6h5.3a4.5 4.5 0 0 1 3.6 1.6l1.6 2.45a4.5 4.5 0 0 1 .9 2.7" />
          </svg>
          Host & Architecture
        </h3>

        <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
          <div>
            <dt className="text-slate-500 font-medium">Hostname</dt>
            <dd className="text-slate-200 font-mono font-medium truncate mt-0.5">{metrics.hostname}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Operating System</dt>
            <dd className="text-slate-200 font-medium mt-0.5">{metrics.platform} ({metrics.os_version})</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Logical CPU Cores</dt>
            <dd className="text-slate-200 font-medium mt-0.5">{metrics.cpu.cores_logical} cores</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Physical CPU Cores</dt>
            <dd className="text-slate-200 font-medium mt-0.5">{metrics.cpu.cores_physical} physical</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Storage Mount Path</dt>
            <dd className="text-slate-300 font-mono text-[11px] truncate mt-0.5" title={metrics.disk.path}>
              {metrics.disk.path}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Server Boot Time</dt>
            <dd className="text-slate-200 font-medium mt-0.5">
              {new Date(metrics.boot_time).toLocaleTimeString()}
            </dd>
          </div>
        </dl>
      </div>

      {/* Backend Process Health Card */}
      <div className="p-5 rounded-2xl bg-surface-800/60 border border-surface-700/50 backdrop-blur-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75v-4.5m0 4.5h4.5m-4.5 0 6-6m-3 18c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.879a2.25 2.25 0 0 1 1.59.659l2.122 2.121a2.25 2.25 0 0 1 .659 1.591v1.129" />
          </svg>
          API Server Runtime Health
        </h3>

        <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
          <div>
            <dt className="text-slate-500 font-medium">Process Memory (RSS)</dt>
            <dd className="text-brand-300 font-mono font-medium mt-0.5">
              {formatBytes(metrics.process.memory_rss_bytes)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Process CPU Usage</dt>
            <dd className="text-slate-200 font-medium mt-0.5">
              {metrics.process.cpu_percent.toFixed(1)}%
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Active Worker Threads</dt>
            <dd className="text-slate-200 font-medium mt-0.5">
              {metrics.process.threads_count} threads
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Framework & Engine</dt>
            <dd className="text-emerald-300 font-medium mt-0.5">
              FastAPI + Uvicorn ASGI
            </dd>
          </div>
          <div className="col-span-2 pt-2 border-t border-surface-700/50">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Total System Physical Memory:</span>
              <span className="text-slate-200 font-mono">{formatBytes(metrics.memory.total_bytes)}</span>
            </div>
          </div>
        </dl>
      </div>
    </div>
  )
}
