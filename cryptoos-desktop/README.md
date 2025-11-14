# CryptoOS Desktop - Electron IPC Interface

A comprehensive, type-safe IPC (Inter-Process Communication) system for the CryptoOS Desktop Environment built on Electron.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Modules](#modules)
- [Usage](#usage)
  - [Renderer Process (React/TypeScript)](#renderer-process-reacttypescript)
  - [Main Process (Node.js)](#main-process-nodejs)
- [API Reference](#api-reference)
- [Type Safety](#type-safety)
- [Security](#security)
- [Development](#development)

## Overview

This IPC interface provides a **fully type-safe** communication layer between Electron's main process and renderer processes. It supports all CryptoOS Desktop modules:

- 🤖 **AI Assistant** - Figma Smart Interpreter, code generation, chat
- 💰 **Wallet Manager** - Multi-chain crypto wallet operations
- 🎰 **Kiosk & Casino** - Bitcoin ATM and GoldenHorse gaming
- 🖥️ **System Monitor** - CPU, memory, disk, network monitoring
- ⚙️ **Process Manager** - System process control
- 📋 **Task Manager** - Scheduled and recurring task execution
- ⛓️ **Node Daemon** - Crypto node orchestration (Bitcoin, Ethereum, etc.)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Renderer Process                      │
│                 (React + TypeScript)                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         window.cryptoOS API                     │   │
│  │  (Exposed via contextBridge in preload.ts)     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
                         │ IPC (Type-Safe)
                         │
┌─────────────────────────────────────────────────────────┐
│                    Main Process                         │
│                    (Node.js)                            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         IPC Handlers (ipcMain)                  │   │
│  │  - AI Assistant handlers                       │   │
│  │  - Wallet Manager handlers                     │   │
│  │  - Kiosk/Casino handlers                       │   │
│  │  - System/Process/Task/Node handlers           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Backend Services                        │   │
│  │  - Crypto node daemons (Bitcoin, ETH, etc.)    │   │
│  │  - Wallet encryption/signing                   │   │
│  │  - File system access                          │   │
│  │  - Hardware wallet integration                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Modules

### 1. AI Assistant (`window.cryptoOS.ai`)

Figma Smart Interpreter and general AI orchestration.

**Channels:**
- `loadDesignContext` - Load Figma design context
- `explainDesign` - Get AI explanation of a design
- `generateCode` - Generate React/Electron code from design
- `generateDocs` - Generate architecture documentation
- `sendMessage` - Chat with AI assistant
- `setContext` / `getContext` / `clearContext` - Context management

**Events:**
- `onResponseChunk` - Streaming AI responses
- `onContextUpdated` - Context changes
- `onError` - AI errors

### 2. Wallet Manager (`window.cryptoOS.wallet`)

Multi-chain cryptocurrency wallet management.

**Channels:**
- Wallet operations: `createWallet`, `importWallet`, `deleteWallet`, `listWallets`
- Balance & addresses: `getBalance`, `generateAddress`, `listAddresses`
- Transactions: `sendTransaction`, `listTransactions`, `estimateFee`
- Security: `lockWallet`, `unlockWallet`, `changePassword`, `enable2FA`
- Hardware wallets: `connectHardware`, `listHardwareDevices`
- Message signing: `signMessage`, `verifyMessage`

**Events:**
- `onBalanceUpdated` - Balance changes
- `onTransactionConfirmed` - Transaction confirmations
- `onTransactionPending` - New pending transactions
- `onWalletLocked` - Wallet lock events
- `onWalletError` - Wallet errors

**Supported Chains:**
- Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), Monero (XMR)
- Bitcoin Cash (BCH), Dogecoin (DOGE), Ripple (XRP)
- Cardano (ADA), Polkadot (DOT), Solana (SOL)

### 3. Kiosk (`window.cryptoOS.kiosk`)

Bitcoin ATM / Crypto kiosk operations.

**Channels:**
- Mode control: `enterKioskMode`, `exitKioskMode`, `getKioskStatus`
- Trading: `initiateBuy`, `initiateSell`, `getExchangeRate`
- Compliance: `verifyIdentity`, `getLimits`
- Payment: `processPayment`

**Events:**
- `onKioskModeChanged` - Kiosk mode changes
- `onTransactionStarted` - New kiosk transaction
- `onRateUpdated` - Exchange rate updates

### 4. Casino (`window.cryptoOS.casino`)

GoldenHorse casino & gaming simulation.

**Channels:**
- Casino control: `startCasino`, `stopCasino`, `getCasinoStatus`
- Sessions: `createSession`, `endSession`, `getPlayerStats`
- Games: `listGames`, `placeBet`, `spinSlot`, `playCardGame`
- Horse racing: `getRaceInfo`, `placeHorseBet`, `startRace`, `getRaceResults`
- Social: `getLeaderboard`, `getAchievements`

**Events:**
- `onGameResult` - Game outcomes
- `onRaceUpdate` - Live race position updates
- `onJackpotHit` - Jackpot wins
- `onAchievementUnlocked` - Achievement unlocks

**Supported Games:**
- Slot machines, Blackjack, Roulette, Poker
- Horse racing (GoldenHorse), Dice, Crash

### 5. System Monitor (`window.cryptoOS.system`)

Real-time system monitoring.

**Channels:**
- `getSystemInfo`, `getCPUUsage`, `getMemoryUsage`
- `getDiskUsage`, `getNetworkStats`, `getTemperature`

**Events:**
- `onCPUUpdate` - CPU usage updates
- `onMemoryUpdate` - Memory usage updates
- `onNetworkUpdate` - Network stats updates
- `onThermalAlert` - Temperature warnings

### 6. Process Manager (`window.cryptoOS.process`)

System process control.

**Channels:**
- `listProcesses`, `getProcess`
- `startProcess`, `stopProcess`, `restartProcess`, `killProcess`
- `getProcessLogs`

**Events:**
- `onProcessStarted`, `onProcessStopped`, `onProcessError`
- `onProcessLog` - Process log streams

### 7. Task Manager (`window.cryptoOS.task`)

Scheduled and recurring task management.

**Channels:**
- `createTask`, `updateTask`, `deleteTask`
- `listTasks`, `getTask`
- `startTask`, `stopTask`, `getTaskLogs`

**Events:**
- `onTaskStatusChanged`, `onTaskCompleted`, `onTaskFailed`

**Task Types:**
- Scheduled (cron), Recurring (interval), One-time, Triggered (event-based)

### 8. Node Daemon (`window.cryptoOS.node`)

Crypto node daemon orchestration.

**Channels:**
- Node control: `listNodes`, `getNode`, `startNode`, `stopNode`, `restartNode`
- Blockchain info: `getNodeInfo`, `getBlockchainInfo`, `getPeerInfo`
- Maintenance: `syncNode`, `pruneNode`

**Events:**
- `onNodeStarted`, `onNodeStopped`
- `onNodeSyncing`, `onNodeSynced`
- `onBlockReceived` - New blocks
- `onNodeError`

## Usage

### Renderer Process (React/TypeScript)

#### Example 1: Create a Bitcoin Wallet

```typescript
import React, { useState } from 'react';

export function WalletCreator() {
  const [wallet, setWallet] = useState(null);
  const [seedPhrase, setSeedPhrase] = useState('');

  const createWallet = async () => {
    try {
      const response = await window.cryptoOS.wallet.createWallet({
        name: 'My BTC Wallet',
        chain: 'BTC',
        type: 'hd',
        password: 'super-secret-password',
      });

      if (response.success) {
        setWallet(response.data.wallet);
        setSeedPhrase(response.data.seedPhrase); // SAVE THIS SECURELY!
        console.log('Wallet created:', response.data.wallet);
      } else {
        console.error('Wallet creation failed:', response.error);
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
    }
  };

  return (
    <div>
      <button onClick={createWallet}>Create Wallet</button>
      {wallet && <p>Wallet ID: {wallet.id}</p>}
      {seedPhrase && (
        <div className="seed-phrase">
          <strong>SAVE THIS SEED PHRASE:</strong>
          <code>{seedPhrase}</code>
        </div>
      )}
    </div>
  );
}
```

#### Example 2: Listen for Balance Updates

```typescript
import React, { useEffect, useState } from 'react';

export function BalanceMonitor({ walletId }: { walletId: string }) {
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    // Subscribe to balance updates
    const unsubscribe = window.cryptoOS.wallet.onBalanceUpdated((event) => {
      if (event.payload.walletId === walletId) {
        setBalance(event.payload.newBalance.total);
      }
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, [walletId]);

  return <div>Balance: {balance} BTC</div>;
}
```

#### Example 3: Chat with AI Assistant

```typescript
export function AIChat() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  const sendMessage = async () => {
    const result = await window.cryptoOS.ai.sendMessage({
      message,
      streamResponse: false,
    });

    if (result.success) {
      setResponse(result.data.response);
    }
  };

  return (
    <div>
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
      <div>{response}</div>
    </div>
  );
}
```

#### Example 4: Start a Horse Race

```typescript
export function GoldenHorseRace({ raceId }: { raceId: string }) {
  const [raceProgress, setRaceProgress] = useState(0);

  useEffect(() => {
    // Listen for race updates
    const unsubscribe = window.cryptoOS.casino.onRaceUpdate((event) => {
      if (event.payload.raceId === raceId) {
        setRaceProgress(event.payload.progress);
      }
    });

    return () => unsubscribe();
  }, [raceId]);

  const startRace = async () => {
    const result = await window.cryptoOS.casino.startRace({
      raceId,
      simulate: true,
    });

    console.log('Race started:', result.data);
  };

  return (
    <div>
      <button onClick={startRace}>Start Race</button>
      <progress value={raceProgress} max={100} />
    </div>
  );
}
```

#### Example 5: Monitor System CPU

```typescript
export function CPUMonitor() {
  const [cpuUsage, setCpuUsage] = useState(0);

  useEffect(() => {
    // Real-time CPU updates
    const unsubscribe = window.cryptoOS.system.onCPUUpdate((event) => {
      setCpuUsage(event.payload.usage.overall);
    });

    // Get initial value
    window.cryptoOS.system.getCPUUsage({}).then((result) => {
      if (result.success) {
        setCpuUsage(result.data.usage.overall);
      }
    });

    return () => unsubscribe();
  }, []);

  return <div>CPU: {cpuUsage.toFixed(1)}%</div>;
}
```

### Main Process (Node.js)

#### Setting Up IPC Handlers

In your main Electron process:

```typescript
// src/main/index.ts
import { app, BrowserWindow } from 'electron';
import { registerAllIPCHandlers } from './ipc-handlers';
import path from 'path';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  // Register all IPC handlers
  registerAllIPCHandlers();

  createWindow();
});
```

#### Implementing Custom Handlers

```typescript
// src/main/ipc-handlers.ts
import { ipcMain } from 'electron';
import { WALLET_MANAGER_CHANNELS, createSuccessResponse, createErrorResponse } from '../shared/ipc';

ipcMain.handle(WALLET_MANAGER_CHANNELS.CREATE_WALLET, async (_event, request) => {
  try {
    const { name, chain, type, password } = request.payload;

    // Your wallet creation logic here
    const wallet = await myWalletService.createWallet(name, chain, type, password);

    return createSuccessResponse(request.id, {
      wallet,
      seedPhrase: wallet.seedPhrase,
      addresses: wallet.addresses,
    });
  } catch (error) {
    return createErrorResponse(
      request.id,
      'WALLET_CREATION_FAILED',
      error.message,
      error
    );
  }
});
```

#### Emitting Events to Renderer

```typescript
import { BrowserWindow } from 'electron';
import { WALLET_MANAGER_CHANNELS, createEvent } from '../shared/ipc';

function notifyBalanceUpdate(walletId: string, oldBalance: any, newBalance: any) {
  const event = createEvent(WALLET_MANAGER_CHANNELS.ON_BALANCE_UPDATED, {
    walletId,
    oldBalance,
    newBalance,
    timestamp: Date.now(),
  });

  // Send to all renderer windows
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(WALLET_MANAGER_CHANNELS.ON_BALANCE_UPDATED, event);
  });
}
```

## API Reference

All types are fully documented in TypeScript. Import them from the shared IPC module:

```typescript
import type {
  // Base types
  IPCRequest,
  IPCResponse,
  IPCEvent,
  IPCError,

  // AI Assistant
  LoadDesignContextRequest,
  GenerateCodeRequest,
  SendMessageRequest,

  // Wallet Manager
  CreateWalletRequest,
  SendTransactionRequest,
  WalletBalance,
  Transaction,

  // Kiosk & Casino
  InitiateBuyRequest,
  PlaceHorseBetRequest,
  Race,
  Horse,

  // System
  SystemInfo,
  CPUUsage,
  MemoryUsage,
  Process,
  Task,
  NodeDaemon,
} from './shared/ipc';
```

## Type Safety

The entire IPC system is **fully type-safe** end-to-end:

1. **Renderer → Main**: Request payloads are typed based on the channel
2. **Main → Renderer**: Response data is typed based on the channel
3. **Events**: Event payloads are typed for each event channel

TypeScript will catch:
- Invalid channel names
- Missing required fields in requests
- Type mismatches in responses
- Incorrect event payload structures

## Security

This IPC interface follows Electron security best practices:

- ✅ **Context Isolation** enabled
- ✅ **Node Integration** disabled in renderer
- ✅ **contextBridge** used to expose APIs
- ✅ No direct IPC channel exposure to renderer
- ✅ All requests validated on main process
- ✅ Sensitive operations (wallet, passwords) handled only in main process

## Development

### Project Structure

```
cryptoos-desktop/
├── src/
│   ├── main/              # Main process (Node.js)
│   │   ├── index.ts       # Main entry point
│   │   └── ipc-handlers.ts # IPC handler implementations
│   │
│   ├── preload/           # Preload scripts
│   │   └── index.ts       # IPC bridge (contextBridge)
│   │
│   ├── renderer/          # Renderer process (React)
│   │   └── global.d.ts    # TypeScript declarations
│   │
│   └── shared/            # Shared code
│       └── ipc/           # IPC type definitions
│           ├── base.types.ts
│           ├── ai-assistant.types.ts
│           ├── wallet-manager.types.ts
│           ├── kiosk-casino.types.ts
│           ├── system-manager.types.ts
│           └── index.ts
│
└── README.md
```

### Adding a New IPC Channel

1. **Define types** in `src/shared/ipc/your-module.types.ts`:

```typescript
export const YOUR_MODULE_CHANNELS = {
  DO_SOMETHING: 'cryptoos:yourmodule:do-something' as IPCChannel,
} as const;

export interface DoSomethingRequest {
  input: string;
}

export interface DoSomethingResponse {
  output: string;
}
```

2. **Add to preload** in `src/preload/index.ts`:

```typescript
const yourModuleAPI = {
  doSomething: (payload: DoSomethingRequest) =>
    invoke(YOUR_MODULE_CHANNELS.DO_SOMETHING, payload),
};

// Add to cryptoOSAPI
const cryptoOSAPI = {
  // ...
  yourModule: yourModuleAPI,
};
```

3. **Implement handler** in `src/main/ipc-handlers.ts`:

```typescript
ipcMain.handle(YOUR_MODULE_CHANNELS.DO_SOMETHING, async (_event, request) => {
  const result = await yourService.doSomething(request.payload.input);
  return createSuccessResponse(request.id, { output: result });
});
```

4. **Use in renderer**:

```typescript
const result = await window.cryptoOS.yourModule.doSomething({ input: 'test' });
```

---

## License

MIT

## Author

Joseph Michael Rounsaville

---

**CryptoOS Desktop** - A complete desktop environment for cryptocurrency operations, AI assistance, and system management.
