# Complete Setup Guide 🛠️

## Unified Bitcoin System Installation

This guide will walk you through setting up the complete Rounsaville Elite Bitcoin System from scratch.

---

## Step 1: Bitcoin Core Node Setup

### Download Bitcoin Core

1. Visit https://bitcoin.org/en/download
2. Download Bitcoin Core for your operating system
3. Install Bitcoin Core

### Configure Bitcoin Core

1. Create `bitcoin.conf` file:
   - **Linux/Mac**: `~/.bitcoin/bitcoin.conf`
   - **Windows**: `%APPDATA%\Bitcoin\bitcoin.conf`

2. Add the following configuration:

```conf
# Bitcoin Core Configuration for Rounsaville Elite System

# Network
testnet=0          # 0 for mainnet, 1 for testnet
mainnet=1

# RPC Server
server=1
rpcuser=rounsaville_rpc_user
rpcpassword=CHANGE_THIS_TO_STRONG_PASSWORD
rpcallowip=127.0.0.1
rpcport=8332

# Connection Settings
maxconnections=125
maxuploadtarget=5000

# Mempool
maxmempool=300
mempoolexpiry=72

# Performance
dbcache=4096
maxorphantx=100

# Logging (optional)
debug=0
printtoconsole=0
```

3. **Important**: Change the `rpcpassword` to a strong, unique password!

### Start Bitcoin Core

```bash
# Linux/Mac
bitcoind -daemon

# Or use Bitcoin-Qt GUI application
```

### Wait for Sync

Bitcoin Core needs to download the entire blockchain (~500GB). This can take several days.

Check sync status:
```bash
bitcoin-cli getblockchaininfo
```

Look for `"verificationprogress"` - should be close to 1.0 when synced.

---

## Step 2: System Requirements

### Hardware
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 600GB+ free space (for blockchain)
- **Network**: Stable broadband connection

### Software
- **Node.js**: v18.0.0 or higher
- **Python**: v3.8 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version

---

## Step 3: Install Node.js and Python

### Install Node.js

**Linux (Ubuntu/Debian)**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Mac**:
```bash
brew install node@18
```

**Windows**:
Download from https://nodejs.org/

Verify:
```bash
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
```

### Install Python

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get update
sudo apt-get install python3 python3-pip
```

**Mac**:
```bash
brew install python@3.11
```

**Windows**:
Download from https://www.python.org/downloads/

Verify:
```bash
python3 --version  # Should show 3.8 or higher
pip3 --version
```

---

## Step 4: Project Setup

### Clone or Navigate to Project

```bash
cd /path/to/RounsavilleElite
```

### Install Node.js Dependencies

```bash
npm install
```

This will install:
- express (API server)
- cors (Cross-origin support)
- jsonwebtoken (Authentication)
- dotenv (Environment management)

### Install Python Dependencies

```bash
pip3 install -r requirements.txt
```

This will install:
- requests (HTTP client)
- PyJWT (JSON Web Tokens)

---

## Step 5: Configuration

### Create Environment File

```bash
cp .env.example .env
```

### Edit .env File

```bash
nano .env  # or use your preferred editor
```

Update with your Bitcoin Core credentials:

```bash
# Bitcoin Core Node Configuration
BITCOIN_RPC_HOST=127.0.0.1
BITCOIN_RPC_PORT=8332
BITCOIN_RPC_USER=rounsaville_rpc_user
BITCOIN_RPC_PASSWORD=your_actual_password_here

# Database Configuration
BITCOIN_DB_PATH=bitcoin_data.db

# Server Configuration
PORT=3000
NODE_ENV=production

# Presence Authentication
PRESENCE_SECRET_KEY=generate_a_random_32_character_string

# API Configuration
API_RATE_LIMIT=100
CACHE_TTL_SECONDS=10

# Network Configuration
BITCOIN_NETWORK=mainnet

# Logging
LOG_LEVEL=info
```

### Generate Secret Key

Generate a secure secret key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as `PRESENCE_SECRET_KEY` in your `.env` file.

---

## Step 6: Test Bitcoin Connection

### Test RPC Connection

```bash
bitcoin-cli -rpcuser=rounsaville_rpc_user -rpcpassword=your_password getblockchaininfo
```

If successful, you'll see blockchain information.

### Test Python Client

```bash
python3 bitcoin_core/cli.py status
```

Expected output (if node is online):
```json
{
  "status": "online",
  "network": "main",
  "blocks": 820000,
  "headers": 820000,
  "sync_progress": 0.9999,
  "connections": 8
}
```

---

## Step 7: Start the System

### Start API Server

```bash
npm start
```

You should see:
```
╔══════════════════════════════════════════════════════════════╗
║  Bitcoin Core Mainnet API Server                            ║
║  Version: 1.0.0                                              ║
║  Port: 3000                                                  ║
║                                                              ║
║  Using full Bitcoin standard double SHA-256 algorithms      ║
╚══════════════════════════════════════════════════════════════╝
```

### Test API Endpoints

Open a new terminal:

```bash
# Health check
curl http://localhost:3000/health

# Get status
curl http://localhost:3000/status

# Get recent blocks
curl http://localhost:3000/blocks?limit=5

# Get mempool
curl http://localhost:3000/mempool?limit=10

# Network graph
curl http://localhost:3000/api/v1/algebra/network-graph
```

---

## Step 8: Verify System Integrity

### Test Cryptography

```bash
python3 << EOF
from bitcoin_core.crypto import BitcoinCrypto

crypto = BitcoinCrypto()
test_data = b"Hello Bitcoin Mainnet"
hash_result = crypto.double_sha256(test_data)
print(f"Double SHA-256 Hash: {hash_result.hex()}")
print("✓ Cryptography module working")
EOF
```

### Test Authentication

```bash
python3 << EOF
from unified_system.presence_auth import PresenceAuth

auth = PresenceAuth()
token = auth.generate_presence_token("test_user", "Bitcoin Mainnet")
is_valid, payload = auth.verify_presence_token(token)
print(f"Token Valid: {is_valid}")
print("✓ Authentication module working")
EOF
```

### Test Visualization

```bash
python3 << EOF
from unified_system.visualization import BitcoinVisualizer

viz = BitcoinVisualizer()
viz.display_block_confirmation(820000, "000000000000000000032028", 2500)
print("✓ Visualization module working")
EOF
```

---

## Step 9: Run Full System Test

### Test All CLI Commands

```bash
# Status
python3 bitcoin_core/cli.py status

# Recent blocks (get 3 blocks)
python3 bitcoin_core/cli.py blocks 3 0

# Mempool (get 10 transactions)
python3 bitcoin_core/cli.py mempool 10 fee_rate

# Network graph
python3 bitcoin_core/cli.py network-graph

# Analytics
python3 bitcoin_core/cli.py analytics
```

### Test All API Endpoints

```bash
# Create a test script
cat > test_api.sh << 'SCRIPT'
#!/bin/bash
echo "Testing all API endpoints..."

echo -e "\n1. Health Check:"
curl -s http://localhost:3000/health | json_pp

echo -e "\n2. Status:"
curl -s http://localhost:3000/status | json_pp

echo -e "\n3. Blocks:"
curl -s http://localhost:3000/blocks?limit=2 | json_pp

echo -e "\n4. Mempool:"
curl -s http://localhost:3000/mempool?limit=5 | json_pp

echo -e "\n5. Network Graph:"
curl -s http://localhost:3000/api/v1/algebra/network-graph | json_pp

echo -e "\n6. Analytics:"
curl -s http://localhost:3000/analytics | json_pp

echo -e "\n✓ All tests complete!"
SCRIPT

chmod +x test_api.sh
./test_api.sh
```

---

## Step 10: Production Deployment

### Security Checklist

- [ ] Change all default passwords
- [ ] Use strong `PRESENCE_SECRET_KEY`
- [ ] Enable HTTPS (use reverse proxy like nginx)
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Enable logging
- [ ] Set up monitoring
- [ ] Configure backups

### Use Process Manager

Install PM2 for production:
```bash
npm install -g pm2

# Start server
pm2 start backend/server.js --name bitcoin-api

# View logs
pm2 logs bitcoin-api

# Monitor
pm2 monit

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Set Up Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable HTTPS

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Troubleshooting

### Bitcoin Core Not Starting
- Check `~/.bitcoin/debug.log`
- Ensure sufficient disk space
- Verify port 8333 is not blocked

### RPC Connection Failed
- Verify `bitcoin.conf` settings
- Check Bitcoin Core is running: `bitcoin-cli ping`
- Verify credentials match `.env` file

### API Server Not Starting
- Check if port 3000 is available: `lsof -i :3000`
- Verify Node.js version: `node --version`
- Check logs for error messages

### Database Errors
- Ensure write permissions: `chmod 664 bitcoin_data.db`
- Check disk space: `df -h`
- Delete and recreate if corrupted: `rm bitcoin_data.db`

### Slow Performance
- Increase `dbcache` in `bitcoin.conf`
- Reduce API cache TTL in `.env`
- Ensure Bitcoin Core is fully synced

---

## Support

If you encounter issues:

1. Check logs: `pm2 logs bitcoin-api`
2. Review Bitcoin Core logs: `~/.bitcoin/debug.log`
3. Test Bitcoin RPC: `bitcoin-cli getblockchaininfo`
4. Contact support: support@rounsavilleelite.store

---

## Next Steps

✓ System is now fully operational!

Explore:
- API documentation: http://localhost:3000/
- View live status: http://localhost:3000/status
- Monitor network: http://localhost:3000/api/v1/algebra/network-graph
- Check analytics: http://localhost:3000/analytics

---

**Congratulations! Your unified Bitcoin system is ready for production.** 🎉
