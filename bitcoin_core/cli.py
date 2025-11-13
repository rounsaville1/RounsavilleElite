#!/usr/bin/env python3
"""
Bitcoin Core CLI Interface
Command-line interface for Bitcoin operations
"""

import sys
import json
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from bitcoin_core.crypto import BitcoinCrypto
from bitcoin_core.node_client import BitcoinNodeClient
from backend.database import BitcoinDatabase


class BitcoinCLI:
    """Command-line interface for Bitcoin operations"""

    def __init__(self):
        # Load configuration from environment
        self.client = BitcoinNodeClient(
            host=os.getenv('BITCOIN_RPC_HOST', '127.0.0.1'),
            port=int(os.getenv('BITCOIN_RPC_PORT', '8332')),
            rpc_user=os.getenv('BITCOIN_RPC_USER', ''),
            rpc_password=os.getenv('BITCOIN_RPC_PASSWORD', '')
        )
        self.db = BitcoinDatabase(os.getenv('BITCOIN_DB_PATH', 'bitcoin_data.db'))
        self.crypto = BitcoinCrypto()

    def status(self):
        """Get node status"""
        return self.client.get_status()

    def transaction(self, txid):
        """Get transaction details"""
        # Try database first
        cached = self.db.get_transaction(txid)
        if cached:
            return cached

        # Fetch from node
        tx = self.client.get_transaction(txid, verbose=True)

        # Verify hash
        hash_verified = self.client.verify_transaction_hash(txid)
        tx['hash_verified'] = hash_verified

        # Save to database
        self.db.save_transaction(tx)

        return tx

    def blocks(self, limit=10, offset=0):
        """Get recent blocks"""
        limit = int(limit)
        offset = int(offset)

        # Try database first
        cached_blocks = self.db.get_recent_blocks(limit)
        if len(cached_blocks) >= limit:
            return cached_blocks[offset:offset + limit]

        # Fetch from node
        blocks = self.client.get_recent_blocks(limit)

        # Save to database and verify
        for block in blocks:
            self.db.save_block(block)

        return blocks[offset:offset + limit]

    def mempool(self, limit=50, order_by='fee_rate'):
        """Get mempool transactions"""
        limit = int(limit)

        # Get from node
        mempool_info = self.client.get_mempool_info()
        raw_mempool = self.client.get_raw_mempool(verbose=True)

        # Save to database
        for txid, tx_data in list(raw_mempool.items())[:limit]:
            self.db.save_mempool_tx(txid, tx_data)

        # Get from database with proper ordering
        transactions = self.db.get_mempool_transactions(limit, order_by)

        return {
            'info': mempool_info,
            'transactions': transactions
        }

    def network_graph(self):
        """Get network graph data"""
        peers = self.client.get_peer_info()
        network_info = self.client.get_network_info()
        blockchain_info = self.client.get_blockchain_info()

        # Save peers to database
        for peer in peers:
            self.db.save_peer(peer)

        # Build graph structure
        nodes = []
        edges = []

        # Add local node
        local_node = {
            'id': 'local',
            'type': 'local',
            'version': network_info.get('version'),
            'subversion': network_info.get('subversion'),
            'connections': network_info.get('connections')
        }
        nodes.append(local_node)

        # Add peer nodes and edges
        for peer in peers:
            peer_node = {
                'id': peer.get('addr'),
                'type': 'peer',
                'version': peer.get('version'),
                'subversion': peer.get('subver'),
                'services': peer.get('services'),
                'inbound': peer.get('inbound'),
                'pingtime': peer.get('pingtime'),
                'bytessent': peer.get('bytessent'),
                'bytesrecv': peer.get('bytesrecv')
            }
            nodes.append(peer_node)

            # Create edge
            edge = {
                'source': 'local' if not peer.get('inbound') else peer.get('addr'),
                'target': peer.get('addr') if not peer.get('inbound') else 'local',
                'type': 'inbound' if peer.get('inbound') else 'outbound',
                'pingtime': peer.get('pingtime')
            }
            edges.append(edge)

        # Calculate statistics
        inbound_count = sum(1 for p in peers if p.get('inbound'))
        outbound_count = len(peers) - inbound_count

        return {
            'graph': {
                'nodes': nodes,
                'edges': edges
            },
            'statistics': {
                'total_peers': len(peers),
                'inbound_peers': inbound_count,
                'outbound_peers': outbound_count,
                'avg_pingtime': sum(p.get('pingtime', 0) for p in peers) / len(peers) if peers else 0,
                'total_bytes_sent': sum(p.get('bytessent', 0) for p in peers),
                'total_bytes_received': sum(p.get('bytesrecv', 0) for p in peers)
            },
            'network_info': {
                'version': network_info.get('version'),
                'subversion': network_info.get('subversion'),
                'protocol_version': network_info.get('protocolversion'),
                'blocks': blockchain_info.get('blocks'),
                'headers': blockchain_info.get('headers'),
                'difficulty': blockchain_info.get('difficulty')
            }
        }

    def verify_tx(self, txid, raw_tx):
        """Verify transaction using double SHA-256"""
        tx_data = bytes.fromhex(raw_tx)
        calculated_txid = self.crypto.double_sha256(tx_data)
        calculated_txid_hex = calculated_txid[::-1].hex()

        return {
            'txid': txid,
            'calculated_txid': calculated_txid_hex,
            'verified': calculated_txid_hex == txid,
            'algorithm': 'double SHA-256'
        }

    def verify_block(self, block_hash, block_header):
        """Verify block using double SHA-256"""
        header_data = bytes.fromhex(block_header)
        calculated_hash = self.crypto.double_sha256(header_data)
        calculated_hash_hex = calculated_hash[::-1].hex()

        return {
            'block_hash': block_hash,
            'calculated_hash': calculated_hash_hex,
            'verified': calculated_hash_hex == block_hash,
            'algorithm': 'double SHA-256'
        }

    def analytics(self):
        """Get comprehensive analytics"""
        db_analytics = self.db.get_analytics_summary()

        try:
            blockchain_info = self.client.get_blockchain_info()
            network_info = self.client.get_network_info()
            mempool_info = self.client.get_mempool_info()
            difficulty = self.client.get_difficulty()
            hash_rate = self.client.get_network_hashps()

            node_analytics = {
                'blockchain': {
                    'chain': blockchain_info.get('chain'),
                    'blocks': blockchain_info.get('blocks'),
                    'headers': blockchain_info.get('headers'),
                    'bestblockhash': blockchain_info.get('bestblockhash'),
                    'difficulty': difficulty,
                    'mediantime': blockchain_info.get('mediantime'),
                    'verificationprogress': blockchain_info.get('verificationprogress'),
                    'chainwork': blockchain_info.get('chainwork'),
                    'size_on_disk': blockchain_info.get('size_on_disk'),
                    'pruned': blockchain_info.get('pruned')
                },
                'network': {
                    'version': network_info.get('version'),
                    'subversion': network_info.get('subversion'),
                    'protocolversion': network_info.get('protocolversion'),
                    'connections': network_info.get('connections'),
                    'networks': network_info.get('networks'),
                    'relayfee': network_info.get('relayfee'),
                    'incrementalfee': network_info.get('incrementalfee'),
                    'hash_rate': hash_rate
                },
                'mempool': {
                    'size': mempool_info.get('size'),
                    'bytes': mempool_info.get('bytes'),
                    'usage': mempool_info.get('usage'),
                    'maxmempool': mempool_info.get('maxmempool'),
                    'mempoolminfee': mempool_info.get('mempoolminfee'),
                    'minrelaytxfee': mempool_info.get('minrelaytxfee')
                }
            }

            return {
                **db_analytics,
                **node_analytics
            }
        except:
            return db_analytics

    def block(self, block_hash):
        """Get block by hash"""
        # Try database first
        cached = self.db.get_block(block_hash)
        if cached:
            return cached

        # Fetch from node
        block = self.client.get_block(block_hash, verbosity=2)
        self.db.save_block(block)

        return block

    def block_height(self, height):
        """Get block by height"""
        height = int(height)

        # Try database first
        cached = self.db.get_block_by_height(height)
        if cached:
            return cached

        # Fetch from node
        block_hash = self.client.get_block_hash(height)
        block = self.client.get_block(block_hash, verbosity=2)
        self.db.save_block(block)

        return block


def main():
    """Main CLI entry point"""
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        sys.exit(1)

    command = sys.argv[1]
    args = sys.argv[2:]

    cli = BitcoinCLI()

    try:
        if hasattr(cli, command):
            result = getattr(cli, command)(*args)
            print(json.dumps(result, indent=2, default=str))
        else:
            print(json.dumps({'error': f'Unknown command: {command}'}))
            sys.exit(1)
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)


if __name__ == '__main__':
    main()
