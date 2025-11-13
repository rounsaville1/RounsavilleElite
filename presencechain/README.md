# PresenceChain Monorepo

A complete decentralized blockchain ecosystem featuring PresenceCoin mainnet, wallet infrastructure, and explorer tools.

## 🏗️ Architecture

This monorepo contains all components of the PresenceChain ecosystem:

```
presencechain/
├── packages/
│   ├── core/           - PresenceCoin mainnet node (Go)
│   ├── wallet-sdk/     - Shared TypeScript wallet library
│   ├── dashboard/      - dApp portal & wallet UI
│   ├── explorer-api/   - Blockchain indexer & API
│   ├── explorer-web/   - Block explorer frontend
│   └── docs/           - Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Go >= 1.21 (for core node)
- Docker & Docker Compose (optional)

### Installation

```bash
# Install dependencies for all packages
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Start all services in development mode
pnpm dev

# Or start individual services:
pnpm core:start          # Blockchain node
pnpm dashboard:dev       # Wallet & dApp portal
pnpm explorer-api:dev    # Indexer API
pnpm explorer-web:dev    # Block explorer
```

### Docker Development

```bash
# Start all services with Docker
docker-compose up

# Start specific services
docker-compose up core explorer-api
```

## 📦 Packages

### Core (`packages/core`)
The PresenceCoin mainnet node implementation in Go, featuring:
- Proof-of-Stake consensus
- P2P networking (libp2p)
- JSON-RPC API
- State management
- Optional VM for smart contracts

### Wallet SDK (`packages/wallet-sdk`)
Shared TypeScript library providing:
- Key generation (BIP39/BIP44)
- Transaction signing
- RPC client for core node
- Used by dashboard and other dApps

### Dashboard (`packages/dashboard`)
React-based dApp portal featuring:
- Wallet management
- Send/Receive transactions
- Staking interface
- Governance participation

### Explorer API (`packages/explorer-api`)
Backend indexer that:
- Listens to new blocks from core
- Indexes blockchain data
- Provides REST/GraphQL API

### Explorer Web (`packages/explorer-web`)
Frontend block explorer showing:
- Blocks & transactions
- Account balances
- Network statistics

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Test specific package
cd packages/core && go test ./...
cd packages/wallet-sdk && pnpm test
```

## 🔧 Configuration

Each package contains its own configuration. See individual package READMEs:
- [Core Configuration](packages/core/README.md)
- [Wallet SDK](packages/wallet-sdk/README.md)
- [Dashboard](packages/dashboard/README.md)
- [Explorer API](packages/explorer-api/README.md)
- [Explorer Web](packages/explorer-web/README.md)

## 📚 Documentation

Comprehensive documentation is available in [`packages/docs/`](packages/docs/):
- Architecture overview
- API references
- Deployment guides
- Development tutorials

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Website](https://presencechain.com)
- [Documentation](https://docs.presencechain.com)
- [Block Explorer](https://explorer.presencechain.com)

---

Built with ❤️ by the PresenceChain Team
