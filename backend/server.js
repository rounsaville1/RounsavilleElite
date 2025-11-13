/**
 * Bitcoin Core Mainnet API Server
 * Unified backend with all operations using double SHA-256 algorithms
 *
 * Endpoints:
 * - GET /status
 * - GET /transaction/<tx_hash>
 * - GET /api/v1/algebra/network-graph
 * - GET /blocks
 * - GET /mempool
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Python Bitcoin client wrapper
class BitcoinClient {
    constructor() {
        this.pythonPath = 'python3';
        this.scriptDir = path.join(__dirname, '..', 'bitcoin-core');
    }

    async executeCommand(command, args = []) {
        return new Promise((resolve, reject) => {
            const python = spawn(this.pythonPath, [
                path.join(this.scriptDir, 'cli.py'),
                command,
                ...args
            ]);

            let stdout = '';
            let stderr = '';

            python.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            python.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(stderr || `Process exited with code ${code}`));
                } else {
                    try {
                        resolve(JSON.parse(stdout));
                    } catch (e) {
                        resolve(stdout);
                    }
                }
            });
        });
    }
}

const bitcoinClient = new BitcoinClient();

// Cache for expensive operations
const cache = new Map();
const CACHE_TTL = 10000; // 10 seconds

function getCached(key, ttl = CACHE_TTL) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
    }
    return null;
}

function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * GET /status
 * Returns current node status and network information
 */
app.get('/status', async (req, res) => {
    try {
        const cacheKey = 'status';
        let status = getCached(cacheKey);

        if (!status) {
            status = await bitcoinClient.executeCommand('status');
            setCache(cacheKey, status);
        }

        res.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting status:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            data: {
                status: 'offline',
                message: 'Bitcoin node not available. Please configure connection.'
            }
        });
    }
});

/**
 * GET /transaction/:tx_hash
 * Get transaction details with SHA-256 verification
 */
app.get('/transaction/:tx_hash', async (req, res) => {
    try {
        const { tx_hash } = req.params;

        if (!tx_hash || !/^[a-fA-F0-9]{64}$/.test(tx_hash)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid transaction hash format. Must be 64 hex characters.'
            });
        }

        const cacheKey = `tx_${tx_hash}`;
        let transaction = getCached(cacheKey, 60000); // Cache for 1 minute

        if (!transaction) {
            transaction = await bitcoinClient.executeCommand('transaction', [tx_hash]);
            setCache(cacheKey, transaction);
        }

        res.json({
            success: true,
            data: transaction,
            verified: transaction.hash_verified || false,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting transaction:', error);
        res.status(404).json({
            success: false,
            error: 'Transaction not found',
            message: error.message
        });
    }
});

/**
 * GET /blocks
 * Get recent blocks with optional pagination
 */
app.get('/blocks', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const offset = parseInt(req.query.offset) || 0;

        const cacheKey = `blocks_${limit}_${offset}`;
        let blocks = getCached(cacheKey);

        if (!blocks) {
            blocks = await bitcoinClient.executeCommand('blocks', [limit.toString(), offset.toString()]);
            setCache(cacheKey, blocks);
        }

        res.json({
            success: true,
            data: blocks,
            count: blocks.length,
            limit,
            offset,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting blocks:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /mempool
 * Get current mempool transactions
 */
app.get('/mempool', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 500);
        const orderBy = req.query.order_by || 'fee_rate'; // fee_rate, time, size

        const cacheKey = `mempool_${limit}_${orderBy}`;
        let mempool = getCached(cacheKey, 5000); // Cache for 5 seconds

        if (!mempool) {
            mempool = await bitcoinClient.executeCommand('mempool', [limit.toString(), orderBy]);
            setCache(cacheKey, mempool);
        }

        res.json({
            success: true,
            data: mempool,
            count: mempool.info?.size || mempool.transactions?.length || 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting mempool:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/v1/algebra/network-graph
 * Network topology and peer graph analysis
 */
app.get('/api/v1/algebra/network-graph', async (req, res) => {
    try {
        const cacheKey = 'network_graph';
        let graph = getCached(cacheKey, 30000); // Cache for 30 seconds

        if (!graph) {
            graph = await bitcoinClient.executeCommand('network-graph');
            setCache(cacheKey, graph);
        }

        res.json({
            success: true,
            data: graph,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting network graph:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================================================
// ADDITIONAL ENDPOINTS
// ============================================================================

/**
 * GET /block/:hash
 * Get specific block by hash
 */
app.get('/block/:hash', async (req, res) => {
    try {
        const { hash } = req.params;

        if (!hash || !/^[a-fA-F0-9]{64}$/.test(hash)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid block hash format'
            });
        }

        const block = await bitcoinClient.executeCommand('block', [hash]);

        res.json({
            success: true,
            data: block,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: 'Block not found'
        });
    }
});

/**
 * GET /block/height/:height
 * Get block by height
 */
app.get('/block/height/:height', async (req, res) => {
    try {
        const { height } = req.params;
        const blockHeight = parseInt(height);

        if (isNaN(blockHeight) || blockHeight < 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid block height'
            });
        }

        const block = await bitcoinClient.executeCommand('block-height', [height]);

        res.json({
            success: true,
            data: block,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: 'Block not found'
        });
    }
});

/**
 * POST /verify/transaction
 * Verify transaction hash using double SHA-256
 */
app.post('/verify/transaction', async (req, res) => {
    try {
        const { txid, raw_tx } = req.body;

        if (!txid || !raw_tx) {
            return res.status(400).json({
                success: false,
                error: 'Missing txid or raw_tx'
            });
        }

        const result = await bitcoinClient.executeCommand('verify-tx', [txid, raw_tx]);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /verify/block
 * Verify block hash using double SHA-256
 */
app.post('/verify/block', async (req, res) => {
    try {
        const { block_hash, block_header } = req.body;

        if (!block_hash || !block_header) {
            return res.status(400).json({
                success: false,
                error: 'Missing block_hash or block_header'
            });
        }

        const result = await bitcoinClient.executeCommand('verify-block', [block_hash, block_header]);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /analytics
 * Get comprehensive analytics
 */
app.get('/analytics', async (req, res) => {
    try {
        const cacheKey = 'analytics';
        let analytics = getCached(cacheKey, 60000); // Cache for 1 minute

        if (!analytics) {
            analytics = await bitcoinClient.executeCommand('analytics');
            setCache(cacheKey, analytics);
        }

        res.json({
            success: true,
            data: analytics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        service: 'Bitcoin Core Mainnet API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /
 * API documentation
 */
app.get('/', (req, res) => {
    res.json({
        service: 'Bitcoin Core Mainnet API',
        version: '1.0.0',
        description: 'Full Bitcoin standard double SHA-256 operations',
        endpoints: {
            status: {
                method: 'GET',
                path: '/status',
                description: 'Get current node status and network information'
            },
            transaction: {
                method: 'GET',
                path: '/transaction/:tx_hash',
                description: 'Get transaction details with SHA-256 verification'
            },
            blocks: {
                method: 'GET',
                path: '/blocks',
                description: 'Get recent blocks',
                params: 'limit (default: 10, max: 100), offset (default: 0)'
            },
            mempool: {
                method: 'GET',
                path: '/mempool',
                description: 'Get current mempool transactions',
                params: 'limit (default: 50, max: 500), order_by (fee_rate|time|size)'
            },
            networkGraph: {
                method: 'GET',
                path: '/api/v1/algebra/network-graph',
                description: 'Network topology and peer graph analysis'
            },
            block: {
                method: 'GET',
                path: '/block/:hash',
                description: 'Get specific block by hash'
            },
            blockByHeight: {
                method: 'GET',
                path: '/block/height/:height',
                description: 'Get block by height'
            },
            verifyTransaction: {
                method: 'POST',
                path: '/verify/transaction',
                description: 'Verify transaction hash using double SHA-256',
                body: { txid: 'string', raw_tx: 'string' }
            },
            verifyBlock: {
                method: 'POST',
                path: '/verify/block',
                description: 'Verify block hash using double SHA-256',
                body: { block_hash: 'string', block_header: 'string' }
            },
            analytics: {
                method: 'GET',
                path: '/analytics',
                description: 'Get comprehensive analytics'
            },
            health: {
                method: 'GET',
                path: '/health',
                description: 'Health check endpoint'
            }
        },
        features: [
            'Bitcoin Core mainnet integration',
            'Full double SHA-256 verification',
            'Real-time mempool monitoring',
            'Network graph analysis',
            'Transaction and block verification',
            'Comprehensive analytics'
        ],
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Bitcoin Core Mainnet API Server                            ║
║  Version: 1.0.0                                              ║
║  Port: ${PORT}                                                  ║
║                                                              ║
║  Using full Bitcoin standard double SHA-256 algorithms      ║
║                                                              ║
║  Endpoints:                                                  ║
║  - GET  /status                                              ║
║  - GET  /transaction/:tx_hash                                ║
║  - GET  /blocks                                              ║
║  - GET  /mempool                                             ║
║  - GET  /api/v1/algebra/network-graph                        ║
║  - GET  /analytics                                           ║
║  - GET  /health                                              ║
║                                                              ║
║  Documentation: http://localhost:${PORT}/                       ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

module.exports = app;
