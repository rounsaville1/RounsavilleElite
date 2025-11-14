/**
 * CryptoOS Desktop - System/Process/Task Manager IPC Interface
 *
 * Type-safe IPC channels for system monitoring, process control,
 * task management, and crypto node daemon orchestration.
 */

import type { IPCChannel, IPCRequest, IPCResponse, IPCEvent } from './base.types';
import type { CryptoChain } from './wallet-manager.types';

// ============================================================================
// SYSTEM MONITOR CHANNELS
// ============================================================================

export const SYSTEM_MONITOR_CHANNELS = {
  GET_SYSTEM_INFO: 'cryptoos:system:get-system-info' as IPCChannel,
  GET_CPU_USAGE: 'cryptoos:system:get-cpu-usage' as IPCChannel,
  GET_MEMORY_USAGE: 'cryptoos:system:get-memory-usage' as IPCChannel,
  GET_DISK_USAGE: 'cryptoos:system:get-disk-usage' as IPCChannel,
  GET_NETWORK_STATS: 'cryptoos:system:get-network-stats' as IPCChannel,
  GET_TEMPERATURE: 'cryptoos:system:get-temperature' as IPCChannel,

  // Events
  ON_CPU_UPDATE: 'cryptoos:system:on-cpu-update' as IPCChannel,
  ON_MEMORY_UPDATE: 'cryptoos:system:on-memory-update' as IPCChannel,
  ON_NETWORK_UPDATE: 'cryptoos:system:on-network-update' as IPCChannel,
  ON_THERMAL_ALERT: 'cryptoos:system:on-thermal-alert' as IPCChannel,
} as const;

// ============================================================================
// PROCESS MANAGER CHANNELS
// ============================================================================

export const PROCESS_MANAGER_CHANNELS = {
  LIST_PROCESSES: 'cryptoos:process:list-processes' as IPCChannel,
  GET_PROCESS: 'cryptoos:process:get-process' as IPCChannel,
  START_PROCESS: 'cryptoos:process:start-process' as IPCChannel,
  STOP_PROCESS: 'cryptoos:process:stop-process' as IPCChannel,
  RESTART_PROCESS: 'cryptoos:process:restart-process' as IPCChannel,
  KILL_PROCESS: 'cryptoos:process:kill-process' as IPCChannel,
  GET_PROCESS_LOGS: 'cryptoos:process:get-process-logs' as IPCChannel,

  // Events
  ON_PROCESS_STARTED: 'cryptoos:process:on-process-started' as IPCChannel,
  ON_PROCESS_STOPPED: 'cryptoos:process:on-process-stopped' as IPCChannel,
  ON_PROCESS_ERROR: 'cryptoos:process:on-process-error' as IPCChannel,
  ON_PROCESS_LOG: 'cryptoos:process:on-process-log' as IPCChannel,
} as const;

// ============================================================================
// TASK MANAGER CHANNELS
// ============================================================================

export const TASK_MANAGER_CHANNELS = {
  CREATE_TASK: 'cryptoos:task:create-task' as IPCChannel,
  UPDATE_TASK: 'cryptoos:task:update-task' as IPCChannel,
  DELETE_TASK: 'cryptoos:task:delete-task' as IPCChannel,
  LIST_TASKS: 'cryptoos:task:list-tasks' as IPCChannel,
  GET_TASK: 'cryptoos:task:get-task' as IPCChannel,
  START_TASK: 'cryptoos:task:start-task' as IPCChannel,
  STOP_TASK: 'cryptoos:task:stop-task' as IPCChannel,
  GET_TASK_LOGS: 'cryptoos:task:get-task-logs' as IPCChannel,

  // Events
  ON_TASK_STATUS_CHANGED: 'cryptoos:task:on-task-status-changed' as IPCChannel,
  ON_TASK_COMPLETED: 'cryptoos:task:on-task-completed' as IPCChannel,
  ON_TASK_FAILED: 'cryptoos:task:on-task-failed' as IPCChannel,
} as const;

// ============================================================================
// NODE DAEMON CHANNELS
// ============================================================================

export const NODE_DAEMON_CHANNELS = {
  LIST_NODES: 'cryptoos:node:list-nodes' as IPCChannel,
  GET_NODE: 'cryptoos:node:get-node' as IPCChannel,
  START_NODE: 'cryptoos:node:start-node' as IPCChannel,
  STOP_NODE: 'cryptoos:node:stop-node' as IPCChannel,
  RESTART_NODE: 'cryptoos:node:restart-node' as IPCChannel,
  GET_NODE_INFO: 'cryptoos:node:get-node-info' as IPCChannel,
  GET_BLOCKCHAIN_INFO: 'cryptoos:node:get-blockchain-info' as IPCChannel,
  GET_PEER_INFO: 'cryptoos:node:get-peer-info' as IPCChannel,
  SYNC_NODE: 'cryptoos:node:sync-node' as IPCChannel,
  PRUNE_NODE: 'cryptoos:node:prune-node' as IPCChannel,

  // Events
  ON_NODE_STARTED: 'cryptoos:node:on-node-started' as IPCChannel,
  ON_NODE_STOPPED: 'cryptoos:node:on-node-stopped' as IPCChannel,
  ON_NODE_SYNCING: 'cryptoos:node:on-node-syncing' as IPCChannel,
  ON_NODE_SYNCED: 'cryptoos:node:on-node-synced' as IPCChannel,
  ON_NODE_ERROR: 'cryptoos:node:on-node-error' as IPCChannel,
  ON_BLOCK_RECEIVED: 'cryptoos:node:on-block-received' as IPCChannel,
} as const;

// ============================================================================
// SYSTEM TYPES
// ============================================================================

export interface SystemInfo {
  platform: string;
  arch: string;
  hostname: string;
  cpus: {
    model: string;
    cores: number;
    threads: number;
    speed: number; // MHz
  };
  memory: {
    total: number; // bytes
    available: number;
  };
  os: {
    type: string;
    release: string;
    version: string;
  };
  uptime: number; // seconds
}

export interface CPUUsage {
  overall: number; // 0-100%
  perCore: number[];
  temperature?: number; // Celsius
  loadAverage: number[];
}

export interface MemoryUsage {
  total: number; // bytes
  used: number;
  free: number;
  available: number;
  swapTotal: number;
  swapUsed: number;
  percentage: number; // 0-100%
}

export interface DiskUsage {
  filesystem: string;
  size: number; // bytes
  used: number;
  available: number;
  percentage: number; // 0-100%
  mountPoint: string;
}

export interface NetworkStats {
  interfaces: {
    name: string;
    ip4: string;
    ip6?: string;
    mac: string;
    speed: number; // Mbps
    state: 'up' | 'down';
    rx: {
      bytes: number;
      packets: number;
      errors: number;
    };
    tx: {
      bytes: number;
      packets: number;
      errors: number;
    };
  }[];
  totalRx: number;
  totalTx: number;
}

export interface Temperature {
  cpu: number;
  gpu?: number;
  mainboard?: number;
  disks?: { [device: string]: number };
}

// ============================================================================
// PROCESS TYPES
// ============================================================================

export enum ProcessStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  SLEEPING = 'sleeping',
  ZOMBIE = 'zombie',
  UNKNOWN = 'unknown',
}

export interface Process {
  pid: number;
  name: string;
  command: string;
  arguments: string[];
  status: ProcessStatus;
  cpu: number; // percentage
  memory: number; // bytes
  user: string;
  startTime: number;
  parentPid?: number;
  threads?: number;
}

export interface ProcessLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source: 'stdout' | 'stderr';
}

// ============================================================================
// TASK TYPES
// ============================================================================

export enum TaskType {
  SCHEDULED = 'scheduled',
  RECURRING = 'recurring',
  ONE_TIME = 'one-time',
  TRIGGERED = 'triggered',
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  command: string;
  arguments: string[];
  schedule?: {
    cron?: string;
    interval?: number; // seconds
    startAt?: number;
    endAt?: number;
  };
  trigger?: {
    event: string;
    condition?: string;
  };
  retries: number;
  maxRetries: number;
  timeout: number; // seconds
  createdAt: number;
  updatedAt: number;
  lastRunAt?: number;
  nextRunAt?: number;
  pid?: number;
  exitCode?: number;
  output?: string;
  error?: string;
}

// ============================================================================
// NODE DAEMON TYPES
// ============================================================================

export enum NodeStatus {
  STOPPED = 'stopped',
  STARTING = 'starting',
  RUNNING = 'running',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  ERROR = 'error',
}

export interface NodeDaemon {
  id: string;
  chain: CryptoChain;
  name: string;
  version: string;
  status: NodeStatus;
  pid?: number;
  startedAt?: number;
  config: {
    dataDir: string;
    rpcPort: number;
    p2pPort: number;
    rpcUser?: string;
    pruned: boolean;
    txIndex: boolean;
    maxConnections: number;
  };
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

export interface NodeInfo {
  version: string;
  protocolVersion: number;
  connections: number;
  networkHashRate?: string;
  difficulty?: string;
  blocks: number;
  headers: number;
  verificationProgress: number; // 0-1
  initialBlockDownload: boolean;
  chainWork?: string;
  sizeOnDisk: number;
  warnings?: string[];
}

export interface BlockchainInfo {
  chain: CryptoChain;
  blocks: number;
  headers: number;
  bestBlockHash: string;
  difficulty: string;
  medianTime: number;
  verificationProgress: number;
  chainWork: string;
  pruned: boolean;
  pruneHeight?: number;
  softforks: {
    [name: string]: {
      type: 'buried' | 'bip9';
      active: boolean;
      height?: number;
    };
  };
}

export interface PeerInfo {
  id: number;
  address: string;
  port: number;
  version: string;
  subversion: string;
  inbound: boolean;
  startingHeight: number;
  syncedHeaders: number;
  syncedBlocks: number;
  bytesReceived: number;
  bytesSent: number;
  connTime: number;
  pingTime: number;
  services: string[];
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface StartProcessRequest {
  command: string;
  arguments?: string[];
  workingDirectory?: string;
  env?: { [key: string]: string };
}

export interface GetProcessLogsRequest {
  pid: number;
  limit?: number;
  offset?: number;
  level?: 'debug' | 'info' | 'warn' | 'error';
  since?: number;
}

export interface CreateTaskRequest {
  name: string;
  description?: string;
  type: TaskType;
  command: string;
  arguments?: string[];
  schedule?: Task['schedule'];
  trigger?: Task['trigger'];
  maxRetries?: number;
  timeout?: number;
}

export interface UpdateTaskRequest {
  taskId: string;
  updates: Partial<Omit<Task, 'id' | 'createdAt'>>;
}

export interface ListTasksRequest {
  status?: TaskStatus;
  type?: TaskType;
  limit?: number;
  offset?: number;
}

export interface StartNodeRequest {
  chain: CryptoChain;
  config?: Partial<NodeDaemon['config']>;
  waitForSync?: boolean;
}

export interface PruneNodeRequest {
  chain: CryptoChain;
  pruneHeight?: number; // Keep blocks above this height
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ProcessListResponse {
  processes: Process[];
  total: number;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
}

export interface NodeListResponse {
  nodes: NodeDaemon[];
}

export interface SyncNodeResponse {
  syncing: boolean;
  progress: number;
  estimatedTimeRemaining: number; // seconds
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface CPUUpdatePayload {
  usage: CPUUsage;
  timestamp: number;
}

export interface MemoryUpdatePayload {
  usage: MemoryUsage;
  timestamp: number;
}

export interface NetworkUpdatePayload {
  stats: NetworkStats;
  timestamp: number;
}

export interface ThermalAlertPayload {
  component: 'cpu' | 'gpu' | 'disk';
  temperature: number;
  threshold: number;
  severity: 'warning' | 'critical';
}

export interface ProcessEventPayload {
  process: Process;
  timestamp: number;
}

export interface ProcessLogPayload {
  pid: number;
  log: ProcessLog;
}

export interface TaskStatusChangedPayload {
  task: Task;
  oldStatus: TaskStatus;
  newStatus: TaskStatus;
  timestamp: number;
}

export interface TaskCompletedPayload {
  task: Task;
  exitCode: number;
  output?: string;
  duration: number; // milliseconds
}

export interface TaskFailedPayload {
  task: Task;
  error: string;
  exitCode?: number;
  willRetry: boolean;
}

export interface NodeEventPayload {
  node: NodeDaemon;
  timestamp: number;
}

export interface NodeSyncingPayload {
  chain: CryptoChain;
  progress: number;
  blocksRemaining: number;
  estimatedTimeRemaining: number;
}

export interface BlockReceivedPayload {
  chain: CryptoChain;
  blockHash: string;
  blockHeight: number;
  transactions: number;
  size: number;
  timestamp: number;
}

// ============================================================================
// TYPED IPC CONTRACTS
// ============================================================================

export type SystemMonitorIPCContract = {
  [SYSTEM_MONITOR_CHANNELS.GET_SYSTEM_INFO]: {
    request: IPCRequest<{}>;
    response: IPCResponse<{ info: SystemInfo }>;
  };
  [SYSTEM_MONITOR_CHANNELS.GET_CPU_USAGE]: {
    request: IPCRequest<{}>;
    response: IPCResponse<{ usage: CPUUsage }>;
  };
  [SYSTEM_MONITOR_CHANNELS.GET_MEMORY_USAGE]: {
    request: IPCRequest<{}>;
    response: IPCResponse<{ usage: MemoryUsage }>;
  };
  [SYSTEM_MONITOR_CHANNELS.GET_DISK_USAGE]: {
    request: IPCRequest<{}>;
    response: IPCResponse<{ usage: DiskUsage[] }>;
  };
  [SYSTEM_MONITOR_CHANNELS.GET_NETWORK_STATS]: {
    request: IPCRequest<{}>;
    response: IPCResponse<{ stats: NetworkStats }>;
  };
  [SYSTEM_MONITOR_CHANNELS.GET_TEMPERATURE]: {
    request: IPCRequest<{}>;
    response: IPCResponse<{ temperature: Temperature }>;
  };

  // Events
  [SYSTEM_MONITOR_CHANNELS.ON_CPU_UPDATE]: IPCEvent<CPUUpdatePayload>;
  [SYSTEM_MONITOR_CHANNELS.ON_MEMORY_UPDATE]: IPCEvent<MemoryUpdatePayload>;
  [SYSTEM_MONITOR_CHANNELS.ON_NETWORK_UPDATE]: IPCEvent<NetworkUpdatePayload>;
  [SYSTEM_MONITOR_CHANNELS.ON_THERMAL_ALERT]: IPCEvent<ThermalAlertPayload>;
};

export type ProcessManagerIPCContract = {
  [PROCESS_MANAGER_CHANNELS.LIST_PROCESSES]: {
    request: IPCRequest<{ filter?: string }>;
    response: IPCResponse<ProcessListResponse>;
  };
  [PROCESS_MANAGER_CHANNELS.GET_PROCESS]: {
    request: IPCRequest<{ pid: number }>;
    response: IPCResponse<{ process: Process }>;
  };
  [PROCESS_MANAGER_CHANNELS.START_PROCESS]: {
    request: IPCRequest<StartProcessRequest>;
    response: IPCResponse<{ process: Process }>;
  };
  [PROCESS_MANAGER_CHANNELS.STOP_PROCESS]: {
    request: IPCRequest<{ pid: number; signal?: string }>;
    response: IPCResponse<{ stopped: boolean }>;
  };
  [PROCESS_MANAGER_CHANNELS.RESTART_PROCESS]: {
    request: IPCRequest<{ pid: number }>;
    response: IPCResponse<{ process: Process }>;
  };
  [PROCESS_MANAGER_CHANNELS.KILL_PROCESS]: {
    request: IPCRequest<{ pid: number }>;
    response: IPCResponse<{ killed: boolean }>;
  };
  [PROCESS_MANAGER_CHANNELS.GET_PROCESS_LOGS]: {
    request: IPCRequest<GetProcessLogsRequest>;
    response: IPCResponse<{ logs: ProcessLog[]; total: number }>;
  };

  // Events
  [PROCESS_MANAGER_CHANNELS.ON_PROCESS_STARTED]: IPCEvent<ProcessEventPayload>;
  [PROCESS_MANAGER_CHANNELS.ON_PROCESS_STOPPED]: IPCEvent<ProcessEventPayload>;
  [PROCESS_MANAGER_CHANNELS.ON_PROCESS_ERROR]: IPCEvent<ProcessEventPayload & { error: string }>;
  [PROCESS_MANAGER_CHANNELS.ON_PROCESS_LOG]: IPCEvent<ProcessLogPayload>;
};

export type TaskManagerIPCContract = {
  [TASK_MANAGER_CHANNELS.CREATE_TASK]: {
    request: IPCRequest<CreateTaskRequest>;
    response: IPCResponse<{ task: Task }>;
  };
  [TASK_MANAGER_CHANNELS.UPDATE_TASK]: {
    request: IPCRequest<UpdateTaskRequest>;
    response: IPCResponse<{ task: Task }>;
  };
  [TASK_MANAGER_CHANNELS.DELETE_TASK]: {
    request: IPCRequest<{ taskId: string }>;
    response: IPCResponse<{ deleted: boolean }>;
  };
  [TASK_MANAGER_CHANNELS.LIST_TASKS]: {
    request: IPCRequest<ListTasksRequest>;
    response: IPCResponse<TaskListResponse>;
  };
  [TASK_MANAGER_CHANNELS.GET_TASK]: {
    request: IPCRequest<{ taskId: string }>;
    response: IPCResponse<{ task: Task }>;
  };
  [TASK_MANAGER_CHANNELS.START_TASK]: {
    request: IPCRequest<{ taskId: string }>;
    response: IPCResponse<{ started: boolean }>;
  };
  [TASK_MANAGER_CHANNELS.STOP_TASK]: {
    request: IPCRequest<{ taskId: string }>;
    response: IPCResponse<{ stopped: boolean }>;
  };
  [TASK_MANAGER_CHANNELS.GET_TASK_LOGS]: {
    request: IPCRequest<{ taskId: string; limit?: number }>;
    response: IPCResponse<{ logs: string }>;
  };

  // Events
  [TASK_MANAGER_CHANNELS.ON_TASK_STATUS_CHANGED]: IPCEvent<TaskStatusChangedPayload>;
  [TASK_MANAGER_CHANNELS.ON_TASK_COMPLETED]: IPCEvent<TaskCompletedPayload>;
  [TASK_MANAGER_CHANNELS.ON_TASK_FAILED]: IPCEvent<TaskFailedPayload>;
};

export type NodeDaemonIPCContract = {
  [NODE_DAEMON_CHANNELS.LIST_NODES]: {
    request: IPCRequest<{ chain?: CryptoChain }>;
    response: IPCResponse<NodeListResponse>;
  };
  [NODE_DAEMON_CHANNELS.GET_NODE]: {
    request: IPCRequest<{ chain: CryptoChain }>;
    response: IPCResponse<{ node: NodeDaemon }>;
  };
  [NODE_DAEMON_CHANNELS.START_NODE]: {
    request: IPCRequest<StartNodeRequest>;
    response: IPCResponse<{ node: NodeDaemon }>;
  };
  [NODE_DAEMON_CHANNELS.STOP_NODE]: {
    request: IPCRequest<{ chain: CryptoChain }>;
    response: IPCResponse<{ stopped: boolean }>;
  };
  [NODE_DAEMON_CHANNELS.RESTART_NODE]: {
    request: IPCRequest<{ chain: CryptoChain }>;
    response: IPCResponse<{ node: NodeDaemon }>;
  };
  [NODE_DAEMON_CHANNELS.GET_NODE_INFO]: {
    request: IPCRequest<{ chain: CryptoChain }>;
    response: IPCResponse<{ info: NodeInfo }>;
  };
  [NODE_DAEMON_CHANNELS.GET_BLOCKCHAIN_INFO]: {
    request: IPCRequest<{ chain: CryptoChain }>;
    response: IPCResponse<{ info: BlockchainInfo }>;
  };
  [NODE_DAEMON_CHANNELS.GET_PEER_INFO]: {
    request: IPCRequest<{ chain: CryptoChain }>;
    response: IPCResponse<{ peers: PeerInfo[] }>;
  };
  [NODE_DAEMON_CHANNELS.SYNC_NODE]: {
    request: IPCRequest<{ chain: CryptoChain }>;
    response: IPCResponse<SyncNodeResponse>;
  };
  [NODE_DAEMON_CHANNELS.PRUNE_NODE]: {
    request: IPCRequest<PruneNodeRequest>;
    response: IPCResponse<{ pruned: boolean; freedSpace: number }>;
  };

  // Events
  [NODE_DAEMON_CHANNELS.ON_NODE_STARTED]: IPCEvent<NodeEventPayload>;
  [NODE_DAEMON_CHANNELS.ON_NODE_STOPPED]: IPCEvent<NodeEventPayload>;
  [NODE_DAEMON_CHANNELS.ON_NODE_SYNCING]: IPCEvent<NodeSyncingPayload>;
  [NODE_DAEMON_CHANNELS.ON_NODE_SYNCED]: IPCEvent<{ chain: CryptoChain; timestamp: number }>;
  [NODE_DAEMON_CHANNELS.ON_NODE_ERROR]: IPCEvent<NodeEventPayload & { error: string }>;
  [NODE_DAEMON_CHANNELS.ON_BLOCK_RECEIVED]: IPCEvent<BlockReceivedPayload>;
};
