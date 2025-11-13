"""
Transitional Control Engine
Provides smooth state transitions for Bluetooth devices
"""

import asyncio
import math
import logging
from typing import Any, Callable, Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
from datetime import datetime


class EasingType(Enum):
    """Easing function types"""
    LINEAR = "linear"
    EASE_IN = "ease-in"
    EASE_OUT = "ease-out"
    EASE_IN_OUT = "ease-in-out"
    CUBIC_IN = "cubic-in"
    CUBIC_OUT = "cubic-out"
    CUBIC_IN_OUT = "cubic-in-out"
    ELASTIC = "elastic"
    BOUNCE = "bounce"


@dataclass
class Transition:
    """Represents a single transition"""
    device_address: str
    property_name: str
    from_value: Any
    to_value: Any
    duration: float
    easing: EasingType
    start_time: datetime
    current_value: Any = None
    completed: bool = False
    progress: float = 0.0


class EasingFunctions:
    """Collection of easing functions"""

    @staticmethod
    def linear(t: float) -> float:
        """Linear interpolation"""
        return t

    @staticmethod
    def ease_in(t: float) -> float:
        """Quadratic ease-in"""
        return t * t

    @staticmethod
    def ease_out(t: float) -> float:
        """Quadratic ease-out"""
        return t * (2 - t)

    @staticmethod
    def ease_in_out(t: float) -> float:
        """Quadratic ease-in-out"""
        return 2 * t * t if t < 0.5 else -1 + (4 - 2 * t) * t

    @staticmethod
    def cubic_in(t: float) -> float:
        """Cubic ease-in"""
        return t * t * t

    @staticmethod
    def cubic_out(t: float) -> float:
        """Cubic ease-out"""
        return (--t) * t * t + 1

    @staticmethod
    def cubic_in_out(t: float) -> float:
        """Cubic ease-in-out"""
        return 4 * t * t * t if t < 0.5 else (t - 1) * (2 * t - 2) * (2 * t - 2) + 1

    @staticmethod
    def elastic(t: float) -> float:
        """Elastic ease-out (bounce effect)"""
        if t == 0 or t == 1:
            return t
        return pow(2, -10 * t) * math.sin((t - 0.1) * 5 * math.pi) + 1

    @staticmethod
    def bounce(t: float) -> float:
        """Bounce ease-out"""
        if t < (1 / 2.75):
            return 7.5625 * t * t
        elif t < (2 / 2.75):
            t -= 1.5 / 2.75
            return 7.5625 * t * t + 0.75
        elif t < (2.5 / 2.75):
            t -= 2.25 / 2.75
            return 7.5625 * t * t + 0.9375
        else:
            t -= 2.625 / 2.75
            return 7.5625 * t * t + 0.984375

    @classmethod
    def get(cls, easing_type: EasingType) -> Callable[[float], float]:
        """Get easing function by type"""
        mapping = {
            EasingType.LINEAR: cls.linear,
            EasingType.EASE_IN: cls.ease_in,
            EasingType.EASE_OUT: cls.ease_out,
            EasingType.EASE_IN_OUT: cls.ease_in_out,
            EasingType.CUBIC_IN: cls.cubic_in,
            EasingType.CUBIC_OUT: cls.cubic_out,
            EasingType.CUBIC_IN_OUT: cls.cubic_in_out,
            EasingType.ELASTIC: cls.elastic,
            EasingType.BOUNCE: cls.bounce,
        }
        return mapping.get(easing_type, cls.linear)


class TransitionalController:
    """
    Controls smooth transitions for device properties

    Features:
    - Multiple simultaneous transitions
    - Various easing functions
    - Sequence chaining
    - Parallel execution
    - Transition callbacks
    """

    def __init__(
        self,
        bluetooth_manager,
        default_duration: float = 2.0,
        default_easing: EasingType = EasingType.EASE_IN_OUT,
        frame_rate: int = 30
    ):
        self.bluetooth_manager = bluetooth_manager
        self.default_duration = default_duration
        self.default_easing = default_easing
        self.frame_rate = frame_rate
        self.frame_interval = 1.0 / frame_rate

        # Active transitions
        self.transitions: Dict[str, Transition] = {}
        self.transition_task = None
        self.running = False

        # Callbacks
        self.callbacks: Dict[str, List[Callable]] = {
            "transition_start": [],
            "transition_update": [],
            "transition_complete": [],
        }

        # Device property handlers
        self.property_handlers: Dict[str, Callable] = {}

        self.logger = logging.getLogger(__name__)

    def register_property_handler(
        self,
        property_name: str,
        handler: Callable[[str, Any], Any]
    ):
        """
        Register a handler for setting device properties

        Args:
            property_name: Name of property (e.g., "volume", "brightness")
            handler: async function(device_address, value) that sets the property
        """
        self.property_handlers[property_name] = handler

    async def start(self):
        """Start the transition engine"""
        if self.running:
            return

        self.running = True
        self.transition_task = asyncio.create_task(self._transition_loop())
        self.logger.info("Transitional Controller started")

    async def stop(self):
        """Stop the transition engine"""
        if not self.running:
            return

        self.running = False
        if self.transition_task:
            self.transition_task.cancel()
            try:
                await self.transition_task
            except asyncio.CancelledError:
                pass

        # Cancel all active transitions
        self.transitions.clear()
        self.logger.info("Transitional Controller stopped")

    async def transition(
        self,
        device_address: str,
        property_name: str,
        to_value: Any,
        from_value: Optional[Any] = None,
        duration: Optional[float] = None,
        easing: Optional[EasingType] = None
    ) -> bool:
        """
        Create a smooth transition for a device property

        Args:
            device_address: MAC address of device
            property_name: Property to transition (e.g., "volume")
            to_value: Target value
            from_value: Starting value (current if None)
            duration: Transition duration in seconds
            easing: Easing function to use

        Returns:
            True if transition started successfully
        """
        # Check device is connected
        if not self.bluetooth_manager.is_connected(device_address):
            self.logger.error(f"Device {device_address} not connected")
            return False

        # Get current value if from_value not provided
        if from_value is None:
            # Try to get current value from device state
            device = self.bluetooth_manager.get_device(device_address)
            from_value = device.metadata.get(property_name, 0)

        # Use defaults if not specified
        duration = duration or self.default_duration
        easing = easing or self.default_easing

        # Create transition
        transition_id = f"{device_address}:{property_name}"
        transition = Transition(
            device_address=device_address,
            property_name=property_name,
            from_value=from_value,
            to_value=to_value,
            duration=duration,
            easing=easing,
            start_time=datetime.now(),
            current_value=from_value
        )

        # Store transition
        self.transitions[transition_id] = transition

        # Start transition loop if not running
        if not self.running:
            await self.start()

        # Trigger callback
        await self._trigger_event("transition_start", transition)

        self.logger.info(
            f"Started transition: {property_name} {from_value} → {to_value} "
            f"({duration}s, {easing.value})"
        )

        return True

    async def transition_sequence(
        self,
        device_address: str,
        sequence: List[Dict[str, Any]]
    ):
        """
        Execute a sequence of transitions one after another

        Args:
            device_address: MAC address of device
            sequence: List of transition configs
                [
                    {"property": "volume", "to": 100, "duration": 2},
                    {"property": "volume", "to": 50, "duration": 1},
                ]
        """
        for step in sequence:
            await self.transition(
                device_address=device_address,
                property_name=step["property"],
                to_value=step["to"],
                from_value=step.get("from"),
                duration=step.get("duration", self.default_duration),
                easing=EasingType(step.get("easing", "ease-in-out"))
            )

            # Wait for transition to complete
            transition_id = f"{device_address}:{step['property']}"
            while transition_id in self.transitions:
                await asyncio.sleep(0.1)

    async def transition_parallel(
        self,
        transitions: List[Dict[str, Any]]
    ):
        """
        Execute multiple transitions in parallel

        Args:
            transitions: List of transition configs
                [
                    {
                        "device": "AA:BB:CC:DD:EE:FF",
                        "property": "volume",
                        "to": 100,
                        "duration": 2
                    },
                    ...
                ]
        """
        tasks = []
        for config in transitions:
            task = self.transition(
                device_address=config["device"],
                property_name=config["property"],
                to_value=config["to"],
                from_value=config.get("from"),
                duration=config.get("duration", self.default_duration),
                easing=EasingType(config.get("easing", "ease-in-out"))
            )
            tasks.append(task)

        await asyncio.gather(*tasks)

    async def fade_in(
        self,
        device_address: str,
        property_name: str = "volume",
        target: int = 100,
        duration: float = 2.0
    ):
        """Convenience method: fade in (0 to target)"""
        await self.transition(
            device_address=device_address,
            property_name=property_name,
            from_value=0,
            to_value=target,
            duration=duration,
            easing=EasingType.EASE_IN
        )

    async def fade_out(
        self,
        device_address: str,
        property_name: str = "volume",
        duration: float = 2.0
    ):
        """Convenience method: fade out (current to 0)"""
        await self.transition(
            device_address=device_address,
            property_name=property_name,
            to_value=0,
            duration=duration,
            easing=EasingType.EASE_OUT
        )

    async def pulse(
        self,
        device_address: str,
        property_name: str,
        min_value: int,
        max_value: int,
        duration: float = 1.0,
        cycles: int = 3
    ):
        """Create a pulsing effect"""
        for _ in range(cycles):
            # Up
            await self.transition(
                device_address=device_address,
                property_name=property_name,
                to_value=max_value,
                duration=duration / 2,
                easing=EasingType.EASE_IN_OUT
            )
            await asyncio.sleep(duration / 2)

            # Down
            await self.transition(
                device_address=device_address,
                property_name=property_name,
                to_value=min_value,
                duration=duration / 2,
                easing=EasingType.EASE_IN_OUT
            )
            await asyncio.sleep(duration / 2)

    async def _transition_loop(self):
        """Main transition processing loop"""
        self.logger.info("Transition loop started")

        while self.running:
            try:
                # Process all active transitions
                completed = []

                for transition_id, transition in self.transitions.items():
                    # Calculate progress
                    elapsed = (datetime.now() - transition.start_time).total_seconds()
                    progress = min(elapsed / transition.duration, 1.0)

                    # Apply easing function
                    easing_func = EasingFunctions.get(transition.easing)
                    eased_progress = easing_func(progress)

                    # Interpolate value
                    if isinstance(transition.from_value, (int, float)):
                        current_value = transition.from_value + (
                            transition.to_value - transition.from_value
                        ) * eased_progress
                    else:
                        # For non-numeric values, switch at 50%
                        current_value = transition.to_value if eased_progress > 0.5 else transition.from_value

                    transition.current_value = current_value
                    transition.progress = progress

                    # Apply value to device
                    await self._apply_property_value(
                        transition.device_address,
                        transition.property_name,
                        current_value
                    )

                    # Trigger update callback
                    await self._trigger_event("transition_update", transition)

                    # Check if complete
                    if progress >= 1.0:
                        transition.completed = True
                        completed.append(transition_id)
                        await self._trigger_event("transition_complete", transition)

                # Remove completed transitions
                for transition_id in completed:
                    del self.transitions[transition_id]

                # Sleep until next frame
                await asyncio.sleep(self.frame_interval)

            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Transition loop error: {e}")

        self.logger.info("Transition loop stopped")

    async def _apply_property_value(
        self,
        device_address: str,
        property_name: str,
        value: Any
    ):
        """Apply a property value to a device"""
        # Check for custom handler
        if property_name in self.property_handlers:
            handler = self.property_handlers[property_name]
            await handler(device_address, value)
            return

        # Default behavior: store in device metadata
        device = self.bluetooth_manager.get_device(device_address)
        if device:
            device.metadata[property_name] = value

            # For common properties, attempt standard operations
            if property_name == "volume":
                # Would send volume control command
                self.logger.debug(f"Set volume to {value}")
            elif property_name == "brightness":
                # Would send brightness command
                self.logger.debug(f"Set brightness to {value}")

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

    def get_active_transitions(self) -> List[Transition]:
        """Get all active transitions"""
        return list(self.transitions.values())

    def cancel_transition(self, device_address: str, property_name: str) -> bool:
        """Cancel a specific transition"""
        transition_id = f"{device_address}:{property_name}"
        if transition_id in self.transitions:
            del self.transitions[transition_id]
            return True
        return False

    def cancel_all_transitions(self, device_address: Optional[str] = None):
        """Cancel all transitions (optionally for specific device)"""
        if device_address:
            # Cancel transitions for specific device
            to_remove = [
                tid for tid in self.transitions
                if tid.startswith(f"{device_address}:")
            ]
            for tid in to_remove:
                del self.transitions[tid]
        else:
            # Cancel all transitions
            self.transitions.clear()


# Example usage
if __name__ == "__main__":
    from bluetooth_manager import BluetoothManager

    async def main():
        # Create manager and controller
        manager = BluetoothManager()
        controller = TransitionalController(manager, frame_rate=60)

        await manager.start()
        await controller.start()

        # Scan for devices
        devices = await manager.scan(duration=5)

        if devices:
            device = devices[0]
            print(f"Using device: {device.name}")

            # Connect
            await manager.connect(device.address)

            # Register volume handler (example)
            async def set_volume(address, value):
                print(f"Setting volume to {value:.1f}")

            controller.register_property_handler("volume", set_volume)

            # Smooth fade in
            print("\nFading in...")
            await controller.fade_in(device.address, duration=3.0)

            await asyncio.sleep(3.5)

            # Fade out
            print("\nFading out...")
            await controller.fade_out(device.address, duration=2.0)

            await asyncio.sleep(2.5)

            # Pulse effect
            print("\nPulsing...")
            await controller.pulse(
                device.address,
                "volume",
                min_value=30,
                max_value=80,
                duration=1.0,
                cycles=3
            )

            await asyncio.sleep(4)

            # Disconnect
            await manager.disconnect(device.address)

        await controller.stop()
        await manager.stop()

    asyncio.run(main())
