"""
Bitcoin Core Cryptographic Functions
Full implementation of Bitcoin standard double SHA-256 algorithms
"""

import hashlib
import hmac
import struct
from typing import Union, List


class BitcoinCrypto:
    """Core cryptographic functions for Bitcoin mainnet operations"""

    @staticmethod
    def sha256(data: Union[bytes, str]) -> bytes:
        """Single SHA-256 hash"""
        if isinstance(data, str):
            data = data.encode('utf-8')
        return hashlib.sha256(data).digest()

    @staticmethod
    def double_sha256(data: Union[bytes, str]) -> bytes:
        """
        Bitcoin standard double SHA-256 hash
        Used for: Block hashes, Transaction IDs, Merkle trees
        """
        if isinstance(data, str):
            data = data.encode('utf-8')
        return hashlib.sha256(hashlib.sha256(data).digest()).digest()

    @staticmethod
    def hash160(data: Union[bytes, str]) -> bytes:
        """
        RIPEMD-160(SHA-256(data))
        Used for: Bitcoin addresses
        """
        if isinstance(data, str):
            data = data.encode('utf-8')
        sha = hashlib.sha256(data).digest()
        ripemd = hashlib.new('ripemd160')
        ripemd.update(sha)
        return ripemd.digest()

    @staticmethod
    def merkle_root(hashes: List[bytes]) -> bytes:
        """
        Calculate Merkle root from list of transaction hashes
        Uses double SHA-256 for each level
        """
        if not hashes:
            return b'\x00' * 32

        if len(hashes) == 1:
            return hashes[0]

        # Duplicate last hash if odd number
        if len(hashes) % 2 == 1:
            hashes.append(hashes[-1])

        # Build next level
        next_level = []
        for i in range(0, len(hashes), 2):
            combined = hashes[i] + hashes[i + 1]
            next_level.append(BitcoinCrypto.double_sha256(combined))

        return BitcoinCrypto.merkle_root(next_level)

    @staticmethod
    def verify_block_hash(block_header: bytes, claimed_hash: bytes) -> bool:
        """
        Verify a block hash meets Bitcoin proof-of-work requirements
        Block hash must be double SHA-256 of the header
        """
        calculated_hash = BitcoinCrypto.double_sha256(block_header)
        # Bitcoin stores hashes in reverse byte order
        return calculated_hash[::-1] == claimed_hash[::-1]

    @staticmethod
    def verify_transaction_hash(transaction_data: bytes, claimed_txid: bytes) -> bool:
        """
        Verify a transaction ID (TXID)
        TXID is double SHA-256 of the serialized transaction
        """
        calculated_txid = BitcoinCrypto.double_sha256(transaction_data)
        # TXIDs are displayed in reverse byte order
        return calculated_txid[::-1] == claimed_txid[::-1]

    @staticmethod
    def calculate_difficulty(bits: int) -> float:
        """
        Calculate difficulty from nBits compact representation
        Used in block headers
        """
        max_target = 0x00000000FFFF0000000000000000000000000000000000000000000000000000

        # Extract exponent and mantissa
        exponent = bits >> 24
        mantissa = bits & 0x00FFFFFF

        if exponent <= 3:
            mantissa >>= (8 * (3 - exponent))
            target = mantissa
        else:
            target = mantissa << (8 * (exponent - 3))

        if target <= 0:
            return 0

        return max_target / target

    @staticmethod
    def base58_encode(data: bytes) -> str:
        """
        Base58 encoding (Bitcoin style, no 0/O or I/l)
        Used for: Bitcoin addresses
        """
        alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

        # Convert bytes to integer
        num = int.from_bytes(data, 'big')

        # Encode
        encoded = ''
        while num > 0:
            num, remainder = divmod(num, 58)
            encoded = alphabet[remainder] + encoded

        # Handle leading zeros
        for byte in data:
            if byte == 0:
                encoded = '1' + encoded
            else:
                break

        return encoded

    @staticmethod
    def base58_decode(encoded: str) -> bytes:
        """Decode Base58 string to bytes"""
        alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

        # Convert to integer
        num = 0
        for char in encoded:
            num = num * 58 + alphabet.index(char)

        # Convert to bytes
        combined = num.to_bytes((num.bit_length() + 7) // 8, 'big')

        # Add leading zero bytes
        for char in encoded:
            if char == '1':
                combined = b'\x00' + combined
            else:
                break

        return combined

    @staticmethod
    def create_address_from_pubkey(pubkey: bytes, testnet: bool = False) -> str:
        """
        Create Bitcoin address from public key
        Uses double SHA-256 for checksum
        """
        # Hash public key
        pubkey_hash = BitcoinCrypto.hash160(pubkey)

        # Add version byte (0x00 for mainnet, 0x6F for testnet)
        version = b'\x6F' if testnet else b'\x00'
        versioned_hash = version + pubkey_hash

        # Calculate checksum (first 4 bytes of double SHA-256)
        checksum = BitcoinCrypto.double_sha256(versioned_hash)[:4]

        # Combine and encode
        address_bytes = versioned_hash + checksum
        return BitcoinCrypto.base58_encode(address_bytes)

    @staticmethod
    def verify_address_checksum(address: str) -> bool:
        """
        Verify Bitcoin address checksum
        Uses double SHA-256
        """
        try:
            decoded = BitcoinCrypto.base58_decode(address)
            if len(decoded) != 25:
                return False

            payload = decoded[:-4]
            checksum = decoded[-4:]

            calculated_checksum = BitcoinCrypto.double_sha256(payload)[:4]
            return checksum == calculated_checksum
        except:
            return False

    @staticmethod
    def hmac_sha512(key: bytes, data: bytes) -> bytes:
        """
        HMAC-SHA512
        Used for: BIP32 HD wallet key derivation
        """
        return hmac.new(key, data, hashlib.sha512).digest()


class BitcoinBlockHeader:
    """Bitcoin block header structure"""

    def __init__(self, version: int, prev_block: bytes, merkle_root: bytes,
                 timestamp: int, bits: int, nonce: int):
        self.version = version
        self.prev_block = prev_block
        self.merkle_root = merkle_root
        self.timestamp = timestamp
        self.bits = bits
        self.nonce = nonce

    def serialize(self) -> bytes:
        """Serialize block header for hashing"""
        return (
            struct.pack('<I', self.version) +
            self.prev_block +
            self.merkle_root +
            struct.pack('<I', self.timestamp) +
            struct.pack('<I', self.bits) +
            struct.pack('<I', self.nonce)
        )

    def calculate_hash(self) -> bytes:
        """Calculate block hash using double SHA-256"""
        return BitcoinCrypto.double_sha256(self.serialize())

    def get_hash_hex(self) -> str:
        """Get block hash in standard hex format (reversed)"""
        return self.calculate_hash()[::-1].hex()

    def verify_pow(self, target: int) -> bool:
        """Verify proof of work meets difficulty target"""
        block_hash = int.from_bytes(self.calculate_hash(), 'little')
        return block_hash < target


# Example usage and testing
if __name__ == "__main__":
    crypto = BitcoinCrypto()

    # Test double SHA-256
    test_data = b"Hello Bitcoin"
    hash_result = crypto.double_sha256(test_data)
    print(f"Double SHA-256: {hash_result.hex()}")

    # Test Merkle root calculation
    tx_hashes = [
        bytes.fromhex('a' * 64),
        bytes.fromhex('b' * 64),
        bytes.fromhex('c' * 64),
    ]
    merkle = crypto.merkle_root(tx_hashes)
    print(f"Merkle Root: {merkle.hex()}")

    # Test address creation
    # Example public key (compressed format)
    pubkey = bytes.fromhex('0279BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798')
    address = crypto.create_address_from_pubkey(pubkey)
    print(f"Bitcoin Address: {address}")
    print(f"Address Valid: {crypto.verify_address_checksum(address)}")
