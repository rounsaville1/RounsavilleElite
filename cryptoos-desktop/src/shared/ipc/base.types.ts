/**
 * CryptoOS Desktop - Base IPC Types
 *
 * Foundational types for type-safe IPC communication between
 * Electron main process and renderer processes.
 */

/**
 * Base structure for IPC requests
 */
export interface IPCRequest<TPayload = unknown> {
  id: string;
  timestamp: number;
  payload: TPayload;
}

/**
 * Base structure for IPC responses
 */
export interface IPCResponse<TData = unknown> {
  id: string;
  timestamp: number;
  success: boolean;
  data?: TData;
  error?: IPCError;
}

/**
 * IPC Error structure
 */
export interface IPCError {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
}

/**
 * Base structure for IPC events (one-way communication)
 */
export interface IPCEvent<TPayload = unknown> {
  type: string;
  timestamp: number;
  payload: TPayload;
}

/**
 * Generic IPC handler function type
 */
export type IPCHandler<TRequest = unknown, TResponse = unknown> = (
  request: IPCRequest<TRequest>
) => Promise<IPCResponse<TResponse>>;

/**
 * Generic IPC event listener type
 */
export type IPCEventListener<TPayload = unknown> = (
  event: IPCEvent<TPayload>
) => void;

/**
 * Channel naming convention
 * Format: "cryptoos:{module}:{action}"
 */
export type IPCChannel = `cryptoos:${string}:${string}`;

/**
 * Common error codes used across all IPC channels
 */
export enum IPCErrorCode {
  UNKNOWN = 'UNKNOWN',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * Helper to create a typed IPC channel name
 */
export function createChannel(module: string, action: string): IPCChannel {
  return `cryptoos:${module}:${action}`;
}

/**
 * Helper to create a successful IPC response
 */
export function createSuccessResponse<T>(
  requestId: string,
  data: T
): IPCResponse<T> {
  return {
    id: requestId,
    timestamp: Date.now(),
    success: true,
    data,
  };
}

/**
 * Helper to create an error IPC response
 */
export function createErrorResponse(
  requestId: string,
  code: string,
  message: string,
  details?: unknown
): IPCResponse<never> {
  return {
    id: requestId,
    timestamp: Date.now(),
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Helper to create an IPC event
 */
export function createEvent<T>(type: string, payload: T): IPCEvent<T> {
  return {
    type,
    timestamp: Date.now(),
    payload,
  };
}
