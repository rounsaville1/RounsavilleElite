import { Router } from 'express';
import { Database } from './database';

export function apiRouter(db: Database): Router {
  const router = Router();

  // Get blocks
  router.get('/blocks', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const blocks = await db.getBlocks(limit, offset);
      res.json({ blocks });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch blocks' });
    }
  });

  // Get block by number or hash
  router.get('/blocks/:id', async (req, res) => {
    try {
      const id = isNaN(Number(req.params.id)) ? req.params.id : Number(req.params.id);
      const block = await db.getBlock(id);

      if (!block) {
        return res.status(404).json({ error: 'Block not found' });
      }

      // Get transactions in block
      const transactions = await db.getTransactionsByBlock(block.number);

      res.json({ block, transactions });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch block' });
    }
  });

  // Get latest blocks
  router.get('/blocks/latest', async (req, res) => {
    try {
      const block = await db.getLatestBlock();
      res.json({ block });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch latest block' });
    }
  });

  // Get transaction by hash
  router.get('/transactions/:hash', async (req, res) => {
    try {
      const transaction = await db.getTransaction(req.params.hash);

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({ transaction });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transaction' });
    }
  });

  // Get account info
  router.get('/accounts/:address', async (req, res) => {
    try {
      const address = req.params.address;
      const account = await db.getAccount(address);
      const transactions = await db.getTransactionsByAddress(address, 50);

      res.json({
        address,
        balance: account?.balance || '0',
        transactionCount: transactions.length,
        transactions,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch account' });
    }
  });

  // Get network statistics
  router.get('/stats', async (req, res) => {
    try {
      const latestBlock = await db.getLatestBlock();

      res.json({
        latestBlock: latestBlock?.number || 0,
        totalBlocks: latestBlock?.number || 0,
        // Additional stats can be added here
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  return router;
}
