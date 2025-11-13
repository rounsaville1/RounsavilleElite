"""
Bitcoin Core Integration Module
Complete mainnet operations with full SHA-256 algorithms
"""

from .crypto import BitcoinCrypto, BitcoinBlockHeader
from .node_client import BitcoinNodeClient

__all__ = ['BitcoinCrypto', 'BitcoinBlockHeader', 'BitcoinNodeClient']
__version__ = '1.0.0'
