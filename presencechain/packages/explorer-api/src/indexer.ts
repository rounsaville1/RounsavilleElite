import { RPCClient } from '@presencechain/wallet-sdk';
import { Database } from './database';

export class Indexer {
  private rpcClient: RPCClient;
  private db: Database;
  private running: boolean = false;
  private latestBlockIndexed: number = 0;
  private intervalId?: NodeJS.Timeout;

  constructor(rpcUrl: string, db: Database) {
    this.rpcClient = new RPCClient({ url: rpcUrl });
    this.db = db;
  }

  async start() {
    this.running = true;

    // Get latest indexed block from database
    const lastBlock = await this.db.getLatestBlock();
    this.latestBlockIndexed = lastBlock?.number || 0;

    console.log(`Starting indexer from block ${this.latestBlockIndexed}`);

    // Index new blocks every 5 seconds
    this.intervalId = setInterval(() => {
      this.indexNewBlocks();
    }, 5000);

    // Initial indexing
    await this.indexNewBlocks();
  }

  stop() {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  getLatestBlockIndexed(): number {
    return this.latestBlockIndexed;
  }

  private async indexNewBlocks() {
    try {
      // Get current blockchain height
      const currentBlock = await this.rpcClient.getBlockNumber();

      // Index missing blocks
      for (let i = this.latestBlockIndexed + 1; i <= currentBlock; i++) {
        await this.indexBlock(i);
      }
    } catch (error) {
      console.error('Error indexing blocks:', error);
    }
  }

  private async indexBlock(blockNumber: number) {
    try {
      // Fetch block data
      const block = await this.rpcClient.getBlockByNumber(blockNumber);

      if (!block) {
        console.warn(`Block ${blockNumber} not found`);
        return;
      }

      // Store block in database
      await this.db.insertBlock({
        number: blockNumber,
        hash: block.hash,
        previousHash: block.previousHash || block.parentHash,
        timestamp: block.timestamp,
        validator: block.validator || block.miner,
        transactionCount: block.transactions?.length || 0,
      });

      // Index transactions
      if (block.transactions && Array.isArray(block.transactions)) {
        for (const tx of block.transactions) {
          if (typeof tx === 'object') {
            await this.indexTransaction(tx, blockNumber);
          }
        }
      }

      this.latestBlockIndexed = blockNumber;
      console.log(`✓ Indexed block #${blockNumber} (${block.hash?.slice(0, 10)}...)`);
    } catch (error) {
      console.error(`Error indexing block ${blockNumber}:`, error);
    }
  }

  private async indexTransaction(tx: any, blockNumber: number) {
    try {
      await this.db.insertTransaction({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        blockNumber,
        timestamp: Date.now(),
        gasUsed: tx.gas || 0,
        status: 'success',
      });

      // Update account balances
      await this.updateAccountBalance(tx.from);
      if (tx.to) {
        await this.updateAccountBalance(tx.to);
      }
    } catch (error) {
      console.error(`Error indexing transaction ${tx.hash}:`, error);
    }
  }

  private async updateAccountBalance(address: string) {
    try {
      const balance = await this.rpcClient.getBalance(address);
      await this.db.updateAccount({
        address,
        balance,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error(`Error updating balance for ${address}:`, error);
    }
  }
}
