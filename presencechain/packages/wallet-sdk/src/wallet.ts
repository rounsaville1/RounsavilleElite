import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import { Account, WalletConfig } from './types';
import { Signer } from './signer';
import { RPCClient } from './api';

/**
 * Wallet class for key/mnemonic generation and management
 * Supports BIP39 mnemonics and BIP44 derivation paths
 */
export class Wallet {
  private mnemonic?: string;
  private accounts: Account[] = [];
  private signer: Signer;
  private rpcClient: RPCClient;

  constructor(config: WalletConfig) {
    this.rpcClient = new RPCClient({ url: config.rpcUrl });
    this.signer = new Signer();

    if (config.mnemonic) {
      this.importFromMnemonic(config.mnemonic);
    } else if (config.privateKey) {
      this.importFromPrivateKey(config.privateKey);
    }
  }

  /**
   * Generate a new wallet with a random mnemonic
   */
  static generate(rpcUrl: string): Wallet {
    const mnemonic = bip39.generateMnemonic();
    return new Wallet({ rpcUrl, mnemonic });
  }

  /**
   * Import wallet from mnemonic phrase
   */
  importFromMnemonic(mnemonic: string): void {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    this.mnemonic = mnemonic;
    // Derive first account (m/44'/60'/0'/0/0)
    this.deriveAccount(0);
  }

  /**
   * Import wallet from private key
   */
  importFromPrivateKey(privateKey: string): void {
    const wallet = new ethers.Wallet(privateKey);
    const account: Account = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
    };
    this.accounts.push(account);
  }

  /**
   * Derive account from mnemonic using BIP44 path
   */
  deriveAccount(index: number): Account {
    if (!this.mnemonic) {
      throw new Error('No mnemonic available for derivation');
    }

    // BIP44 path: m/44'/60'/0'/0/{index}
    const path = `m/44'/60'/0'/0/${index}`;
    const hdNode = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(this.mnemonic),
      path
    );

    const account: Account = {
      address: hdNode.address,
      privateKey: hdNode.privateKey,
      publicKey: hdNode.publicKey,
    };

    this.accounts.push(account);
    return account;
  }

  /**
   * Get all accounts in the wallet
   */
  getAccounts(): Account[] {
    return this.accounts;
  }

  /**
   * Get primary account (first account)
   */
  getPrimaryAccount(): Account {
    if (this.accounts.length === 0) {
      throw new Error('No accounts in wallet');
    }
    return this.accounts[0];
  }

  /**
   * Get account by index
   */
  getAccount(index: number): Account {
    if (index >= this.accounts.length) {
      throw new Error(`Account at index ${index} does not exist`);
    }
    return this.accounts[index];
  }

  /**
   * Get mnemonic phrase (if available)
   */
  getMnemonic(): string | undefined {
    return this.mnemonic;
  }

  /**
   * Get balance for an account
   */
  async getBalance(address?: string): Promise<string> {
    const addr = address || this.getPrimaryAccount().address;
    return this.rpcClient.getBalance(addr);
  }

  /**
   * Send transaction
   */
  async sendTransaction(
    to: string,
    value: string,
    from?: string
  ): Promise<string> {
    const account = from
      ? this.accounts.find((acc) => acc.address === from)
      : this.getPrimaryAccount();

    if (!account) {
      throw new Error('Account not found');
    }

    // Get nonce
    const nonce = await this.rpcClient.getTransactionCount(account.address);

    // Create transaction
    const tx = {
      from: account.address,
      to,
      value,
      nonce,
      gasLimit: 21000,
      gasPrice: '1000000000', // 1 Gwei
    };

    // Sign transaction
    const signedTx = this.signer.signTransaction(tx, account.privateKey);

    // Send transaction
    return this.rpcClient.sendTransaction(signedTx);
  }

  /**
   * Sign message with account private key
   */
  signMessage(message: string, accountIndex: number = 0): string {
    const account = this.getAccount(accountIndex);
    return this.signer.signMessage(message, account.privateKey);
  }

  /**
   * Export wallet as JSON (encrypted with password)
   */
  async exportAsJSON(password: string): Promise<string> {
    const account = this.getPrimaryAccount();
    const wallet = new ethers.Wallet(account.privateKey);
    return wallet.encrypt(password);
  }

  /**
   * Import wallet from encrypted JSON
   */
  static async importFromJSON(
    json: string,
    password: string,
    rpcUrl: string
  ): Promise<Wallet> {
    const wallet = await ethers.Wallet.fromEncryptedJson(json, password);
    return new Wallet({
      rpcUrl,
      privateKey: wallet.privateKey,
    });
  }
}
