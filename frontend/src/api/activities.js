/**
 * Activities API Client
 * =====================
 * Wrapper functions for the Activity audit trail API endpoints.
 *
 * Uses the shared Axios instance from client.js, which automatically
 * attaches the JWT token to every request.
 */

import api from './client'

/**
 * List the current user's activities (paginated, filterable).
 * @param {object} params
 * @param {number} [params.limit=20]  - Max records per page (1–100)
 * @param {number} [params.offset=0]  - Records to skip
 * @param {string|null} [params.action=null] - Filter by action type
 */
export function listActivities({ limit = 20, offset = 0, action = null } = {}) {
  const params = { limit, offset }
  if (action) params.action = action
  return api.get('/api/activities/', { params })
}

/**
 * Get activity summary (counts grouped by action type).
 */
export function getActivitySummary() {
  return api.get('/api/activities/summary')
}
