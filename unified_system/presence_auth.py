"""
Presence-Based Authentication System
Integrated with Bitcoin Core for secure wallet operations
"""

import hashlib
import hmac
import secrets
import time
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
import jwt


class PresenceAuth:
    """
    Presence-Originated Logic Lock
    Advanced authentication system for Bitcoin wallet operations
    """

    def __init__(self, secret_key: str = None):
        """Initialize presence authentication system"""
        self.secret_key = secret_key or secrets.token_hex(32)
        self.presence_tokens = {}  # Store active presence tokens
        self.failed_attempts = {}  # Track failed authentication attempts

    def generate_presence_token(self, user_id: str, node_location: str = None,
                                 duration_minutes: int = 30) -> str:
        """
        Generate presence-based authentication token

        Args:
            user_id: User identifier
            node_location: Optional node location (Giza, Titicaca, Sedona, etc.)
            duration_minutes: Token validity duration

        Returns:
            JWT token with presence claims
        """
        now = datetime.utcnow()
        expiration = now + timedelta(minutes=duration_minutes)

        payload = {
            'user_id': user_id,
            'node_location': node_location,
            'presence_level': 'authenticated',
            'iat': now,
            'exp': expiration,
            'crystal_signature': self._generate_crystal_signature(user_id)
        }

        token = jwt.encode(payload, self.secret_key, algorithm='HS256')
        self.presence_tokens[user_id] = {
            'token': token,
            'created_at': now,
            'expires_at': expiration
        }

        return token

    def verify_presence_token(self, token: str) -> Tuple[bool, Optional[Dict]]:
        """
        Verify presence token

        Returns:
            (is_valid, payload)
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])

            # Verify crystal signature
            user_id = payload.get('user_id')
            expected_signature = self._generate_crystal_signature(user_id)
            actual_signature = payload.get('crystal_signature')

            if expected_signature != actual_signature:
                return False, None

            return True, payload

        except jwt.ExpiredSignatureError:
            return False, {'error': 'Token expired'}
        except jwt.InvalidTokenError:
            return False, {'error': 'Invalid token'}

    def _generate_crystal_signature(self, user_id: str) -> str:
        """
        Generate crystal identity signature using double SHA-256
        (Bitcoin-compatible signature)
        """
        data = f"{user_id}:{self.secret_key}".encode('utf-8')
        # Use double SHA-256 like Bitcoin
        first_hash = hashlib.sha256(data).digest()
        second_hash = hashlib.sha256(first_hash).digest()
        return second_hash.hex()[:32]

    def presence_locked_operation(self, token: str, operation_name: str) -> Tuple[bool, str]:
        """
        Perform presence-locked operation (e.g., Bitcoin wallet transaction)

        Args:
            token: Presence authentication token
            operation_name: Name of the operation

        Returns:
            (success, message)
        """
        is_valid, payload = self.verify_presence_token(token)

        if not is_valid:
            return False, "Authentication failed: Invalid or expired presence token"

        user_id = payload.get('user_id')
        node_location = payload.get('node_location', 'unknown')

        # Log operation (in production, use proper audit logging)
        timestamp = datetime.utcnow().isoformat()
        print(f"[{timestamp}] Presence-locked operation: {operation_name}")
        print(f"  User: {user_id}, Node: {node_location}")

        return True, f"Operation '{operation_name}' authorized for {user_id}"

    def quantum_collapse_auto_corrector(self, func):
        """
        Quantum Collapse Auto-Corrector decorator
        Error handling wrapper for critical operations
        """
        def wrapper(*args, **kwargs):
            max_attempts = 3
            for attempt in range(max_attempts):
                try:
                    result = func(*args, **kwargs)
                    return result
                except Exception as e:
                    if attempt == max_attempts - 1:
                        print(f"❌ Quantum collapse detected: {str(e)}")
                        raise
                    else:
                        print(f"⚠️  Auto-correction attempt {attempt + 1}/{max_attempts}")
                        time.sleep(0.1 * (attempt + 1))  # Exponential backoff
            return None
        return wrapper

    def check_rate_limit(self, user_id: str, max_attempts: int = 5,
                         window_seconds: int = 60) -> Tuple[bool, str]:
        """
        Check rate limiting for user operations

        Returns:
            (allowed, message)
        """
        now = time.time()

        if user_id not in self.failed_attempts:
            self.failed_attempts[user_id] = []

        # Clean old attempts
        self.failed_attempts[user_id] = [
            t for t in self.failed_attempts[user_id]
            if now - t < window_seconds
        ]

        if len(self.failed_attempts[user_id]) >= max_attempts:
            return False, f"Rate limit exceeded. Try again in {window_seconds} seconds."

        return True, "OK"

    def record_failed_attempt(self, user_id: str):
        """Record failed authentication attempt"""
        if user_id not in self.failed_attempts:
            self.failed_attempts[user_id] = []
        self.failed_attempts[user_id].append(time.time())

    def generate_bitcoin_wallet_signature(self, wallet_address: str, private_key: str) -> str:
        """
        Generate presence-locked Bitcoin wallet signature

        Args:
            wallet_address: Bitcoin address
            private_key: Private key (in presence mode, this could be biometric)

        Returns:
            HMAC-SHA256 signature
        """
        message = f"{wallet_address}:{int(time.time())}".encode('utf-8')
        signature = hmac.new(
            private_key.encode('utf-8'),
            message,
            hashlib.sha256
        ).hexdigest()

        return signature

    def verify_bitcoin_wallet_signature(self, wallet_address: str, signature: str,
                                        private_key: str, max_age_seconds: int = 300) -> bool:
        """
        Verify Bitcoin wallet signature

        Args:
            wallet_address: Bitcoin address
            signature: HMAC signature
            private_key: Private key
            max_age_seconds: Maximum age of signature

        Returns:
            True if signature is valid
        """
        # Try recent timestamps
        now = int(time.time())
        for timestamp in range(now - max_age_seconds, now + 1):
            message = f"{wallet_address}:{timestamp}".encode('utf-8')
            expected_signature = hmac.new(
                private_key.encode('utf-8'),
                message,
                hashlib.sha256
            ).hexdigest()

            if hmac.compare_digest(signature, expected_signature):
                return True

        return False


class NodeSelector:
    """
    Rounsaville Node Driver Integration
    Select geographic/conceptual nodes for operations
    """

    NODES = {
        'giza': {
            'name': 'Giza Plateau',
            'location': 'Egypt',
            'type': 'ancient',
            'energy_level': 'high'
        },
        'titicaca': {
            'name': 'Lake Titicaca',
            'location': 'Peru/Bolivia',
            'type': 'natural',
            'energy_level': 'high'
        },
        'sedona': {
            'name': 'Sedona',
            'location': 'Arizona, USA',
            'type': 'vortex',
            'energy_level': 'medium'
        },
        'mainnet': {
            'name': 'Bitcoin Mainnet',
            'location': 'Global',
            'type': 'network',
            'energy_level': 'distributed'
        }
    }

    @classmethod
    def select_node(cls, node_key: str) -> Optional[Dict]:
        """Select a node for operation"""
        node_key = node_key.lower()

        # Check aliases
        aliases = {
            'giza plateau': 'giza',
            'lake titicaca': 'titicaca',
            'bitcoin': 'mainnet',
            'btc': 'mainnet'
        }

        node_key = aliases.get(node_key, node_key)
        return cls.NODES.get(node_key)

    @classmethod
    def list_nodes(cls) -> Dict:
        """List all available nodes"""
        return cls.NODES


# Example usage
if __name__ == "__main__":
    # Initialize presence authentication
    auth = PresenceAuth()

    # Generate presence token
    user_id = "rounsaville_elite_user_001"
    node = NodeSelector.select_node('mainnet')
    token = auth.generate_presence_token(user_id, node['name'])

    print(f"✓ Presence token generated for {user_id}")
    print(f"  Node: {node['name']}")
    print(f"  Token: {token[:50]}...")

    # Verify token
    is_valid, payload = auth.verify_presence_token(token)
    print(f"\n✓ Token verification: {'VALID' if is_valid else 'INVALID'}")

    # Perform presence-locked operation
    success, message = auth.presence_locked_operation(token, "bitcoin_transaction_sign")
    print(f"\n{'✓' if success else '❌'} {message}")

    # Generate Bitcoin wallet signature
    wallet_address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
    private_key = "test_key_for_demo"
    signature = auth.generate_bitcoin_wallet_signature(wallet_address, private_key)
    print(f"\n✓ Wallet signature: {signature[:32]}...")

    # Verify signature
    is_valid = auth.verify_bitcoin_wallet_signature(wallet_address, signature, private_key)
    print(f"✓ Signature verification: {'VALID' if is_valid else 'INVALID'}")
