/**
 * StorageBreakdown Component
 * ==========================
 * Displays user storage distribution classified into:
 * - Documents (PDF, DOCX, TXT)
 * - Images (PNG, JPG, SVG)
 * - Media/Videos (MP4, MP3)
 * - Other (Archives, code, binaries, etc.)
 *
 * Features:
 * - Multi-segment stacked progress bar showing relative category proportion
 * - Detailed breakdown cards with file counts, byte sizes, and percentages
 * - Fully responsive with theme-consistent glassmorphism
 */

import React from 'react'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const CATEGORY_CONFIG = {
  documents: {
    label: 'Documents',
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    dotColor: '#3b82f6',
    icon: (
      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
  images: {
    label: 'Images',
    color: 'bg-cyan-400',
    textColor: 'text-cyan-400',
    dotColor: '#22d3ee',
    icon: (
      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
    ),
  },
  media: {
    label: 'Media / Videos',
    color: 'bg-purple-500',
    textColor: 'text-purple-400',
    dotColor: '#a855f7',
    icon: (
      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  other: {
    label: 'Other',
    color: 'bg-slate-400',
    textColor: 'text-slate-400',
    dotColor: '#94a3b8',
    icon: (
      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
  },
}

export default function StorageBreakdown({ analytics, loading = false }) {
  if (loading) {
    return (
      <div className="bg-surface-800/60 backdrop-blur-xl border border-surface-600/50 rounded-2xl p-6 animate-pulse">
        <div className="h-5 bg-surface-700/80 rounded w-1/3 mb-4" />
        <div className="h-4 bg-surface-700/80 rounded-full w-full mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-surface-700/60 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const usedBytes = analytics?.used_bytes || 0
  const quotaBytes = analytics?.quota_bytes || 1
  const categories = analytics?.categories || {}

  // Calculate percentage of each category relative to quota
  const cats = ['documents', 'images', 'media', 'other'].map((key) => {
    const data = categories[key] || { size_bytes: 0, file_count: 0, percentage: 0 }
    const quotaShare = quotaBytes > 0 ? (data.size_bytes / quotaBytes) * 100 : 0
    return {
      key,
      ...CATEGORY_CONFIG[key],
      sizeBytes: data.size_bytes,
      fileCount: data.file_count,
      percentOfUsed: data.percentage,
      quotaShare: Math.min(100, quotaShare),
    }
  })

  return (
    <div className="bg-surface-800/60 backdrop-blur-xl border border-surface-600/50 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
            </svg>
            Storage Breakdown
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Distribution across file formats and media types
          </p>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-white">{formatBytes(usedBytes)}</span>
          <span className="text-xs text-slate-400"> of {formatBytes(quotaBytes)}</span>
        </div>
      </div>

      {/* Multi-segment horizontal bar */}
      <div className="relative w-full h-3.5 bg-surface-900/80 rounded-full overflow-hidden flex border border-surface-700/60 mb-6">
        {cats.map((cat) => {
          if (cat.quotaShare <= 0) return null
          return (
            <div
              key={cat.key}
              className={`${cat.color} transition-all duration-500`}
              style={{ width: `${cat.quotaShare}%` }}
              title={`${cat.label}: ${formatBytes(cat.sizeBytes)} (${cat.percentOfUsed}% of used)`}
            />
          )
        })}
      </div>

      {/* Category breakdown cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cats.map((cat) => (
          <div
            key={cat.key}
            className="p-3.5 rounded-xl bg-surface-900/50 border border-surface-700/40 hover:border-surface-600/70 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.dotColor }} />
                <span className="text-xs font-medium text-slate-300">{cat.label}</span>
              </div>
              {cat.icon}
            </div>
            <div className="text-sm font-semibold text-white">
              {formatBytes(cat.sizeBytes)}
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
              <span>{cat.fileCount} {cat.fileCount === 1 ? 'file' : 'files'}</span>
              <span>{cat.percentOfUsed}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
