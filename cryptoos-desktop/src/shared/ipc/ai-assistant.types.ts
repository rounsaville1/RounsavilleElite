/**
 * CryptoOS Desktop - AI Assistant IPC Interface
 *
 * Type-safe IPC channels for the Figma Smart Interpreter AI Assistant
 * and general AI orchestration features.
 */

import type { IPCChannel, IPCRequest, IPCResponse, IPCEvent } from './base.types';

// ============================================================================
// AI ASSISTANT CHANNELS
// ============================================================================

export const AI_ASSISTANT_CHANNELS = {
  // Design interpretation
  LOAD_DESIGN_CONTEXT: 'cryptoos:ai:load-design-context' as IPCChannel,
  EXPLAIN_DESIGN: 'cryptoos:ai:explain-design' as IPCChannel,
  GENERATE_CODE: 'cryptoos:ai:generate-code' as IPCChannel,
  GENERATE_DOCS: 'cryptoos:ai:generate-docs' as IPCChannel,

  // Chat & interaction
  SEND_MESSAGE: 'cryptoos:ai:send-message' as IPCChannel,
  STREAM_RESPONSE: 'cryptoos:ai:stream-response' as IPCChannel,
  CANCEL_REQUEST: 'cryptoos:ai:cancel-request' as IPCChannel,

  // Context management
  SET_CONTEXT: 'cryptoos:ai:set-context' as IPCChannel,
  CLEAR_CONTEXT: 'cryptoos:ai:clear-context' as IPCChannel,
  GET_CONTEXT: 'cryptoos:ai:get-context' as IPCChannel,

  // Events (one-way from main → renderer)
  ON_RESPONSE_CHUNK: 'cryptoos:ai:on-response-chunk' as IPCChannel,
  ON_CONTEXT_UPDATED: 'cryptoos:ai:on-context-updated' as IPCChannel,
  ON_ERROR: 'cryptoos:ai:on-error' as IPCChannel,
} as const;

// ============================================================================
// DESIGN CONTEXT TYPES
// ============================================================================

export interface DesignNode {
  id: string;
  name: string;
  type: 'FRAME' | 'COMPONENT' | 'INSTANCE' | 'GROUP' | 'TEXT' | 'RECTANGLE' | 'ELLIPSE' | 'VECTOR';
  children?: DesignNode[];
  props?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fills?: string[];
    strokes?: string[];
    cornerRadius?: number;
    fontSize?: number;
    fontFamily?: string;
    layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
    padding?: number;
    gap?: number;
    [key: string]: unknown;
  };
}

export interface DesignContext {
  fileId: string;
  fileName: string;
  lastModified?: number;
  nodes: DesignNode[];
  metadata?: {
    version?: string;
    author?: string;
    description?: string;
    [key: string]: unknown;
  };
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface LoadDesignContextRequest {
  fileId: string;
  nodeId?: string;
  accessToken?: string; // For Figma API
}

export interface ExplainDesignRequest {
  context: DesignContext;
  focusNodeId?: string;
  includeImplementationNotes?: boolean;
}

export interface GenerateCodeRequest {
  context: DesignContext;
  nodeId: string;
  options: {
    framework: 'react-spa' | 'electron-react' | 'vue' | 'angular';
    styling: 'css-modules' | 'tailwind' | 'styled-components' | 'emotion';
    typescript: boolean;
    includeTests?: boolean;
  };
}

export interface GenerateDocsRequest {
  context: DesignContext;
  options: {
    format: 'markdown' | 'html' | 'pdf';
    includeScreenshots?: boolean;
    includeComponentHierarchy?: boolean;
  };
}

export interface SendMessageRequest {
  message: string;
  conversationId?: string;
  context?: {
    currentFile?: string;
    selectedCode?: string;
    activeTool?: string;
  };
  streamResponse?: boolean;
}

export interface SetContextRequest {
  key: string;
  value: unknown;
  persist?: boolean;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface LoadDesignContextResponse {
  context: DesignContext;
  warnings?: string[];
}

export interface ExplainDesignResponse {
  explanation: string;
  summary: {
    componentCount: number;
    layoutType: string;
    keyFeatures: string[];
  };
  suggestions?: string[];
}

export interface GeneratedCodeFile {
  path: string;
  contents: string;
  language: 'typescript' | 'javascript' | 'css' | 'scss' | 'json';
}

export interface GenerateCodeResponse {
  files: GeneratedCodeFile[];
  notes?: string;
  dependencies?: {
    package: string;
    version: string;
  }[];
  instructions?: string;
}

export interface GenerateDocsResponse {
  content: string;
  format: 'markdown' | 'html' | 'pdf';
  assets?: {
    name: string;
    data: string; // base64 for images
    type: string;
  }[];
}

export interface SendMessageResponse {
  response: string;
  conversationId: string;
  timestamp: number;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    processingTime?: number;
  };
}

export interface GetContextResponse {
  context: Record<string, unknown>;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface ResponseChunkPayload {
  conversationId: string;
  chunk: string;
  isDone: boolean;
  metadata?: {
    chunkIndex: number;
    totalChunks?: number;
  };
}

export interface ContextUpdatedPayload {
  key: string;
  value: unknown;
  timestamp: number;
}

export interface AIErrorPayload {
  code: string;
  message: string;
  conversationId?: string;
  recoverable: boolean;
}

// ============================================================================
// TYPED IPC CONTRACTS
// ============================================================================

export type AIAssistantIPCContract = {
  // Design interpretation
  [AI_ASSISTANT_CHANNELS.LOAD_DESIGN_CONTEXT]: {
    request: IPCRequest<LoadDesignContextRequest>;
    response: IPCResponse<LoadDesignContextResponse>;
  };
  [AI_ASSISTANT_CHANNELS.EXPLAIN_DESIGN]: {
    request: IPCRequest<ExplainDesignRequest>;
    response: IPCResponse<ExplainDesignResponse>;
  };
  [AI_ASSISTANT_CHANNELS.GENERATE_CODE]: {
    request: IPCRequest<GenerateCodeRequest>;
    response: IPCResponse<GenerateCodeResponse>;
  };
  [AI_ASSISTANT_CHANNELS.GENERATE_DOCS]: {
    request: IPCRequest<GenerateDocsRequest>;
    response: IPCResponse<GenerateDocsResponse>;
  };

  // Chat & interaction
  [AI_ASSISTANT_CHANNELS.SEND_MESSAGE]: {
    request: IPCRequest<SendMessageRequest>;
    response: IPCResponse<SendMessageResponse>;
  };
  [AI_ASSISTANT_CHANNELS.CANCEL_REQUEST]: {
    request: IPCRequest<{ requestId: string }>;
    response: IPCResponse<{ cancelled: boolean }>;
  };

  // Context management
  [AI_ASSISTANT_CHANNELS.SET_CONTEXT]: {
    request: IPCRequest<SetContextRequest>;
    response: IPCResponse<{ success: boolean }>;
  };
  [AI_ASSISTANT_CHANNELS.CLEAR_CONTEXT]: {
    request: IPCRequest<{ keys?: string[] }>;
    response: IPCResponse<{ cleared: string[] }>;
  };
  [AI_ASSISTANT_CHANNELS.GET_CONTEXT]: {
    request: IPCRequest<{ keys?: string[] }>;
    response: IPCResponse<GetContextResponse>;
  };

  // Events
  [AI_ASSISTANT_CHANNELS.ON_RESPONSE_CHUNK]: IPCEvent<ResponseChunkPayload>;
  [AI_ASSISTANT_CHANNELS.ON_CONTEXT_UPDATED]: IPCEvent<ContextUpdatedPayload>;
  [AI_ASSISTANT_CHANNELS.ON_ERROR]: IPCEvent<AIErrorPayload>;
};
