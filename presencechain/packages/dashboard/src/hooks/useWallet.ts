import { useState, useEffect } from 'react';
import { Wallet } from '@presencechain/wallet-sdk';

const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://localhost:8545';

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Try to load wallet from localStorage
    const savedMnemonic = localStorage.getItem('wallet_mnemonic');
    if (savedMnemonic) {
      try {
        const w = new Wallet({ rpcUrl: RPC_URL, mnemonic: savedMnemonic });
        setWallet(w);
        const account = w.getPrimaryAccount();
        setAddress(account.address);
        setIsConnected(true);
        loadBalance(w);
      } catch (error) {
        console.error('Failed to load wallet:', error);
      }
    }
  }, []);

  const loadBalance = async (w: Wallet) => {
    try {
      const bal = await w.getBalance();
      setBalance(bal);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const createWallet = () => {
    const w = Wallet.generate(RPC_URL);
    const mnemonic = w.getMnemonic();
    if (mnemonic) {
      localStorage.setItem('wallet_mnemonic', mnemonic);
    }
    setWallet(w);
    const account = w.getPrimaryAccount();
    setAddress(account.address);
    setIsConnected(true);
    loadBalance(w);
    return mnemonic;
  };

  const importWallet = (mnemonic: string) => {
    const w = new Wallet({ rpcUrl: RPC_URL, mnemonic });
    localStorage.setItem('wallet_mnemonic', mnemonic);
    setWallet(w);
    const account = w.getPrimaryAccount();
    setAddress(account.address);
    setIsConnected(true);
    loadBalance(w);
  };

  const sendTransaction = async (to: string, amount: string) => {
    if (!wallet) throw new Error('Wallet not connected');
    const txHash = await wallet.sendTransaction(to, amount);
    await loadBalance(wallet);
    return txHash;
  };

  const disconnect = () => {
    localStorage.removeItem('wallet_mnemonic');
    setWallet(null);
    setAddress('');
    setBalance('0');
    setIsConnected(false);
  };

  return {
    wallet,
    address,
    balance,
    isConnected,
    createWallet,
    importWallet,
    sendTransaction,
    disconnect,
  };
}
