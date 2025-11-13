import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Indexer } from './indexer';
import { Database } from './database';
import { apiRouter } from './api';

dotenv.config();

const PORT = process.env.PORT || 4000;
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const DB_URL = process.env.DATABASE_URL || 'postgresql://localhost/presencechain';

async function main() {
  console.log('🚀 Starting PresenceChain Explorer API...');

  // Initialize database
  const db = new Database(DB_URL);
  await db.connect();
  await db.initialize();
  console.log('✓ Database connected');

  // Initialize indexer
  const indexer = new Indexer(RPC_URL, db);
  await indexer.start();
  console.log('✓ Blockchain indexer started');

  // Create Express app
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      indexer: indexer.isRunning(),
      latestBlock: indexer.getLatestBlockIndexed(),
    });
  });

  // API routes
  app.use('/api', apiRouter(db));

  // Start server
  app.listen(PORT, () => {
    console.log(`\n✅ Explorer API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   API: http://localhost:${PORT}/api`);
  });
}

main().catch((error) => {
  console.error('Failed to start Explorer API:', error);
  process.exit(1);
});
