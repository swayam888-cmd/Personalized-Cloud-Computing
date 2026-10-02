/**
 * ActivityTimeline Component
 * ==========================
 * Chronological audit feed displaying user activities in a clean timeline layout.
 *
 * Shows:
 * - Specific action icon & color badge
 * - Human-readable summary (e.g., "Uploaded report.pdf")
 * - Additional action details (source/target paths, IP info, etc.)
 * - Relative timestamps
 * - Optional action filtering
 */

import React, { useState } from 'react'

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSec < 45) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getActionMeta(action) {
  switch (action) {
    case 'UPLOAD':
      return {
        label: 'Uploaded',
        color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
        ),
      }
    case 'DOWNLOAD':
      return {
        label: 'Downloaded',
        color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        ),
      }
    case 'CREATE_FOLDER':
      return {
        label: 'Created folder',
        color: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
          </svg>
        ),
      }
    case 'DELETE':
      return {
        label: 'Deleted',
        color: 'text-red-400 bg-red-500/15 border-red-500/30',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        ),
      }
    case 'RENAME':
      return {
        label: 'Renamed',
        color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
          </svg>
        ),
      }
    case 'MOVE':
      return {
        label: 'Moved',
        color: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        ),
      }
    case 'LOGIN':
      return {
        label: 'Signed in',
        color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
          </svg>
        ),
      }
    case 'UPDATE_PROFILE':
      return {
        label: 'Updated profile',
        color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        ),
      }
    case 'CHANGE_PASSWORD':
      return {
        label: 'Changed password',
        color: 'text-teal-400 bg-teal-500/15 border-teal-500/30',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        ),
      }
    default:
      return {
        label: action || 'Activity',
        color: 'text-slate-400 bg-slate-500/15 border-slate-500/30',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        ),
      }
  }
}

export default function ActivityTimeline({ activities = [], loading = false }) {
  const [filter, setFilter] = useState('ALL')

  const filtered = activities.filter((act) => {
    if (filter === 'ALL') return true
    if (filter === 'FILES') return ['UPLOAD', 'DOWNLOAD', 'CREATE_FOLDER', 'DELETE', 'RENAME', 'MOVE'].includes(act.action)
    if (filter === 'AUTH') return ['LOGIN', 'REGISTER'].includes(act.action)
    if (filter === 'SECURITY') return ['UPDATE_PROFILE', 'CHANGE_PASSWORD'].includes(act.action)
    return true
  })

  return (
    <div className="bg-surface-800/60 backdrop-blur-xl border border-surface-600/50 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Activity Timeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Chronological record of recent cloud events</p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-surface-900/60 p-1 rounded-xl border border-surface-700/50">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'FILES', label: 'Files' },
            { id: 'AUTH', label: 'Auth' },
            { id: 'SECURITY', label: 'Security' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filter === btn.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-surface-700/60 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-surface-700/60 rounded w-1/2" />
                <div className="h-3 bg-surface-700/40 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <svg className="w-10 h-10 mx-auto mb-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <p className="text-sm">No activity recorded yet</p>
          <p className="text-xs text-slate-500 mt-1">Actions like uploading or downloading files will appear here</p>
        </div>
      ) : (
        <div className="relative pl-4 space-y-4 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-700/60">
          {filtered.map((act) => {
            const meta = getActionMeta(act.action)
            return (
              <div key={act.id} className="relative flex items-start gap-3 group">
                {/* Node icon */}
                <div className={`w-8 h-8 rounded-full border ${meta.color} flex items-center justify-center shrink-0 z-10 shadow-sm transition-transform group-hover:scale-110`}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2">
                    <p className="text-sm font-medium text-slate-200">
                      <span className="text-white">{meta.label}</span>
                      {act.item_name && (
                        <span className="text-slate-300 ml-1 font-semibold break-all">
                          {act.item_name}
                        </span>
                      )}
                    </p>
                    <span className="text-xs text-slate-400 shrink-0">
                      {formatRelativeTime(act.timestamp)}
                    </span>
                  </div>

                  {act.details && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate group-hover:text-slate-300 transition-colors" title={act.details}>
                      {act.details}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
