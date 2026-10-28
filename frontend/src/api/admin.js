/**
 * Admin API Module
 * ================
 * Client methods for administrator operations and telemetry:
 * - Real-time system hardware and process metrics
 * - User accounts list with storage usage aggregation
 * - Quota modifications
 * - Account activation / suspension
 * - Role elevation / demotion
 */

import api from './client'

/**
 * Fetch real-time system and process telemetry (CPU, RAM, Disk, Uptime).
 * Requires admin privileges.
 */
export function getSystemMetrics() {
  return api.get('/api/admin/metrics')
}

/**
 * Fetch all registered users enriched with storage consumption and totals.
 * Requires admin privileges.
 */
export function getAdminUsers() {
  return api.get('/api/admin/users')
}

/**
 * Update the storage quota in bytes for a specific user.
 *
 * @param {number} userId - Target user ID
 * @param {number} storageQuotaBytes - New quota in bytes
 */
export function updateUserQuota(userId, storageQuotaBytes) {
  return api.put(`/api/admin/users/${userId}/quota`, {
    storage_quota_bytes: storageQuotaBytes,
  })
}

/**
 * Activate or suspend a user account.
 *
 * @param {number} userId - Target user ID
 * @param {boolean} isActive - New status
 */
export function toggleUserStatus(userId, isActive) {
  return api.patch(`/api/admin/users/${userId}/status`, {
    is_active: isActive,
  })
}

/**
 * Elevate a user to 'admin' or demote to 'user'.
 *
 * @param {number} userId - Target user ID
 * @param {'user'|'admin'} role - Target role
 */
export function updateUserRole(userId, role) {
  return api.patch(`/api/admin/users/${userId}/role`, {
    role,
  })
}
