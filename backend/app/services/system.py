"""
System Metrics Service
======================
Collects host and process-level telemetry using psutil.
Provides real-time health data for CPU, RAM, storage disk partition,
system uptime, and FastAPI server resource consumption.
"""

import os
import platform
import socket
import time
from datetime import datetime, timezone
from pathlib import Path

import psutil

from app.core.config import settings
from app.schemas.admin import (
    CPUInfo,
    MemoryInfo,
    DiskInfo,
    ProcessInfo,
    SystemMetricsResponse,
)


def get_system_metrics() -> SystemMetricsResponse:
    """
    Collect comprehensive real-time system and process telemetry.

    Returns:
        SystemMetricsResponse containing CPU, RAM, Disk, Uptime, and Process metrics.
    """
    now = datetime.now(timezone.utc)

    # ─── CPU Metrics ──────────────────────────────────────────
    # Non-blocking instantaneous CPU usage sample
    cpu_percent = psutil.cpu_percent(interval=None)
    cores_logical = psutil.cpu_count(logical=True) or 1
    cores_physical = psutil.cpu_count(logical=False) or cores_logical

    freq_mhz = None
    try:
        cpu_freq = psutil.cpu_freq()
        if cpu_freq and cpu_freq.current:
            freq_mhz = round(cpu_freq.current, 2)
    except Exception:
        freq_mhz = None

    cpu_info = CPUInfo(
        percent=float(cpu_percent),
        cores_logical=cores_logical,
        cores_physical=cores_physical,
        frequency_mhz=freq_mhz,
    )

    # ─── Memory (RAM) Metrics ─────────────────────────────────
    vmem = psutil.virtual_memory()
    memory_info = MemoryInfo(
        total_bytes=vmem.total,
        available_bytes=vmem.available,
        used_bytes=vmem.used,
        percent=float(vmem.percent),
    )

    # ─── Disk Storage Metrics ─────────────────────────────────
    # Measure the disk partition where the storage directory resides
    storage_path: Path = settings.resolved_storage_dir
    if not storage_path.exists():
        storage_path.mkdir(parents=True, exist_ok=True)

    disk = psutil.disk_usage(str(storage_path))
    disk_info = DiskInfo(
        total_bytes=disk.total,
        used_bytes=disk.used,
        free_bytes=disk.free,
        percent=float(disk.percent),
        path=str(storage_path),
    )

    # ─── Current Process Metrics ──────────────────────────────
    current_proc = psutil.Process(os.getpid())
    try:
        proc_mem = current_proc.memory_info().rss
    except Exception:
        proc_mem = 0

    try:
        proc_cpu = current_proc.cpu_percent(interval=None)
    except Exception:
        proc_cpu = 0.0

    try:
        proc_threads = current_proc.num_threads()
    except Exception:
        proc_threads = 1

    process_info = ProcessInfo(
        memory_rss_bytes=proc_mem,
        cpu_percent=float(proc_cpu),
        threads_count=proc_threads,
    )

    # ─── Host & Uptime ────────────────────────────────────────
    boot_timestamp = psutil.boot_time()
    boot_time = datetime.fromtimestamp(boot_timestamp, tz=timezone.utc)
    uptime_seconds = max(0, int(time.time() - boot_timestamp))

    hostname = socket.gethostname()
    os_name = platform.system()
    os_ver = platform.release()

    return SystemMetricsResponse(
        timestamp=now,
        platform=os_name,
        os_version=os_ver,
        hostname=hostname,
        boot_time=boot_time,
        uptime_seconds=uptime_seconds,
        cpu=cpu_info,
        memory=memory_info,
        disk=disk_info,
        process=process_info,
    )
