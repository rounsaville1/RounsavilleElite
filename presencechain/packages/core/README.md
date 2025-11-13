# PresenceChain Core

The PresenceCoin mainnet node implementation in Go.

## Features

- **Proof-of-Stake Consensus**: Energy-efficient consensus mechanism with validator rewards
- **P2P Networking**: Built on libp2p for robust peer-to-peer communication
- **JSON-RPC API**: Ethereum-compatible RPC interface for wallets and dApps
- **State Management**: Efficient state storage using BadgerDB
- **Smart Contracts**: Optional VM support for programmable transactions
- **Cryptography**: Secure key management with secp256k1 signatures

## Architecture

```
core/
├── consensus/   - Proof-of-Stake logic, validators, block production
├── crypto/      - Key generation, signing, hashing (secp256k1)
├── db/          - State database (BadgerDB)
├── net/         - P2P networking (libp2p)
├── rpc/         - JSON-RPC API server
├── state/       - State transition logic, account management
├── vm/          - Virtual machine for smart contracts
└── main.go      - Node entrypoint
```

## Quick Start

### Prerequisites

- Go 1.21 or higher
- Git

### Installation

```bash
cd packages/core
go mod download
```

### Running a Node

```bash
# Run a regular node
go run main.go

# Run as a validator
go run main.go --validator

# Custom configuration
go run main.go --data-dir ./mydata --rpc-port 8545 --p2p-port 30303
```

### Building

```bash
go build -o presencechain main.go
./presencechain --help
```

## Configuration

Configuration can be provided via command-line flags or a `config.yaml` file:

```yaml
data-dir: ./data
rpc-port: 8545
p2p-port: 30303
validator: false
```

### Command-Line Flags

- `--config`: Path to config file (default: ./config.yaml)
- `--data-dir`: Data directory for blockchain storage (default: ./data)
- `--rpc-port`: JSON-RPC port (default: 8545)
- `--p2p-port`: P2P networking port (default: 30303)
- `--validator`: Run as validator node (default: false)

## JSON-RPC API

The node exposes an Ethereum-compatible JSON-RPC API:

### Supported Methods

- `eth_blockNumber`: Get latest block number
- `eth_getBalance`: Get account balance
- `eth_sendTransaction`: Send transaction
- `net_version`: Get network ID
- `net_peerCount`: Get peer count
- `web3_clientVersion`: Get client version

### Example Usage

```bash
# Get latest block number
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Get balance
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x123..."],"id":1}'
```

## Development

### Running Tests

```bash
go test ./...
```

### Code Structure

- **main.go**: Application entrypoint, CLI setup, service initialization
- **consensus/**: Block production, validator selection, epoch management
- **crypto/**: ECDSA key pairs, address generation, signatures
- **db/**: Key-value storage abstraction over BadgerDB
- **net/**: libp2p networking, peer discovery, message propagation
- **rpc/**: HTTP JSON-RPC server, method handlers
- **state/**: Account state, balance management, nonces
- **vm/**: Smart contract execution environment (optional)

## Becoming a Validator

To run a validator node:

1. Generate validator keys
2. Stake minimum required tokens
3. Register as validator
4. Run node with `--validator` flag

```bash
# Run as validator
./presencechain --validator --config validator-config.yaml
```

## Network Ports

- **8545**: JSON-RPC API (default)
- **30303**: P2P networking (default)

Make sure these ports are accessible if running a public node.

## Troubleshooting

### Database Lock Error
If you see "database locked" errors, ensure no other instance is running:
```bash
ps aux | grep presencechain
```

### Connection Issues
Check firewall settings allow P2P port:
```bash
sudo ufw allow 30303
```

### Low Disk Space
The blockchain data grows over time. Monitor disk usage:
```bash
du -sh ./data
```

## Contributing

Contributions are welcome! Please see the main monorepo [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

MIT License - see [LICENSE](../../LICENSE)
