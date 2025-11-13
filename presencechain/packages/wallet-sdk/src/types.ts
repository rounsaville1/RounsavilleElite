export interface Transaction {
  from: string;
  to: string;
  value: string;
  nonce: number;
  gasLimit: number;
  gasPrice: string;
  data?: string;
  signature?: string;
}

export interface SignedTransaction extends Transaction {
  signature: string;
  hash: string;
}

export interface Account {
  address: string;
  privateKey: string;
  publicKey: string;
}

export interface Balance {
  address: string;
  balance: string;
  decimals: number;
}

export interface Block {
  number: number;
  hash: string;
  previousHash: string;
  timestamp: number;
  validator: string;
  transactions: Transaction[];
}

export interface RPCConfig {
  url: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface WalletConfig {
  rpcUrl: string;
  mnemonic?: string;
  privateKey?: string;
}
