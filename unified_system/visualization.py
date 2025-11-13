"""
Visualization System for Bitcoin Operations
Integrates quantum hum FX and holographic displays
"""

import sys
import time
import math
from typing import List, Dict


class BitcoinVisualizer:
    """Real-time visualization for Bitcoin network operations"""

    @staticmethod
    def display_block_confirmation(block_height: int, block_hash: str, tx_count: int):
        """Display animated block confirmation"""
        print(f"\n{'='*70}")
        print(f"  🟢 NEW BLOCK CONFIRMED")
        print(f"{'='*70}")
        print(f"  Height:       {block_height:,}")
        print(f"  Hash:         {block_hash[:32]}...")
        print(f"  Transactions: {tx_count:,}")
        print(f"{'='*70}\n")

    @staticmethod
    def display_transaction_status(txid: str, status: str, fee: float = None):
        """Display transaction status"""
        status_icons = {
            'pending': '⏳',
            'confirmed': '✅',
            'failed': '❌',
            'broadcasting': '📡'
        }

        icon = status_icons.get(status, '•')
        print(f"{icon} Transaction {status.upper()}")
        print(f"   TXID: {txid[:32]}...")
        if fee:
            print(f"   Fee:  {fee:.8f} BTC")

    @staticmethod
    def display_mempool_visualization(mempool_data: Dict):
        """Display mempool visualization"""
        size = mempool_data.get('size', 0)
        bytes_count = mempool_data.get('bytes', 0)

        print(f"\n{'~'*70}")
        print(f"  MEMPOOL STATUS")
        print(f"{'~'*70}")
        print(f"  Transactions: {size:,}")
        print(f"  Size:         {bytes_count / 1_000_000:.2f} MB")
        print(f"{'~'*70}\n")

    @staticmethod
    def display_network_graph_ascii(peers: List[Dict]):
        """Display ASCII network graph"""
        print(f"\n{'─'*70}")
        print("  BITCOIN NETWORK TOPOLOGY")
        print(f"{'─'*70}")
        print("                    [LOCAL NODE]")
        print("                         |")
        print("          ┌──────────────┼──────────────┐")

        for i, peer in enumerate(peers[:5]):  # Show top 5 peers
            addr = peer.get('addr', 'unknown')[:20]
            direction = "←" if peer.get('inbound') else "→"
            print(f"          {direction} {addr}")

        if len(peers) > 5:
            print(f"          ... and {len(peers) - 5} more peers")

        print(f"{'─'*70}\n")

    @staticmethod
    def display_holo5d_spiral(frame_count: int = 20):
        """
        Display 5D holographic spiral animation
        Adapted from holo5d_ascii.py
        """
        print("\n" + "="*70)
        print("  QUANTUM HOLOGRAPHIC DISPLAY - Bitcoin Network Sync")
        print("="*70 + "\n")

        for frame in range(frame_count):
            # Clear screen (simple version)
            sys.stdout.write('\033[2J\033[H')

            angle_offset = frame * 0.2
            depth = 20

            for z in range(depth):
                row = ""
                for x in range(40):
                    # 3D spiral calculation
                    theta = (x / 40.0) * 2 * math.pi + angle_offset
                    r = z / depth
                    y_val = int(10 + 8 * math.sin(theta + z * 0.3) * r)

                    # Create character based on position
                    if y_val == 10:
                        char = '█' if (frame + z) % 3 == 0 else '▓'
                    else:
                        char = ' '

                    row += char

                print(row)

            time.sleep(0.05)

        print("\n" + "="*70)

    @staticmethod
    def display_transaction_flow(from_addr: str, to_addr: str, amount: float):
        """Display transaction flow animation"""
        print(f"\n{'┌' + '─'*68 + '┐'}")
        print(f"│  BITCOIN TRANSACTION FLOW{' '*43}│")
        print(f"{'└' + '─'*68 + '┘'}")

        print(f"\n  FROM: {from_addr[:40]}...")
        print("           │")
        print(f"           ▼  {amount:.8f} BTC")
        print("           │")
        print(f"  TO:   {to_addr[:40]}...")
        print()

    @staticmethod
    def display_difficulty_chart(difficulty: float, hash_rate: float):
        """Display mining difficulty and hash rate"""
        print(f"\n{'╔' + '═'*68 + '╗'}")
        print(f"║  MINING STATISTICS{' '*50}║")
        print(f"{'╠' + '═'*68 + '╣'}")
        print(f"║  Difficulty:  {difficulty:,.0f}{' '*(54-len(f'{difficulty:,.0f}'))}║")
        print(f"║  Hash Rate:   {hash_rate/1e18:.2f} EH/s{' '*44}║")
        print(f"{'╚' + '═'*68 + '╝'}\n")

    @staticmethod
    def display_sync_progress(blocks: int, headers: int, percent: float):
        """Display blockchain sync progress"""
        bar_length = 50
        filled = int(bar_length * percent)
        bar = '█' * filled + '░' * (bar_length - filled)

        print(f"\n  BLOCKCHAIN SYNC PROGRESS")
        print(f"  [{bar}] {percent*100:.2f}%")
        print(f"  Blocks: {blocks:,} / {headers:,}")
        print()


class QuantumHumFX:
    """
    Quantum Hum audio feedback for Bitcoin operations
    Adapted from quantum_hum_fx.py
    """

    @staticmethod
    def play_transaction_confirmed():
        """Play confirmation sound (text representation)"""
        print("🔊 ♪ Transaction Confirmed (High tone)")

    @staticmethod
    def play_block_found():
        """Play block found sound"""
        print("🔊 ♪♪ New Block Found (Rising tone)")

    @staticmethod
    def play_error():
        """Play error sound"""
        print("🔊 ⚠ Error Alert (Warning tone)")

    @staticmethod
    def play_sync_progress():
        """Play sync progress sound"""
        print("🔊 ... Syncing (Pulsing hum)")


class DashboardDisplay:
    """Comprehensive dashboard display"""

    @staticmethod
    def display_full_status(status: Dict, mempool: Dict, peers: List[Dict]):
        """Display comprehensive system status"""
        # Clear screen
        sys.stdout.write('\033[2J\033[H')

        print("╔" + "═"*78 + "╗")
        print("║" + " "*20 + "BITCOIN CORE MAINNET - LIVE DASHBOARD" + " "*21 + "║")
        print("╠" + "═"*78 + "╣")

        # Network Status
        blocks = status.get('blocks', 0)
        headers = status.get('headers', 0)
        sync_progress = status.get('sync_progress', 0) * 100

        print(f"║  🌐 NETWORK STATUS{' '*59}║")
        print(f"║    Chain:       {status.get('network', 'mainnet'):<63}║")
        print(f"║    Blocks:      {blocks:,} / {headers:,}{' '*(48-len(f'{blocks:,} / {headers:,}'))}║")
        print(f"║    Sync:        {sync_progress:.2f}%{' '*59}║")
        print(f"║    Connections: {status.get('connections', 0)}{' '*63}║")
        print("╠" + "─"*78 + "╣")

        # Mempool
        mempool_size = mempool.get('size', 0)
        mempool_bytes = mempool.get('bytes', 0) / 1_000_000

        print(f"║  📊 MEMPOOL{' '*66}║")
        print(f"║    Transactions: {mempool_size:,}{' '*(60-len(f'{mempool_size:,}'))}║")
        print(f"║    Size:         {mempool_bytes:.2f} MB{' '*57}║")
        print("╠" + "─"*78 + "╣")

        # Peers
        print(f"║  🔗 NETWORK PEERS ({len(peers)}){' '*(58-len(str(len(peers))))}║")
        for i, peer in enumerate(peers[:3]):
            addr = peer.get('addr', 'unknown')[:40]
            direction = "Inbound " if peer.get('inbound') else "Outbound"
            print(f"║    {i+1}. [{direction}] {addr}{' '*(54-len(addr)-len(direction))}║")

        print("╚" + "═"*78 + "╝")


# Example usage
if __name__ == "__main__":
    viz = BitcoinVisualizer()

    # Test visualizations
    viz.display_block_confirmation(800000, "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5", 2500)

    viz.display_transaction_status(
        "a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d",
        "confirmed",
        0.0001
    )

    viz.display_mempool_visualization({'size': 12500, 'bytes': 5_000_000})

    viz.display_network_graph_ascii([
        {'addr': '192.168.1.1:8333', 'inbound': False},
        {'addr': '10.0.0.50:8333', 'inbound': True},
        {'addr': '172.16.0.10:8333', 'inbound': False},
    ])

    # Test quantum hum FX
    fx = QuantumHumFX()
    fx.play_block_found()
    fx.play_transaction_confirmed()

    print("\n✓ All visualization systems operational")
