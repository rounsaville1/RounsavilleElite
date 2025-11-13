import { BitcoinDaemon } from './bitcoin-daemon';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);

export class WalletManager {
  private daemon: BitcoinDaemon;
  private currentWallet: string | null = null;

  constructor(daemon: BitcoinDaemon) {
    this.daemon = daemon;
  }

  async createWallet(walletName: string, passphrase: string): Promise<any> {
    const client = this.daemon.getClient();
    if (!client) throw new Error('Bitcoin client not initialized');

    try {
      // Create wallet in Bitcoin Core
      const result = await client.command('createwallet', walletName, false, false, passphrase);

      this.currentWallet = walletName;

      // Generate mnemonic for additional security
      const mnemonic = bip39.generateMnemonic(128); // 12 words

      console.log('🔐 Wallet created:', walletName);

      return {
        success: true,
        walletName,
        mnemonic, // User should backup this securely
        warning: 'BACKUP YOUR MNEMONIC PHRASE - This is the only way to recover your wallet!',
      };
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  async loadWallet(walletName: string): Promise<any> {
    const client = this.daemon.getClient();
    if (!client) throw new Error('Bitcoin client not initialized');

    try {
      await client.command('loadwallet', walletName);
      this.currentWallet = walletName;

      console.log('📂 Wallet loaded:', walletName);

      return {
        success: true,
        walletName,
      };
    } catch (error: any) {
      console.error('Error loading wallet:', error);
      throw new Error(`Failed to load wallet: ${error.message}`);
    }
  }

  async getBalance(): Promise<any> {
    const client = this.daemon.getClient();
    if (!client) throw new Error('Bitcoin client not initialized');

    try {
      const balance = await client.command('getbalance');
      const unconfirmed = await client.command('getunconfirmedbalance');

      return {
        confirmed: balance,
        unconfirmed,
        total: balance + unconfirmed,
      };
    } catch (error: any) {
      console.error('Error getting balance:', error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async getAddresses(): Promise<any[]> {
    const client = this.daemon.getClient();
    if (!client) throw new Error('Bitcoin client not initialized');

    try {
      const addresses = await client.command('listreceivedbyaddress', 0, true);
      return addresses;
    } catch (error: any) {
      console.error('Error getting addresses:', error);
      throw new Error(`Failed to get addresses: ${error.message}`);
    }
  }

  async generateAddress(label?: string): Promise<string> {
    const client = this.daemon.getClient();
    if (!client) throw new Error('Bitcoin client not initialized');

    try {
      const address = await client.command('getnewaddress', label || '');
      console.log('🏠 New address generated:', address);
      return address;
    } catch (error: any) {
      console.error('Error generating address:', error);
      throw new Error(`Failed to generate address: ${error.message}`);
    }
  }

  async getTransactions(limit: number = 100): Promise<any[]> {
    const client = this.daemon.getClient();
    if (!client) throw new Error('Bitcoin client not initialized');

    try {
      const transactions = await client.command('listtransactions', '*', limit);
      return transactions;
    } catch (error: any) {
      console.error('Error getting transactions:', error);
      throw new Error(`Failed to get transactions: ${error.message}`);
    }
  }

  async sendTransaction(to: string, amount: number, fee?: number): Promise<string> {
    const client = this.daemon.getClient();
    if (!client) throw new Error('Bitcoin client not initialized');

    try {
      // Validate address
      const addressInfo = await client.command('validateaddress', to);
      if (!addressInfo.isvalid) {
        throw new Error('Invalid Bitcoin address');
      }

      // Set fee rate if provided
      if (fee) {
        await client.command('settxfee', fee);
      }

      // Send transaction
      const txid = await client.command('sendtoaddress', to, amount);

      console.log('💸 Transaction sent:', txid);

      return txid;
    } catch (error: any) {
      console.error('Error sending transaction:', error);
      throw new Error(`Failed to send transaction: ${error.message}`);
    }
  }

  async estimateFee(to: string, amount: number): Promise<number> {
    const client = this.daemon.getClient();
    if (!client) throw new Error('Bitcoin client not initialized');

    try {
      // Estimate smart fee for next block
      const feeEstimate = await client.command('estimatesmartfee', 1);

      if (feeEstimate.feerate) {
        return feeEstimate.feerate;
      }

      // Fallback to network info
      const networkInfo = await client.command('getnetworkinfo');
      return networkInfo.relayfee || 0.00001;
    } catch (error: any) {
      console.error('Error estimating fee:', error);
      return 0.00001; // Fallback fee
    }
  }

  async backupWallet(destination: string): Promise<void> {
    const client = this.daemon.getClient();
    if (!client) throw new Error('Bitcoin client not initialized');

    try {
      await client.command('backupwallet', destination);
      console.log('💾 Wallet backed up to:', destination);
    } catch (error: any) {
      console.error('Error backing up wallet:', error);
      throw new Error(`Failed to backup wallet: ${error.message}`);
    }
  }

  async importPrivateKey(privateKey: string, label?: string): Promise<void> {
    const client = this.daemon.getClient();
    if (!client) throw new Error('Bitcoin client not initialized');

    try {
      await client.command('importprivkey', privateKey, label || '', false);
      console.log('🔑 Private key imported');
    } catch (error: any) {
      console.error('Error importing private key:', error);
      throw new Error(`Failed to import private key: ${error.message}`);
    }
  }

  async exportPrivateKey(address: string): Promise<string> {
    const client = this.daemon.getClient();
    if (!client) throw new Error('Bitcoin client not initialized');

    try {
      const privateKey = await client.command('dumpprivkey', address);
      return privateKey;
    } catch (error: any) {
      console.error('Error exporting private key:', error);
      throw new Error(`Failed to export private key: ${error.message}`);
    }
  }

  generateMnemonicWallet(mnemonic?: string): any {
    // Generate or use provided mnemonic
    const seed = mnemonic ? mnemonic : bip39.generateMnemonic(128);

    if (!bip39.validateMnemonic(seed)) {
      throw new Error('Invalid mnemonic phrase');
    }

    // Generate seed from mnemonic
    const seedBuffer = bip39.mnemonicToSeedSync(seed);

    // Create master key (BIP32)
    const root = bip32.fromSeed(seedBuffer, bitcoin.networks.bitcoin);

    // Derive BIP84 (Native SegWit) path: m/84'/0'/0'/0/0
    const path = "m/84'/0'/0'/0/0";
    const child = root.derivePath(path);

    // Generate address
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: child.publicKey,
      network: bitcoin.networks.bitcoin,
    });

    return {
      mnemonic: seed,
      privateKey: child.toWIF(),
      publicKey: child.publicKey.toString('hex'),
      address,
      path,
    };
  }
}
