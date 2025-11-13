"""
Web Server for Bluetooth Control System
Provides REST API and WebSocket interface for dashboard
"""

import asyncio
import json
import logging
from typing import Dict, Set
from datetime import datetime
from aiohttp import web
import aiohttp
from bluetooth_manager import BluetoothManager
from transitional_control import TransitionalController, EasingType
from automation_engine import AutomationEngine, TriggerType


class WebServer:
    """
    Web server for Bluetooth Control System

    Features:
    - REST API for device control
    - WebSocket for real-time updates
    - Static file serving for dashboard
    - Event broadcasting
    """

    def __init__(
        self,
        bluetooth_manager: BluetoothManager,
        transitional_controller: TransitionalController,
        automation_engine: AutomationEngine,
        host: str = "0.0.0.0",
        port: int = 8080,
        ws_port: int = 8081
    ):
        self.bluetooth_manager = bluetooth_manager
        self.transitional_controller = transitional_controller
        self.automation_engine = automation_engine

        self.host = host
        self.port = port
        self.ws_port = ws_port

        # WebSocket connections
        self.websockets: Set[web.WebSocketResponse] = set()

        # Web app
        self.app = web.Application()
        self.setup_routes()

        self.logger = logging.getLogger(__name__)

    def setup_routes(self):
        """Setup HTTP routes"""
        # API routes
        self.app.router.add_get('/api/status', self.handle_status)
        self.app.router.add_get('/api/devices', self.handle_get_devices)
        self.app.router.add_get('/api/scenes', self.handle_get_scenes)
        self.app.router.add_get('/api/rules', self.handle_get_rules)

        self.app.router.add_post('/api/scan', self.handle_scan)
        self.app.router.add_post('/api/connect', self.handle_connect)
        self.app.router.add_post('/api/disconnect', self.handle_disconnect)
        self.app.router.add_post('/api/set_property', self.handle_set_property)
        self.app.router.add_post('/api/transition', self.handle_transition)
        self.app.router.add_post('/api/activate_scene', self.handle_activate_scene)
        self.app.router.add_post('/api/toggle_rule', self.handle_toggle_rule)

        # WebSocket
        self.app.router.add_get('/ws', self.handle_websocket)

        # Static files
        self.app.router.add_static('/', path='dashboard/', name='static')

    async def start(self):
        """Start web server"""
        # Register event handlers
        self.bluetooth_manager.on("device_discovered", self.on_device_discovered)
        self.bluetooth_manager.on("device_connected", self.on_device_connected)
        self.bluetooth_manager.on("device_disconnected", self.on_device_disconnected)
        self.bluetooth_manager.on("device_updated", self.on_device_updated)

        self.transitional_controller.on("transition_update", self.on_transition_update)
        self.transitional_controller.on("transition_complete", self.on_transition_complete)

        self.automation_engine.on("scene_activated", self.on_scene_activated)
        self.automation_engine.on("rule_triggered", self.on_rule_triggered)

        # Start server
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, self.host, self.port)
        await site.start()

        self.logger.info(f"Web server started on http://{self.host}:{self.port}")
        self.logger.info(f"Dashboard: http://localhost:{self.port}/index.html")

    # ============ API Handlers ============

    async def handle_status(self, request):
        """Get full system status"""
        return web.json_response({
            "devices": [d.to_dict() for d in self.bluetooth_manager.get_all_devices()],
            "scenes": [s.to_dict() for s in self.automation_engine.get_all_scenes()],
            "rules": [r.to_dict() for r in self.automation_engine.get_all_rules()],
            "transitions": [
                {
                    "device_address": t.device_address,
                    "property_name": t.property_name,
                    "from_value": t.from_value,
                    "to_value": t.to_value,
                    "progress": t.progress
                }
                for t in self.transitional_controller.get_active_transitions()
            ]
        })

    async def handle_get_devices(self, request):
        """Get all devices"""
        devices = [d.to_dict() for d in self.bluetooth_manager.get_all_devices()]
        return web.json_response({"devices": devices})

    async def handle_get_scenes(self, request):
        """Get all scenes"""
        scenes = [s.to_dict() for s in self.automation_engine.get_all_scenes()]
        return web.json_response({"scenes": scenes})

    async def handle_get_rules(self, request):
        """Get all automation rules"""
        rules = [r.to_dict() for r in self.automation_engine.get_all_rules()]
        return web.json_response({"rules": rules})

    async def handle_scan(self, request):
        """Start device scan"""
        asyncio.create_task(self._scan_task())
        return web.json_response({"status": "scanning"})

    async def _scan_task(self):
        """Background scan task"""
        await self.bluetooth_manager.scan(duration=10)

    async def handle_connect(self, request):
        """Connect to device"""
        data = await request.json()
        address = data.get("address")

        if not address:
            return web.json_response({"error": "address required"}, status=400)

        success = await self.bluetooth_manager.connect(address)
        return web.json_response({"success": success})

    async def handle_disconnect(self, request):
        """Disconnect from device"""
        data = await request.json()
        address = data.get("address")

        if not address:
            return web.json_response({"error": "address required"}, status=400)

        success = await self.bluetooth_manager.disconnect(address)
        return web.json_response({"success": success})

    async def handle_set_property(self, request):
        """Set device property"""
        data = await request.json()
        address = data.get("address")
        property_name = data.get("property")
        value = data.get("value")

        if not all([address, property_name, value is not None]):
            return web.json_response({"error": "Missing parameters"}, status=400)

        device = self.bluetooth_manager.get_device(address)
        if device:
            device.metadata[property_name] = value
            await self.broadcast({
                "type": "device_updated",
                "device": device.to_dict()
            })
            return web.json_response({"success": True})

        return web.json_response({"error": "Device not found"}, status=404)

    async def handle_transition(self, request):
        """Create a transition"""
        data = await request.json()
        address = data.get("address")
        property_name = data.get("property")
        to_value = data.get("to_value")
        from_value = data.get("from_value")
        duration = data.get("duration", 2.0)
        easing = data.get("easing", "ease-in-out")

        if not all([address, property_name, to_value is not None]):
            return web.json_response({"error": "Missing parameters"}, status=400)

        try:
            easing_type = EasingType(easing)
        except ValueError:
            easing_type = EasingType.EASE_IN_OUT

        success = await self.transitional_controller.transition(
            device_address=address,
            property_name=property_name,
            to_value=to_value,
            from_value=from_value,
            duration=duration,
            easing=easing_type
        )

        return web.json_response({"success": success})

    async def handle_activate_scene(self, request):
        """Activate a scene"""
        data = await request.json()
        scene_id = data.get("scene_id")
        transition_duration = data.get("transition_duration", 2.0)

        if not scene_id:
            return web.json_response({"error": "scene_id required"}, status=400)

        success = await self.automation_engine.activate_scene(
            scene_id,
            transition_duration
        )

        return web.json_response({"success": success})

    async def handle_toggle_rule(self, request):
        """Toggle automation rule enabled/disabled"""
        data = await request.json()
        rule_id = data.get("rule_id")

        if not rule_id:
            return web.json_response({"error": "rule_id required"}, status=400)

        rule = self.automation_engine.rules.get(rule_id)
        if not rule:
            return web.json_response({"error": "Rule not found"}, status=404)

        rule.enabled = not rule.enabled

        await self.broadcast({
            "type": "rules_update",
            "rules": [r.to_dict() for r in self.automation_engine.get_all_rules()]
        })

        return web.json_response({"success": True, "enabled": rule.enabled})

    # ============ WebSocket ============

    async def handle_websocket(self, request):
        """Handle WebSocket connection"""
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        self.websockets.add(ws)
        self.logger.info(f"WebSocket client connected (total: {len(self.websockets)})")

        # Send initial state
        await ws.send_json({
            "type": "initial_state",
            "devices": [d.to_dict() for d in self.bluetooth_manager.get_all_devices()],
            "scenes": [s.to_dict() for s in self.automation_engine.get_all_scenes()],
            "rules": [r.to_dict() for r in self.automation_engine.get_all_rules()]
        })

        try:
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    await self.handle_websocket_message(ws, data)
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    self.logger.error(f'WebSocket error: {ws.exception()}')
        finally:
            self.websockets.discard(ws)
            self.logger.info(f"WebSocket client disconnected (total: {len(self.websockets)})")

        return ws

    async def handle_websocket_message(self, ws, data):
        """Handle incoming WebSocket message"""
        msg_type = data.get("type")

        if msg_type == "ping":
            await ws.send_json({"type": "pong"})

    async def broadcast(self, message: dict):
        """Broadcast message to all WebSocket clients"""
        if not self.websockets:
            return

        message_json = json.dumps(message)
        for ws in self.websockets.copy():
            try:
                await ws.send_str(message_json)
            except Exception as e:
                self.logger.error(f"Broadcast error: {e}")
                self.websockets.discard(ws)

    # ============ Event Handlers ============

    async def on_device_discovered(self, device):
        """Device discovered event"""
        await self.broadcast({
            "type": "device_discovered",
            "device": device.to_dict()
        })

    async def on_device_connected(self, device):
        """Device connected event"""
        await self.broadcast({
            "type": "device_connected",
            "device": device.to_dict()
        })

    async def on_device_disconnected(self, device):
        """Device disconnected event"""
        await self.broadcast({
            "type": "device_disconnected",
            "device": device.to_dict()
        })

    async def on_device_updated(self, device):
        """Device updated event"""
        await self.broadcast({
            "type": "devices_update",
            "devices": [d.to_dict() for d in self.bluetooth_manager.get_all_devices()]
        })

    async def on_transition_update(self, transition):
        """Transition update event"""
        await self.broadcast({
            "type": "transition_update",
            "transitions": [
                {
                    "device_address": t.device_address,
                    "property_name": t.property_name,
                    "from_value": t.from_value,
                    "to_value": t.to_value,
                    "progress": t.progress
                }
                for t in self.transitional_controller.get_active_transitions()
            ]
        })

    async def on_transition_complete(self, transition):
        """Transition complete event"""
        await self.on_transition_update(transition)

    async def on_scene_activated(self, scene):
        """Scene activated event"""
        await self.broadcast({
            "type": "scene_activated",
            "scene": scene.to_dict()
        })

    async def on_rule_triggered(self, rule):
        """Rule triggered event"""
        await self.broadcast({
            "type": "rule_triggered",
            "rule": rule.to_dict()
        })


# Example usage
if __name__ == "__main__":
    async def main():
        # Create components
        manager = BluetoothManager()
        controller = TransitionalController(manager)
        engine = AutomationEngine(manager, controller)

        # Create web server
        server = WebServer(manager, controller, engine)

        # Start all components
        await manager.start()
        await controller.start()
        await engine.start()
        await server.start()

        # Keep running
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down...")

        # Cleanup
        await engine.stop()
        await controller.stop()
        await manager.stop()

    asyncio.run(main())
