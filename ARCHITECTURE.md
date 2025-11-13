# System Architecture 🏗️

## Unified Bitcoin Core Mainnet System

---

## Overview

The Rounsaville Elite Bitcoin System is a comprehensive, production-ready platform that integrates Bitcoin Core mainnet operations with innovative security and visualization features. The system uses full Bitcoin standard double SHA-256 algorithms for all cryptographic operations.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │   Web    │  │  Mobile  │  │   CLI    │  │   API    │           │
│  │ Browser  │  │   App    │  │  Tools   │  │ Clients  │           │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘           │
└────────┼─────────────┼─────────────┼─────────────┼─────────────────┘
         │             │             │             │
         └─────────────┴─────────────┴─────────────┘
                       │
         ┌─────────────▼──────────────┐
         │      REST API LAYER        │
         │   Express.js (Node.js)     │
         │   Port: 3000               │
         │   ┌──────────────────┐     │
         │   │ Endpoints:       │     │
         │   │ - /status        │     │
         │   │ - /transaction   │     │
         │   │ - /blocks        │     │
         │   │ - /mempool       │     │
         │   │ - /network-graph │     │
         │   └──────────────────┘     │
         └────────────┬───────────────┘
                      │
         ┌────────────▼───────────────┐
         │   INTEGRATION LAYER        │
         │                            │
         │  ┌────────────────────┐    │
         │  │  Presence Auth     │    │
         │  │  - JWT Tokens      │    │
         │  │  - Node Selection  │    │
         │  │  - Rate Limiting   │    │
         │  └────────────────────┘    │
         │                            │
         │  ┌────────────────────┐    │
         │  │  Visualization     │    │
         │  │  - Dashboard       │    │
         │  │  - Network Graph   │    │
         │  │  - Holo Display    │    │
         │  └────────────────────┘    │
         └────────────┬───────────────┘
                      │
         ┌────────────▼───────────────┐
         │   BITCOIN CORE LAYER       │
         │                            │
         │  ┌────────────────────┐    │
         │  │  RPC Client        │    │
         │  │  - Node Connection │    │
         │  │  - Block Ops       │    │
         │  │  - Transaction Ops │    │
         │  │  - Mempool Ops     │    │
         │  └────────────────────┘    │
         │                            │
         │  ┌────────────────────┐    │
         │  │  Cryptography      │    │
         │  │  - Double SHA-256  │    │
         │  │  - RIPEMD-160      │    │
         │  │  - Base58          │    │
         │  │  - Merkle Trees    │    │
         │  └────────────────────┘    │
         └────────────┬───────────────┘
                      │
         ┌────────────▼───────────────┐
         │   DATABASE LAYER           │
         │   SQLite                   │
         │                            │
         │  ┌────────────────────┐    │
         │  │ Tables:            │    │
         │  │ - blocks           │    │
         │  │ - transactions     │    │
         │  │ - mempool          │    │
         │  │ - peers            │    │
         │  │ - network_stats    │    │
         │  │ - ip_registrations │    │
         │  └────────────────────┘    │
         └────────────┬───────────────┘
                      │
         ┌────────────▼───────────────┐
         │   BITCOIN CORE NODE        │
         │   Mainnet                  │
         │   RPC Port: 8332           │
         │   Network Port: 8333       │
         └────────────┬───────────────┘
                      │
         ┌────────────▼───────────────┐
         │   BITCOIN P2P NETWORK      │
         │   Global Mainnet           │
         │   ~50,000 Nodes            │
         └────────────────────────────┘
```

---

## Component Details

### 1. REST API Layer (`backend/server.js`)

**Technology**: Express.js (Node.js)

**Responsibilities**:
- HTTP request handling
- Route management
- Response caching
- Error handling
- CORS support

**Key Features**:
- RESTful endpoints
- JSON responses
- Rate limiting ready
- Logging middleware
- Health checks

**Endpoints**:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/status` | GET | Node status and network info |
| `/transaction/:tx_hash` | GET | Transaction details with verification |
| `/blocks` | GET | Recent blocks with pagination |
| `/mempool` | GET | Mempool transactions |
| `/api/v1/algebra/network-graph` | GET | Network topology |
| `/block/:hash` | GET | Specific block by hash |
| `/block/height/:height` | GET | Block by height |
| `/verify/transaction` | POST | Verify transaction hash |
| `/verify/block` | POST | Verify block hash |
| `/analytics` | GET | Comprehensive analytics |
| `/health` | GET | Health check |

---

### 2. Bitcoin Core Layer (`bitcoin_core/`)

#### 2.1 Cryptography Module (`crypto.py`)

**Algorithms Implemented**:

1. **SHA-256**
   ```python
   def sha256(data: bytes) -> bytes:
       return hashlib.sha256(data).digest()
   ```

2. **Double SHA-256** (Bitcoin Standard)
   ```python
   def double_sha256(data: bytes) -> bytes:
       return hashlib.sha256(hashlib.sha256(data).digest()).digest()
   ```

3. **RIPEMD-160**
   ```python
   def hash160(data: bytes) -> bytes:
       sha = hashlib.sha256(data).digest()
       ripemd = hashlib.new('ripemd160')
       ripemd.update(sha)
       return ripemd.digest()
   ```

4. **Merkle Root Calculation**
   ```python
   def merkle_root(hashes: List[bytes]) -> bytes:
       # Recursive calculation using double SHA-256
       # Duplicates last hash if odd number
   ```

5. **Base58 Encoding/Decoding**
   ```python
   def base58_encode(data: bytes) -> str:
       # Bitcoin-style Base58 (no 0, O, I, l)
   ```

6. **Address Generation**
   ```python
   def create_address_from_pubkey(pubkey: bytes) -> str:
       # Public key → Hash160 → Base58Check
   ```

**Usage**:
```python
from bitcoin_core.crypto import BitcoinCrypto

crypto = BitcoinCrypto()
block_hash = crypto.double_sha256(block_header)
address = crypto.create_address_from_pubkey(public_key)
```

#### 2.2 Node Client (`node_client.py`)

**Connection**:
- Bitcoin Core RPC
- JSON-RPC 2.0 protocol
- HTTP Basic Auth
- Default port: 8332 (mainnet)

**Operations**:

**Network Information**:
- `get_blockchain_info()` - Chain status
- `get_network_info()` - Node version, connections
- `get_peer_info()` - Connected peers
- `get_connection_count()` - Active connections

**Block Operations**:
- `get_block_count()` - Current height
- `get_block_hash(height)` - Block hash at height
- `get_block(hash, verbosity)` - Block data
- `get_block_header(hash)` - Header only
- `verify_block_hash(hash)` - Verify using double SHA-256

**Transaction Operations**:
- `get_transaction(txid)` - Transaction details
- `get_raw_transaction(txid)` - Raw hex
- `decode_raw_transaction(raw_tx)` - Parse transaction
- `send_raw_transaction(raw_tx)` - Broadcast
- `verify_transaction_hash(txid)` - Verify using double SHA-256

**Mempool Operations**:
- `get_mempool_info()` - Size, bytes, fee stats
- `get_raw_mempool(verbose)` - All pending transactions
- `get_mempool_entry(txid)` - Specific entry
- `get_mempool_ancestors(txid)` - Parent transactions
- `get_mempool_descendants(txid)` - Child transactions

**Mining Information**:
- `get_mining_info()` - Mining stats
- `get_difficulty()` - Current difficulty
- `get_network_hashps()` - Network hash rate

#### 2.3 CLI Interface (`cli.py`)

**Commands**:
```bash
# Status
python3 bitcoin_core/cli.py status

# Transaction
python3 bitcoin_core/cli.py transaction TXID

# Blocks
python3 bitcoin_core/cli.py blocks 10 0

# Mempool
python3 bitcoin_core/cli.py mempool 50 fee_rate

# Network graph
python3 bitcoin_core/cli.py network-graph

# Verification
python3 bitcoin_core/cli.py verify-tx TXID RAW_TX
python3 bitcoin_core/cli.py verify-block HASH HEADER

# Analytics
python3 bitcoin_core/cli.py analytics
```

---

### 3. Database Layer (`backend/database.py`)

**Technology**: SQLite3

**Tables**:

#### `blocks`
```sql
- height (PRIMARY KEY)
- hash (UNIQUE)
- prev_block_hash
- merkle_root
- timestamp
- bits
- nonce
- difficulty
- size, weight
- tx_count
- verified (BOOLEAN)
```

#### `transactions`
```sql
- txid (PRIMARY KEY)
- block_hash (FOREIGN KEY)
- block_height
- timestamp
- size, vsize, weight
- version, locktime
- input_count, output_count
- total_input_value
- total_output_value
- fee, fee_rate
- verified (BOOLEAN)
```

#### `mempool`
```sql
- txid (PRIMARY KEY)
- size, vsize, weight
- fee, fee_rate
- time, height
- ancestor_count, ancestor_size
- descendant_count, descendant_size
- removed_at (TIMESTAMP)
```

#### `peers`
```sql
- id, addr (COMPOSITE PRIMARY KEY)
- addr_local
- services
- bytessent, bytesrecv
- pingtime
- version, subver
- inbound (BOOLEAN)
- last_seen (TIMESTAMP)
```

#### `network_stats`
```sql
- id (AUTO INCREMENT)
- timestamp
- block_height
- difficulty
- hash_rate
- peer_count
- mempool_size
- mempool_bytes
```

#### `ip_registrations`
```sql
- registration_id (UNIQUE)
- user_id
- content_hash
- bitcoin_txid (FOREIGN KEY)
- bitcoin_block_hash
- op_return_data
- timestamp
- verified (BOOLEAN)
```

**Indexes**:
- `idx_blocks_height` - Fast block lookup by height
- `idx_blocks_timestamp` - Time-based queries
- `idx_transactions_block` - Transactions by block
- `idx_mempool_fee_rate` - Fee rate ordering

**Operations**:
```python
from backend.database import BitcoinDatabase

db = BitcoinDatabase()
db.save_block(block_data)
db.save_transaction(tx_data)
db.save_mempool_tx(txid, tx_data)
analytics = db.get_analytics_summary()
```

---

### 4. Integration Layer (`unified_system/`)

#### 4.1 Presence Authentication (`presence_auth.py`)

**Features**:
- JWT-based authentication
- Node location tracking
- Rate limiting
- Crystal signature generation (using double SHA-256)
- Bitcoin wallet signature verification

**Classes**:

**PresenceAuth**:
```python
auth = PresenceAuth()

# Generate token
token = auth.generate_presence_token(
    user_id="user_001",
    node_location="Bitcoin Mainnet",
    duration_minutes=30
)

# Verify token
is_valid, payload = auth.verify_presence_token(token)

# Perform secured operation
success, msg = auth.presence_locked_operation(
    token,
    "bitcoin_transaction_sign"
)

# Generate wallet signature
signature = auth.generate_bitcoin_wallet_signature(
    wallet_address,
    private_key
)
```

**NodeSelector**:
```python
# Select node
node = NodeSelector.select_node('mainnet')

# List nodes
nodes = NodeSelector.list_nodes()
```

**Available Nodes**:
- `giza` - Giza Plateau (Egypt)
- `titicaca` - Lake Titicaca (Peru/Bolivia)
- `sedona` - Sedona (Arizona)
- `mainnet` - Bitcoin Mainnet (Global)

#### 4.2 Visualization (`visualization.py`)

**Classes**:

**BitcoinVisualizer**:
```python
viz = BitcoinVisualizer()

# Block confirmation
viz.display_block_confirmation(height, hash, tx_count)

# Transaction status
viz.display_transaction_status(txid, status, fee)

# Mempool visualization
viz.display_mempool_visualization(mempool_data)

# Network graph (ASCII)
viz.display_network_graph_ascii(peers)

# Transaction flow
viz.display_transaction_flow(from_addr, to_addr, amount)

# Difficulty chart
viz.display_difficulty_chart(difficulty, hash_rate)

# Sync progress
viz.display_sync_progress(blocks, headers, percent)
```

**QuantumHumFX**:
```python
fx = QuantumHumFX()

# Audio feedback (text representation)
fx.play_transaction_confirmed()
fx.play_block_found()
fx.play_error()
fx.play_sync_progress()
```

**DashboardDisplay**:
```python
# Comprehensive dashboard
DashboardDisplay.display_full_status(status, mempool, peers)
```

---

## Data Flow

### Transaction Verification Flow

```
1. Client Request
   └─> GET /transaction/:txid

2. API Server (server.js)
   └─> Check cache
   └─> If not cached:
       └─> Execute CLI command

3. CLI (cli.py)
   └─> Check database
   └─> If not in DB:
       └─> Call Node Client

4. Node Client (node_client.py)
   └─> RPC call to Bitcoin Core
   └─> Receive transaction data
   └─> Verify hash using BitcoinCrypto

5. BitcoinCrypto (crypto.py)
   └─> double_sha256(raw_transaction)
   └─> Compare with claimed TXID
   └─> Return verification result

6. Database (database.py)
   └─> Save transaction
   └─> Set verified flag

7. Response
   └─> Return to client with verification status
```

### Block Processing Flow

```
1. New Block Detected
   └─> Bitcoin Core broadcasts

2. Node Client receives
   └─> get_block(hash, verbosity=2)

3. Process Block
   ├─> Verify block hash (double SHA-256)
   ├─> Calculate Merkle root
   ├─> Verify each transaction
   └─> Save to database

4. Update Statistics
   └─> network_stats table
   └─> Cache analytics

5. Trigger Events
   ├─> Visualization update
   ├─> Audio feedback (QuantumHumFX)
   └─> Dashboard refresh
```

### Mempool Monitoring Flow

```
1. Periodic Poll (every 10 seconds)
   └─> get_raw_mempool(verbose=True)

2. Compare with Database
   ├─> New transactions → save to DB
   ├─> Missing transactions → mark as removed
   └─> Updated transactions → update stats

3. Analysis
   ├─> Calculate fee statistics
   ├─> Identify high-fee transactions
   ├─> Track transaction ancestors/descendants
   └─> Update visualization

4. API Response
   └─> Return sorted by fee_rate, time, or size
```

---

## Security Architecture

### Authentication Flow

```
1. User Login Request
   └─> Provide credentials + node selection

2. PresenceAuth
   ├─> Validate credentials
   ├─> Generate JWT token
   ├─> Add crystal signature (double SHA-256)
   └─> Include node location in claims

3. Token Issued
   └─> Client stores token

4. Authenticated Request
   ├─> Client includes token in header
   ├─> Server validates token
   ├─> Check crystal signature
   ├─> Verify expiration
   └─> Check rate limits

5. Operation Authorized
   └─> Execute Bitcoin operation
   └─> Log to audit trail
```

### Rate Limiting

```python
# Check rate limit before operation
allowed, msg = auth.check_rate_limit(
    user_id,
    max_attempts=5,
    window_seconds=60
)

if not allowed:
    return error_response(msg)

# If failed
auth.record_failed_attempt(user_id)
```

### Cryptographic Verification

All critical operations use Bitcoin-standard cryptography:

1. **Transaction Verification**
   - Raw transaction → bytes
   - double_sha256(raw_tx)
   - Compare with claimed TXID (reversed byte order)

2. **Block Verification**
   - Block header (80 bytes)
   - double_sha256(header)
   - Compare with claimed block hash (reversed)

3. **Address Validation**
   - Decode Base58
   - Extract checksum (last 4 bytes)
   - Calculate: double_sha256(payload)[:4]
   - Compare checksums

4. **Merkle Root Calculation**
   - Pair transaction hashes
   - double_sha256(hash1 + hash2) for each pair
   - Recursively build tree
   - Result must match block header merkle_root

---

## Performance Optimization

### Caching Strategy

**Multi-Level Cache**:

1. **In-Memory Cache** (JavaScript Map)
   - TTL: 10 seconds (status/blocks)
   - TTL: 60 seconds (transactions)
   - TTL: 5 seconds (mempool)

2. **Database Cache** (SQLite)
   - Persistent storage
   - Indexed for fast lookups
   - Analytics pre-computed

3. **Bitcoin Core Cache**
   - dbcache setting in bitcoin.conf
   - UTXO set in memory

### Database Optimization

**Indexes**:
```sql
CREATE INDEX idx_blocks_height ON blocks(height);
CREATE INDEX idx_blocks_timestamp ON blocks(timestamp);
CREATE INDEX idx_transactions_block ON transactions(block_hash);
CREATE INDEX idx_mempool_fee_rate ON mempool(fee_rate);
```

**Query Optimization**:
- Use prepared statements
- Limit result sets
- Avoid SELECT *
- Use EXPLAIN QUERY PLAN

### Connection Pooling

```python
# SQLite connection per thread
conn = sqlite3.connect(db_path, check_same_thread=False)

# RPC client reuses HTTP session
session = requests.Session()
```

---

## Scalability Considerations

### Horizontal Scaling

**Load Balancer**:
```
     ┌─────────────────┐
     │  Load Balancer  │
     └────────┬────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│ API 1 │ │ API 2 │ │ API 3 │
└───┬───┘ └───┬───┘ └───┬───┘
    │         │         │
    └─────────┼─────────┘
              │
    ┌─────────▼─────────┐
    │  Shared Database  │
    └───────────────────┘
```

### Vertical Scaling

**Resource Allocation**:
- Bitcoin Core: 4GB+ RAM, 600GB+ storage
- API Server: 2GB RAM per instance
- Database: 1GB RAM, SSD recommended

### Microservices Architecture (Future)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Block Service│  │  TX Service  │  │ Mempool Svc  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       └──────────────────┼──────────────────┘
                          │
                  ┌───────▼────────┐
                  │  Message Queue │
                  │  (Redis/RabbitMQ)
                  └────────────────┘
```

---

## Monitoring & Logging

### Logging Strategy

**Levels**:
- `ERROR` - System errors, failures
- `WARN` - Warnings, deprecated usage
- `INFO` - Important events, operations
- `DEBUG` - Detailed debugging info

**Locations**:
- Console output
- File: `logs/bitcoin-api.log`
- Database: `analytics_cache` table

### Metrics to Monitor

**System Health**:
- API response times
- Error rates
- Cache hit ratio
- Database query times

**Bitcoin Node**:
- Block height vs network height
- Sync progress
- Connection count
- Mempool size

**Business Metrics**:
- API requests per minute
- Active users
- Transaction volume
- Fee revenue (if applicable)

---

## Disaster Recovery

### Backup Strategy

**Critical Data**:
1. `bitcoin_data.db` - Daily backups
2. `.env` - Secure storage
3. Bitcoin wallet files (if applicable)

**Backup Script**:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
cp bitcoin_data.db backups/bitcoin_data_$DATE.db
```

### Recovery Procedures

**Database Corruption**:
```bash
# Remove corrupted database
rm bitcoin_data.db

# Restart server (will recreate)
npm start

# Resync from Bitcoin Core
python3 bitcoin_core/cli.py blocks 1000
```

**Bitcoin Node Failure**:
```bash
# Check status
bitcoin-cli getblockchaininfo

# If corrupted, reindex
bitcoind -reindex

# If needed, resync from scratch
rm -rf ~/.bitcoin/blocks ~/.bitcoin/chainstate
bitcoind
```

---

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install
pip3 install -r requirements.txt

# Start Bitcoin Core (testnet recommended)
bitcoind -testnet -daemon

# Configure .env for testnet
BITCOIN_NETWORK=testnet
BITCOIN_RPC_PORT=18332

# Start development server
npm run dev
```

### Testing

```bash
# Unit tests (future)
npm test

# Integration tests
./test_api.sh

# Manual testing
curl http://localhost:3000/health
```

### Deployment

```bash
# Build (if needed)
# No build step for Node.js/Python

# Deploy
git pull origin main
npm install --production
pm2 restart bitcoin-api
```

---

## Future Enhancements

### Phase 1 (Q1 2024)
- [ ] WebSocket support for real-time updates
- [ ] Enhanced frontend dashboard
- [ ] Docker containerization
- [ ] Automated tests

### Phase 2 (Q2 2024)
- [ ] Lightning Network integration
- [ ] Hardware wallet support
- [ ] Multi-signature wallets
- [ ] Advanced analytics

### Phase 3 (Q3 2024)
- [ ] Mobile app (React Native)
- [ ] Payment processing
- [ ] Merchant tools
- [ ] DeFi integrations

---

## Conclusion

The Rounsaville Elite Bitcoin System provides a comprehensive, secure, and scalable platform for Bitcoin mainnet operations. Using full Bitcoin-standard double SHA-256 algorithms throughout, it ensures cryptographic integrity while offering innovative features like presence-based authentication and real-time visualization.

**Key Strengths**:
✓ Bitcoin-standard cryptography
✓ Production-ready architecture
✓ Comprehensive API
✓ Innovative security features
✓ Real-time monitoring
✓ Scalable design

**Contact**: support@rounsavilleelite.store
