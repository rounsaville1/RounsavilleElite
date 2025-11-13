# @presencechain/explorer-api

Backend indexer and API for the PresenceChain block explorer.

## Features

- **Blockchain Indexer**: Continuously indexes new blocks and transactions
- **PostgreSQL Database**: Stores blockchain data for fast queries
- **REST API**: Provides endpoints for explorer frontend
- **Real-time Updates**: Polls blockchain every 5 seconds
- **Account Tracking**: Maintains up-to-date account balances

## Quick Start

### Prerequisites

- Node.js >= 18
- PostgreSQL database
- Running PresenceChain core node

### Installation

```bash
pnpm install
```

### Configuration

Create a `.env` file:

```env
PORT=4000
RPC_URL=http://localhost:8545
DATABASE_URL=postgresql://user:password@localhost:5432/presencechain
```

### Database Setup

```bash
# Create database
createdb presencechain

# Tables will be created automatically on first run
```

### Development

```bash
# Start in development mode
pnpm dev

# Build
pnpm build

# Start production server
pnpm start
```

## API Endpoints

### Health Check

```
GET /health
```

Returns indexer status and latest block indexed.

### Blocks

```
GET /api/blocks?limit=20&offset=0
```

Get list of blocks (paginated).

```
GET /api/blocks/:id
```

Get block by number or hash, including transactions.

```
GET /api/blocks/latest
```

Get the latest block.

### Transactions

```
GET /api/transactions/:hash
```

Get transaction by hash.

### Accounts

```
GET /api/accounts/:address
```

Get account info including balance and transaction history.

### Statistics

```
GET /api/stats
```

Get network statistics.

## Architecture

```
explorer-api/
├── src/
│   ├── index.ts      # Entry point
│   ├── indexer.ts    # Block indexer
│   ├── database.ts   # Database layer
│   └── api.ts        # API routes
```

### Indexer

The indexer:
1. Connects to PresenceChain core node via RPC
2. Fetches new blocks every 5 seconds
3. Stores blocks and transactions in PostgreSQL
4. Updates account balances
5. Maintains sync state

### Database Schema

```sql
-- Blocks
CREATE TABLE blocks (
  number BIGINT PRIMARY KEY,
  hash VARCHAR(66) UNIQUE,
  previous_hash VARCHAR(66),
  timestamp BIGINT,
  validator VARCHAR(42),
  transaction_count INT
);

-- Transactions
CREATE TABLE transactions (
  hash VARCHAR(66) PRIMARY KEY,
  from_address VARCHAR(42),
  to_address VARCHAR(42),
  value VARCHAR(78),
  block_number BIGINT,
  timestamp BIGINT,
  gas_used BIGINT,
  status VARCHAR(20)
);

-- Accounts
CREATE TABLE accounts (
  address VARCHAR(42) PRIMARY KEY,
  balance VARCHAR(78),
  last_updated BIGINT
);
```

## Usage Examples

### Fetching Latest Blocks

```typescript
const response = await fetch('http://localhost:4000/api/blocks?limit=10');
const { blocks } = await response.json();
```

### Getting Block Details

```typescript
const response = await fetch('http://localhost:4000/api/blocks/12345');
const { block, transactions } = await response.json();
```

### Account Information

```typescript
const response = await fetch('http://localhost:4000/api/accounts/0x123...');
const { address, balance, transactions } = await response.json();
```

## Performance

- Indexes blocks in real-time (5s polling interval)
- PostgreSQL indexes on common query patterns
- Pagination support for large datasets
- Connection pooling for database queries

## Monitoring

The `/health` endpoint provides:
- Indexer status (running/stopped)
- Latest block indexed
- Database connectivity

```bash
curl http://localhost:4000/health
```

## Troubleshooting

### Indexer Not Starting

Check RPC URL is correct and core node is running:
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Database Connection Issues

Verify PostgreSQL is running and credentials are correct:
```bash
psql $DATABASE_URL
```

### Missing Blocks

The indexer will automatically catch up on restart. Check logs for errors.

## Development

```bash
# Run tests
pnpm test

# Lint code
pnpm lint

# Watch mode
pnpm dev
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - see [LICENSE](../../LICENSE)
