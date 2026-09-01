/**
 * FilesPage — Personal Cloud Storage File Manager
 * =================================================
 * A full-featured file browser for the personal cloud.
 *
 * FEATURES:
 * - Browse folders with breadcrumb navigation
 * - Upload files via button or drag-and-drop
 * - Create new folders
 * - Download, rename, and delete files/folders
 * - Storage usage bar showing quota consumption
 * - File type icons based on MIME type
 * - Responsive layout (grid on desktop, list on mobile)
 *
 * STATE MANAGEMENT:
 * - files: current directory contents
 * - currentFolder: ID of the folder being viewed (null = root)
 * - breadcrumbs: navigation trail from root to current folder
 * - stats: storage usage data
 * - uploading: tracks upload progress
 * - modal states: for create folder, rename, delete confirmation
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import {
  listFiles,
  uploadFile,
  createFolder,
  downloadFile,
  renameFile,
  deleteFile,
  getStorageStats,
  getBreadcrumbs,
} from '../api/files'

export default function FilesPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // ─── State ──────────────────────────────────────────
  const [files, setFiles] = useState([])
  const [currentFolder, setCurrentFolder] = useState(null)
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  // Modal state
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renameTarget, setRenameTarget] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [error, setError] = useState('')
  const [actionMenu, setActionMenu] = useState(null)

  // ─── Data Loading ───────────────────────────────────
  const loadFiles = useCallback(async () => {
    try {
      const [filesRes, statsRes] = await Promise.all([
        listFiles(currentFolder),
        getStorageStats(),
      ])
      setFiles(filesRes.data)
      setStats(statsRes.data)
    } catch {
      setError('Failed to load files')
    } finally {
      setLoading(false)
    }
  }, [currentFolder])

  const loadBreadcrumbs = useCallback(async () => {
    if (currentFolder) {
      try {
        const res = await getBreadcrumbs(currentFolder)
        setBreadcrumbs(res.data)
      } catch {
        setBreadcrumbs([])
      }
    } else {
      setBreadcrumbs([])
    }
  }, [currentFolder])

  useEffect(() => {
    setLoading(true)
    loadFiles()
    loadBreadcrumbs()
  }, [loadFiles, loadBreadcrumbs])

  // Close action menu when clicking outside
  useEffect(() => {
    const handler = () => setActionMenu(null)
    if (actionMenu !== null) document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [actionMenu])

  // ─── Handlers ───────────────────────────────────────
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navigateToFolder = (folderId) => {
    setCurrentFolder(folderId)
    setActionMenu(null)
  }

  const handleUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    setUploadProgress(0)
    setError('')

    try {
      for (let i = 0; i < fileList.length; i++) {
        await uploadFile(fileList[i], currentFolder, (progress) => {
          // Weight progress across all files
          const base = (i / fileList.length) * 100
          const fileWeight = (1 / fileList.length) * progress
          setUploadProgress(Math.round(base + fileWeight))
        })
      }
      await loadFiles()
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    setError('')

    try {
      await createFolder(newFolderName.trim(), currentFolder)
      setShowNewFolder(false)
      setNewFolderName('')
      await loadFiles()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create folder')
    }
  }

  const handleRename = async (e) => {
    e.preventDefault()
    if (!renameValue.trim() || !renameTarget) return
    setError('')

    try {
      await renameFile(renameTarget.id, renameValue.trim())
      setRenameTarget(null)
      setRenameValue('')
      await loadFiles()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to rename')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setError('')

    try {
      await deleteFile(deleteTarget.id)
      setDeleteTarget(null)
      await loadFiles()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete')
    }
  }

  const handleDownload = async (file) => {
    try {
      await downloadFile(file.id, file.name)
    } catch {
      setError('Failed to download file')
    }
  }

  // ─── Drag & Drop ───────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files)
  }

  // ─── Helpers ────────────────────────────────────────
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const usagePercent = stats
    ? Math.min(100, Math.round((stats.used_bytes / stats.quota_bytes) * 100))
    : 0

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Background effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-accent-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Drag overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 bg-surface-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="border-2 border-dashed border-brand-400 rounded-3xl p-16 text-center" style={{ animation: 'drop-zone-pulse 1.5s ease-in-out infinite' }}>
            <svg className="w-16 h-16 text-brand-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-xl font-semibold text-white">Drop files here to upload</p>
            <p className="text-slate-400 mt-2">Files will be added to the current folder</p>
          </div>
        </div>
      )}

      {/* Nav bar */}
      <nav className="relative z-10 border-b border-surface-600/50 bg-surface-800/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-accent-400 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
              </svg>
            </div>
            <span className="font-semibold text-white">Personalized Cloud</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-surface-700/50 transition-all"
            >
              Dashboard
            </Link>
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
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8 animate-fade-in">
        {/* Header with breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm mb-2">
              <button
                onClick={() => navigateToFolder(null)}
                className={`hover:text-white transition-colors cursor-pointer ${currentFolder === null ? 'text-white font-medium' : 'text-slate-400'}`}
              >
                My Files
              </button>
              {breadcrumbs.map((crumb) => (
                <span key={crumb.id} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                  <button
                    onClick={() => navigateToFolder(crumb.id)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {crumb.name}
                  </button>
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-bold text-white">
              {breadcrumbs.length > 0
                ? breadcrumbs[breadcrumbs.length - 1].name
                : 'My Files'}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewFolder(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-surface-700/50 border border-surface-600/50 hover:bg-surface-700 hover:text-white transition-all cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
              </svg>
              New Folder
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg shadow-brand-600/25 cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>
        </div>

        {/* Upload progress bar */}
        {uploading && (
          <div className="mb-6 bg-surface-800/80 rounded-xl p-4 border border-surface-600/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Uploading files...</span>
              <span className="text-sm font-medium text-brand-400">{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Storage stats bar */}
        {stats && (
          <div className="mb-6 bg-surface-800/80 backdrop-blur-xl border border-surface-600/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">
                {formatSize(stats.used_bytes)} of {formatSize(stats.quota_bytes)} used
              </span>
              <span className="text-sm text-slate-500">
                {stats.file_count} files · {stats.folder_count} folders
              </span>
            </div>
            <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usagePercent > 90
                    ? 'bg-gradient-to-r from-danger to-red-400'
                    : usagePercent > 70
                      ? 'bg-gradient-to-r from-warning to-amber-400'
                      : 'bg-gradient-to-r from-brand-500 to-accent-400'
                }`}
                style={{ width: `${Math.max(usagePercent, 1)}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-danger text-sm">{error}</span>
            <button onClick={() => setError('')} className="text-danger/60 hover:text-danger cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Files list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-surface-800/50" style={{ background: 'linear-gradient(90deg, rgba(26,34,53,0.5) 25%, rgba(36,48,68,0.5) 50%, rgba(26,34,53,0.5) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : files.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-surface-800/80 border border-surface-600/50 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {currentFolder ? 'This folder is empty' : 'No files yet'}
            </h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              {currentFolder
                ? 'Upload files or create subfolders to organize your content.'
                : 'Upload your first file or create a folder to get started with your personal cloud.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowNewFolder(true)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-surface-700/50 border border-surface-600/50 hover:bg-surface-700 transition-all cursor-pointer"
              >
                Create Folder
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg shadow-brand-600/25 cursor-pointer"
              >
                Upload File
              </button>
            </div>
          </div>
        ) : (
          /* File grid */
          <div className="space-y-1">
            {files.map((file) => (
              <div
                key={file.id}
                className="group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-surface-800/80 transition-all cursor-pointer relative"
                onClick={() => file.is_folder ? navigateToFolder(file.id) : null}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  file.is_folder
                    ? 'bg-brand-500/15 text-brand-400'
                    : getFileColor(file.mime_type)
                }`}>
                  {file.is_folder ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                    </svg>
                  ) : (
                    <FileTypeIcon mimeType={file.mime_type} />
                  )}
                </div>

                {/* Name and info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {file.is_folder ? 'Folder' : formatSize(file.size_bytes)}
                    {' · '}
                    {formatDate(file.updated_at)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!file.is_folder && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(file) }}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-700/50 transition-all cursor-pointer"
                      title="Download"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setRenameTarget(file)
                      setRenameValue(file.name)
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-700/50 transition-all cursor-pointer"
                    title="Rename"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(file) }}
                    className="p-2 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-all cursor-pointer"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ═══ Modals ═══════════════════════════════════ */}

      {/* New Folder Modal */}
      {showNewFolder && (
        <Modal onClose={() => setShowNewFolder(false)}>
          <h3 className="text-lg font-semibold text-white mb-4">Create New Folder</h3>
          <form onSubmit={handleCreateFolder}>
            <input
              autoFocus
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-4 py-3 rounded-xl bg-surface-700/50 border border-surface-600/50 text-white placeholder-slate-500 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowNewFolder(false)}
                className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 transition-all cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <Modal onClose={() => setRenameTarget(null)}>
          <h3 className="text-lg font-semibold text-white mb-4">
            Rename {renameTarget.is_folder ? 'Folder' : 'File'}
          </h3>
          <form onSubmit={handleRename}>
            <input
              autoFocus
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="New name"
              className="w-full px-4 py-3 rounded-xl bg-surface-700/50 border border-surface-600/50 text-white placeholder-slate-500 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 transition-all cursor-pointer"
              >
                Rename
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)}>
          <h3 className="text-lg font-semibold text-white mb-2">Delete {deleteTarget.is_folder ? 'Folder' : 'File'}</h3>
          <p className="text-slate-400 text-sm mb-6">
            Are you sure you want to delete <span className="text-white font-medium">"{deleteTarget.name}"</span>?
            {deleteTarget.is_folder && ' All files inside this folder will also be deleted.'}
            {' '}This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-danger hover:bg-red-600 transition-all cursor-pointer"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════

/** Reusable modal overlay */
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-surface-800 border border-surface-600/50 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

/** File type icon based on MIME type */
function FileTypeIcon({ mimeType }) {
  if (!mimeType) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    )
  }

  // Image files
  if (mimeType.startsWith('image/')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
      </svg>
    )
  }

  // Video files
  if (mimeType.startsWith('video/')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    )
  }

  // PDF
  if (mimeType === 'application/pdf') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    )
  }

  // Code / text
  if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('javascript')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
      </svg>
    )
  }

  // Archive
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar') || mimeType.includes('compressed')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    )
  }

  // Default file icon
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

/** Returns Tailwind classes for file type coloring */
function getFileColor(mimeType) {
  if (!mimeType) return 'bg-slate-500/15 text-slate-400'
  if (mimeType.startsWith('image/')) return 'bg-purple-500/15 text-purple-400'
  if (mimeType.startsWith('video/')) return 'bg-pink-500/15 text-pink-400'
  if (mimeType === 'application/pdf') return 'bg-red-500/15 text-red-400'
  if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('javascript')) return 'bg-emerald-500/15 text-emerald-400'
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('compressed')) return 'bg-amber-500/15 text-amber-400'
  return 'bg-slate-500/15 text-slate-400'
}
