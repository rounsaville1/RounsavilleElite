import { ethers } from 'ethers';
import { Transaction, SignedTransaction } from './types';

/**
 * Signer class for transaction signing
 */
export class Signer {
  /**
   * Sign a transaction with a private key
   */
  signTransaction(
    transaction: Transaction,
    privateKey: string
  ): SignedTransaction {
    const wallet = new ethers.Wallet(privateKey);

    // Create serializable transaction
    const tx = {
      to: transaction.to,
      value: ethers.parseEther(transaction.value),
      nonce: transaction.nonce,
      gasLimit: transaction.gasLimit,
      gasPrice: ethers.parseUnits(transaction.gasPrice, 'gwei'),
      data: transaction.data || '0x',
    };

    // Sign transaction (returns promise, but we'll handle it synchronously for now)
    const signature = wallet.signingKey.sign(
      ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(tx)))
    );

    const signedTx: SignedTransaction = {
      ...transaction,
      signature: signature.serialized,
      hash: ethers.keccak256(signature.serialized),
    };

    return signedTx;
  }

  /**
   * Sign a message with a private key
   */
  signMessage(message: string, privateKey: string): string {
    const wallet = new ethers.Wallet(privateKey);
    const messageHash = ethers.hashMessage(message);
    const signature = wallet.signingKey.sign(messageHash);
    return signature.serialized;
  }

  /**
   * Verify a message signature
   */
  verifyMessage(message: string, signature: string): string {
    return ethers.verifyMessage(message, signature);
  }

  /**
   * Recover address from signature
   */
  recoverAddress(message: string, signature: string): string {
    return ethers.verifyMessage(message, signature);
  }

  /**
   * Hash data using keccak256
   */
  hash(data: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }
}
