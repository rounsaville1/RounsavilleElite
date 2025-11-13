"""
Bluetooth Device Manager
Handles device discovery, connection, and control operations
"""

import asyncio
import logging
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

try:
    from bleak import BleakScanner, BleakClient
    from bleak.backends.device import BLEDevice
    BLEAK_AVAILABLE = True
except ImportError:
    BLEAK_AVAILABLE = False
    print("Warning: bleak not installed. Install with: pip install bleak")


class DeviceType(Enum):
    """Bluetooth device categories"""
    AUDIO = "audio"
    LIGHT = "light"
    SENSOR = "sensor"
    INPUT = "input"
    WEARABLE = "wearable"
    UNKNOWN = "unknown"


class ConnectionState(Enum):
    """Device connection states"""
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    RECONNECTING = "reconnecting"
    ERROR = "error"


@dataclass
class BluetoothDevice:
    """Represents a Bluetooth device"""
    address: str
    name: Optional[str] = None
    device_type: DeviceType = DeviceType.UNKNOWN
    rssi: int = 0  # Signal strength
    battery_level: Optional[int] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    services: List[str] = field(default_factory=list)
    characteristics: Dict[str, Any] = field(default_factory=dict)
    state: ConnectionState = ConnectionState.DISCONNECTED
    last_seen: datetime = field(default_factory=datetime.now)
    connection_attempts: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "address": self.address,
            "name": self.name,
            "device_type": self.device_type.value,
            "rssi": self.rssi,
            "battery_level": self.battery_level,
            "manufacturer": self.manufacturer,
            "model": self.model,
            "services": self.services,
            "state": self.state.value,
            "last_seen": self.last_seen.isoformat(),
            "connection_attempts": self.connection_attempts,
            "metadata": self.metadata
        }


class BluetoothManager:
    """
    Core Bluetooth management system

    Features:
    - Device discovery and scanning
    - Connection management
    - State tracking
    - Event callbacks
    - Auto-reconnection
    """

    def __init__(
        self,
        scan_interval: int = 30,
        auto_reconnect: bool = True,
        connection_timeout: int = 10,
        max_devices: int = 50
    ):
        self.scan_interval = scan_interval
        self.auto_reconnect = auto_reconnect
        self.connection_timeout = connection_timeout
        self.max_devices = max_devices

        # Device storage
        self.devices: Dict[str, BluetoothDevice] = {}
        self.connected_clients: Dict[str, BleakClient] = {}

        # Event callbacks
        self.callbacks: Dict[str, List[Callable]] = {
            "device_discovered": [],
            "device_connected": [],
            "device_disconnected": [],
            "device_updated": [],
            "scan_complete": [],
            "error": []
        }

        # State
        self.scanning = False
        self.scan_task = None

        # Logging
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO)

        # Whitelist/Blacklist
        self.whitelist: Optional[List[str]] = None
        self.blacklist: List[str] = []

    async def start(self):
        """Start the Bluetooth manager"""
        self.logger.info("Starting Bluetooth Manager...")

        if not BLEAK_AVAILABLE:
            self.logger.error("Bleak library not available!")
            return False

        # Start continuous scanning if enabled
        if self.scan_interval > 0:
            self.scan_task = asyncio.create_task(self._continuous_scan())

        self.logger.info("Bluetooth Manager started")
        return True

    async def stop(self):
        """Stop the Bluetooth manager"""
        self.logger.info("Stopping Bluetooth Manager...")

        # Stop scanning
        if self.scan_task:
            self.scan_task.cancel()
            try:
                await self.scan_task
            except asyncio.CancelledError:
                pass

        # Disconnect all devices
        for address in list(self.connected_clients.keys()):
            await self.disconnect(address)

        self.logger.info("Bluetooth Manager stopped")

    async def scan(self, duration: float = 10.0) -> List[BluetoothDevice]:
        """
        Scan for nearby Bluetooth devices

        Args:
            duration: How long to scan in seconds

        Returns:
            List of discovered devices
        """
        self.logger.info(f"Scanning for Bluetooth devices ({duration}s)...")
        self.scanning = True

        discovered = []

        try:
            devices = await BleakScanner.discover(timeout=duration)

            for device in devices:
                # Check whitelist/blacklist
                if self.whitelist and device.address not in self.whitelist:
                    continue
                if device.address in self.blacklist:
                    continue

                # Create or update device
                bt_device = self._process_discovered_device(device)
                discovered.append(bt_device)

                # Trigger callback
                await self._trigger_event("device_discovered", bt_device)

        except Exception as e:
            self.logger.error(f"Scan error: {e}")
            await self._trigger_event("error", {"type": "scan_error", "error": str(e)})

        self.scanning = False
        await self._trigger_event("scan_complete", {"count": len(discovered)})

        self.logger.info(f"Scan complete: found {len(discovered)} devices")
        return discovered

    def _process_discovered_device(self, ble_device: 'BLEDevice') -> BluetoothDevice:
        """Process a discovered BLE device"""
        address = ble_device.address

        if address in self.devices:
            # Update existing device
            device = self.devices[address]
            device.name = ble_device.name or device.name
            device.rssi = ble_device.rssi
            device.last_seen = datetime.now()
        else:
            # Create new device
            device = BluetoothDevice(
                address=address,
                name=ble_device.name,
                rssi=ble_device.rssi,
                device_type=self._detect_device_type(ble_device),
                last_seen=datetime.now()
            )

            # Limit total devices
            if len(self.devices) >= self.max_devices:
                # Remove oldest unseen device
                oldest = min(
                    self.devices.values(),
                    key=lambda d: d.last_seen if d.state == ConnectionState.DISCONNECTED else datetime.max
                )
                del self.devices[oldest.address]

            self.devices[address] = device

        return device

    def _detect_device_type(self, ble_device: 'BLEDevice') -> DeviceType:
        """Attempt to detect device type from metadata"""
        name = (ble_device.name or "").lower()

        if any(kw in name for kw in ["speaker", "headphone", "earbud", "audio", "soundbar"]):
            return DeviceType.AUDIO
        elif any(kw in name for kw in ["light", "bulb", "lamp", "hue", "lifx"]):
            return DeviceType.LIGHT
        elif any(kw in name for kw in ["sensor", "temp", "motion", "door", "window"]):
            return DeviceType.SENSOR
        elif any(kw in name for kw in ["keyboard", "mouse", "controller", "remote"]):
            return DeviceType.INPUT
        elif any(kw in name for kw in ["watch", "band", "fitness", "tracker"]):
            return DeviceType.WEARABLE

        return DeviceType.UNKNOWN

    async def connect(
        self,
        address: str,
        timeout: Optional[float] = None
    ) -> bool:
        """
        Connect to a Bluetooth device

        Args:
            address: Device MAC address
            timeout: Connection timeout in seconds

        Returns:
            True if connected successfully
        """
        if address not in self.devices:
            self.logger.error(f"Device {address} not found")
            return False

        device = self.devices[address]

        if address in self.connected_clients:
            self.logger.info(f"Already connected to {device.name}")
            return True

        self.logger.info(f"Connecting to {device.name} ({address})...")
        device.state = ConnectionState.CONNECTING
        device.connection_attempts += 1
        await self._trigger_event("device_updated", device)

        timeout = timeout or self.connection_timeout

        try:
            client = BleakClient(address, timeout=timeout)
            await client.connect()

            if client.is_connected:
                self.connected_clients[address] = client
                device.state = ConnectionState.CONNECTED

                # Discover services and characteristics
                await self._discover_services(address, client)

                # Check battery level
                device.battery_level = await self._read_battery_level(client)

                await self._trigger_event("device_connected", device)
                await self._trigger_event("device_updated", device)

                self.logger.info(f"Connected to {device.name}")
                return True
            else:
                device.state = ConnectionState.ERROR
                await self._trigger_event("device_updated", device)
                return False

        except Exception as e:
            self.logger.error(f"Connection error: {e}")
            device.state = ConnectionState.ERROR
            await self._trigger_event("error", {
                "type": "connection_error",
                "device": address,
                "error": str(e)
            })
            await self._trigger_event("device_updated", device)
            return False

    async def disconnect(self, address: str) -> bool:
        """
        Disconnect from a Bluetooth device

        Args:
            address: Device MAC address

        Returns:
            True if disconnected successfully
        """
        if address not in self.connected_clients:
            self.logger.warning(f"Not connected to {address}")
            return False

        device = self.devices.get(address)
        client = self.connected_clients[address]

        self.logger.info(f"Disconnecting from {device.name if device else address}...")

        try:
            await client.disconnect()
            del self.connected_clients[address]

            if device:
                device.state = ConnectionState.DISCONNECTED
                await self._trigger_event("device_disconnected", device)
                await self._trigger_event("device_updated", device)

            self.logger.info(f"Disconnected from {device.name if device else address}")
            return True

        except Exception as e:
            self.logger.error(f"Disconnect error: {e}")
            return False

    async def _discover_services(self, address: str, client: BleakClient):
        """Discover device services and characteristics"""
        device = self.devices[address]

        try:
            services = await client.get_services()

            device.services = [str(service.uuid) for service in services]

            # Store characteristics
            for service in services:
                for char in service.characteristics:
                    device.characteristics[str(char.uuid)] = {
                        "properties": char.properties,
                        "descriptors": [str(d.uuid) for d in char.descriptors]
                    }

            self.logger.info(f"Discovered {len(device.services)} services for {device.name}")

        except Exception as e:
            self.logger.error(f"Service discovery error: {e}")

    async def _read_battery_level(self, client: BleakClient) -> Optional[int]:
        """Read battery level if available"""
        BATTERY_LEVEL_UUID = "00002a19-0000-1000-8000-00805f9b34fb"

        try:
            value = await client.read_gatt_char(BATTERY_LEVEL_UUID)
            return int(value[0]) if value else None
        except:
            return None

    async def read_characteristic(
        self,
        address: str,
        characteristic_uuid: str
    ) -> Optional[bytes]:
        """
        Read a characteristic value

        Args:
            address: Device MAC address
            characteristic_uuid: UUID of characteristic to read

        Returns:
            Bytes value or None
        """
        if address not in self.connected_clients:
            self.logger.error(f"Not connected to {address}")
            return None

        client = self.connected_clients[address]

        try:
            value = await client.read_gatt_char(characteristic_uuid)
            return value
        except Exception as e:
            self.logger.error(f"Read error: {e}")
            return None

    async def write_characteristic(
        self,
        address: str,
        characteristic_uuid: str,
        value: bytes
    ) -> bool:
        """
        Write a characteristic value

        Args:
            address: Device MAC address
            characteristic_uuid: UUID of characteristic to write
            value: Bytes to write

        Returns:
            True if successful
        """
        if address not in self.connected_clients:
            self.logger.error(f"Not connected to {address}")
            return False

        client = self.connected_clients[address]

        try:
            await client.write_gatt_char(characteristic_uuid, value)
            return True
        except Exception as e:
            self.logger.error(f"Write error: {e}")
            return False

    def is_connected(self, address: str) -> bool:
        """Check if device is connected"""
        return address in self.connected_clients

    def get_device(self, address: str) -> Optional[BluetoothDevice]:
        """Get device by address"""
        return self.devices.get(address)

    def get_all_devices(self) -> List[BluetoothDevice]:
        """Get all discovered devices"""
        return list(self.devices.values())

    def get_connected_devices(self) -> List[BluetoothDevice]:
        """Get all connected devices"""
        return [
            device for device in self.devices.values()
            if device.state == ConnectionState.CONNECTED
        ]

    def set_whitelist(self, addresses: List[str]):
        """Set device whitelist (only these can connect)"""
        self.whitelist = addresses
        self.logger.info(f"Whitelist set: {len(addresses)} devices")

    def set_blacklist(self, addresses: List[str]):
        """Set device blacklist (these cannot connect)"""
        self.blacklist = addresses
        self.logger.info(f"Blacklist set: {len(addresses)} devices")

    def on(self, event: str, callback: Callable):
        """
        Register event callback

        Events:
        - device_discovered
        - device_connected
        - device_disconnected
        - device_updated
        - scan_complete
        - error
        """
        if event in self.callbacks:
            self.callbacks[event].append(callback)

    async def _trigger_event(self, event: str, data: Any):
        """Trigger event callbacks"""
        if event in self.callbacks:
            for callback in self.callbacks[event]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(data)
                    else:
                        callback(data)
                except Exception as e:
                    self.logger.error(f"Callback error: {e}")

    async def _continuous_scan(self):
        """Continuously scan for devices at intervals"""
        self.logger.info(f"Starting continuous scan (interval: {self.scan_interval}s)")

        while True:
            try:
                await self.scan(duration=5.0)
                await asyncio.sleep(self.scan_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Continuous scan error: {e}")
                await asyncio.sleep(self.scan_interval)


# Example usage
if __name__ == "__main__":
    async def main():
        manager = BluetoothManager(scan_interval=30)

        # Register callbacks
        manager.on("device_discovered", lambda device: print(f"Discovered: {device.name}"))
        manager.on("device_connected", lambda device: print(f"Connected: {device.name}"))

        await manager.start()

        # Scan for devices
        devices = await manager.scan(duration=10)
        print(f"\nFound {len(devices)} devices:")
        for device in devices:
            print(f"  - {device.name} ({device.address}) - {device.device_type.value}")

        # Connect to first device
        if devices:
            success = await manager.connect(devices[0].address)
            if success:
                print(f"Connected to {devices[0].name}")

                # Keep running for a bit
                await asyncio.sleep(10)

                # Disconnect
                await manager.disconnect(devices[0].address)

        await manager.stop()

    asyncio.run(main())
