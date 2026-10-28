/**
 * AdminPage — Cloud Infrastructure Administration & Resource Monitoring
 * ======================================================================
 * Central operations center for system metrics telemetry and user administration.
 * Restricted to accounts with role='admin'.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('metrics') // 'metrics' | 'users'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-surface-900 text-slate-100">
      {/* Ambient gradient backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="relative z-10 border-b border-surface-600/50 bg-surface-800/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-brand-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight block">Admin Console</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Control Plane
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">Infrastructure & User Management</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 rounded-xl bg-surface-700/50 hover:bg-surface-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              Dashboard
            </Link>
            <Link
              to="/files"
              className="px-3.5 py-1.5 rounded-xl bg-surface-700/50 hover:bg-surface-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              My Files
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-surface-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-brand-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="text-sm font-medium text-slate-200 hidden md:block">{user?.username}</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-surface-700/60 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Body */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-surface-700 pb-4 mb-6">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'metrics'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-surface-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.143 2.143L15.429 6" />
            </svg>
            System Metrics & Health
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-surface-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            User Accounts & Quotas
          </button>
        </div>

        {/* Tab Content placeholder - will be populated by widgets */}
        <div id="admin-tab-content">
          {activeTab === 'metrics' ? (
            <div className="p-8 rounded-2xl bg-surface-800/60 border border-surface-700/50 text-center">
              <p className="text-slate-400 text-sm">System telemetry widgets loading...</p>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-surface-800/60 border border-surface-700/50 text-center">
              <p className="text-slate-400 text-sm">User administration console loading...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
