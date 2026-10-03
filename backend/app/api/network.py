"""
Network Information API
=======================
Provides server network details so clients know how to connect.

WHY WE NEED THIS:
When the cloud runs in LAN mode, devices on the network need to know:
1. What is the server's LAN IP? (so they can type it in a browser)
2. Is LAN mode actually active? (so the UI can show connection info)
3. What URLs should other devices use? (frontend and API URLs)

This endpoint is PUBLIC (no authentication required) because a new
device connecting for the first time won't have a JWT token yet —
it needs the server's network info before it can even show a login page.
"""

from fastapi import APIRouter

from app.core.config import settings
from app.core.network import get_network_info

router = APIRouter(prefix="/network", tags=["Network"])


@router.get("/info")
def network_info():
    """
    Get server network information.

    Returns the server's LAN IP, hostname, accessibility status,
    and URLs that other devices should use to connect.

    This endpoint is unauthenticated so that new devices
    can discover the server's network details.

    Example response (LAN mode enabled):
        {
            "hostname": "swayams-macbook",
            "platform": "Darwin",
            "lan_mode": true,
            "server_host": "0.0.0.0",
            "server_port": 8000,
            "lan_ip": "192.168.1.42",
            "lan_accessible": true,
            "local_url": "http://localhost:8000",
            "lan_url": "http://192.168.1.42:8000",
            "frontend_lan_url": "http://192.168.1.42:5173",
            "timestamp": "2026-10-03T12:00:00+00:00"
        }

    Example response (LAN mode disabled):
        {
            "hostname": "swayams-macbook",
            "platform": "Darwin",
            "lan_mode": false,
            "server_host": "127.0.0.1",
            "server_port": 8000,
            "lan_ip": "192.168.1.42",
            "lan_accessible": false,
            "local_url": "http://localhost:8000",
            "lan_url": null,
            "frontend_lan_url": null,
            "timestamp": "2026-10-03T12:00:00+00:00"
        }
    """
    return get_network_info(
        host=settings.HOST,
        port=settings.PORT,
        lan_mode=settings.LAN_MODE,
    )
