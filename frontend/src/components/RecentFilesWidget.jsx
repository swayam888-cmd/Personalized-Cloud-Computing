/**
 * RecentFilesWidget Component
 * ===========================
 * Displays the user's latest 5 uploaded/modified files on the dashboard.
 *
 * Includes:
 * - File icon based on extension/type
 * - File name, human-readable size, formatted timestamp
 * - Quick download action reusing the existing files API downloadFile helper
 * - Link to navigate directly to the full files workspace
 */

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { downloadFile } from '../api/files'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getFileIcon(fileName = '') {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(ext)) {
    return (
      <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      </div>
    )
  }
  if (['pdf', 'docx', 'doc', 'txt', 'rtf'].includes(ext)) {
    return (
      <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      </div>
    )
  }
  if (['mp4', 'mp3', 'wav', 'mkv', 'avi'].includes(ext)) {
    return (
      <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-lg bg-slate-500/15 border border-slate-500/25 flex items-center justify-center text-slate-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    </div>
  )
}

export default function RecentFilesWidget({ files = [], loading = false }) {
  const [downloadingId, setDownloadingId] = useState(null)

  const handleDownload = async (file) => {
    try {
      setDownloadingId(file.id)
      await downloadFile(file.id, file.name)
    } catch (err) {
      console.error('Download failed', err)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="bg-surface-800/60 backdrop-blur-xl border border-surface-600/50 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Recent Files
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Quick access to your latest uploaded files</p>
        </div>
        <Link
          to="/files"
          className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors flex items-center gap-1"
        >
          View all
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-surface-700/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <svg className="w-10 h-10 mx-auto mb-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
          </svg>
          <p className="text-sm">No files uploaded yet</p>
          <Link
            to="/files"
            className="inline-block mt-3 text-xs text-brand-400 hover:text-brand-300 font-medium bg-brand-500/10 px-3 py-1.5 rounded-lg border border-brand-500/20"
          >
            Go to Files to upload
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-surface-700/50">
          {files.map((file) => (
            <div
              key={file.id}
              className="py-2.5 flex items-center justify-between group hover:bg-surface-700/20 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 mr-3">
                {getFileIcon(file.name)}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{formatBytes(file.size_bytes)}</span>
                    <span>•</span>
                    <span>{formatDate(file.created_at)}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDownload(file)}
                disabled={downloadingId === file.id}
                title="Download file"
                className="p-2 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-brand-500/10 transition-colors disabled:opacity-50 shrink-0"
              >
                {downloadingId === file.id ? (
                  <svg className="w-4 h-4 animate-spin text-brand-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
