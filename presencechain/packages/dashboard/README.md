# @presencechain/dashboard

PresenceChain dApp Portal & Wallet UI - A modern React-based interface for interacting with the PresenceChain blockchain.

## Features

- **Wallet Management**: Create, import, and manage wallets
- **Send/Receive**: Transfer tokens with QR code support
- **Staking Interface**: Stake tokens and earn rewards
- **Governance**: Vote on network proposals
- **Real-time Updates**: Live balance and transaction updates

## Tech Stack

- **React 18**: Modern UI library
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **TailwindCSS**: Utility-first styling
- **React Router**: Client-side routing
- **TanStack Query**: Data fetching and caching
- **Zustand**: State management
- **@presencechain/wallet-sdk**: Blockchain integration

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

The app will be available at http://localhost:3000

### Environment Variables

Create a `.env` file:

```env
VITE_RPC_URL=http://localhost:8545
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   └── Layout.tsx    # App layout with navigation
├── pages/            # Page components
│   ├── WalletPage.tsx
│   ├── SendReceivePage.tsx
│   ├── StakingPage.tsx
│   └── GovernancePage.tsx
├── hooks/            # Custom React hooks
│   └── useWallet.ts  # Wallet management hook
├── App.tsx           # App root component
├── main.tsx          # App entry point
└── index.css         # Global styles
```

## Usage

### Creating a Wallet

```typescript
import { useWallet } from './hooks/useWallet';

function MyComponent() {
  const { createWallet } = useWallet();

  const handleCreate = () => {
    const mnemonic = createWallet();
    console.log('Save this mnemonic:', mnemonic);
  };

  return <button onClick={handleCreate}>Create Wallet</button>;
}
```

### Sending Transactions

```typescript
const { sendTransaction } = useWallet();

const handleSend = async () => {
  try {
    const txHash = await sendTransaction(
      '0xRecipientAddress',
      '1.5' // Amount in PSC
    );
    console.log('Transaction sent:', txHash);
  } catch (error) {
    console.error('Send failed:', error);
  }
};
```

### Checking Balance

```typescript
const { balance, address } = useWallet();

return (
  <div>
    <p>Address: {address}</p>
    <p>Balance: {balance} PSC</p>
  </div>
);
```

## Pages

### Wallet Page
- View total balance
- Quick actions (Send, Receive, Swap)
- Recent transaction history

### Send/Receive Page
- Send tokens to any address
- Receive tokens via QR code
- Transaction status tracking

### Staking Page
- View staking stats (APY, rewards)
- Stake/unstake tokens
- Browse active validators

### Governance Page
- View active proposals
- Vote on network changes
- Track voting power

## Styling

The app uses TailwindCSS with a custom dark theme featuring:
- Gradient backgrounds
- Glassmorphism effects
- Purple/pink accent colors
- Responsive design

### Custom Theme

```css
/* Glass effect */
.glass {
  @apply bg-white/10 backdrop-blur-lg border border-white/10;
}

/* Gradient button */
.btn-gradient {
  @apply bg-gradient-to-r from-purple-600 to-pink-600;
}
```

## Hooks

### useWallet

Main wallet management hook:

```typescript
const {
  wallet,        // Wallet instance
  address,       // Current address
  balance,       // Current balance
  isConnected,   // Connection status
  createWallet,  // Create new wallet
  importWallet,  // Import from mnemonic
  sendTransaction, // Send tokens
  disconnect,    // Disconnect wallet
} = useWallet();
```

### useBalance

Real-time balance hook:

```typescript
import { useQuery } from '@tanstack/react-query';

const { data: balance } = useQuery({
  queryKey: ['balance', address],
  queryFn: () => wallet?.getBalance(address),
  refetchInterval: 10000, // Refresh every 10s
});
```

## Building for Production

```bash
# Build optimized bundle
pnpm build

# The build output will be in ./dist
```

### Deployment

Deploy the `dist` folder to any static hosting:

```bash
# Deploy to Vercel
vercel deploy

# Deploy to Netlify
netlify deploy --prod --dir=dist

# Deploy to GitHub Pages
gh-pages -d dist
```

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

## Performance

- Code splitting per route
- Lazy loading of components
- Optimized bundle size
- Fast dev server with HMR

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - see [LICENSE](../../LICENSE)
