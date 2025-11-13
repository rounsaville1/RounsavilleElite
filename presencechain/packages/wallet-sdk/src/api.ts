import axios, { AxiosInstance } from 'axios';
import { RPCConfig, SignedTransaction } from './types';

/**
 * RPC Client to communicate with PresenceChain core node
 */
export class RPCClient {
  private client: AxiosInstance;
  private requestId: number = 1;

  constructor(config: RPCConfig) {
    this.client = axios.create({
      baseURL: config.url,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });
  }

  /**
   * Make a JSON-RPC call
   */
  private async call(method: string, params: any[] = []): Promise<any> {
    const response = await this.client.post('/', {
      jsonrpc: '2.0',
      method,
      params,
      id: this.requestId++,
    });

    if (response.data.error) {
      throw new Error(
        `RPC Error: ${response.data.error.message} (code: ${response.data.error.code})`
      );
    }

    return response.data.result;
  }

  /**
   * Get the latest block number
   */
  async getBlockNumber(): Promise<number> {
    const result = await this.call('eth_blockNumber');
    return parseInt(result, 16);
  }

  /**
   * Get balance of an address
   */
  async getBalance(address: string): Promise<string> {
    const result = await this.call('eth_getBalance', [address, 'latest']);
    return result;
  }

  /**
   * Get transaction count (nonce) for an address
   */
  async getTransactionCount(address: string): Promise<number> {
    const result = await this.call('eth_getTransactionCount', [
      address,
      'latest',
    ]);
    return parseInt(result, 16);
  }

  /**
   * Send a signed transaction
   */
  async sendTransaction(signedTx: SignedTransaction): Promise<string> {
    const result = await this.call('eth_sendTransaction', [signedTx]);
    return result;
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string): Promise<any> {
    return this.call('eth_getTransactionByHash', [hash]);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(hash: string): Promise<any> {
    return this.call('eth_getTransactionReceipt', [hash]);
  }

  /**
   * Get block by number
   */
  async getBlockByNumber(blockNumber: number): Promise<any> {
    const blockNum = '0x' + blockNumber.toString(16);
    return this.call('eth_getBlockByNumber', [blockNum, true]);
  }

  /**
   * Get block by hash
   */
  async getBlockByHash(hash: string): Promise<any> {
    return this.call('eth_getBlockByHash', [hash, true]);
  }

  /**
   * Get network version/chain ID
   */
  async getNetworkVersion(): Promise<string> {
    return this.call('net_version');
  }

  /**
   * Get peer count
   */
  async getPeerCount(): Promise<number> {
    const result = await this.call('net_peerCount');
    return parseInt(result, 16);
  }

  /**
   * Get client version
   */
  async getClientVersion(): Promise<string> {
    return this.call('web3_clientVersion');
  }

  /**
   * Call a contract method (read-only)
   */
  async call(transaction: any, blockTag: string = 'latest'): Promise<string> {
    return this.call('eth_call', [transaction, blockTag]);
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction: any): Promise<number> {
    const result = await this.call('eth_estimateGas', [transaction]);
    return parseInt(result, 16);
  }

  /**
   * Get gas price
   */
  async getGasPrice(): Promise<string> {
    return this.call('eth_gasPrice');
  }
}
