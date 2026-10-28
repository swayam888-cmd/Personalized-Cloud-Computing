/**
 * UserManagementTable Component
 * =============================
 * Administrator console for user accounts:
 * - Aggregated system user & storage overview
 * - Filter by search query, role, or active status
 * - Interactive storage quota modifier with presets (1 GB, 2 GB, 5 GB, 10 GB, Custom)
 * - Account suspension & activation controls
 * - Role elevation / demotion
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getAdminUsers,
  updateUserQuota,
  toggleUserStatus,
  updateUserRole,
} from '../../api/admin'
import { useAuth } from '../../context/AuthContext'

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

export default function UserManagementTable() {
  const { user: currentAdmin } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notification, setNotification] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all') // 'all' | 'admin' | 'user'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'suspended'

  // Quota Modal State
  const [quotaModalUser, setQuotaModalUser] = useState(null)
  const [newQuotaGB, setNewQuotaGB] = useState(1)
  const [savingQuota, setSavingQuota] = useState(false)

  // Action Confirmation Modal
  const [confirmModal, setConfirmModal] = useState(null) // { type: 'status'|'role', user: User, nextValue: any, title, message }

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getAdminUsers()
      setData(res.data)
      setError(null)
    } catch (err) {
      console.error('Failed to load admin user list:', err)
      setError(err.response?.data?.detail || 'Failed to retrieve user directory')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // ─── Quota Handler ───────────────────────────────────────
  const openQuotaModal = (user) => {
    setQuotaModalUser(user)
    const currentGB = (user.storage_quota_bytes / (1024 * 1024 * 1024)).toFixed(1)
    setNewQuotaGB(parseFloat(currentGB))
  }

  const handleSaveQuota = async (e) => {
    e.preventDefault()
    if (!quotaModalUser) return
    const bytes = Math.round(newQuotaGB * 1024 * 1024 * 1024)
    if (bytes <= 0) return

    setSavingQuota(true)
    try {
      await updateUserQuota(quotaModalUser.id, bytes)
      showNotification(`Storage quota updated for ${quotaModalUser.username} to ${newQuotaGB} GB`)
      setQuotaModalUser(null)
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update quota')
    } finally {
      setSavingQuota(false)
    }
  }

  // ─── Status & Role Action Handler ─────────────────────────
  const executeConfirmAction = async () => {
    if (!confirmModal) return
    const { type, user, nextValue } = confirmModal
    setConfirmModal(null)

    try {
      if (type === 'status') {
        await toggleUserStatus(user.id, nextValue)
        showNotification(`Account ${nextValue ? 'activated' : 'suspended'} for ${user.username}`)
      } else if (type === 'role') {
        await updateUserRole(user.id, nextValue)
        showNotification(`Role changed to ${nextValue.toUpperCase()} for ${user.username}`)
      }
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Action failed')
    }
  }

  // Filtered users list
  const filteredUsers = (data?.users || []).filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())

    const matchesRole = roleFilter === 'all' || u.role === roleFilter

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.is_active) ||
      (statusFilter === 'suspended' && !u.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* System User Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-surface-800/60 border border-surface-700/50 backdrop-blur-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
            Total Accounts
          </span>
          <span className="text-2xl font-extrabold text-white">
            {data?.total_users ?? 0}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            {data?.active_users ?? 0} active · {(data?.total_users ?? 0) - (data?.active_users ?? 0)} suspended
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-surface-800/60 border border-surface-700/50 backdrop-blur-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
            Administrators
          </span>
          <span className="text-2xl font-extrabold text-indigo-400">
            {data?.admin_users ?? 0}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Privileged control plane
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-surface-800/60 border border-surface-700/50 backdrop-blur-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
            Allocated Quota
          </span>
          <span className="text-2xl font-extrabold text-brand-300">
            {formatBytes(data?.total_storage_allocated_bytes)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Total assigned capacity
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-surface-800/60 border border-surface-700/50 backdrop-blur-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
            Consumed Storage
          </span>
          <span className="text-2xl font-extrabold text-emerald-400">
            {formatBytes(data?.total_storage_used_bytes)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Across all users & folders
          </span>
        </div>
      </div>

      {/* Notifications / Errors */}
      {notification && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white ml-2">×</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white ml-2">×</button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-surface-800/60 border border-surface-700/50 backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-900 border border-surface-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-surface-900 border border-surface-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins Only</option>
            <option value="user">Standard Users</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-900 border border-surface-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>

          <button
            onClick={loadUsers}
            className="px-3 py-2 rounded-xl bg-surface-700/60 hover:bg-surface-700 text-xs font-semibold text-slate-300 hover:text-white border border-surface-600/50 transition-all flex items-center gap-1.5"
            title="Reload user table"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-surface-800/60 border border-surface-700/50 backdrop-blur-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-900/60 border-b border-surface-700/50 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 min-w-[200px]">Storage Used / Quota</th>
                <th className="py-3.5 px-4 text-center">Items</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/40">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.id === currentAdmin?.id
                  const usedFormatted = formatBytes(u.used_storage_bytes)
                  const quotaFormatted = formatBytes(u.storage_quota_bytes)

                  return (
                    <tr key={u.id} className="hover:bg-surface-700/30 transition-colors">
                      {/* User Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            u.role === 'admin'
                              ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/20'
                              : 'bg-surface-700 text-slate-300'
                          }`}>
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              {u.username}
                              {isSelf && (
                                <span className="text-[10px] bg-brand-500/20 text-brand-300 border border-brand-500/30 px-1.5 py-0.2 rounded font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-slate-400 text-[11px] font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                            : 'bg-surface-700/60 text-slate-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                          u.is_active
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Storage Progress Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-200 font-medium">{usedFormatted}</span>
                          <span className="text-slate-400 font-mono">of {quotaFormatted} ({u.storage_percent}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-900 rounded-full overflow-hidden p-0.5 border border-surface-700/60">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              u.storage_percent >= 90
                                ? 'bg-rose-500'
                                : u.storage_percent >= 75
                                ? 'bg-amber-500'
                                : 'bg-brand-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(2, u.storage_percent))}%` }}
                          />
                        </div>
                      </td>

                      {/* Files & Folders Count */}
                      <td className="py-3.5 px-4 text-center text-slate-300 font-mono text-[11px]">
                        {u.file_count} files · {u.folder_count} folders
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Change Quota Button */}
                          <button
                            onClick={() => openQuotaModal(u)}
                            className="px-2.5 py-1 rounded-lg bg-surface-700/70 hover:bg-surface-600 text-slate-200 text-xs font-medium transition-all"
                            title="Modify storage quota limit"
                          >
                            Quota
                          </button>

                          {/* Role Toggle Button */}
                          <button
                            onClick={() =>
                              setConfirmModal({
                                type: 'role',
                                user: u,
                                nextValue: u.role === 'admin' ? 'user' : 'admin',
                                title: u.role === 'admin' ? 'Demote Administrator' : 'Promote to Administrator',
                                message: `Are you sure you want to change the role of ${u.username} to ${u.role === 'admin' ? 'USER' : 'ADMIN'}?`,
                              })
                            }
                            disabled={isSelf && u.role === 'admin'}
                            className="px-2.5 py-1 rounded-lg bg-surface-700/70 hover:bg-surface-600 text-slate-200 text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isSelf ? 'Cannot demote yourself' : 'Change user role'}
                          >
                            {u.role === 'admin' ? 'Demote' : 'Promote'}
                          </button>

                          {/* Account Suspend / Activate Toggle */}
                          <button
                            onClick={() =>
                              setConfirmModal({
                                type: 'status',
                                user: u,
                                nextValue: !u.is_active,
                                title: u.is_active ? 'Suspend Account' : 'Activate Account',
                                message: `Are you sure you want to ${u.is_active ? 'suspend' : 'activate'} the account for ${u.username}?`,
                              })
                            }
                            disabled={isSelf}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                              u.is_active
                                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                            }`}
                            title={isSelf ? 'Cannot suspend your own account' : u.is_active ? 'Suspend account' : 'Reactivate account'}
                          >
                            {u.is_active ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Quota Adjustment Modal ────────────────────────────── */}
      {quotaModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-surface-800 border border-surface-700/80 p-6 shadow-2xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Adjust Storage Quota
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Set allocation limit for <span className="text-slate-200 font-semibold">{quotaModalUser.username}</span>.
              </p>
            </div>

            <form onSubmit={handleSaveQuota} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Quick Presets
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 5, 10].map((gb) => (
                    <button
                      type="button"
                      key={gb}
                      onClick={() => setNewQuotaGB(gb)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                        newQuotaGB === gb
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-surface-700/60 hover:bg-surface-700 text-slate-300'
                      }`}
                    >
                      {gb} GB
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Custom Quota (in Gigabytes)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    max="1000"
                    value={newQuotaGB}
                    onChange={(e) => setNewQuotaGB(parseFloat(e.target.value) || 0)}
                    required
                    className="flex-1 bg-surface-900 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <span className="text-xs font-semibold text-slate-400">GB</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Approx: {formatBytes(Math.round(newQuotaGB * 1024 * 1024 * 1024))}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-700">
                <button
                  type="button"
                  onClick={() => setQuotaModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-surface-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuota || newQuotaGB <= 0}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {savingQuota ? 'Saving...' : 'Apply Quota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Confirmation Modal ───────────────────────────────── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-surface-800 border border-surface-700/80 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight">
              {confirmModal.title}
            </h3>
            <p className="text-xs text-slate-300">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-700">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-surface-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmAction}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
