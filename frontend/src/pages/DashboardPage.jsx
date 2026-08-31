/**
 * DashboardPage — Protected user dashboard
 * ==========================================
 * The first page users see after logging in.
 * This is a PROTECTED page — only accessible with a valid JWT.
 *
 * For Sprint 2, this is a simple "Welcome" page that proves:
 * 1. Registration works
 * 2. Login works
 * 3. JWT tokens work
 * 4. Protected routes work
 * 5. The user's profile is loaded correctly
 *
 * Sprint 3 will expand this with file management, storage stats, etc.
 */

import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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
            value="Coming in Sprint 3"
            accent="accent"
          />
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

/** Stat card component */
function StatCard({ icon, label, value, accent }) {
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
