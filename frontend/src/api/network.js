/**
 * Network API Module
 * ==================
 * Fetches server network information from the backend.
 *
 * SPRINT 5 — LAN DEPLOYMENT:
 * The /api/network/info endpoint is PUBLIC (no auth required) because
 * new devices connecting for the first time need to discover the server
 * before they can authenticate.
 *
 * This module is used by the NetworkStatusWidget to display:
 * - Server hostname and LAN IP
 * - Whether LAN mode is active
 * - Access URLs for other devices
 */

import api from './client'

/**
 * Get server network information.
 *
 * Returns:
 *   {
 *     hostname: "swayams-macbook",
 *     platform: "Darwin",
 *     lan_mode: true/false,
 *     server_host: "0.0.0.0" or "127.0.0.1",
 *     server_port: 8000,
 *     lan_ip: "192.168.1.42",
 *     lan_accessible: true/false,
 *     local_url: "http://localhost:8000",
 *     lan_url: "http://192.168.1.42:8000" or null,
 *     frontend_lan_url: "http://192.168.1.42:5173" or null,
 *     timestamp: "2026-10-03T12:00:00+00:00"
 *   }
 */
export function getNetworkInfo() {
  return api.get('/api/network/info')
}
