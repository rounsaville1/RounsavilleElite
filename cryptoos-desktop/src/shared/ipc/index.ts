/**
 * CryptoOS Desktop - IPC Interface Index
 *
 * Central export point for all IPC types, channels, and utilities.
 */

// Base types and utilities
export * from './base.types';

// AI Assistant
export * from './ai-assistant.types';

// Wallet Manager
export * from './wallet-manager.types';

// Kiosk & Casino
export * from './kiosk-casino.types';

// System/Process/Task/Node Management
export * from './system-manager.types';

// ============================================================================
// UNIFIED IPC CONTRACT
// ============================================================================

import type { AIAssistantIPCContract } from './ai-assistant.types';
import type { WalletManagerIPCContract } from './wallet-manager.types';
import type { KioskIPCContract, CasinoIPCContract } from './kiosk-casino.types';
import type {
  SystemMonitorIPCContract,
  ProcessManagerIPCContract,
  TaskManagerIPCContract,
  NodeDaemonIPCContract,
} from './system-manager.types';

/**
 * Complete IPC contract for all CryptoOS Desktop channels
 */
export type CryptoOSIPCContract = AIAssistantIPCContract &
  WalletManagerIPCContract &
  KioskIPCContract &
  CasinoIPCContract &
  SystemMonitorIPCContract &
  ProcessManagerIPCContract &
  TaskManagerIPCContract &
  NodeDaemonIPCContract;
