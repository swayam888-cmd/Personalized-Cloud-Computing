/**
 * Users API Client
 * ================
 * Wrapper functions for user profile and security endpoints.
 *
 * Uses the shared Axios instance from client.js, which automatically
 * attaches the JWT token to every request.
 */

import api from './client'

/**
 * Get current authenticated user profile.
 */
export function getCurrentUser() {
  return api.get('/api/users/me')
}

/**
 * Update current user profile (username, email).
 * @param {object} data - { username?: string, email?: string }
 */
export function updateProfile(data) {
  return api.put('/api/users/me', data)
}

/**
 * Change current user password.
 * @param {object} data - { current_password: string, new_password: string }
 */
export function changePassword(data) {
  return api.post('/api/users/change-password', data)
}
