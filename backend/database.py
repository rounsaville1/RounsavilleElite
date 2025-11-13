"""
Database Layer for Bitcoin Core Operations
Stores blocks, transactions, mempool data, and network analytics
"""

import sqlite3
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BitcoinDatabase:
    """SQLite database for Bitcoin data caching and analytics"""

    def __init__(self, db_path: str = "bitcoin_data.db"):
        """Initialize database connection"""
        self.db_path = db_path
        self.conn = None
        self.init_database()

    def init_database(self):
        """Create database tables if they don't exist"""
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row

        cursor = self.conn.cursor()

        # Blocks table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS blocks (
                height INTEGER PRIMARY KEY,
                hash TEXT UNIQUE NOT NULL,
                prev_block_hash TEXT,
                merkle_root TEXT,
                timestamp INTEGER,
                bits TEXT,
                nonce INTEGER,
                difficulty REAL,
                size INTEGER,
                weight INTEGER,
                tx_count INTEGER,
                version INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                verified BOOLEAN DEFAULT 0
            )
        ''')

        # Transactions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                txid TEXT PRIMARY KEY,
                block_hash TEXT,
                block_height INTEGER,
                timestamp INTEGER,
                size INTEGER,
                vsize INTEGER,
                weight INTEGER,
                version INTEGER,
                locktime INTEGER,
                input_count INTEGER,
                output_count INTEGER,
                total_input_value REAL,
                total_output_value REAL,
                fee REAL,
                fee_rate REAL,
                raw_tx TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                verified BOOLEAN DEFAULT 0,
                FOREIGN KEY (block_hash) REFERENCES blocks(hash)
            )
        ''')

        # Mempool table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS mempool (
                txid TEXT PRIMARY KEY,
                size INTEGER,
                vsize INTEGER,
                weight INTEGER,
                fee REAL,
                fee_rate REAL,
                time INTEGER,
                height INTEGER,
                descendant_count INTEGER,
                descendant_size INTEGER,
                ancestor_count INTEGER,
                ancestor_size INTEGER,
                raw_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                removed_at TIMESTAMP
            )
        ''')

        # Network peers table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS peers (
                id INTEGER,
                addr TEXT,
                addr_local TEXT,
                services TEXT,
                relaytxes BOOLEAN,
                lastsend INTEGER,
                lastrecv INTEGER,
                bytessent INTEGER,
                bytesrecv INTEGER,
                conntime INTEGER,
                pingtime REAL,
                version INTEGER,
                subver TEXT,
                inbound BOOLEAN,
                startingheight INTEGER,
                synced_blocks INTEGER,
                synced_headers INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id, addr)
            )
        ''')

        # Network statistics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS network_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER,
                block_height INTEGER,
                difficulty REAL,
                hash_rate REAL,
                peer_count INTEGER,
                mempool_size INTEGER,
                mempool_bytes INTEGER,
                chain_size_gb REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # IP Registration / Timestamping table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ip_registrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                registration_id TEXT UNIQUE NOT NULL,
                user_id TEXT,
                content_hash TEXT NOT NULL,
                content_type TEXT,
                description TEXT,
                bitcoin_txid TEXT,
                bitcoin_block_hash TEXT,
                bitcoin_block_height INTEGER,
                op_return_data TEXT,
                timestamp INTEGER,
                verified BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (bitcoin_txid) REFERENCES transactions(txid)
            )
        ''')

        # Analytics cache table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analytics_cache (
                cache_key TEXT PRIMARY KEY,
                data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP
            )
        ''')

        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_blocks_height ON blocks(height)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_transactions_block ON transactions(block_hash)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_mempool_time ON mempool(time)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_mempool_fee_rate ON mempool(fee_rate)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_peers_last_seen ON peers(last_seen)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_ip_reg_user ON ip_registrations(user_id)')

        self.conn.commit()
        logger.info("Database initialized successfully")

    # === Block Operations ===

    def save_block(self, block_data: Dict) -> bool:
        """Save block to database"""
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO blocks
                (height, hash, prev_block_hash, merkle_root, timestamp, bits, nonce,
                 difficulty, size, weight, tx_count, version)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                block_data.get('height'),
                block_data.get('hash'),
                block_data.get('previousblockhash'),
                block_data.get('merkleroot'),
                block_data.get('time'),
                block_data.get('bits'),
                block_data.get('nonce'),
                block_data.get('difficulty'),
                block_data.get('size'),
                block_data.get('weight'),
                block_data.get('nTx'),
                block_data.get('version')
            ))
            self.conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error saving block: {e}")
            return False

    def get_block(self, block_hash: str) -> Optional[Dict]:
        """Get block from database"""
        cursor = self.conn.cursor()
        cursor.execute('SELECT * FROM blocks WHERE hash = ?', (block_hash,))
        row = cursor.fetchone()
        return dict(row) if row else None

    def get_block_by_height(self, height: int) -> Optional[Dict]:
        """Get block by height"""
        cursor = self.conn.cursor()
        cursor.execute('SELECT * FROM blocks WHERE height = ?', (height,))
        row = cursor.fetchone()
        return dict(row) if row else None

    def get_recent_blocks(self, limit: int = 10) -> List[Dict]:
        """Get most recent blocks"""
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT * FROM blocks
            ORDER BY height DESC
            LIMIT ?
        ''', (limit,))
        return [dict(row) for row in cursor.fetchall()]

    # === Transaction Operations ===

    def save_transaction(self, tx_data: Dict) -> bool:
        """Save transaction to database"""
        try:
            cursor = self.conn.cursor()

            # Calculate totals if not provided
            total_input = sum(vin.get('value', 0) for vin in tx_data.get('vin', []))
            total_output = sum(vout.get('value', 0) for vout in tx_data.get('vout', []))
            fee = total_input - total_output if total_input > 0 else 0

            cursor.execute('''
                INSERT OR REPLACE INTO transactions
                (txid, block_hash, block_height, timestamp, size, vsize, weight,
                 version, locktime, input_count, output_count, total_input_value,
                 total_output_value, fee, fee_rate)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                tx_data.get('txid'),
                tx_data.get('blockhash'),
                tx_data.get('blockheight'),
                tx_data.get('blocktime') or tx_data.get('time'),
                tx_data.get('size'),
                tx_data.get('vsize'),
                tx_data.get('weight'),
                tx_data.get('version'),
                tx_data.get('locktime'),
                len(tx_data.get('vin', [])),
                len(tx_data.get('vout', [])),
                total_input,
                total_output,
                fee,
                fee / tx_data.get('vsize', 1) if tx_data.get('vsize') else 0
            ))
            self.conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error saving transaction: {e}")
            return False

    def get_transaction(self, txid: str) -> Optional[Dict]:
        """Get transaction from database"""
        cursor = self.conn.cursor()
        cursor.execute('SELECT * FROM transactions WHERE txid = ?', (txid,))
        row = cursor.fetchone()
        return dict(row) if row else None

    # === Mempool Operations ===

    def save_mempool_tx(self, txid: str, tx_data: Dict) -> bool:
        """Save mempool transaction"""
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO mempool
                (txid, size, vsize, weight, fee, fee_rate, time, height,
                 descendant_count, descendant_size, ancestor_count, ancestor_size, raw_data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                txid,
                tx_data.get('size'),
                tx_data.get('vsize'),
                tx_data.get('weight'),
                tx_data.get('fees', {}).get('base'),
                tx_data.get('fees', {}).get('base', 0) / tx_data.get('vsize', 1),
                tx_data.get('time'),
                tx_data.get('height'),
                tx_data.get('descendantcount'),
                tx_data.get('descendantsize'),
                tx_data.get('ancestorcount'),
                tx_data.get('ancestorsize'),
                json.dumps(tx_data)
            ))
            self.conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error saving mempool tx: {e}")
            return False

    def get_mempool_transactions(self, limit: int = 100, order_by: str = 'fee_rate') -> List[Dict]:
        """Get mempool transactions ordered by fee rate"""
        cursor = self.conn.cursor()
        query = f'''
            SELECT * FROM mempool
            WHERE removed_at IS NULL
            ORDER BY {order_by} DESC
            LIMIT ?
        '''
        cursor.execute(query, (limit,))
        return [dict(row) for row in cursor.fetchall()]

    def mark_mempool_tx_removed(self, txid: str):
        """Mark mempool transaction as removed (confirmed or dropped)"""
        cursor = self.conn.cursor()
        cursor.execute('''
            UPDATE mempool
            SET removed_at = CURRENT_TIMESTAMP
            WHERE txid = ?
        ''', (txid,))
        self.conn.commit()

    # === Network Operations ===

    def save_peer(self, peer_data: Dict) -> bool:
        """Save peer information"""
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO peers
                (id, addr, addr_local, services, relaytxes, lastsend, lastrecv,
                 bytessent, bytesrecv, conntime, pingtime, version, subver,
                 inbound, startingheight, synced_blocks, synced_headers, last_seen)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (
                peer_data.get('id'),
                peer_data.get('addr'),
                peer_data.get('addrlocal'),
                peer_data.get('services'),
                peer_data.get('relaytxes'),
                peer_data.get('lastsend'),
                peer_data.get('lastrecv'),
                peer_data.get('bytessent'),
                peer_data.get('bytesrecv'),
                peer_data.get('conntime'),
                peer_data.get('pingtime'),
                peer_data.get('version'),
                peer_data.get('subver'),
                peer_data.get('inbound'),
                peer_data.get('startingheight'),
                peer_data.get('synced_blocks'),
                peer_data.get('synced_headers')
            ))
            self.conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error saving peer: {e}")
            return False

    def get_active_peers(self) -> List[Dict]:
        """Get active peers (seen in last hour)"""
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT * FROM peers
            WHERE datetime(last_seen) > datetime('now', '-1 hour')
            ORDER BY last_seen DESC
        ''')
        return [dict(row) for row in cursor.fetchall()]

    def save_network_stats(self, stats: Dict) -> bool:
        """Save network statistics snapshot"""
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT INTO network_stats
                (timestamp, block_height, difficulty, hash_rate, peer_count,
                 mempool_size, mempool_bytes, chain_size_gb)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                int(datetime.now().timestamp()),
                stats.get('block_height'),
                stats.get('difficulty'),
                stats.get('hash_rate'),
                stats.get('peer_count'),
                stats.get('mempool_size'),
                stats.get('mempool_bytes'),
                stats.get('chain_size_gb')
            ))
            self.conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error saving network stats: {e}")
            return False

    def get_network_stats_history(self, hours: int = 24) -> List[Dict]:
        """Get network statistics history"""
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT * FROM network_stats
            WHERE datetime(created_at) > datetime('now', ? || ' hours')
            ORDER BY created_at DESC
        ''', (f'-{hours}',))
        return [dict(row) for row in cursor.fetchall()]

    # === IP Registration / Timestamping ===

    def save_ip_registration(self, registration: Dict) -> bool:
        """Save IP registration/timestamp record"""
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT INTO ip_registrations
                (registration_id, user_id, content_hash, content_type, description,
                 bitcoin_txid, bitcoin_block_hash, bitcoin_block_height,
                 op_return_data, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                registration.get('registration_id'),
                registration.get('user_id'),
                registration.get('content_hash'),
                registration.get('content_type'),
                registration.get('description'),
                registration.get('bitcoin_txid'),
                registration.get('bitcoin_block_hash'),
                registration.get('bitcoin_block_height'),
                registration.get('op_return_data'),
                registration.get('timestamp')
            ))
            self.conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error saving IP registration: {e}")
            return False

    def get_ip_registration(self, registration_id: str) -> Optional[Dict]:
        """Get IP registration by ID"""
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT * FROM ip_registrations
            WHERE registration_id = ?
        ''', (registration_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    def get_user_registrations(self, user_id: str) -> List[Dict]:
        """Get all registrations for a user"""
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT * FROM ip_registrations
            WHERE user_id = ?
            ORDER BY created_at DESC
        ''', (user_id,))
        return [dict(row) for row in cursor.fetchall()]

    # === Analytics ===

    def get_analytics_summary(self) -> Dict:
        """Get comprehensive analytics summary"""
        cursor = self.conn.cursor()

        # Block stats
        cursor.execute('SELECT COUNT(*), MAX(height) FROM blocks')
        block_count, max_height = cursor.fetchone()

        # Transaction stats
        cursor.execute('SELECT COUNT(*), SUM(fee), AVG(fee_rate) FROM transactions')
        tx_count, total_fees, avg_fee_rate = cursor.fetchone()

        # Mempool stats
        cursor.execute('''
            SELECT COUNT(*), SUM(size), AVG(fee_rate)
            FROM mempool WHERE removed_at IS NULL
        ''')
        mempool_count, mempool_bytes, mempool_avg_fee = cursor.fetchone()

        # Peer stats
        cursor.execute('''
            SELECT COUNT(*) FROM peers
            WHERE datetime(last_seen) > datetime('now', '-1 hour')
        ''')
        active_peers = cursor.fetchone()[0]

        return {
            'blocks_cached': block_count or 0,
            'latest_block_height': max_height or 0,
            'transactions_cached': tx_count or 0,
            'total_fees_btc': total_fees or 0,
            'avg_fee_rate': avg_fee_rate or 0,
            'mempool_tx_count': mempool_count or 0,
            'mempool_bytes': mempool_bytes or 0,
            'mempool_avg_fee_rate': mempool_avg_fee or 0,
            'active_peers': active_peers or 0
        }

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()


# Example usage
if __name__ == "__main__":
    db = BitcoinDatabase("test_bitcoin.db")

    # Test saving a block
    test_block = {
        'height': 800000,
        'hash': 'test_hash_123',
        'previousblockhash': 'prev_hash',
        'merkleroot': 'merkle_root',
        'time': int(datetime.now().timestamp()),
        'bits': '170e9510',
        'nonce': 123456,
        'difficulty': 50000000000000,
        'size': 1000000,
        'weight': 4000000,
        'nTx': 2500,
        'version': 536870912
    }

    db.save_block(test_block)
    print("Block saved!")

    # Get analytics
    analytics = db.get_analytics_summary()
    print(f"\nAnalytics: {json.dumps(analytics, indent=2)}")

    db.close()
