/**
 * Files API Client
 * ================
 * Wrapper functions for all file/folder API endpoints.
 *
 * Uses the shared Axios instance from client.js, which automatically
 * attaches the JWT token to every request.
 *
 * WHY A SEPARATE FILE?
 * Keeps API calls organized by feature. Components import these
 * functions instead of constructing URLs and headers themselves.
 */

import api from './client'

/**
 * List files and folders in a directory.
 * @param {number|null} parentId - Folder ID (null = root)
 */
export function listFiles(parentId = null) {
  const params = parentId !== null ? { parent_id: parentId } : {}
  return api.get('/api/files/', { params })
}

/**
 * Upload a file.
 * @param {File} file - The browser File object
 * @param {number|null} parentId - Folder to upload into (null = root)
 * @param {function} onProgress - Progress callback (0-100)
 */
export function uploadFile(file, parentId = null, onProgress = null) {
  const formData = new FormData()
  formData.append('file', file)
  if (parentId !== null) {
    formData.append('parent_id', parentId)
  }

  return api.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  })
}

/**
 * Create a new folder.
 * @param {string} name - Folder name
 * @param {number|null} parentId - Parent folder (null = root)
 */
export function createFolder(name, parentId = null) {
  return api.post('/api/files/folder', { name, parent_id: parentId })
}

/**
 * Download a file (triggers browser download).
 * @param {number} fileId - File ID
 * @param {string} fileName - Original filename for the download
 */
export async function downloadFile(fileId, fileName) {
  const response = await api.get(`/api/files/${fileId}/download`, {
    responseType: 'blob',
  })

  // Create a temporary link to trigger the browser's download dialog
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

/**
 * Get file/folder metadata.
 * @param {number} fileId
 */
export function getFileMetadata(fileId) {
  return api.get(`/api/files/${fileId}`)
}

/**
 * Rename a file or folder.
 * @param {number} fileId
 * @param {string} newName
 */
export function renameFile(fileId, newName) {
  return api.put(`/api/files/${fileId}/rename`, { name: newName })
}

/**
 * Move a file or folder.
 * @param {number} fileId
 * @param {number|null} newParentId - Destination folder (null = root)
 */
export function moveFile(fileId, newParentId) {
  return api.put(`/api/files/${fileId}/move`, { parent_id: newParentId })
}

/**
 * Delete a file or folder.
 * @param {number} fileId
 */
export function deleteFile(fileId) {
  return api.delete(`/api/files/${fileId}`)
}

/**
 * Get storage usage stats.
 */
export function getStorageStats() {
  return api.get('/api/files/stats')
}

/**
 * Get breadcrumb trail for a folder.
 * @param {number} folderId
 */
export function getBreadcrumbs(folderId) {
  return api.get(`/api/files/${folderId}/breadcrumbs`)
}
