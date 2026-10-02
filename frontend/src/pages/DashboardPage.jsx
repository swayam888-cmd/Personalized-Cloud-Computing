/**
 * DashboardPage — Sprint 4 Upgraded Interactive Cloud Dashboard
 * ==============================================================
 * Comprehensive overview of the user's personal cloud workspace.
 *
 * Integrated Sections:
 * 1. Top navigation with profile identity & sign out
 * 2. Welcome hero banner with quick status
 * 3. 4-Metric Storage & Workspace Overview Cards:
 *    - Used Storage vs Quota (with progress bar)
 *    - Remaining Free Storage
 *    - Usage Percentage
 *    - Total Files & Folders
 * 4. Storage Breakdown (Task 10):
 *    - Visual multi-segment bar for Documents, Images, Media, Other
 *    - Category detail cards with count, size, and quota proportion
 * 5. Recent Files Widget (Task 11):
 *    - Latest 5 files with quick download action
 * 6. Activity Timeline (Task 12):
 *    - Chronological event audit feed with filtering tabs
 * 7. Profile & Security Management (Task 14 & 15):
 *    - Update username & email with validation
 *    - Change password securely with bcrypt verification
 *    - Real-time success and error banners
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getStorageAnalytics, getRecentFiles } from '../api/files'
import { listActivities } from '../api/activity'

import StorageBreakdown from '../components/StorageBreakdown'
import RecentFilesWidget from '../components/RecentFilesWidget'
import ActivityTimeline from '../components/ActivityTimeline'
import ProfileSecurityWidget from '../components/ProfileSecurityWidget'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function DashboardPage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  const [analytics, setAnalytics] = useState(null)
  const [recentFiles, setRecentFiles] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notification, setNotification] = useState(null)

  const showNotification = (msg, type = 'info') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [analyticsRes, recentRes, activitiesRes] = await Promise.all([
        getStorageAnalytics(),
        getRecentFiles(5),
        listActivities({ limit: 15 }),
      ])

      setAnalytics(analyticsRes.data)
      setRecentFiles(recentRes.data)
      setActivities(activitiesRes.data.items || [])
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError('Unable to load some cloud dashboard data. Please verify your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleProfileUpdated = (updatedUser) => {
    updateUser(updatedUser)
    showNotification('Profile updated successfully!', 'success')
    // Refresh activities to show the UPDATE_PROFILE event
    listActivities({ limit: 15 })
      .then((res) => setActivities(res.data.items || []))
      .catch(() => {})
  }

  const usedBytes = analytics?.used_bytes || 0
  const quotaBytes = analytics?.quota_bytes || 1073741824
  const remainingBytes = analytics?.remaining_bytes ?? Math.max(0, quotaBytes - usedBytes)
  const usedPercentage = analytics?.used_percentage ?? Math.min(100, Math.round((usedBytes / quotaBytes) * 100))
  const fileCount = analytics?.file_count ?? 0
  const folderCount = analytics?.folder_count ?? 0

  return (
    <div className="min-h-screen relative overflow-hidden bg-surface-900 text-slate-100">
      {/* Background ambient gradient glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Nav Bar */}
      <nav className="relative z-10 border-b border-surface-600/50 bg-surface-800/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight block">Personalized Cloud</span>
              <span className="text-[10px] text-accent-400 font-medium tracking-wide uppercase">Private Infrastructure</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/files"
              className="px-3.5 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
              </svg>
              My Files
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-surface-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-accent-400 flex items-center justify-center font-bold text-white text-xs shadow-md">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium text-slate-200 hidden md:block">{user?.username}</span>
            </div>

            <button
              onClick={handleLogout}
              id="logout-button"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-surface-700/60 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Global Notification Banner */}
      {notification && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-brand-500/15 border-brand-500/30 text-brand-300'
          }`}>
            <span>{notification.msg}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white ml-2">×</button>
          </div>
        </div>
      )}

      {/* Error state alert with retry */}
      {error && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={loadDashboardData}
              className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
        {/* Welcome Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.username} 👋
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Your personalized cloud workspace is active and secure.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDashboardData}
              disabled={loading}
              title="Refresh Dashboard Data"
              className="px-3 py-1.5 rounded-xl bg-surface-800 border border-surface-600/60 hover:bg-surface-700 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Refresh
            </button>

            <Link
              to="/files"
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
            >
              Upload New Files
            </Link>
          </div>
        </div>

        {/* 4 Storage & Workspace Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Used Storage */}
          <div className="bg-surface-800/70 backdrop-blur-xl border border-surface-600/50 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Used Storage</span>
              <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-brand-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              </div>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {formatBytes(usedBytes)}
            </div>
            <p className="text-xs text-slate-400 mb-3">Quota: {formatBytes(quotaBytes)}</p>
            {/* Progress bar */}
            <div className="h-1.5 w-full bg-surface-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(usedPercentage, 2))}%` }}
              />
            </div>
          </div>

          {/* Card 2: Remaining Quota */}
          <div className="bg-surface-800/70 backdrop-blur-xl border border-surface-600/50 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Space</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {formatBytes(remainingBytes)}
            </div>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span>●</span> Ready for uploads
            </p>
          </div>

          {/* Card 3: Storage Percentage */}
          <div className="bg-surface-800/70 backdrop-blur-xl border border-surface-600/50 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Usage Ratio</span>
              <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/25 flex items-center justify-center text-accent-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                </svg>
              </div>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {usedPercentage}%
            </div>
            <p className="text-xs text-slate-400">
              {usedPercentage > 85 ? 'Quota almost full' : 'Healthy usage rate'}
            </p>
          </div>

          {/* Card 4: Total Files & Folders */}
          <div className="bg-surface-800/70 backdrop-blur-xl border border-surface-600/50 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cloud Items</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                </svg>
              </div>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {fileCount} <span className="text-sm font-normal text-slate-400">files</span>
            </div>
            <p className="text-xs text-slate-400">{folderCount} folders created</p>
          </div>
        </div>

        {/* Storage Breakdown Component (Task 10) */}
        <StorageBreakdown analytics={analytics} loading={loading} />

        {/* Two-Column Workspace Grid: Recent Files & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Files Widget (Task 11) */}
          <RecentFilesWidget files={recentFiles} loading={loading} />

          {/* Quick Actions & Workspace Hub */}
          <div className="space-y-4">
            <Link
              to="/files"
              className="group block bg-surface-800/60 backdrop-blur-xl border border-surface-600/50 hover:border-brand-500/40 rounded-2xl p-6 shadow-xl transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white group-hover:text-brand-300 transition-colors">
                    Open File Manager
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload, organize, create folders, and manage all your documents
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-brand-400 group-hover:text-brand-300 font-medium">
                <span>Go to cloud files</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* System Security Status Card */}
            <div className="bg-surface-800/60 backdrop-blur-xl border border-surface-600/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Security & Isolation</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Isolated Storage
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Files are strictly isolated per user with JWT authentication and UUID disk mapping. No cross-tenant access is permitted.
              </p>
            </div>
          </div>
        </div>

        {/* Activity Timeline (Task 12) */}
        <ActivityTimeline activities={activities} loading={loading} />

        {/* Account & Security Settings (Task 14 & 15) */}
        <ProfileSecurityWidget user={user} onProfileUpdated={handleProfileUpdated} />
      </main>
    </div>
  )
}
