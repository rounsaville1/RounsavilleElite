/**
 * CryptoOS Desktop - Wallet Manager IPC Interface
 *
 * Type-safe IPC channels for cryptocurrency wallet management,
 * including Bitcoin, Ethereum, Litecoin, Monero, and other chains.
 */

import type { IPCChannel, IPCRequest, IPCResponse, IPCEvent } from './base.types';

// ============================================================================
// WALLET MANAGER CHANNELS
// ============================================================================

export const WALLET_MANAGER_CHANNELS = {
  // Wallet operations
  CREATE_WALLET: 'cryptoos:wallet:create-wallet' as IPCChannel,
  IMPORT_WALLET: 'cryptoos:wallet:import-wallet' as IPCChannel,
  DELETE_WALLET: 'cryptoos:wallet:delete-wallet' as IPCChannel,
  LIST_WALLETS: 'cryptoos:wallet:list-wallets' as IPCChannel,
  GET_WALLET: 'cryptoos:wallet:get-wallet' as IPCChannel,
  BACKUP_WALLET: 'cryptoos:wallet:backup-wallet' as IPCChannel,

  // Balance & addresses
  GET_BALANCE: 'cryptoos:wallet:get-balance' as IPCChannel,
  GET_ADDRESS: 'cryptoos:wallet:get-address' as IPCChannel,
  GENERATE_ADDRESS: 'cryptoos:wallet:generate-address' as IPCChannel,
  LIST_ADDRESSES: 'cryptoos:wallet:list-addresses' as IPCChannel,

  // Transactions
  SEND_TRANSACTION: 'cryptoos:wallet:send-transaction' as IPCChannel,
  GET_TRANSACTION: 'cryptoos:wallet:get-transaction' as IPCChannel,
  LIST_TRANSACTIONS: 'cryptoos:wallet:list-transactions' as IPCChannel,
  ESTIMATE_FEE: 'cryptoos:wallet:estimate-fee' as IPCChannel,
  SIGN_MESSAGE: 'cryptoos:wallet:sign-message' as IPCChannel,
  VERIFY_MESSAGE: 'cryptoos:wallet:verify-message' as IPCChannel,

  // Security
  LOCK_WALLET: 'cryptoos:wallet:lock-wallet' as IPCChannel,
  UNLOCK_WALLET: 'cryptoos:wallet:unlock-wallet' as IPCChannel,
  CHANGE_PASSWORD: 'cryptoos:wallet:change-password' as IPCChannel,
  ENABLE_2FA: 'cryptoos:wallet:enable-2fa' as IPCChannel,

  // Hardware wallet support
  CONNECT_HARDWARE: 'cryptoos:wallet:connect-hardware' as IPCChannel,
  DISCONNECT_HARDWARE: 'cryptoos:wallet:disconnect-hardware' as IPCChannel,
  LIST_HARDWARE_DEVICES: 'cryptoos:wallet:list-hardware-devices' as IPCChannel,

  // Events (one-way from main → renderer)
  ON_BALANCE_UPDATED: 'cryptoos:wallet:on-balance-updated' as IPCChannel,
  ON_TRANSACTION_CONFIRMED: 'cryptoos:wallet:on-transaction-confirmed' as IPCChannel,
  ON_TRANSACTION_PENDING: 'cryptoos:wallet:on-transaction-pending' as IPCChannel,
  ON_WALLET_LOCKED: 'cryptoos:wallet:on-wallet-locked' as IPCChannel,
  ON_WALLET_ERROR: 'cryptoos:wallet:on-wallet-error' as IPCChannel,
} as const;

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export enum CryptoChain {
  BITCOIN = 'BTC',
  ETHEREUM = 'ETH',
  LITECOIN = 'LTC',
  MONERO = 'XMR',
  BITCOIN_CASH = 'BCH',
  DOGECOIN = 'DOGE',
  RIPPLE = 'XRP',
  CARDANO = 'ADA',
  POLKADOT = 'DOT',
  SOLANA = 'SOL',
}

export enum WalletType {
  HD_WALLET = 'hd',
  SINGLE_ADDRESS = 'single',
  HARDWARE = 'hardware',
  MULTISIG = 'multisig',
  WATCH_ONLY = 'watch-only',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum AddressType {
  LEGACY = 'legacy', // P2PKH
  SEGWIT = 'segwit', // P2WPKH
  NATIVE_SEGWIT = 'native-segwit', // bech32
  TAPROOT = 'taproot', // P2TR
}

// ============================================================================
// CORE TYPES
// ============================================================================

export interface Wallet {
  id: string;
  name: string;
  chain: CryptoChain;
  type: WalletType;
  encrypted: boolean;
  locked: boolean;
  createdAt: number;
  lastAccessedAt: number;
  balance?: WalletBalance;
  metadata?: {
    description?: string;
    tags?: string[];
    [key: string]: unknown;
  };
}

export interface WalletBalance {
  confirmed: string; // String to preserve precision
  unconfirmed: string;
  total: string;
  currency: CryptoChain;
  fiatValue?: {
    amount: string;
    currency: 'USD' | 'EUR' | 'GBP';
    lastUpdated: number;
  };
}

export interface WalletAddress {
  address: string;
  type: AddressType;
  label?: string;
  balance: string;
  transactions: number;
  createdAt: number;
  derivationPath?: string; // For HD wallets
}

export interface Transaction {
  id: string; // txid
  walletId: string;
  chain: CryptoChain;
  status: TransactionStatus;
  type: 'send' | 'receive';
  amount: string;
  fee: string;
  from: string[];
  to: string[];
  confirmations: number;
  timestamp: number;
  blockHeight?: number;
  blockHash?: string;
  memo?: string;
  metadata?: {
    replaceable?: boolean; // RBF
    estimatedConfirmTime?: number;
    [key: string]: unknown;
  };
}

export interface HardwareDevice {
  id: string;
  type: 'ledger' | 'trezor' | 'coldcard' | 'other';
  model: string;
  firmwareVersion: string;
  connected: boolean;
  supportedChains: CryptoChain[];
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface CreateWalletRequest {
  name: string;
  chain: CryptoChain;
  type: WalletType;
  password?: string;
  seedPhrase?: string; // Optional, will be generated if not provided
  metadata?: Record<string, unknown>;
}

export interface ImportWalletRequest {
  name: string;
  chain: CryptoChain;
  type: WalletType;
  source: {
    seedPhrase?: string;
    privateKey?: string;
    publicKey?: string; // For watch-only
    xpub?: string; // For HD watch-only
    file?: string; // Path to wallet file
  };
  password?: string;
  metadata?: Record<string, unknown>;
}

export interface DeleteWalletRequest {
  walletId: string;
  password?: string;
  confirmPhrase: string; // Must match "DELETE MY WALLET"
}

export interface GetBalanceRequest {
  walletId: string;
  includeFiatValue?: boolean;
  fiatCurrency?: 'USD' | 'EUR' | 'GBP';
}

export interface GenerateAddressRequest {
  walletId: string;
  type?: AddressType;
  label?: string;
}

export interface ListAddressesRequest {
  walletId: string;
  includeZeroBalance?: boolean;
  limit?: number;
  offset?: number;
}

export interface SendTransactionRequest {
  walletId: string;
  to: string;
  amount: string;
  fee?: string; // Optional, will be estimated if not provided
  feeRate?: number; // sat/byte for BTC, gwei for ETH
  memo?: string;
  password?: string; // Required if wallet is encrypted
  rbf?: boolean; // Replace-by-fee
}

export interface ListTransactionsRequest {
  walletId: string;
  limit?: number;
  offset?: number;
  status?: TransactionStatus;
  type?: 'send' | 'receive';
  startDate?: number;
  endDate?: number;
}

export interface EstimateFeeRequest {
  walletId: string;
  to: string;
  amount: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface SignMessageRequest {
  walletId: string;
  message: string;
  address?: string;
  password?: string;
}

export interface VerifyMessageRequest {
  message: string;
  signature: string;
  address: string;
  chain: CryptoChain;
}

export interface UnlockWalletRequest {
  walletId: string;
  password: string;
  duration?: number; // Auto-lock after N seconds, 0 = no auto-lock
}

export interface ChangePasswordRequest {
  walletId: string;
  currentPassword: string;
  newPassword: string;
}

export interface ConnectHardwareRequest {
  deviceType: 'ledger' | 'trezor' | 'coldcard';
  transport?: 'usb' | 'bluetooth';
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface CreateWalletResponse {
  wallet: Wallet;
  seedPhrase?: string; // Only returned on creation, never stored
  addresses: WalletAddress[];
}

export interface ImportWalletResponse {
  wallet: Wallet;
  addresses: WalletAddress[];
}

export interface BackupWalletResponse {
  backupPath: string;
  encrypted: boolean;
  timestamp: number;
}

export interface SendTransactionResponse {
  transaction: Transaction;
  estimatedConfirmTime: number; // seconds
}

export interface EstimateFeeResponse {
  low: {
    fee: string;
    feeRate: number;
    estimatedTime: number; // minutes
  };
  medium: {
    fee: string;
    feeRate: number;
    estimatedTime: number;
  };
  high: {
    fee: string;
    feeRate: number;
    estimatedTime: number;
  };
}

export interface SignMessageResponse {
  signature: string;
  address: string;
  message: string;
}

export interface VerifyMessageResponse {
  valid: boolean;
  recoveredAddress?: string;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface BalanceUpdatedPayload {
  walletId: string;
  oldBalance: WalletBalance;
  newBalance: WalletBalance;
  timestamp: number;
}

export interface TransactionConfirmedPayload {
  transaction: Transaction;
  walletId: string;
  blockHeight: number;
  confirmations: number;
}

export interface TransactionPendingPayload {
  transaction: Transaction;
  walletId: string;
  estimatedConfirmTime: number;
}

export interface WalletLockedPayload {
  walletId: string;
  timestamp: number;
  reason: 'auto-lock' | 'manual' | 'security';
}

export interface WalletErrorPayload {
  walletId?: string;
  code: string;
  message: string;
  severity: 'warning' | 'error' | 'critical';
}

// ============================================================================
// TYPED IPC CONTRACTS
// ============================================================================

export type WalletManagerIPCContract = {
  // Wallet operations
  [WALLET_MANAGER_CHANNELS.CREATE_WALLET]: {
    request: IPCRequest<CreateWalletRequest>;
    response: IPCResponse<CreateWalletResponse>;
  };
  [WALLET_MANAGER_CHANNELS.IMPORT_WALLET]: {
    request: IPCRequest<ImportWalletRequest>;
    response: IPCResponse<ImportWalletResponse>;
  };
  [WALLET_MANAGER_CHANNELS.DELETE_WALLET]: {
    request: IPCRequest<DeleteWalletRequest>;
    response: IPCResponse<{ deleted: boolean }>;
  };
  [WALLET_MANAGER_CHANNELS.LIST_WALLETS]: {
    request: IPCRequest<{ chain?: CryptoChain }>;
    response: IPCResponse<{ wallets: Wallet[] }>;
  };
  [WALLET_MANAGER_CHANNELS.GET_WALLET]: {
    request: IPCRequest<{ walletId: string }>;
    response: IPCResponse<{ wallet: Wallet }>;
  };
  [WALLET_MANAGER_CHANNELS.BACKUP_WALLET]: {
    request: IPCRequest<{ walletId: string; password?: string }>;
    response: IPCResponse<BackupWalletResponse>;
  };

  // Balance & addresses
  [WALLET_MANAGER_CHANNELS.GET_BALANCE]: {
    request: IPCRequest<GetBalanceRequest>;
    response: IPCResponse<WalletBalance>;
  };
  [WALLET_MANAGER_CHANNELS.GET_ADDRESS]: {
    request: IPCRequest<{ walletId: string; address: string }>;
    response: IPCResponse<{ address: WalletAddress }>;
  };
  [WALLET_MANAGER_CHANNELS.GENERATE_ADDRESS]: {
    request: IPCRequest<GenerateAddressRequest>;
    response: IPCResponse<{ address: WalletAddress }>;
  };
  [WALLET_MANAGER_CHANNELS.LIST_ADDRESSES]: {
    request: IPCRequest<ListAddressesRequest>;
    response: IPCResponse<{ addresses: WalletAddress[]; total: number }>;
  };

  // Transactions
  [WALLET_MANAGER_CHANNELS.SEND_TRANSACTION]: {
    request: IPCRequest<SendTransactionRequest>;
    response: IPCResponse<SendTransactionResponse>;
  };
  [WALLET_MANAGER_CHANNELS.GET_TRANSACTION]: {
    request: IPCRequest<{ walletId: string; txId: string }>;
    response: IPCResponse<{ transaction: Transaction }>;
  };
  [WALLET_MANAGER_CHANNELS.LIST_TRANSACTIONS]: {
    request: IPCRequest<ListTransactionsRequest>;
    response: IPCResponse<{ transactions: Transaction[]; total: number }>;
  };
  [WALLET_MANAGER_CHANNELS.ESTIMATE_FEE]: {
    request: IPCRequest<EstimateFeeRequest>;
    response: IPCResponse<EstimateFeeResponse>;
  };
  [WALLET_MANAGER_CHANNELS.SIGN_MESSAGE]: {
    request: IPCRequest<SignMessageRequest>;
    response: IPCResponse<SignMessageResponse>;
  };
  [WALLET_MANAGER_CHANNELS.VERIFY_MESSAGE]: {
    request: IPCRequest<VerifyMessageRequest>;
    response: IPCResponse<VerifyMessageResponse>;
  };

  // Security
  [WALLET_MANAGER_CHANNELS.LOCK_WALLET]: {
    request: IPCRequest<{ walletId: string }>;
    response: IPCResponse<{ locked: boolean }>;
  };
  [WALLET_MANAGER_CHANNELS.UNLOCK_WALLET]: {
    request: IPCRequest<UnlockWalletRequest>;
    response: IPCResponse<{ unlocked: boolean; autoLockAt?: number }>;
  };
  [WALLET_MANAGER_CHANNELS.CHANGE_PASSWORD]: {
    request: IPCRequest<ChangePasswordRequest>;
    response: IPCResponse<{ success: boolean }>;
  };
  [WALLET_MANAGER_CHANNELS.ENABLE_2FA]: {
    request: IPCRequest<{ walletId: string; secret: string }>;
    response: IPCResponse<{ enabled: boolean; backupCodes: string[] }>;
  };

  // Hardware wallet support
  [WALLET_MANAGER_CHANNELS.CONNECT_HARDWARE]: {
    request: IPCRequest<ConnectHardwareRequest>;
    response: IPCResponse<{ device: HardwareDevice }>;
  };
  [WALLET_MANAGER_CHANNELS.DISCONNECT_HARDWARE]: {
    request: IPCRequest<{ deviceId: string }>;
    response: IPCResponse<{ disconnected: boolean }>;
  };
  [WALLET_MANAGER_CHANNELS.LIST_HARDWARE_DEVICES]: {
    request: IPCRequest<{}>;
    response: IPCResponse<{ devices: HardwareDevice[] }>;
  };

  // Events
  [WALLET_MANAGER_CHANNELS.ON_BALANCE_UPDATED]: IPCEvent<BalanceUpdatedPayload>;
  [WALLET_MANAGER_CHANNELS.ON_TRANSACTION_CONFIRMED]: IPCEvent<TransactionConfirmedPayload>;
  [WALLET_MANAGER_CHANNELS.ON_TRANSACTION_PENDING]: IPCEvent<TransactionPendingPayload>;
  [WALLET_MANAGER_CHANNELS.ON_WALLET_LOCKED]: IPCEvent<WalletLockedPayload>;
  [WALLET_MANAGER_CHANNELS.ON_WALLET_ERROR]: IPCEvent<WalletErrorPayload>;
};
