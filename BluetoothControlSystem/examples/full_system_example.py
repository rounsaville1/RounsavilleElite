"""
Full System Example
Demonstrates complete Bluetooth control system usage
"""

import asyncio
from sys import path
path.insert(0, '../src')

from bluetooth_manager import BluetoothManager
from transitional_control import TransitionalController, EasingType
from automation_engine import AutomationEngine, TriggerType
from web_server import WebServer


async def example_basic_control():
    """Example: Basic device control"""
    print("\n=== Basic Device Control ===\n")

    manager = BluetoothManager()
    await manager.start()

    # Scan for devices
    print("Scanning for devices...")
    devices = await manager.scan(duration=5)

    print(f"\nFound {len(devices)} devices:")
    for device in devices:
        print(f"  - {device.name} ({device.address})")
        print(f"    Type: {device.device_type.value}, RSSI: {device.rssi} dBm")

    if devices:
        # Connect to first device
        device = devices[0]
        print(f"\nConnecting to {device.name}...")
        success = await manager.connect(device.address)

        if success:
            print("✅ Connected!")

            # Set property
            device.metadata['volume'] = 75
            print(f"Set volume to {device.metadata['volume']}")

            # Wait a bit
            await asyncio.sleep(2)

            # Disconnect
            await manager.disconnect(device.address)
            print("Disconnected")

    await manager.stop()


async def example_smooth_transitions():
    """Example: Smooth transitional control"""
    print("\n=== Smooth Transitions ===\n")

    manager = BluetoothManager()
    controller = TransitionalController(manager, frame_rate=60)

    await manager.start()
    await controller.start()

    # Scan and connect
    devices = await manager.scan(duration=5)
    if not devices:
        print("No devices found")
        return

    device = devices[0]
    await manager.connect(device.address)

    if manager.is_connected(device.address):
        print(f"Connected to {device.name}\n")

        # Example 1: Smooth fade in
        print("1️⃣  Fade in volume (0 → 100) over 3 seconds...")
        await controller.fade_in(
            device.address,
            property_name="volume",
            target=100,
            duration=3.0
        )
        await asyncio.sleep(3.5)

        # Example 2: Fade out with different easing
        print("2️⃣  Fade out (100 → 0) over 2 seconds...")
        await controller.fade_out(
            device.address,
            property_name="volume",
            duration=2.0
        )
        await asyncio.sleep(2.5)

        # Example 3: Pulse effect
        print("3️⃣  Pulse effect (30 ↔ 80) 3 times...")
        await controller.pulse(
            device.address,
            property_name="volume",
            min_value=30,
            max_value=80,
            duration=1.0,
            cycles=3
        )
        await asyncio.sleep(6.5)

        # Example 4: Custom transition with easing
        print("4️⃣  Custom transition with elastic easing...")
        await controller.transition(
            device_address=device.address,
            property_name="volume",
            from_value=0,
            to_value=100,
            duration=2.5,
            easing=EasingType.ELASTIC
        )
        await asyncio.sleep(3)

        await manager.disconnect(device.address)

    await controller.stop()
    await manager.stop()


async def example_automation():
    """Example: Automation and scenes"""
    print("\n=== Automation & Scenes ===\n")

    manager = BluetoothManager()
    controller = TransitionalController(manager)
    engine = AutomationEngine(manager, controller)

    await manager.start()
    await controller.start()
    await engine.start()

    # Scan and connect to devices
    devices = await manager.scan(duration=5)
    if len(devices) < 2:
        print("Need at least 2 devices for this example")
        return

    device1, device2 = devices[0], devices[1]
    await manager.connect(device1.address)
    await manager.connect(device2.address)

    if manager.is_connected(device1.address) and manager.is_connected(device2.address):
        print(f"Connected to {device1.name} and {device2.name}\n")

        # Example 1: Create a scene
        print("1️⃣  Creating 'Movie Time' scene...")
        scene_id = engine.create_scene(
            name="Movie Time",
            device_states={
                device1.address: {"volume": 80, "mode": "theater"},
                device2.address: {"brightness": 30, "color": "warm"}
            },
            icon="🎬"
        )
        print(f"   Scene created: {scene_id}")

        # Example 2: Activate scene
        print("\n2️⃣  Activating 'Movie Time' scene...")
        await engine.activate_scene(scene_id, transition_duration=2.0)
        await asyncio.sleep(3)

        # Example 3: Create time-based automation
        print("\n3️⃣  Creating morning automation...")
        rule_id = engine.add_rule(
            name="Morning Lights",
            trigger_type=TriggerType.TIME,
            trigger_value="08:00",
            actions=[
                {
                    "device": device2.address,
                    "property": "brightness",
                    "value": 100,
                    "transition": {"duration": 30, "easing": "ease-in"}
                }
            ]
        )
        print(f"   Rule created: {rule_id}")
        print("   This will turn on lights at 8:00 AM")

        # Example 4: Create interval-based automation
        print("\n4️⃣  Creating pulse effect automation...")
        engine.add_rule(
            name="Periodic Pulse",
            trigger_type=TriggerType.INTERVAL,
            trigger_value=10,  # Every 10 seconds
            actions=[
                {
                    "device": device1.address,
                    "property": "volume",
                    "value": 90,
                    "transition": {"duration": 1}
                }
            ]
        )

        # Example 5: Manually trigger a rule
        print("\n5️⃣  Manually triggering morning automation...")
        await engine.trigger_rule(rule_id)
        await asyncio.sleep(2)

        # Save configuration
        print("\n6️⃣  Saving configuration...")
        engine.save_config("automation_config.json")
        print("   Configuration saved to automation_config.json")

    await engine.stop()
    await controller.stop()
    await manager.stop()


async def example_full_system():
    """Example: Complete system with web server"""
    print("\n=== Full System with Web Dashboard ===\n")

    # Create all components
    manager = BluetoothManager(scan_interval=30)
    controller = TransitionalController(manager, frame_rate=60)
    engine = AutomationEngine(manager, controller)
    server = WebServer(manager, controller, engine, port=8080)

    # Start everything
    print("Starting Bluetooth Control System...")
    await manager.start()
    await controller.start()
    await engine.start()
    await server.start()

    print("\n✅ System started successfully!\n")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("  Dashboard: http://localhost:8080/index.html")
    print("  API:       http://localhost:8080/api/status")
    print("  WebSocket: ws://localhost:8081")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("\nPress Ctrl+C to stop\n")

    # Run forever
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")

    # Cleanup
    await engine.stop()
    await controller.stop()
    await manager.stop()
    print("Goodbye! 👋")


async def example_sequence_control():
    """Example: Sequential and parallel transitions"""
    print("\n=== Sequential & Parallel Control ===\n")

    manager = BluetoothManager()
    controller = TransitionalController(manager)

    await manager.start()
    await controller.start()

    devices = await manager.scan(duration=5)
    if len(devices) < 2:
        print("Need at least 2 devices")
        return

    device1, device2 = devices[0], devices[1]
    await manager.connect(device1.address)
    await manager.connect(device2.address)

    if manager.is_connected(device1.address) and manager.is_connected(device2.address):
        print(f"Using {device1.name} and {device2.name}\n")

        # Example 1: Sequential transitions
        print("1️⃣  Sequential: Fade device1, then device2...")
        await controller.transition_sequence(
            device_address=device1.address,
            sequence=[
                {"property": "volume", "to": 100, "duration": 1.5},
                {"property": "volume", "to": 50, "duration": 1.0},
                {"property": "volume", "to": 75, "duration": 1.0}
            ]
        )
        print("   Device1 sequence complete")

        # Example 2: Parallel transitions
        print("\n2️⃣  Parallel: Fade both devices simultaneously...")
        await controller.transition_parallel([
            {
                "device": device1.address,
                "property": "volume",
                "to": 100,
                "duration": 2.0,
                "easing": "ease-in-out"
            },
            {
                "device": device2.address,
                "property": "brightness",
                "to": 80,
                "duration": 2.0,
                "easing": "ease-in-out"
            }
        ])
        print("   Both devices transitioned")

    await controller.stop()
    await manager.stop()


if __name__ == "__main__":
    print("╔════════════════════════════════════════════╗")
    print("║  Bluetooth Control System - Examples      ║")
    print("╚════════════════════════════════════════════╝")

    # Choose which example to run
    examples = {
        "1": ("Basic Control", example_basic_control),
        "2": ("Smooth Transitions", example_smooth_transitions),
        "3": ("Automation & Scenes", example_automation),
        "4": ("Sequential & Parallel", example_sequence_control),
        "5": ("Full System", example_full_system),
    }

    print("\nAvailable examples:")
    for key, (name, _) in examples.items():
        print(f"  {key}. {name}")

    choice = input("\nSelect example (1-5): ").strip()

    if choice in examples:
        _, example_func = examples[choice]
        asyncio.run(example_func())
    else:
        print("Invalid choice")
