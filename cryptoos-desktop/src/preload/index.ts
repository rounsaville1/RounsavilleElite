/**
 * CryptoOS Desktop - Preload Script
 *
 * Type-safe IPC bridge between main and renderer processes.
 * Exposes a secure API to the renderer through contextBridge.
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type {
  IPCRequest,
  IPCResponse,
  IPCEvent,
  IPCEventListener,
  IPCChannel,
} from '../shared/ipc/base.types';
import {
  AI_ASSISTANT_CHANNELS,
  WALLET_MANAGER_CHANNELS,
  KIOSK_CHANNELS,
  CASINO_CHANNELS,
  SYSTEM_MONITOR_CHANNELS,
  PROCESS_MANAGER_CHANNELS,
  TASK_MANAGER_CHANNELS,
  NODE_DAEMON_CHANNELS,
} from '../shared/ipc';

// ============================================================================
// IPC HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Send a typed IPC request and get a typed response
 */
async function invoke<TRequest, TResponse>(
  channel: IPCChannel,
  payload: TRequest
): Promise<IPCResponse<TResponse>> {
  const request: IPCRequest<TRequest> = {
    id: generateRequestId(),
    timestamp: Date.now(),
    payload,
  };

  const response = await ipcRenderer.invoke(channel, request);
  return response as IPCResponse<TResponse>;
}

/**
 * Subscribe to a typed IPC event
 */
function on<TPayload>(
  channel: IPCChannel,
  listener: IPCEventListener<TPayload>
): () => void {
  const wrappedListener = (_event: IpcRendererEvent, data: IPCEvent<TPayload>) => {
    listener(data);
  };

  ipcRenderer.on(channel, wrappedListener);

  // Return unsubscribe function
  return () => {
    ipcRenderer.removeListener(channel, wrappedListener);
  };
}

/**
 * Subscribe to a typed IPC event (once)
 */
function once<TPayload>(
  channel: IPCChannel,
  listener: IPCEventListener<TPayload>
): void {
  const wrappedListener = (_event: IpcRendererEvent, data: IPCEvent<TPayload>) => {
    listener(data);
  };

  ipcRenderer.once(channel, wrappedListener);
}

// ============================================================================
// AI ASSISTANT API
// ============================================================================

const aiAssistantAPI = {
  // Design interpretation
  loadDesignContext: (payload: any) =>
    invoke(AI_ASSISTANT_CHANNELS.LOAD_DESIGN_CONTEXT, payload),
  explainDesign: (payload: any) =>
    invoke(AI_ASSISTANT_CHANNELS.EXPLAIN_DESIGN, payload),
  generateCode: (payload: any) =>
    invoke(AI_ASSISTANT_CHANNELS.GENERATE_CODE, payload),
  generateDocs: (payload: any) =>
    invoke(AI_ASSISTANT_CHANNELS.GENERATE_DOCS, payload),

  // Chat & interaction
  sendMessage: (payload: any) =>
    invoke(AI_ASSISTANT_CHANNELS.SEND_MESSAGE, payload),
  cancelRequest: (payload: any) =>
    invoke(AI_ASSISTANT_CHANNELS.CANCEL_REQUEST, payload),

  // Context management
  setContext: (payload: any) =>
    invoke(AI_ASSISTANT_CHANNELS.SET_CONTEXT, payload),
  clearContext: (payload: any) =>
    invoke(AI_ASSISTANT_CHANNELS.CLEAR_CONTEXT, payload),
  getContext: (payload: any) =>
    invoke(AI_ASSISTANT_CHANNELS.GET_CONTEXT, payload),

  // Event listeners
  onResponseChunk: (listener: IPCEventListener<any>) =>
    on(AI_ASSISTANT_CHANNELS.ON_RESPONSE_CHUNK, listener),
  onContextUpdated: (listener: IPCEventListener<any>) =>
    on(AI_ASSISTANT_CHANNELS.ON_CONTEXT_UPDATED, listener),
  onError: (listener: IPCEventListener<any>) =>
    on(AI_ASSISTANT_CHANNELS.ON_ERROR, listener),
};

// ============================================================================
// WALLET MANAGER API
// ============================================================================

const walletManagerAPI = {
  // Wallet operations
  createWallet: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.CREATE_WALLET, payload),
  importWallet: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.IMPORT_WALLET, payload),
  deleteWallet: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.DELETE_WALLET, payload),
  listWallets: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.LIST_WALLETS, payload),
  getWallet: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.GET_WALLET, payload),
  backupWallet: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.BACKUP_WALLET, payload),

  // Balance & addresses
  getBalance: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.GET_BALANCE, payload),
  getAddress: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.GET_ADDRESS, payload),
  generateAddress: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.GENERATE_ADDRESS, payload),
  listAddresses: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.LIST_ADDRESSES, payload),

  // Transactions
  sendTransaction: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.SEND_TRANSACTION, payload),
  getTransaction: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.GET_TRANSACTION, payload),
  listTransactions: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.LIST_TRANSACTIONS, payload),
  estimateFee: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.ESTIMATE_FEE, payload),
  signMessage: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.SIGN_MESSAGE, payload),
  verifyMessage: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.VERIFY_MESSAGE, payload),

  // Security
  lockWallet: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.LOCK_WALLET, payload),
  unlockWallet: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.UNLOCK_WALLET, payload),
  changePassword: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.CHANGE_PASSWORD, payload),
  enable2FA: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.ENABLE_2FA, payload),

  // Hardware wallet
  connectHardware: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.CONNECT_HARDWARE, payload),
  disconnectHardware: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.DISCONNECT_HARDWARE, payload),
  listHardwareDevices: (payload: any) =>
    invoke(WALLET_MANAGER_CHANNELS.LIST_HARDWARE_DEVICES, payload),

  // Event listeners
  onBalanceUpdated: (listener: IPCEventListener<any>) =>
    on(WALLET_MANAGER_CHANNELS.ON_BALANCE_UPDATED, listener),
  onTransactionConfirmed: (listener: IPCEventListener<any>) =>
    on(WALLET_MANAGER_CHANNELS.ON_TRANSACTION_CONFIRMED, listener),
  onTransactionPending: (listener: IPCEventListener<any>) =>
    on(WALLET_MANAGER_CHANNELS.ON_TRANSACTION_PENDING, listener),
  onWalletLocked: (listener: IPCEventListener<any>) =>
    on(WALLET_MANAGER_CHANNELS.ON_WALLET_LOCKED, listener),
  onWalletError: (listener: IPCEventListener<any>) =>
    on(WALLET_MANAGER_CHANNELS.ON_WALLET_ERROR, listener),
};

// ============================================================================
// KIOSK API
// ============================================================================

const kioskAPI = {
  enterKioskMode: (payload: any) =>
    invoke(KIOSK_CHANNELS.ENTER_KIOSK_MODE, payload),
  exitKioskMode: (payload: any) =>
    invoke(KIOSK_CHANNELS.EXIT_KIOSK_MODE, payload),
  getKioskStatus: (payload: any) =>
    invoke(KIOSK_CHANNELS.GET_KIOSK_STATUS, payload),
  updateKioskConfig: (payload: any) =>
    invoke(KIOSK_CHANNELS.UPDATE_KIOSK_CONFIG, payload),
  initiateBuy: (payload: any) =>
    invoke(KIOSK_CHANNELS.INITIATE_BUY, payload),
  initiateSell: (payload: any) =>
    invoke(KIOSK_CHANNELS.INITIATE_SELL, payload),
  getExchangeRate: (payload: any) =>
    invoke(KIOSK_CHANNELS.GET_EXCHANGE_RATE, payload),
  getLimits: (payload: any) =>
    invoke(KIOSK_CHANNELS.GET_LIMITS, payload),
  verifyIdentity: (payload: any) =>
    invoke(KIOSK_CHANNELS.VERIFY_IDENTITY, payload),
  processPayment: (payload: any) =>
    invoke(KIOSK_CHANNELS.PROCESS_PAYMENT, payload),

  // Event listeners
  onKioskModeChanged: (listener: IPCEventListener<any>) =>
    on(KIOSK_CHANNELS.ON_KIOSK_MODE_CHANGED, listener),
  onTransactionStarted: (listener: IPCEventListener<any>) =>
    on(KIOSK_CHANNELS.ON_TRANSACTION_STARTED, listener),
  onRateUpdated: (listener: IPCEventListener<any>) =>
    on(KIOSK_CHANNELS.ON_RATE_UPDATED, listener),
};

// ============================================================================
// CASINO API
// ============================================================================

const casinoAPI = {
  startCasino: (payload: any) =>
    invoke(CASINO_CHANNELS.START_CASINO, payload),
  stopCasino: (payload: any) =>
    invoke(CASINO_CHANNELS.STOP_CASINO, payload),
  getCasinoStatus: (payload: any) =>
    invoke(CASINO_CHANNELS.GET_CASINO_STATUS, payload),
  updateCasinoConfig: (payload: any) =>
    invoke(CASINO_CHANNELS.UPDATE_CASINO_CONFIG, payload),
  createSession: (payload: any) =>
    invoke(CASINO_CHANNELS.CREATE_SESSION, payload),
  endSession: (payload: any) =>
    invoke(CASINO_CHANNELS.END_SESSION, payload),
  getSession: (payload: any) =>
    invoke(CASINO_CHANNELS.GET_SESSION, payload),
  getPlayerStats: (payload: any) =>
    invoke(CASINO_CHANNELS.GET_PLAYER_STATS, payload),
  listGames: (payload: any) =>
    invoke(CASINO_CHANNELS.LIST_GAMES, payload),
  getGame: (payload: any) =>
    invoke(CASINO_CHANNELS.GET_GAME, payload),
  placeBet: (payload: any) =>
    invoke(CASINO_CHANNELS.PLACE_BET, payload),
  spinSlot: (payload: any) =>
    invoke(CASINO_CHANNELS.SPIN_SLOT, payload),
  playCardGame: (payload: any) =>
    invoke(CASINO_CHANNELS.PLAY_CARD_GAME, payload),
  getRaceInfo: (payload: any) =>
    invoke(CASINO_CHANNELS.GET_RACE_INFO, payload),
  placeHorseBet: (payload: any) =>
    invoke(CASINO_CHANNELS.PLACE_HORSE_BET, payload),
  startRace: (payload: any) =>
    invoke(CASINO_CHANNELS.START_RACE, payload),
  getRaceResults: (payload: any) =>
    invoke(CASINO_CHANNELS.GET_RACE_RESULTS, payload),
  getLeaderboard: (payload: any) =>
    invoke(CASINO_CHANNELS.GET_LEADERBOARD, payload),
  getAchievements: (payload: any) =>
    invoke(CASINO_CHANNELS.GET_ACHIEVEMENTS, payload),
  unlockAchievement: (payload: any) =>
    invoke(CASINO_CHANNELS.UNLOCK_ACHIEVEMENT, payload),

  // Event listeners
  onGameResult: (listener: IPCEventListener<any>) =>
    on(CASINO_CHANNELS.ON_GAME_RESULT, listener),
  onRaceUpdate: (listener: IPCEventListener<any>) =>
    on(CASINO_CHANNELS.ON_RACE_UPDATE, listener),
  onJackpotHit: (listener: IPCEventListener<any>) =>
    on(CASINO_CHANNELS.ON_JACKPOT_HIT, listener),
  onAchievementUnlocked: (listener: IPCEventListener<any>) =>
    on(CASINO_CHANNELS.ON_ACHIEVEMENT_UNLOCKED, listener),
};

// ============================================================================
// SYSTEM MONITOR API
// ============================================================================

const systemMonitorAPI = {
  getSystemInfo: (payload: any) =>
    invoke(SYSTEM_MONITOR_CHANNELS.GET_SYSTEM_INFO, payload),
  getCPUUsage: (payload: any) =>
    invoke(SYSTEM_MONITOR_CHANNELS.GET_CPU_USAGE, payload),
  getMemoryUsage: (payload: any) =>
    invoke(SYSTEM_MONITOR_CHANNELS.GET_MEMORY_USAGE, payload),
  getDiskUsage: (payload: any) =>
    invoke(SYSTEM_MONITOR_CHANNELS.GET_DISK_USAGE, payload),
  getNetworkStats: (payload: any) =>
    invoke(SYSTEM_MONITOR_CHANNELS.GET_NETWORK_STATS, payload),
  getTemperature: (payload: any) =>
    invoke(SYSTEM_MONITOR_CHANNELS.GET_TEMPERATURE, payload),

  // Event listeners
  onCPUUpdate: (listener: IPCEventListener<any>) =>
    on(SYSTEM_MONITOR_CHANNELS.ON_CPU_UPDATE, listener),
  onMemoryUpdate: (listener: IPCEventListener<any>) =>
    on(SYSTEM_MONITOR_CHANNELS.ON_MEMORY_UPDATE, listener),
  onNetworkUpdate: (listener: IPCEventListener<any>) =>
    on(SYSTEM_MONITOR_CHANNELS.ON_NETWORK_UPDATE, listener),
  onThermalAlert: (listener: IPCEventListener<any>) =>
    on(SYSTEM_MONITOR_CHANNELS.ON_THERMAL_ALERT, listener),
};

// ============================================================================
// PROCESS MANAGER API
// ============================================================================

const processManagerAPI = {
  listProcesses: (payload: any) =>
    invoke(PROCESS_MANAGER_CHANNELS.LIST_PROCESSES, payload),
  getProcess: (payload: any) =>
    invoke(PROCESS_MANAGER_CHANNELS.GET_PROCESS, payload),
  startProcess: (payload: any) =>
    invoke(PROCESS_MANAGER_CHANNELS.START_PROCESS, payload),
  stopProcess: (payload: any) =>
    invoke(PROCESS_MANAGER_CHANNELS.STOP_PROCESS, payload),
  restartProcess: (payload: any) =>
    invoke(PROCESS_MANAGER_CHANNELS.RESTART_PROCESS, payload),
  killProcess: (payload: any) =>
    invoke(PROCESS_MANAGER_CHANNELS.KILL_PROCESS, payload),
  getProcessLogs: (payload: any) =>
    invoke(PROCESS_MANAGER_CHANNELS.GET_PROCESS_LOGS, payload),

  // Event listeners
  onProcessStarted: (listener: IPCEventListener<any>) =>
    on(PROCESS_MANAGER_CHANNELS.ON_PROCESS_STARTED, listener),
  onProcessStopped: (listener: IPCEventListener<any>) =>
    on(PROCESS_MANAGER_CHANNELS.ON_PROCESS_STOPPED, listener),
  onProcessError: (listener: IPCEventListener<any>) =>
    on(PROCESS_MANAGER_CHANNELS.ON_PROCESS_ERROR, listener),
  onProcessLog: (listener: IPCEventListener<any>) =>
    on(PROCESS_MANAGER_CHANNELS.ON_PROCESS_LOG, listener),
};

// ============================================================================
// TASK MANAGER API
// ============================================================================

const taskManagerAPI = {
  createTask: (payload: any) =>
    invoke(TASK_MANAGER_CHANNELS.CREATE_TASK, payload),
  updateTask: (payload: any) =>
    invoke(TASK_MANAGER_CHANNELS.UPDATE_TASK, payload),
  deleteTask: (payload: any) =>
    invoke(TASK_MANAGER_CHANNELS.DELETE_TASK, payload),
  listTasks: (payload: any) =>
    invoke(TASK_MANAGER_CHANNELS.LIST_TASKS, payload),
  getTask: (payload: any) =>
    invoke(TASK_MANAGER_CHANNELS.GET_TASK, payload),
  startTask: (payload: any) =>
    invoke(TASK_MANAGER_CHANNELS.START_TASK, payload),
  stopTask: (payload: any) =>
    invoke(TASK_MANAGER_CHANNELS.STOP_TASK, payload),
  getTaskLogs: (payload: any) =>
    invoke(TASK_MANAGER_CHANNELS.GET_TASK_LOGS, payload),

  // Event listeners
  onTaskStatusChanged: (listener: IPCEventListener<any>) =>
    on(TASK_MANAGER_CHANNELS.ON_TASK_STATUS_CHANGED, listener),
  onTaskCompleted: (listener: IPCEventListener<any>) =>
    on(TASK_MANAGER_CHANNELS.ON_TASK_COMPLETED, listener),
  onTaskFailed: (listener: IPCEventListener<any>) =>
    on(TASK_MANAGER_CHANNELS.ON_TASK_FAILED, listener),
};

// ============================================================================
// NODE DAEMON API
// ============================================================================

const nodeDaemonAPI = {
  listNodes: (payload: any) =>
    invoke(NODE_DAEMON_CHANNELS.LIST_NODES, payload),
  getNode: (payload: any) =>
    invoke(NODE_DAEMON_CHANNELS.GET_NODE, payload),
  startNode: (payload: any) =>
    invoke(NODE_DAEMON_CHANNELS.START_NODE, payload),
  stopNode: (payload: any) =>
    invoke(NODE_DAEMON_CHANNELS.STOP_NODE, payload),
  restartNode: (payload: any) =>
    invoke(NODE_DAEMON_CHANNELS.RESTART_NODE, payload),
  getNodeInfo: (payload: any) =>
    invoke(NODE_DAEMON_CHANNELS.GET_NODE_INFO, payload),
  getBlockchainInfo: (payload: any) =>
    invoke(NODE_DAEMON_CHANNELS.GET_BLOCKCHAIN_INFO, payload),
  getPeerInfo: (payload: any) =>
    invoke(NODE_DAEMON_CHANNELS.GET_PEER_INFO, payload),
  syncNode: (payload: any) =>
    invoke(NODE_DAEMON_CHANNELS.SYNC_NODE, payload),
  pruneNode: (payload: any) =>
    invoke(NODE_DAEMON_CHANNELS.PRUNE_NODE, payload),

  // Event listeners
  onNodeStarted: (listener: IPCEventListener<any>) =>
    on(NODE_DAEMON_CHANNELS.ON_NODE_STARTED, listener),
  onNodeStopped: (listener: IPCEventListener<any>) =>
    on(NODE_DAEMON_CHANNELS.ON_NODE_STOPPED, listener),
  onNodeSyncing: (listener: IPCEventListener<any>) =>
    on(NODE_DAEMON_CHANNELS.ON_NODE_SYNCING, listener),
  onNodeSynced: (listener: IPCEventListener<any>) =>
    on(NODE_DAEMON_CHANNELS.ON_NODE_SYNCED, listener),
  onNodeError: (listener: IPCEventListener<any>) =>
    on(NODE_DAEMON_CHANNELS.ON_NODE_ERROR, listener),
  onBlockReceived: (listener: IPCEventListener<any>) =>
    on(NODE_DAEMON_CHANNELS.ON_BLOCK_RECEIVED, listener),
};

// ============================================================================
// EXPOSE API TO RENDERER
// ============================================================================

const cryptoOSAPI = {
  ai: aiAssistantAPI,
  wallet: walletManagerAPI,
  kiosk: kioskAPI,
  casino: casinoAPI,
  system: systemMonitorAPI,
  process: processManagerAPI,
  task: taskManagerAPI,
  node: nodeDaemonAPI,
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('cryptoOS', cryptoOSAPI);

// Export type for renderer usage
export type CryptoOSAPI = typeof cryptoOSAPI;
