# @presencechain/wallet-sdk

Shared TypeScript library for PresenceChain wallet functionality.

## Features

- **Key Management**: BIP39 mnemonic generation and BIP44 derivation
- **Transaction Signing**: Sign transactions with private keys
- **RPC Client**: Communicate with PresenceChain core nodes
- **Account Management**: Multi-account support
- **Type-Safe**: Full TypeScript support with type definitions

## Installation

```bash
npm install @presencechain/wallet-sdk
# or
pnpm add @presencechain/wallet-sdk
# or
yarn add @presencechain/wallet-sdk
```

## Quick Start

### Creating a New Wallet

```typescript
import { Wallet } from '@presencechain/wallet-sdk';

// Generate new wallet with random mnemonic
const wallet = Wallet.generate('http://localhost:8545');

// Get mnemonic phrase (save this securely!)
const mnemonic = wallet.getMnemonic();
console.log('Mnemonic:', mnemonic);

// Get primary account
const account = wallet.getPrimaryAccount();
console.log('Address:', account.address);
```

### Importing an Existing Wallet

```typescript
import { Wallet } from '@presencechain/wallet-sdk';

// From mnemonic
const wallet = new Wallet({
  rpcUrl: 'http://localhost:8545',
  mnemonic: 'your twelve word mnemonic phrase here...',
});

// From private key
const wallet2 = new Wallet({
  rpcUrl: 'http://localhost:8545',
  privateKey: '0x...',
});
```

### Checking Balance

```typescript
// Get balance of primary account
const balance = await wallet.getBalance();
console.log('Balance:', balance);

// Get balance of specific address
const balance2 = await wallet.getBalance('0x...');
```

### Sending Transactions

```typescript
// Send transaction from primary account
const txHash = await wallet.sendTransaction(
  '0xRecipientAddress',
  '1.5' // Amount in tokens
);
console.log('Transaction hash:', txHash);

// Send from specific account
const txHash2 = await wallet.sendTransaction(
  '0xRecipientAddress',
  '1.5',
  '0xSenderAddress'
);
```

### Managing Multiple Accounts

```typescript
// Derive additional accounts
const account1 = wallet.deriveAccount(1);
const account2 = wallet.deriveAccount(2);

// Get all accounts
const accounts = wallet.getAccounts();

// Get specific account
const account = wallet.getAccount(0);
```

### Signing Messages

```typescript
const message = 'Hello, PresenceChain!';
const signature = wallet.signMessage(message, 0); // Sign with account 0
console.log('Signature:', signature);
```

### Using RPC Client Directly

```typescript
import { RPCClient } from '@presencechain/wallet-sdk';

const rpc = new RPCClient({
  url: 'http://localhost:8545',
  timeout: 30000,
});

// Get latest block number
const blockNumber = await rpc.getBlockNumber();
console.log('Latest block:', blockNumber);

// Get peer count
const peers = await rpc.getPeerCount();
console.log('Connected peers:', peers);

// Get client version
const version = await rpc.getClientVersion();
console.log('Node version:', version);
```

### Using Signer Directly

```typescript
import { Signer } from '@presencechain/wallet-sdk';

const signer = new Signer();

// Sign transaction
const signedTx = signer.signTransaction(transaction, privateKey);

// Sign message
const signature = signer.signMessage('Hello!', privateKey);

// Verify signature
const recoveredAddress = signer.verifyMessage('Hello!', signature);
```

## API Reference

### Wallet

#### Constructor
- `new Wallet(config: WalletConfig)`
- `Wallet.generate(rpcUrl: string): Wallet`

#### Methods
- `importFromMnemonic(mnemonic: string): void`
- `importFromPrivateKey(privateKey: string): void`
- `deriveAccount(index: number): Account`
- `getAccounts(): Account[]`
- `getPrimaryAccount(): Account`
- `getAccount(index: number): Account`
- `getMnemonic(): string | undefined`
- `getBalance(address?: string): Promise<string>`
- `sendTransaction(to: string, value: string, from?: string): Promise<string>`
- `signMessage(message: string, accountIndex?: number): string`
- `exportAsJSON(password: string): Promise<string>`
- `static importFromJSON(json: string, password: string, rpcUrl: string): Promise<Wallet>`

### RPCClient

#### Constructor
- `new RPCClient(config: RPCConfig)`

#### Methods
- `getBlockNumber(): Promise<number>`
- `getBalance(address: string): Promise<string>`
- `getTransactionCount(address: string): Promise<number>`
- `sendTransaction(signedTx: SignedTransaction): Promise<string>`
- `getTransaction(hash: string): Promise<any>`
- `getTransactionReceipt(hash: string): Promise<any>`
- `getBlockByNumber(blockNumber: number): Promise<any>`
- `getBlockByHash(hash: string): Promise<any>`
- `getNetworkVersion(): Promise<string>`
- `getPeerCount(): Promise<number>`
- `getClientVersion(): Promise<string>`
- `call(transaction: any, blockTag?: string): Promise<string>`
- `estimateGas(transaction: any): Promise<number>`
- `getGasPrice(): Promise<string>`

### Signer

#### Methods
- `signTransaction(transaction: Transaction, privateKey: string): SignedTransaction`
- `signMessage(message: string, privateKey: string): string`
- `verifyMessage(message: string, signature: string): string`
- `recoverAddress(message: string, signature: string): string`
- `hash(data: string): string`

## Types

```typescript
interface WalletConfig {
  rpcUrl: string;
  mnemonic?: string;
  privateKey?: string;
}

interface Account {
  address: string;
  privateKey: string;
  publicKey: string;
}

interface Transaction {
  from: string;
  to: string;
  value: string;
  nonce: number;
  gasLimit: number;
  gasPrice: string;
  data?: string;
  signature?: string;
}

interface RPCConfig {
  url: string;
  timeout?: number;
  headers?: Record<string, string>;
}
```

## Security Best Practices

1. **Never expose private keys or mnemonics**
   ```typescript
   // ❌ Bad
   console.log('Private key:', account.privateKey);

   // ✅ Good
   // Store securely, never log or expose
   ```

2. **Use encrypted JSON for storage**
   ```typescript
   // Export wallet encrypted
   const encrypted = await wallet.exportAsJSON('strong-password');
   // Store encrypted JSON safely

   // Import later
   const wallet = await Wallet.importFromJSON(encrypted, 'strong-password', rpcUrl);
   ```

3. **Validate addresses before sending**
   ```typescript
   import { ethers } from 'ethers';

   if (!ethers.isAddress(recipientAddress)) {
     throw new Error('Invalid address');
   }
   ```

4. **Use environment variables for sensitive data**
   ```typescript
   const wallet = new Wallet({
     rpcUrl: process.env.RPC_URL,
     privateKey: process.env.PRIVATE_KEY,
   });
   ```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test

# Lint
pnpm lint
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

MIT License - see [LICENSE](../../LICENSE)
