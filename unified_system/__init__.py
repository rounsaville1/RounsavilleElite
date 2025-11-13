"""
Unified Bitcoin System
Integrates all Rounsaville Elite innovations with Bitcoin Core mainnet
"""

from .presence_auth import PresenceAuth, NodeSelector
from .visualization import BitcoinVisualizer, QuantumHumFX, DashboardDisplay

__all__ = [
    'PresenceAuth',
    'NodeSelector',
    'BitcoinVisualizer',
    'QuantumHumFX',
    'DashboardDisplay'
]
__version__ = '1.0.0'
