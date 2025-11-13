"""
Automation Engine
Handles scheduling, triggers, and automated device control
"""

import asyncio
import logging
from typing import Any, Callable, Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, time, timedelta
from enum import Enum
import json


class TriggerType(Enum):
    """Types of automation triggers"""
    TIME = "time"              # Specific time (e.g., "08:00")
    INTERVAL = "interval"      # Repeat every X seconds
    SUNRISE = "sunrise"        # At sunrise
    SUNSET = "sunset"          # At sunset
    DEVICE_STATE = "device_state"  # When device reaches state
    SENSOR_VALUE = "sensor_value"  # When sensor reads value
    MANUAL = "manual"          # Manually triggered


@dataclass
class AutomationRule:
    """Represents an automation rule"""
    id: str
    name: str
    enabled: bool = True
    trigger_type: TriggerType = TriggerType.TIME
    trigger_value: Any = None
    actions: List[Dict[str, Any]] = field(default_factory=list)
    conditions: List[Dict[str, Any]] = field(default_factory=list)
    last_triggered: Optional[datetime] = None
    trigger_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "enabled": self.enabled,
            "trigger_type": self.trigger_type.value,
            "trigger_value": self.trigger_value,
            "actions": self.actions,
            "conditions": self.conditions,
            "last_triggered": self.last_triggered.isoformat() if self.last_triggered else None,
            "trigger_count": self.trigger_count,
            "metadata": self.metadata
        }


@dataclass
class Scene:
    """Represents a saved scene (collection of device states)"""
    id: str
    name: str
    description: Optional[str] = None
    device_states: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    icon: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "device_states": self.device_states,
            "created_at": self.created_at.isoformat(),
            "icon": self.icon
        }


class AutomationEngine:
    """
    Automation and scheduling engine

    Features:
    - Time-based scheduling
    - Trigger-based automation
    - Scene management
    - Conditional logic
    - Repeat patterns
    """

    def __init__(
        self,
        bluetooth_manager,
        transitional_controller,
        location: Optional[Dict[str, float]] = None
    ):
        self.bluetooth_manager = bluetooth_manager
        self.transitional_controller = transitional_controller

        # Location for sunrise/sunset
        self.location = location or {"latitude": 37.7749, "longitude": -122.4194}

        # Storage
        self.rules: Dict[str, AutomationRule] = {}
        self.scenes: Dict[str, Scene] = {}

        # State
        self.running = False
        self.scheduler_task = None

        # Callbacks
        self.callbacks: Dict[str, List[Callable]] = {
            "rule_triggered": [],
            "scene_activated": [],
            "action_executed": [],
        }

        self.logger = logging.getLogger(__name__)

    async def start(self):
        """Start the automation engine"""
        if self.running:
            return

        self.running = True
        self.scheduler_task = asyncio.create_task(self._scheduler_loop())
        self.logger.info("Automation Engine started")

    async def stop(self):
        """Stop the automation engine"""
        if not self.running:
            return

        self.running = False
        if self.scheduler_task:
            self.scheduler_task.cancel()
            try:
                await self.scheduler_task
            except asyncio.CancelledError:
                pass

        self.logger.info("Automation Engine stopped")

    def add_rule(
        self,
        name: str,
        trigger_type: TriggerType,
        trigger_value: Any,
        actions: List[Dict[str, Any]],
        conditions: Optional[List[Dict[str, Any]]] = None,
        enabled: bool = True,
        rule_id: Optional[str] = None
    ) -> str:
        """
        Add an automation rule

        Args:
            name: Rule name
            trigger_type: Type of trigger
            trigger_value: Trigger configuration
            actions: List of actions to execute
            conditions: Optional conditions to check
            enabled: Whether rule is enabled
            rule_id: Optional custom ID

        Returns:
            Rule ID

        Example:
            engine.add_rule(
                name="Morning Lights",
                trigger_type=TriggerType.TIME,
                trigger_value="08:00",
                actions=[
                    {
                        "device": "11:22:33:44:55:66",
                        "property": "power",
                        "value": True,
                        "transition": {"duration": 30}
                    }
                ]
            )
        """
        if not rule_id:
            rule_id = f"rule_{len(self.rules) + 1}_{datetime.now().timestamp()}"

        rule = AutomationRule(
            id=rule_id,
            name=name,
            enabled=enabled,
            trigger_type=trigger_type,
            trigger_value=trigger_value,
            actions=actions,
            conditions=conditions or []
        )

        self.rules[rule_id] = rule
        self.logger.info(f"Added rule: {name} ({rule_id})")

        return rule_id

    def remove_rule(self, rule_id: str) -> bool:
        """Remove an automation rule"""
        if rule_id in self.rules:
            del self.rules[rule_id]
            self.logger.info(f"Removed rule: {rule_id}")
            return True
        return False

    def enable_rule(self, rule_id: str):
        """Enable a rule"""
        if rule_id in self.rules:
            self.rules[rule_id].enabled = True

    def disable_rule(self, rule_id: str):
        """Disable a rule"""
        if rule_id in self.rules:
            self.rules[rule_id].enabled = False

    def create_scene(
        self,
        name: str,
        device_states: Optional[Dict[str, Dict[str, Any]]] = None,
        description: Optional[str] = None,
        icon: Optional[str] = None,
        scene_id: Optional[str] = None
    ) -> str:
        """
        Create a scene

        Args:
            name: Scene name
            device_states: Device states to save (or capture current if None)
            description: Optional description
            icon: Optional icon name
            scene_id: Optional custom ID

        Returns:
            Scene ID

        Example:
            engine.create_scene(
                name="Movie Time",
                device_states={
                    "AA:BB:CC:DD:EE:FF": {"volume": 80, "mode": "theater"},
                    "11:22:33:44:55:66": {"brightness": 30}
                }
            )
        """
        if not scene_id:
            scene_id = f"scene_{len(self.scenes) + 1}_{datetime.now().timestamp()}"

        # If no device states provided, capture current states
        if device_states is None:
            device_states = {}
            for device in self.bluetooth_manager.get_connected_devices():
                device_states[device.address] = device.metadata.copy()

        scene = Scene(
            id=scene_id,
            name=name,
            description=description,
            device_states=device_states,
            icon=icon
        )

        self.scenes[scene_id] = scene
        self.logger.info(f"Created scene: {name} ({scene_id})")

        return scene_id

    def remove_scene(self, scene_id: str) -> bool:
        """Remove a scene"""
        if scene_id in self.scenes:
            del self.scenes[scene_id]
            self.logger.info(f"Removed scene: {scene_id}")
            return True
        return False

    async def activate_scene(
        self,
        scene_id: str,
        transition_duration: float = 2.0
    ) -> bool:
        """
        Activate a scene

        Args:
            scene_id: Scene ID or name
            transition_duration: Duration of transitions

        Returns:
            True if successful
        """
        # Find scene by ID or name
        scene = None
        if scene_id in self.scenes:
            scene = self.scenes[scene_id]
        else:
            # Search by name
            for s in self.scenes.values():
                if s.name == scene_id:
                    scene = s
                    break

        if not scene:
            self.logger.error(f"Scene not found: {scene_id}")
            return False

        self.logger.info(f"Activating scene: {scene.name}")

        # Apply all device states
        transitions = []
        for device_address, state in scene.device_states.items():
            # Check device is connected
            if not self.bluetooth_manager.is_connected(device_address):
                self.logger.warning(f"Device not connected: {device_address}")
                continue

            # Create transitions for each property
            for property_name, value in state.items():
                transitions.append({
                    "device": device_address,
                    "property": property_name,
                    "to": value,
                    "duration": transition_duration
                })

        # Execute all transitions in parallel
        if transitions:
            await self.transitional_controller.transition_parallel(transitions)

        await self._trigger_event("scene_activated", scene)

        return True

    async def trigger_rule(self, rule_id: str) -> bool:
        """Manually trigger a rule"""
        if rule_id not in self.rules:
            return False

        rule = self.rules[rule_id]
        if not rule.enabled:
            self.logger.info(f"Rule {rule.name} is disabled")
            return False

        # Check conditions
        if not await self._check_conditions(rule.conditions):
            self.logger.info(f"Rule {rule.name} conditions not met")
            return False

        # Execute actions
        await self._execute_actions(rule.actions)

        # Update stats
        rule.last_triggered = datetime.now()
        rule.trigger_count += 1

        await self._trigger_event("rule_triggered", rule)

        return True

    async def _scheduler_loop(self):
        """Main scheduler loop"""
        self.logger.info("Scheduler loop started")

        while self.running:
            try:
                current_time = datetime.now()

                # Check all rules
                for rule in self.rules.values():
                    if not rule.enabled:
                        continue

                    should_trigger = False

                    if rule.trigger_type == TriggerType.TIME:
                        # Check if current time matches trigger time
                        trigger_time = self._parse_time(rule.trigger_value)
                        if trigger_time:
                            if (current_time.hour == trigger_time.hour and
                                current_time.minute == trigger_time.minute):
                                # Check if not already triggered in last minute
                                if (not rule.last_triggered or
                                    (current_time - rule.last_triggered).total_seconds() > 60):
                                    should_trigger = True

                    elif rule.trigger_type == TriggerType.INTERVAL:
                        # Check if interval elapsed
                        interval = rule.trigger_value  # seconds
                        if not rule.last_triggered:
                            should_trigger = True
                        elif (current_time - rule.last_triggered).total_seconds() >= interval:
                            should_trigger = True

                    elif rule.trigger_type == TriggerType.SUNRISE:
                        sunrise_time = self._calculate_sunrise()
                        if sunrise_time and current_time.time() == sunrise_time:
                            if (not rule.last_triggered or
                                current_time.date() > rule.last_triggered.date()):
                                should_trigger = True

                    elif rule.trigger_type == TriggerType.SUNSET:
                        sunset_time = self._calculate_sunset()
                        if sunset_time and current_time.time() == sunset_time:
                            if (not rule.last_triggered or
                                current_time.date() > rule.last_triggered.date()):
                                should_trigger = True

                    if should_trigger:
                        await self.trigger_rule(rule.id)

                # Sleep until next check (check every minute)
                await asyncio.sleep(60)

            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Scheduler error: {e}")
                await asyncio.sleep(60)

        self.logger.info("Scheduler loop stopped")

    async def _execute_actions(self, actions: List[Dict[str, Any]]):
        """Execute a list of actions"""
        for action in actions:
            try:
                device_address = action.get("device")
                property_name = action.get("property")
                value = action.get("value")
                transition_config = action.get("transition")

                if transition_config:
                    # Use transitional control
                    await self.transitional_controller.transition(
                        device_address=device_address,
                        property_name=property_name,
                        to_value=value,
                        duration=transition_config.get("duration", 2.0),
                        easing=transition_config.get("easing", "ease-in-out")
                    )
                else:
                    # Direct set
                    device = self.bluetooth_manager.get_device(device_address)
                    if device:
                        device.metadata[property_name] = value

                await self._trigger_event("action_executed", action)

            except Exception as e:
                self.logger.error(f"Action execution error: {e}")

    async def _check_conditions(self, conditions: List[Dict[str, Any]]) -> bool:
        """Check if conditions are met"""
        if not conditions:
            return True

        for condition in conditions:
            condition_type = condition.get("type")

            if condition_type == "device_state":
                device_address = condition.get("device")
                property_name = condition.get("property")
                operator = condition.get("operator", "==")
                value = condition.get("value")

                device = self.bluetooth_manager.get_device(device_address)
                if not device:
                    return False

                current_value = device.metadata.get(property_name)
                if not self._compare_values(current_value, operator, value):
                    return False

            elif condition_type == "time_range":
                start_time = self._parse_time(condition.get("start"))
                end_time = self._parse_time(condition.get("end"))
                current_time = datetime.now().time()

                if start_time and end_time:
                    if not (start_time <= current_time <= end_time):
                        return False

        return True

    def _compare_values(self, a: Any, operator: str, b: Any) -> bool:
        """Compare two values using operator"""
        if operator == "==":
            return a == b
        elif operator == "!=":
            return a != b
        elif operator == ">":
            return a > b
        elif operator == "<":
            return a < b
        elif operator == ">=":
            return a >= b
        elif operator == "<=":
            return a <= b
        return False

    def _parse_time(self, time_str: str) -> Optional[time]:
        """Parse time string (HH:MM)"""
        try:
            parts = time_str.split(":")
            return time(hour=int(parts[0]), minute=int(parts[1]))
        except:
            return None

    def _calculate_sunrise(self) -> Optional[time]:
        """Calculate sunrise time (simplified)"""
        # In production, use library like astral
        # For now, return approximate time
        return time(hour=6, minute=30)

    def _calculate_sunset(self) -> Optional[time]:
        """Calculate sunset time (simplified)"""
        # In production, use library like astral
        # For now, return approximate time
        return time(hour=19, minute=30)

    def save_config(self, filepath: str):
        """Save automation config to file"""
        config = {
            "rules": {rid: rule.to_dict() for rid, rule in self.rules.items()},
            "scenes": {sid: scene.to_dict() for sid, scene in self.scenes.items()}
        }

        with open(filepath, 'w') as f:
            json.dump(config, f, indent=2)

        self.logger.info(f"Saved config to {filepath}")

    def load_config(self, filepath: str):
        """Load automation config from file"""
        try:
            with open(filepath, 'r') as f:
                config = json.load(f)

            # Load rules
            for rule_data in config.get("rules", {}).values():
                self.add_rule(
                    name=rule_data["name"],
                    trigger_type=TriggerType(rule_data["trigger_type"]),
                    trigger_value=rule_data["trigger_value"],
                    actions=rule_data["actions"],
                    conditions=rule_data["conditions"],
                    enabled=rule_data["enabled"],
                    rule_id=rule_data["id"]
                )

            # Load scenes
            for scene_data in config.get("scenes", {}).values():
                self.create_scene(
                    name=scene_data["name"],
                    device_states=scene_data["device_states"],
                    description=scene_data.get("description"),
                    icon=scene_data.get("icon"),
                    scene_id=scene_data["id"]
                )

            self.logger.info(f"Loaded config from {filepath}")

        except Exception as e:
            self.logger.error(f"Failed to load config: {e}")

    def on(self, event: str, callback: Callable):
        """Register event callback"""
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

    def get_all_rules(self) -> List[AutomationRule]:
        """Get all rules"""
        return list(self.rules.values())

    def get_all_scenes(self) -> List[Scene]:
        """Get all scenes"""
        return list(self.scenes.values())
