# PresenceChain Documentation

Comprehensive documentation for the PresenceChain blockchain ecosystem.

## 📚 Table of Contents

- [Getting Started](./getting-started.md)
- [Architecture Overview](./architecture.md)
- [Core Node](./core-node.md)
- [Wallet SDK](./wallet-sdk.md)
- [Dashboard](./dashboard.md)
- [Explorer](./explorer.md)
- [API Reference](./api-reference.md)
- [Deployment Guide](./deployment.md)
- [Development Guide](./development.md)

## Quick Links

### For Users

- [Installing a Wallet](./getting-started.md#wallet-setup)
- [Sending Transactions](./getting-started.md#sending-transactions)
- [Staking Guide](./staking.md)
- [Governance Participation](./governance.md)

### For Developers

- [Building dApps](./development.md#building-dapps)
- [Integrating Wallet SDK](./wallet-sdk.md#integration)
- [API Integration](./api-reference.md)
- [Smart Contract Development](./smart-contracts.md)

### For Validators

- [Running a Validator](./validators.md#setup)
- [Staking Requirements](./validators.md#requirements)
- [Validator Operations](./validators.md#operations)

### For Node Operators

- [Running a Full Node](./core-node.md#installation)
- [Node Configuration](./core-node.md#configuration)
- [Monitoring & Maintenance](./core-node.md#monitoring)

## Architecture

PresenceChain is a complete blockchain ecosystem consisting of:

1. **Core Node** (Go) - Proof-of-Stake blockchain implementation
2. **Wallet SDK** (TypeScript) - Client library for wallet and dApp integration
3. **Dashboard** (React) - User-facing wallet and dApp portal
4. **Explorer API** (Node.js) - Blockchain indexer and API
5. **Explorer Web** (React) - Block explorer frontend

```
                    ┌─────────────────┐
                    │   Users/dApps   │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
    │  Dashboard  │  │ Explorer Web│  │   dApps     │
    │   (React)   │  │   (React)   │  │             │
    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
           │                 │                 │
           │        ┌────────▼────────┐        │
           │        │  Explorer API   │        │
           │        │   (Node.js)     │        │
           │        └────────┬────────┘        │
           │                 │                 │
           └────────┬────────┴────────┬────────┘
                    │   Wallet SDK    │
                    │  (TypeScript)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Core Node     │
                    │  Blockchain     │
                    │   (Go/Rust)     │
                    └─────────────────┘
```

## Key Features

### Proof-of-Stake Consensus
- Energy-efficient consensus mechanism
- Validator rewards and slashing
- Epoch-based validator selection

### Smart Contract Support
- Optional VM for programmable transactions
- Gas-based execution model
- Developer-friendly tooling

### Wallet Infrastructure
- BIP39/BIP44 key derivation
- Multi-account support
- Hardware wallet compatibility

### Explorer & Analytics
- Real-time blockchain indexing
- Transaction and block search
- Account analytics

## Getting Help

- **Documentation**: This repository
- **Issues**: [GitHub Issues](https://github.com/presencechain/presencechain/issues)
- **Discord**: [Join our community](https://discord.gg/presencechain)
- **Twitter**: [@PresenceChain](https://twitter.com/presencechain)

## Contributing

We welcome contributions! Please see:

- [Contributing Guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Development Setup](./development.md#setup)

## License

MIT License - see [LICENSE](../LICENSE)

---

**Built with ❤️ by the PresenceChain Team**
