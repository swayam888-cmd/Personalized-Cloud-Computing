/**
 * DashboardPage — Protected user dashboard
 * ==========================================
 * The first page users see after logging in.
 * This is a PROTECTED page — only accessible with a valid JWT.
 *
 * Shows:
 * 1. Welcome message with user info
 * 2. Live storage stats from the API
 * 3. Quick-action cards (My Files, profile info)
 * 4. Recent Activity feed (from audit trail)
 * 5. Profile details
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { getStorageStats } from '../api/files'
import { listActivities } from '../api/activities'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)

  useEffect(() => {
    getStorageStats()
      .then((res) => setStats(res.data))
      .catch(() => {}) // Silently fail — stats card will show fallback
  }, [])

  useEffect(() => {
    setActivitiesLoading(true)
    listActivities({ limit: 10 })
      .then((res) => setActivities(res.data.items))
      .catch(() => {})
      .finally(() => setActivitiesLoading(false))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Format the date nicely
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Format bytes to human-readable
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const storageLabel = stats
    ? `${formatSize(stats.used_bytes)} / ${formatSize(stats.quota_bytes)}`
    : 'Loading...'

  const usagePercent = stats
    ? Math.min(100, Math.round((stats.used_bytes / stats.quota_bytes) * 100))
    : 0

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-accent-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Nav bar */}
      <nav className="relative z-10 border-b border-surface-600/50 bg-surface-800/60 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-accent-400 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
              </svg>
            </div>
            <span className="font-semibold text-white">Personalized Cloud</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-500/30 flex items-center justify-center">
                <span className="text-sm font-semibold text-brand-300">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-slate-300 hidden sm:block">{user.username}</span>
            </div>
            <button
              onClick={handleLogout}
              id="logout-button"
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-surface-700/50 transition-all cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10 animate-fade-in">
        {/* Welcome section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome, {user.username} 👋
          </h1>
          <p className="text-slate-400">
            Your personal cloud is ready. Here's your workspace overview.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            }
            label="Account"
            value={user.role === 'admin' ? 'Administrator' : 'User'}
            accent="brand"
          />
          <StatCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            }
            label="Storage"
            value={storageLabel}
            accent="accent"
          >
            {/* Mini progress bar */}
            {stats && (
              <div className="mt-2 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400 transition-all duration-500"
                  style={{ width: `${Math.max(usagePercent, 2)}%` }}
                />
              </div>
            )}
          </StatCard>
          <StatCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            }
            label="Member Since"
            value={memberSince}
            accent="success"
          />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link
            to="/files"
            className="group bg-surface-800/80 backdrop-blur-xl border border-surface-600/50 rounded-2xl p-6 shadow-2xl hover:border-brand-500/30 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-brand-400 group-hover:bg-brand-500/25 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">My Files</h3>
                <p className="text-sm text-slate-400">
                  {stats
                    ? `${stats.file_count} files, ${stats.folder_count} folders`
                    : 'Browse your cloud storage'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm text-brand-400 group-hover:gap-2 transition-all">
              Open file manager
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>

          <div className="bg-surface-800/80 backdrop-blur-xl border border-surface-600/50 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">System Status</h3>
                <p className="text-sm text-slate-400">All services operational</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-emerald-400">Online</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-surface-800/80 backdrop-blur-xl border border-surface-600/50 rounded-2xl p-6 shadow-2xl mb-10">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">
            Recent Activity
          </h2>
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-10 h-10 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p className="text-slate-500 text-sm">No activity yet. Start uploading files!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.map((act) => (
                <ActivityRow key={act.id} activity={act} />
              ))}
            </div>
          )}
        </div>

        {/* Profile card */}
        <div className="bg-surface-800/80 backdrop-blur-xl border border-surface-600/50 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">
            Your Profile
          </h2>
          <div className="space-y-4">
            <ProfileRow label="Username" value={user.username} />
            <ProfileRow label="Email" value={user.email} />
            <ProfileRow label="Role" value={user.role} />
            <ProfileRow label="Status" value={user.is_active ? 'Active' : 'Inactive'} />
            <ProfileRow label="User ID" value={`#${user.id}`} />
          </div>
        </div>
      </main>
    </div>
  )
}

/** Action type → icon + color mapping */
const ACTION_META = {
  REGISTER:      { emoji: '🎉', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  LOGIN:         { emoji: '🔑', color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  UPLOAD:        { emoji: '📤', color: 'text-green-400',  bg: 'bg-green-500/10' },
  DOWNLOAD:      { emoji: '📥', color: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
  DELETE:        { emoji: '🗑️', color: 'text-red-400',    bg: 'bg-red-500/10' },
  RENAME:        { emoji: '✏️', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  MOVE:          { emoji: '📁', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  CREATE_FOLDER: { emoji: '📂', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
}

/** Format timestamp to relative or readable form */
function formatRelativeTime(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Single activity row */
function ActivityRow({ activity }) {
  const meta = ACTION_META[activity.action] || { emoji: '📋', color: 'text-slate-400', bg: 'bg-slate-500/10' }

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-surface-700/30 transition-colors group">
      <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center text-sm shrink-0`}>
        {meta.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold uppercase tracking-wide ${meta.color}`}>
            {activity.action.replace('_', ' ')}
          </span>
          {activity.item_name && (
            <span className="text-sm text-white truncate">
              — {activity.item_name}
            </span>
          )}
        </div>
        {activity.details && (
          <p className="text-xs text-slate-500 truncate mt-0.5">{activity.details}</p>
        )}
      </div>
      <span className="text-xs text-slate-600 whitespace-nowrap shrink-0 group-hover:text-slate-500 transition-colors">
        {formatRelativeTime(activity.timestamp)}
      </span>
    </div>
  )
}

/** Stat card component */
function StatCard({ icon, label, value, accent, children }) {
  const colors = {
    brand: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    accent: 'text-accent-400 bg-accent-500/10 border-accent-500/20',
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  }

  return (
    <div className="bg-surface-800/80 backdrop-blur-xl border border-surface-600/50 rounded-xl p-5">
      <div className={`w-10 h-10 rounded-lg ${colors[accent]} border flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{value}</p>
      {children}
    </div>
  )
}

/** Profile row component */
function ProfileRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-surface-700/30">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  )
}
