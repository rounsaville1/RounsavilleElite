import { Pool, QueryResult } from 'pg';

export interface Block {
  number: number;
  hash: string;
  previousHash: string;
  timestamp: number;
  validator: string;
  transactionCount: number;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  timestamp: number;
  gasUsed: number;
  status: string;
}

export interface Account {
  address: string;
  balance: string;
  lastUpdated: number;
}

export class Database {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
    });
  }

  async connect() {
    await this.pool.query('SELECT NOW()');
  }

  async initialize() {
    // Create tables if they don't exist
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS blocks (
        number BIGINT PRIMARY KEY,
        hash VARCHAR(66) UNIQUE NOT NULL,
        previous_hash VARCHAR(66),
        timestamp BIGINT NOT NULL,
        validator VARCHAR(42),
        transaction_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blocks(hash);
      CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp);
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        hash VARCHAR(66) PRIMARY KEY,
        from_address VARCHAR(42) NOT NULL,
        to_address VARCHAR(42),
        value VARCHAR(78) NOT NULL,
        block_number BIGINT REFERENCES blocks(number),
        timestamp BIGINT NOT NULL,
        gas_used BIGINT,
        status VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_tx_from ON transactions(from_address);
      CREATE INDEX IF NOT EXISTS idx_tx_to ON transactions(to_address);
      CREATE INDEX IF NOT EXISTS idx_tx_block ON transactions(block_number);
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        address VARCHAR(42) PRIMARY KEY,
        balance VARCHAR(78) NOT NULL DEFAULT '0',
        last_updated BIGINT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_accounts_balance ON accounts(balance);
    `);
  }

  async insertBlock(block: Block) {
    await this.pool.query(
      `INSERT INTO blocks (number, hash, previous_hash, timestamp, validator, transaction_count)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (number) DO UPDATE SET
         hash = EXCLUDED.hash,
         previous_hash = EXCLUDED.previous_hash,
         timestamp = EXCLUDED.timestamp,
         validator = EXCLUDED.validator,
         transaction_count = EXCLUDED.transaction_count`,
      [block.number, block.hash, block.previousHash, block.timestamp, block.validator, block.transactionCount]
    );
  }

  async getLatestBlock(): Promise<Block | null> {
    const result = await this.pool.query(
      'SELECT * FROM blocks ORDER BY number DESC LIMIT 1'
    );
    return result.rows[0] || null;
  }

  async getBlock(numberOrHash: number | string): Promise<Block | null> {
    const isNumber = typeof numberOrHash === 'number';
    const result = await this.pool.query(
      `SELECT * FROM blocks WHERE ${isNumber ? 'number' : 'hash'} = $1`,
      [numberOrHash]
    );
    return result.rows[0] || null;
  }

  async getBlocks(limit: number = 20, offset: number = 0): Promise<Block[]> {
    const result = await this.pool.query(
      'SELECT * FROM blocks ORDER BY number DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  async insertTransaction(tx: Transaction) {
    await this.pool.query(
      `INSERT INTO transactions (hash, from_address, to_address, value, block_number, timestamp, gas_used, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (hash) DO NOTHING`,
      [tx.hash, tx.from, tx.to, tx.value, tx.blockNumber, tx.timestamp, tx.gasUsed, tx.status]
    );
  }

  async getTransaction(hash: string): Promise<Transaction | null> {
    const result = await this.pool.query(
      'SELECT * FROM transactions WHERE hash = $1',
      [hash]
    );
    return result.rows[0] || null;
  }

  async getTransactionsByBlock(blockNumber: number): Promise<Transaction[]> {
    const result = await this.pool.query(
      'SELECT * FROM transactions WHERE block_number = $1 ORDER BY timestamp',
      [blockNumber]
    );
    return result.rows;
  }

  async getTransactionsByAddress(address: string, limit: number = 20): Promise<Transaction[]> {
    const result = await this.pool.query(
      'SELECT * FROM transactions WHERE from_address = $1 OR to_address = $1 ORDER BY timestamp DESC LIMIT $2',
      [address, limit]
    );
    return result.rows;
  }

  async updateAccount(account: Account) {
    await this.pool.query(
      `INSERT INTO accounts (address, balance, last_updated)
       VALUES ($1, $2, $3)
       ON CONFLICT (address) DO UPDATE SET
         balance = EXCLUDED.balance,
         last_updated = EXCLUDED.last_updated`,
      [account.address, account.balance, account.lastUpdated]
    );
  }

  async getAccount(address: string): Promise<Account | null> {
    const result = await this.pool.query(
      'SELECT * FROM accounts WHERE address = $1',
      [address]
    );
    return result.rows[0] || null;
  }

  async close() {
    await this.pool.end();
  }
}
