"""
Network Utilities
=================
Detects the host machine's LAN (Local Area Network) IP address.

WHY DO WE NEED THIS?
When the cloud platform runs in LAN mode, other devices on the same
Wi-Fi/Ethernet network need to know the server's IP to connect.
Instead of making the user manually look up their IP and configure it,
we detect it automatically.

HOW IT WORKS — The Socket Trick:
1. We create a UDP socket and "connect" it to an external IP (8.8.8.8)
2. We DON'T actually send any data — UDP connect() doesn't transmit
3. But the OS must pick a source address to route to that destination
4. That source address IS the machine's LAN IP (e.g., 192.168.1.42)
5. This works on macOS, Linux, and Windows — no external call needed

FALLBACK:
If the machine has no network (airplane mode, no Wi-Fi), we fall back
to 127.0.0.1 (localhost), which means the app still works locally.
"""

import socket
import platform
from datetime import datetime, timezone


def get_lan_ip() -> str:
    """
    Detect the machine's LAN IP address.

    Returns:
        A string like "192.168.1.42" or "10.0.0.5".
        Falls back to "127.0.0.1" if no LAN interface is found.
    """
    try:
        # Create a UDP socket — we won't actually send anything
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            # "Connect" to Google DNS — this makes the OS pick our LAN IP
            # No data is sent over the network
            sock.connect(("8.8.8.8", 80))
            lan_ip = sock.getsockname()[0]
        finally:
            sock.close()
        return lan_ip
    except (socket.error, OSError):
        # No network connection — fall back to localhost
        return "127.0.0.1"


def get_network_info(host: str, port: int, lan_mode: bool) -> dict:
    """
    Gather comprehensive network information about the server.

    Args:
        host: The host the server is bound to (e.g., "0.0.0.0" or "127.0.0.1")
        port: The port the server is running on (e.g., 8000)
        lan_mode: Whether LAN mode is enabled

    Returns:
        A dictionary with server network details for the /api/network/info endpoint.
    """
    lan_ip = get_lan_ip()
    hostname = socket.gethostname()
    is_lan_accessible = lan_mode and lan_ip != "127.0.0.1"

    info = {
        "hostname": hostname,
        "platform": platform.system(),
        "lan_mode": lan_mode,
        "server_host": host,
        "server_port": port,
        "lan_ip": lan_ip,
        "lan_accessible": is_lan_accessible,
        "local_url": f"http://localhost:{port}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    if is_lan_accessible:
        info["lan_url"] = f"http://{lan_ip}:{port}"
        info["frontend_lan_url"] = f"http://{lan_ip}:5173"
    else:
        info["lan_url"] = None
        info["frontend_lan_url"] = None

    return info
