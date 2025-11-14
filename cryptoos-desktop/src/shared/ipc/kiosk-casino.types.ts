/**
 * CryptoOS Desktop - Kiosk & Casino IPC Interface
 *
 * Type-safe IPC channels for Bitcoin Kiosk operations and
 * GoldenHorse casino simulation / gaming features.
 */

import type { IPCChannel, IPCRequest, IPCResponse, IPCEvent } from './base.types';
import type { CryptoChain } from './wallet-manager.types';

// ============================================================================
// KIOSK CHANNELS
// ============================================================================

export const KIOSK_CHANNELS = {
  // Kiosk mode control
  ENTER_KIOSK_MODE: 'cryptoos:kiosk:enter-kiosk-mode' as IPCChannel,
  EXIT_KIOSK_MODE: 'cryptoos:kiosk:exit-kiosk-mode' as IPCChannel,
  GET_KIOSK_STATUS: 'cryptoos:kiosk:get-kiosk-status' as IPCChannel,
  UPDATE_KIOSK_CONFIG: 'cryptoos:kiosk:update-kiosk-config' as IPCChannel,

  // Buy/Sell crypto (ATM functionality)
  INITIATE_BUY: 'cryptoos:kiosk:initiate-buy' as IPCChannel,
  INITIATE_SELL: 'cryptoos:kiosk:initiate-sell' as IPCChannel,
  GET_EXCHANGE_RATE: 'cryptoos:kiosk:get-exchange-rate' as IPCChannel,
  GET_LIMITS: 'cryptoos:kiosk:get-limits' as IPCChannel,
  VERIFY_IDENTITY: 'cryptoos:kiosk:verify-identity' as IPCChannel,
  PROCESS_PAYMENT: 'cryptoos:kiosk:process-payment' as IPCChannel,

  // Events
  ON_KIOSK_MODE_CHANGED: 'cryptoos:kiosk:on-kiosk-mode-changed' as IPCChannel,
  ON_TRANSACTION_STARTED: 'cryptoos:kiosk:on-transaction-started' as IPCChannel,
  ON_RATE_UPDATED: 'cryptoos:kiosk:on-rate-updated' as IPCChannel,
} as const;

// ============================================================================
// CASINO CHANNELS
// ============================================================================

export const CASINO_CHANNELS = {
  // Casino management
  START_CASINO: 'cryptoos:casino:start-casino' as IPCChannel,
  STOP_CASINO: 'cryptoos:casino:stop-casino' as IPCChannel,
  GET_CASINO_STATUS: 'cryptoos:casino:get-casino-status' as IPCChannel,
  UPDATE_CASINO_CONFIG: 'cryptoos:casino:update-casino-config' as IPCChannel,

  // Player session
  CREATE_SESSION: 'cryptoos:casino:create-session' as IPCChannel,
  END_SESSION: 'cryptoos:casino:end-session' as IPCChannel,
  GET_SESSION: 'cryptoos:casino:get-session' as IPCChannel,
  GET_PLAYER_STATS: 'cryptoos:casino:get-player-stats' as IPCChannel,

  // Games
  LIST_GAMES: 'cryptoos:casino:list-games' as IPCChannel,
  GET_GAME: 'cryptoos:casino:get-game' as IPCChannel,
  PLACE_BET: 'cryptoos:casino:place-bet' as IPCChannel,
  SPIN_SLOT: 'cryptoos:casino:spin-slot' as IPCChannel,
  PLAY_CARD_GAME: 'cryptoos:casino:play-card-game' as IPCChannel,

  // GoldenHorse specific
  GET_RACE_INFO: 'cryptoos:casino:get-race-info' as IPCChannel,
  PLACE_HORSE_BET: 'cryptoos:casino:place-horse-bet' as IPCChannel,
  START_RACE: 'cryptoos:casino:start-race' as IPCChannel,
  GET_RACE_RESULTS: 'cryptoos:casino:get-race-results' as IPCChannel,

  // Leaderboard & achievements
  GET_LEADERBOARD: 'cryptoos:casino:get-leaderboard' as IPCChannel,
  GET_ACHIEVEMENTS: 'cryptoos:casino:get-achievements' as IPCChannel,
  UNLOCK_ACHIEVEMENT: 'cryptoos:casino:unlock-achievement' as IPCChannel,

  // Events
  ON_GAME_RESULT: 'cryptoos:casino:on-game-result' as IPCChannel,
  ON_RACE_UPDATE: 'cryptoos:casino:on-race-update' as IPCChannel,
  ON_JACKPOT_HIT: 'cryptoos:casino:on-jackpot-hit' as IPCChannel,
  ON_ACHIEVEMENT_UNLOCKED: 'cryptoos:casino:on-achievement-unlocked' as IPCChannel,
} as const;

// ============================================================================
// KIOSK TYPES
// ============================================================================

export enum KioskMode {
  DISABLED = 'disabled',
  BUY_ONLY = 'buy-only',
  SELL_ONLY = 'sell-only',
  FULL_SERVICE = 'full-service',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank-transfer',
  MOBILE_PAYMENT = 'mobile-payment',
}

export enum IdentityVerificationLevel {
  NONE = 'none',
  BASIC = 'basic', // Phone number
  INTERMEDIATE = 'intermediate', // ID document
  FULL = 'full', // KYC + AML
}

export interface KioskConfig {
  mode: KioskMode;
  supportedChains: CryptoChain[];
  paymentMethods: PaymentMethod[];
  limits: {
    minTransaction: number; // USD
    maxTransaction: number; // USD
    dailyLimit: number; // USD
    requiresVerificationAbove: number; // USD
  };
  fees: {
    buyFeePercent: number;
    sellFeePercent: number;
    networkFeeMarkup: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'gold';
    language: string;
    timeout: number; // Auto-exit after inactivity (seconds)
  };
}

export interface KioskTransaction {
  id: string;
  type: 'buy' | 'sell';
  chain: CryptoChain;
  amount: string; // Crypto amount
  fiatAmount: string; // USD amount
  exchangeRate: number;
  fee: string;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: number;
  completedAt?: number;
  receiptUrl?: string;
}

export interface ExchangeRate {
  chain: CryptoChain;
  buy: number; // USD per coin
  sell: number; // USD per coin
  lastUpdated: number;
  source: string; // Exchange source
}

// ============================================================================
// CASINO TYPES
// ============================================================================

export enum GameType {
  SLOT_MACHINE = 'slot-machine',
  BLACKJACK = 'blackjack',
  ROULETTE = 'roulette',
  POKER = 'poker',
  HORSE_RACING = 'horse-racing',
  DICE = 'dice',
  CRASH = 'crash',
}

export interface CasinoConfig {
  enabled: boolean;
  theme: 'classic' | 'gold' | 'neon' | 'cyberpunk';
  soundEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  houseEdge: {
    [key in GameType]?: number; // Percentage
  };
  maxBet: {
    [key in GameType]?: string; // In BTC
  };
  minBet: string; // In BTC
  jackpotEnabled: boolean;
  jackpotContribution: number; // Percentage of each bet
}

export interface PlayerSession {
  id: string;
  playerId: string;
  startedAt: number;
  endedAt?: number;
  walletAddress: string;
  startingBalance: string;
  currentBalance: string;
  totalWagered: string;
  totalWon: string;
  gamesPlayed: number;
}

export interface PlayerStats {
  playerId: string;
  totalSessions: number;
  totalWagered: string;
  totalWon: string;
  totalLost: string;
  favoriteGame: GameType;
  biggestWin: string;
  gamesPlayed: {
    [key in GameType]?: number;
  };
  achievements: string[];
  rank: number;
  vipLevel: number;
}

export interface Game {
  id: string;
  type: GameType;
  name: string;
  description: string;
  minBet: string;
  maxBet: string;
  houseEdge: number;
  jackpotEnabled: boolean;
  currentJackpot?: string;
  active: boolean;
  playCount: number;
  totalWagered: string;
}

export interface SlotResult {
  reels: string[][]; // 3x3 or 5x3 grid of symbols
  winLines: number[];
  multiplier: number;
  payout: string;
}

export interface CardGameState {
  gameId: string;
  deck: string[];
  playerHand: string[];
  dealerHand: string[];
  playerScore: number;
  dealerScore: number;
  canHit: boolean;
  canStand: boolean;
  canDouble: boolean;
  canSplit: boolean;
}

// GoldenHorse Racing
export interface Horse {
  id: number;
  name: string;
  odds: number;
  stats: {
    speed: number;
    stamina: number;
    consistency: number;
  };
  winRate: number;
  form: string; // "1-2-3-1-1" recent placements
}

export interface Race {
  id: string;
  raceNumber: number;
  startTime: number;
  horses: Horse[];
  track: {
    distance: number; // meters
    condition: 'firm' | 'good' | 'soft' | 'heavy';
    weather: 'sunny' | 'cloudy' | 'rainy';
  };
  totalPool: string; // Total bets placed
  status: 'upcoming' | 'betting-open' | 'running' | 'finished';
}

export interface HorseBet {
  id: string;
  raceId: string;
  horseId: number;
  betType: 'win' | 'place' | 'show' | 'exacta' | 'trifecta';
  amount: string;
  potentialPayout: string;
  placedAt: number;
}

export interface RaceResult {
  raceId: string;
  finishOrder: number[]; // Horse IDs in finish order
  times: number[]; // Finish times in seconds
  payouts: {
    win: string;
    place: string;
    show: string;
  };
  videoUrl?: string;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface EnterKioskModeRequest {
  config?: Partial<KioskConfig>;
  fullscreen?: boolean;
}

export interface InitiateBuyRequest {
  chain: CryptoChain;
  fiatAmount: string;
  paymentMethod: PaymentMethod;
  destinationAddress: string;
  verificationData?: {
    phoneNumber?: string;
    idDocument?: string;
    selfie?: string;
  };
}

export interface InitiateSellRequest {
  chain: CryptoChain;
  cryptoAmount: string;
  paymentMethod: PaymentMethod;
  payoutDetails: {
    accountNumber?: string;
    routingNumber?: string;
    phoneNumber?: string;
  };
}

export interface CreateSessionRequest {
  playerId: string;
  walletAddress: string;
  initialDeposit?: string;
}

export interface PlaceBetRequest {
  sessionId: string;
  gameId: string;
  amount: string;
  gameSpecificData?: {
    // For roulette
    numbers?: number[];
    color?: 'red' | 'black';
    // For slots
    lines?: number;
    // For crash
    autoCashout?: number;
  };
}

export interface SpinSlotRequest {
  sessionId: string;
  gameId: string;
  betAmount: string;
  lines: number;
}

export interface PlayCardGameRequest {
  sessionId: string;
  gameId: string;
  action: 'deal' | 'hit' | 'stand' | 'double' | 'split';
  betAmount?: string; // Required for 'deal'
}

export interface PlaceHorseBetRequest {
  sessionId: string;
  raceId: string;
  horseId: number;
  betType: 'win' | 'place' | 'show' | 'exacta' | 'trifecta';
  amount: string;
  horses?: number[]; // For exacta/trifecta
}

export interface StartRaceRequest {
  raceId: string;
  simulate?: boolean; // If true, instant simulation
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface KioskStatusResponse {
  active: boolean;
  mode: KioskMode;
  currentTransaction?: KioskTransaction;
  config: KioskConfig;
}

export interface ExchangeRateResponse {
  rates: ExchangeRate[];
  timestamp: number;
}

export interface ProcessPaymentResponse {
  transaction: KioskTransaction;
  qrCode?: string; // For crypto address
  instructions: string;
}

export interface CasinoStatusResponse {
  running: boolean;
  activeGames: number;
  activeSessions: number;
  totalJackpot: string;
  config: CasinoConfig;
}

export interface GameResultResponse {
  sessionId: string;
  gameId: string;
  result: {
    won: boolean;
    payout: string;
    multiplier?: number;
    details: SlotResult | CardGameState | RaceResult | unknown;
  };
  newBalance: string;
}

export interface LeaderboardResponse {
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  entries: {
    rank: number;
    playerId: string;
    playerName: string;
    winnings: string;
    gamesPlayed: number;
  }[];
  playerRank?: number;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface KioskModeChangedPayload {
  oldMode: KioskMode;
  newMode: KioskMode;
  timestamp: number;
}

export interface TransactionStartedPayload {
  transaction: KioskTransaction;
}

export interface RateUpdatedPayload {
  rate: ExchangeRate;
}

export interface GameResultPayload {
  sessionId: string;
  gameType: GameType;
  won: boolean;
  payout: string;
  timestamp: number;
}

export interface RaceUpdatePayload {
  raceId: string;
  positions: {
    horseId: number;
    position: number;
    distance: number; // meters covered
  }[];
  progress: number; // 0-100%
}

export interface JackpotHitPayload {
  sessionId: string;
  gameId: string;
  amount: string;
  timestamp: number;
}

export interface AchievementUnlockedPayload {
  playerId: string;
  achievementId: string;
  achievementName: string;
  reward?: string;
  timestamp: number;
}

// ============================================================================
// TYPED IPC CONTRACTS
// ============================================================================

export type KioskIPCContract = {
  [KIOSK_CHANNELS.ENTER_KIOSK_MODE]: {
    request: IPCRequest<EnterKioskModeRequest>;
    response: IPCResponse<KioskStatusResponse>;
  };
  [KIOSK_CHANNELS.EXIT_KIOSK_MODE]: {
    request: IPCRequest<{}>;
    response: IPCResponse<{ exited: boolean }>;
  };
  [KIOSK_CHANNELS.GET_KIOSK_STATUS]: {
    request: IPCRequest<{}>;
    response: IPCResponse<KioskStatusResponse>;
  };
  [KIOSK_CHANNELS.UPDATE_KIOSK_CONFIG]: {
    request: IPCRequest<{ config: Partial<KioskConfig> }>;
    response: IPCResponse<KioskStatusResponse>;
  };
  [KIOSK_CHANNELS.INITIATE_BUY]: {
    request: IPCRequest<InitiateBuyRequest>;
    response: IPCResponse<ProcessPaymentResponse>;
  };
  [KIOSK_CHANNELS.INITIATE_SELL]: {
    request: IPCRequest<InitiateSellRequest>;
    response: IPCResponse<ProcessPaymentResponse>;
  };
  [KIOSK_CHANNELS.GET_EXCHANGE_RATE]: {
    request: IPCRequest<{ chains?: CryptoChain[] }>;
    response: IPCResponse<ExchangeRateResponse>;
  };
  [KIOSK_CHANNELS.GET_LIMITS]: {
    request: IPCRequest<{ verificationLevel: IdentityVerificationLevel }>;
    response: IPCResponse<KioskConfig['limits']>;
  };
  [KIOSK_CHANNELS.VERIFY_IDENTITY]: {
    request: IPCRequest<{ phoneNumber?: string; idDocument?: string; selfie?: string }>;
    response: IPCResponse<{ level: IdentityVerificationLevel; verified: boolean }>;
  };
  [KIOSK_CHANNELS.PROCESS_PAYMENT]: {
    request: IPCRequest<{ transactionId: string; paymentData: unknown }>;
    response: IPCResponse<ProcessPaymentResponse>;
  };

  // Events
  [KIOSK_CHANNELS.ON_KIOSK_MODE_CHANGED]: IPCEvent<KioskModeChangedPayload>;
  [KIOSK_CHANNELS.ON_TRANSACTION_STARTED]: IPCEvent<TransactionStartedPayload>;
  [KIOSK_CHANNELS.ON_RATE_UPDATED]: IPCEvent<RateUpdatedPayload>;
};

export type CasinoIPCContract = {
  [CASINO_CHANNELS.START_CASINO]: {
    request: IPCRequest<{ config?: Partial<CasinoConfig> }>;
    response: IPCResponse<CasinoStatusResponse>;
  };
  [CASINO_CHANNELS.STOP_CASINO]: {
    request: IPCRequest<{}>;
    response: IPCResponse<{ stopped: boolean }>;
  };
  [CASINO_CHANNELS.GET_CASINO_STATUS]: {
    request: IPCRequest<{}>;
    response: IPCResponse<CasinoStatusResponse>;
  };
  [CASINO_CHANNELS.UPDATE_CASINO_CONFIG]: {
    request: IPCRequest<{ config: Partial<CasinoConfig> }>;
    response: IPCResponse<CasinoStatusResponse>;
  };
  [CASINO_CHANNELS.CREATE_SESSION]: {
    request: IPCRequest<CreateSessionRequest>;
    response: IPCResponse<{ session: PlayerSession }>;
  };
  [CASINO_CHANNELS.END_SESSION]: {
    request: IPCRequest<{ sessionId: string }>;
    response: IPCResponse<{ session: PlayerSession }>;
  };
  [CASINO_CHANNELS.GET_SESSION]: {
    request: IPCRequest<{ sessionId: string }>;
    response: IPCResponse<{ session: PlayerSession }>;
  };
  [CASINO_CHANNELS.GET_PLAYER_STATS]: {
    request: IPCRequest<{ playerId: string }>;
    response: IPCResponse<{ stats: PlayerStats }>;
  };
  [CASINO_CHANNELS.LIST_GAMES]: {
    request: IPCRequest<{ type?: GameType }>;
    response: IPCResponse<{ games: Game[] }>;
  };
  [CASINO_CHANNELS.GET_GAME]: {
    request: IPCRequest<{ gameId: string }>;
    response: IPCResponse<{ game: Game }>;
  };
  [CASINO_CHANNELS.PLACE_BET]: {
    request: IPCRequest<PlaceBetRequest>;
    response: IPCResponse<{ accepted: boolean; betId: string }>;
  };
  [CASINO_CHANNELS.SPIN_SLOT]: {
    request: IPCRequest<SpinSlotRequest>;
    response: IPCResponse<GameResultResponse>;
  };
  [CASINO_CHANNELS.PLAY_CARD_GAME]: {
    request: IPCRequest<PlayCardGameRequest>;
    response: IPCResponse<GameResultResponse>;
  };
  [CASINO_CHANNELS.GET_RACE_INFO]: {
    request: IPCRequest<{ raceId?: string }>;
    response: IPCResponse<{ races: Race[] }>;
  };
  [CASINO_CHANNELS.PLACE_HORSE_BET]: {
    request: IPCRequest<PlaceHorseBetRequest>;
    response: IPCResponse<{ bet: HorseBet }>;
  };
  [CASINO_CHANNELS.START_RACE]: {
    request: IPCRequest<StartRaceRequest>;
    response: IPCResponse<{ raceId: string; startedAt: number }>;
  };
  [CASINO_CHANNELS.GET_RACE_RESULTS]: {
    request: IPCRequest<{ raceId: string }>;
    response: IPCResponse<{ result: RaceResult }>;
  };
  [CASINO_CHANNELS.GET_LEADERBOARD]: {
    request: IPCRequest<{ period: 'daily' | 'weekly' | 'monthly' | 'all-time' }>;
    response: IPCResponse<LeaderboardResponse>;
  };
  [CASINO_CHANNELS.GET_ACHIEVEMENTS]: {
    request: IPCRequest<{ playerId: string }>;
    response: IPCResponse<{ achievements: string[] }>;
  };
  [CASINO_CHANNELS.UNLOCK_ACHIEVEMENT]: {
    request: IPCRequest<{ playerId: string; achievementId: string }>;
    response: IPCResponse<{ unlocked: boolean }>;
  };

  // Events
  [CASINO_CHANNELS.ON_GAME_RESULT]: IPCEvent<GameResultPayload>;
  [CASINO_CHANNELS.ON_RACE_UPDATE]: IPCEvent<RaceUpdatePayload>;
  [CASINO_CHANNELS.ON_JACKPOT_HIT]: IPCEvent<JackpotHitPayload>;
  [CASINO_CHANNELS.ON_ACHIEVEMENT_UNLOCKED]: IPCEvent<AchievementUnlockedPayload>;
};
