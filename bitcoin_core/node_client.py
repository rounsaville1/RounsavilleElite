"""
Bitcoin Core RPC Client
Connects to mainnet Bitcoin Core node and provides high-level operations
"""

import json
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
from .crypto import BitcoinCrypto

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BitcoinNodeClient:
    """Bitcoin Core mainnet RPC client"""

    def __init__(self, host: str = "127.0.0.1", port: int = 8332,
                 rpc_user: str = "", rpc_password: str = ""):
        """
        Initialize Bitcoin Core RPC client

        Args:
            host: Bitcoin Core node host
            port: Bitcoin Core RPC port (8332 for mainnet)
            rpc_user: RPC username from bitcoin.conf
            rpc_password: RPC password from bitcoin.conf
        """
        self.host = host
        self.port = port
        self.rpc_url = f"http://{host}:{port}"
        self.auth = (rpc_user, rpc_password) if rpc_user else None
        self.crypto = BitcoinCrypto()

    def _rpc_call(self, method: str, params: List[Any] = None) -> Dict:
        """
        Make RPC call to Bitcoin Core node

        Args:
            method: RPC method name
            params: Method parameters

        Returns:
            RPC response result
        """
        payload = {
            "jsonrpc": "2.0",
            "id": "rounsaville-elite",
            "method": method,
            "params": params or []
        }

        try:
            response = requests.post(
                self.rpc_url,
                json=payload,
                auth=self.auth,
                headers={"content-type": "application/json"},
                timeout=30
            )
            response.raise_for_status()

            result = response.json()
            if "error" in result and result["error"]:
                raise Exception(f"RPC Error: {result['error']}")

            return result.get("result")

        except requests.exceptions.RequestException as e:
            logger.error(f"RPC call failed: {method} - {str(e)}")
            raise

    # === Network Information ===

    def get_blockchain_info(self) -> Dict:
        """Get blockchain information"""
        return self._rpc_call("getblockchaininfo")

    def get_network_info(self) -> Dict:
        """Get network information"""
        return self._rpc_call("getnetworkinfo")

    def get_peer_info(self) -> List[Dict]:
        """Get information about connected peers"""
        return self._rpc_call("getpeerinfo")

    def get_connection_count(self) -> int:
        """Get number of connections to other nodes"""
        return self._rpc_call("getconnectioncount")

    # === Block Operations ===

    def get_block_count(self) -> int:
        """Get current block height"""
        return self._rpc_call("getblockcount")

    def get_block_hash(self, height: int) -> str:
        """Get block hash at specific height"""
        return self._rpc_call("getblockhash", [height])

    def get_block(self, block_hash: str, verbosity: int = 2) -> Dict:
        """
        Get block information

        Args:
            block_hash: Block hash
            verbosity: 0=hex, 1=json, 2=json with transactions
        """
        return self._rpc_call("getblock", [block_hash, verbosity])

    def get_block_header(self, block_hash: str, verbose: bool = True) -> Dict:
        """Get block header information"""
        return self._rpc_call("getblockheader", [block_hash, verbose])

    def get_best_block_hash(self) -> str:
        """Get hash of the best (tip) block"""
        return self._rpc_call("getbestblockhash")

    def get_recent_blocks(self, count: int = 10) -> List[Dict]:
        """Get most recent blocks"""
        current_height = self.get_block_count()
        blocks = []

        for i in range(count):
            height = current_height - i
            if height < 0:
                break
            try:
                block_hash = self.get_block_hash(height)
                block = self.get_block(block_hash, verbosity=1)
                blocks.append(block)
            except Exception as e:
                logger.error(f"Error fetching block {height}: {e}")

        return blocks

    def verify_block_hash(self, block_hash: str) -> bool:
        """Verify block hash using double SHA-256"""
        try:
            block = self.get_block(block_hash, verbosity=0)
            # Block is hex-encoded, decode and verify
            block_data = bytes.fromhex(block)
            # Extract header (first 80 bytes)
            header = block_data[:80]
            calculated_hash = self.crypto.double_sha256(header)
            return calculated_hash[::-1].hex() == block_hash
        except Exception as e:
            logger.error(f"Block verification failed: {e}")
            return False

    # === Transaction Operations ===

    def get_transaction(self, txid: str, verbose: bool = True) -> Dict:
        """Get transaction information"""
        return self._rpc_call("getrawtransaction", [txid, verbose])

    def get_raw_transaction(self, txid: str) -> str:
        """Get raw transaction hex"""
        return self._rpc_call("getrawtransaction", [txid, False])

    def decode_raw_transaction(self, raw_tx: str) -> Dict:
        """Decode raw transaction"""
        return self._rpc_call("decoderawtransaction", [raw_tx])

    def send_raw_transaction(self, raw_tx: str) -> str:
        """Broadcast raw transaction to network"""
        return self._rpc_call("sendrawtransaction", [raw_tx])

    def verify_transaction_hash(self, txid: str) -> bool:
        """Verify transaction hash using double SHA-256"""
        try:
            raw_tx = self.get_raw_transaction(txid)
            tx_data = bytes.fromhex(raw_tx)
            calculated_txid = self.crypto.double_sha256(tx_data)
            return calculated_txid[::-1].hex() == txid
        except Exception as e:
            logger.error(f"Transaction verification failed: {e}")
            return False

    # === Mempool Operations ===

    def get_mempool_info(self) -> Dict:
        """Get mempool information"""
        return self._rpc_call("getmempoolinfo")

    def get_raw_mempool(self, verbose: bool = False) -> Any:
        """
        Get mempool contents

        Args:
            verbose: If False, returns list of txids.
                    If True, returns dict with detailed info
        """
        return self._rpc_call("getrawmempool", [verbose])

    def get_mempool_entry(self, txid: str) -> Dict:
        """Get mempool entry for specific transaction"""
        return self._rpc_call("getmempoolentry", [txid])

    def get_mempool_ancestors(self, txid: str, verbose: bool = False) -> Any:
        """Get mempool ancestors of a transaction"""
        return self._rpc_call("getmempoolancestors", [txid, verbose])

    def get_mempool_descendants(self, txid: str, verbose: bool = False) -> Any:
        """Get mempool descendants of a transaction"""
        return self._rpc_call("getmempooldescendants", [txid, verbose])

    # === Mining Information ===

    def get_mining_info(self) -> Dict:
        """Get mining information"""
        return self._rpc_call("getmininginfo")

    def get_difficulty(self) -> float:
        """Get current difficulty"""
        return self._rpc_call("getdifficulty")

    def get_network_hashps(self, blocks: int = 120) -> float:
        """Get estimated network hash rate per second"""
        return self._rpc_call("getnetworkhashps", [blocks])

    # === Wallet Operations (if wallet enabled) ===

    def get_balance(self) -> float:
        """Get wallet balance"""
        try:
            return self._rpc_call("getbalance")
        except:
            logger.warning("Wallet not available or not enabled")
            return 0.0

    def get_new_address(self, label: str = "", address_type: str = "bech32") -> str:
        """Generate new address"""
        return self._rpc_call("getnewaddress", [label, address_type])

    def validate_address(self, address: str) -> Dict:
        """Validate Bitcoin address"""
        result = self._rpc_call("validateaddress", [address])
        # Also verify checksum using our crypto module
        result['checksum_valid'] = self.crypto.verify_address_checksum(address)
        return result

    # === Advanced Operations ===

    def estimate_smart_fee(self, conf_target: int = 6) -> Dict:
        """Estimate fee rate for confirmation within conf_target blocks"""
        return self._rpc_call("estimatesmartfee", [conf_target])

    def get_tx_out(self, txid: str, vout: int, include_mempool: bool = True) -> Optional[Dict]:
        """Get details about an unspent transaction output (UTXO)"""
        return self._rpc_call("gettxout", [txid, vout, include_mempool])

    def get_tx_out_set_info(self) -> Dict:
        """Get statistics about the unspent transaction output set"""
        return self._rpc_call("gettxoutsetinfo")

    def get_chain_tips(self) -> List[Dict]:
        """Get information about all known chain tips"""
        return self._rpc_call("getchaintips")

    # === Status and Health ===

    def get_status(self) -> Dict:
        """Get comprehensive node status"""
        try:
            blockchain_info = self.get_blockchain_info()
            network_info = self.get_network_info()
            mempool_info = self.get_mempool_info()

            return {
                "status": "online",
                "network": blockchain_info.get("chain", "unknown"),
                "blocks": blockchain_info.get("blocks", 0),
                "headers": blockchain_info.get("headers", 0),
                "sync_progress": blockchain_info.get("verificationprogress", 0),
                "connections": network_info.get("connections", 0),
                "version": network_info.get("version", 0),
                "subversion": network_info.get("subversion", ""),
                "mempool_size": mempool_info.get("size", 0),
                "mempool_bytes": mempool_info.get("bytes", 0),
                "difficulty": blockchain_info.get("difficulty", 0),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "offline",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def is_synced(self) -> bool:
        """Check if node is fully synced"""
        try:
            info = self.get_blockchain_info()
            return info.get("verificationprogress", 0) > 0.9999
        except:
            return False


# Example usage
if __name__ == "__main__":
    # Initialize client (configure with your node credentials)
    client = BitcoinNodeClient(
        host="127.0.0.1",
        port=8332,
        rpc_user="your_rpc_user",
        rpc_password="your_rpc_password"
    )

    try:
        # Get status
        status = client.get_status()
        print(f"Node Status: {json.dumps(status, indent=2)}")

        # Get recent blocks
        print("\nRecent Blocks:")
        blocks = client.get_recent_blocks(5)
        for block in blocks:
            print(f"  Height: {block['height']}, Hash: {block['hash']}")

        # Get mempool info
        mempool = client.get_mempool_info()
        print(f"\nMempool: {mempool['size']} transactions")

    except Exception as e:
        print(f"Error: {e}")
