/**
 * CryptoOS Desktop - Global Type Declarations
 *
 * TypeScript declarations for the window.cryptoOS API exposed by the preload script.
 */

import type { CryptoOSAPI } from '../preload';

declare global {
  interface Window {
    cryptoOS: CryptoOSAPI;
  }
}

export {};
