/**
 * Provider Abstraction Layer
 *
 * Unified interface for executing functions across different cloud providers
 */

import { FunctionRequest, FunctionResponse } from '../router';

export type ProviderType =
  | 'aws-lambda'
  | 'netlify'
  | 'cloudflare-workers'
  | 'vercel'
  | 'google-cloud-functions'
  | 'self-hosted'
  | 'cache';

export interface ProviderConfig {
  apiKey?: string;
  apiSecret?: string;
  region?: string;
  endpoint?: string;
  timeout?: number;
  retries?: number;
}

export interface CostEstimate {
  compute: number;      // Cost for execution
  bandwidth: number;    // Cost for data transfer
  storage: number;      // Cost for any storage operations
  total: number;        // Total cost
}

/**
 * Abstract base class for all provider adapters
 */
export abstract class ProviderAdapter {
  protected config: ProviderConfig;
  protected available: boolean = true;
  protected lastHealthCheck: Date = new Date();

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /**
   * Execute a function on this provider
   */
  abstract execute(request: FunctionRequest): Promise<FunctionResponse>;

  /**
   * Estimate the cost of executing a request
   * Returns cost in USD
   */
  abstract estimateCost(request: FunctionRequest): Promise<number>;

  /**
   * Estimate latency based on user region
   * Returns latency in milliseconds
   */
  abstract estimateLatency(userRegion: string): Promise<number>;

  /**
   * Get the provider type
   */
  abstract getType(): ProviderType;

  /**
   * Check if provider is available
   */
  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Health check for this provider
   */
  async healthCheck(): Promise<boolean> {
    this.lastHealthCheck = new Date();
    // Override in subclasses for specific health checks
    return true;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    // Override in subclasses if cleanup needed
  }

  /**
   * Get current pricing information
   */
  protected abstract getPricing(): {
    computePerGBHour: number;
    bandwidthPerGB: number;
    requestCost: number;
  };

  /**
   * Calculate GB-hours from memory and duration
   */
  protected calculateGBHours(memoryMB: number, durationMS: number): number {
    const memoryGB = memoryMB / 1024;
    const durationHours = durationMS / (1000 * 60 * 60);
    return memoryGB * durationHours;
  }
}

/**
 * Provider Registry - manages all active providers
 */
export class ProviderRegistry {
  private providers: Map<ProviderType, ProviderAdapter> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Register a provider
   */
  register(provider: ProviderAdapter): void {
    this.providers.set(provider.getType(), provider);
  }

  /**
   * Get a specific provider
   */
  get(type: ProviderType): ProviderAdapter | undefined {
    return this.providers.get(type);
  }

  /**
   * Get all available providers
   */
  getAvailable(): ProviderAdapter[] {
    return Array.from(this.providers.values()).filter(p => p.isAvailable());
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(intervalMS: number = 60000): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const provider of this.providers.values()) {
        try {
          await provider.healthCheck();
        } catch (error) {
          console.error(`Health check failed for ${provider.getType()}:`, error);
        }
      }
    }, intervalMS);
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Shutdown all providers
   */
  async shutdown(): Promise<void> {
    this.stopHealthChecks();

    const shutdownPromises = Array.from(this.providers.values()).map(p => p.shutdown());
    await Promise.all(shutdownPromises);
  }
}

/**
 * Provider performance tracker
 */
export class ProviderMetrics {
  private metrics: Map<ProviderType, {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalCost: number;
    totalLatency: number;
    lastUpdated: Date;
  }> = new Map();

  recordExecution(
    provider: ProviderType,
    success: boolean,
    cost: number,
    latency: number
  ): void {
    const current = this.metrics.get(provider) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalCost: 0,
      totalLatency: 0,
      lastUpdated: new Date(),
    };

    current.totalRequests++;
    if (success) {
      current.successfulRequests++;
    } else {
      current.failedRequests++;
    }
    current.totalCost += cost;
    current.totalLatency += latency;
    current.lastUpdated = new Date();

    this.metrics.set(provider, current);
  }

  getSuccessRate(provider: ProviderType): number {
    const metrics = this.metrics.get(provider);
    if (!metrics || metrics.totalRequests === 0) {
      return 1.0; // Default to 100% if no data
    }

    return metrics.successfulRequests / metrics.totalRequests;
  }

  getAverageLatency(provider: ProviderType): number {
    const metrics = this.metrics.get(provider);
    if (!metrics || metrics.totalRequests === 0) {
      return 0;
    }

    return metrics.totalLatency / metrics.totalRequests;
  }

  getAverageCost(provider: ProviderType): number {
    const metrics = this.metrics.get(provider);
    if (!metrics || metrics.totalRequests === 0) {
      return 0;
    }

    return metrics.totalCost / metrics.totalRequests;
  }

  getTotalCost(provider: ProviderType): number {
    const metrics = this.metrics.get(provider);
    return metrics?.totalCost || 0;
  }

  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [provider, metrics] of this.metrics.entries()) {
      result[provider] = {
        ...metrics,
        successRate: this.getSuccessRate(provider),
        averageLatency: this.getAverageLatency(provider),
        averageCost: this.getAverageCost(provider),
      };
    }

    return result;
  }
}

/**
 * Real-time pricing data manager
 */
export class PricingManager {
  private cache: Map<string, { price: number; timestamp: Date }> = new Map();
  private readonly CACHE_TTL_MS = 60000; // 1 minute cache

  /**
   * Get current spot pricing for a provider
   */
  async getSpotPrice(
    provider: ProviderType,
    region: string,
    resourceType: string
  ): Promise<number> {
    const cacheKey = `${provider}:${region}:${resourceType}`;
    const cached = this.cache.get(cacheKey);

    // Return cached price if fresh
    if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_TTL_MS) {
      return cached.price;
    }

    // Fetch fresh pricing
    const price = await this.fetchSpotPrice(provider, region, resourceType);

    // Update cache
    this.cache.set(cacheKey, {
      price,
      timestamp: new Date(),
    });

    return price;
  }

  /**
   * Fetch spot pricing from provider APIs
   */
  private async fetchSpotPrice(
    provider: ProviderType,
    region: string,
    resourceType: string
  ): Promise<number> {
    switch (provider) {
      case 'aws-lambda':
        return this.fetchAWSSpotPrice(region, resourceType);

      case 'google-cloud-functions':
        return this.fetchGCPSpotPrice(region, resourceType);

      case 'self-hosted':
        return this.fetchSpotInstancePrice(region, resourceType);

      default:
        // For providers without spot pricing, return standard rates
        return this.getStandardPrice(provider);
    }
  }

  private async fetchAWSSpotPrice(region: string, instanceType: string): Promise<number> {
    // In production, this would call AWS Pricing API
    // For now, return mock data based on typical spot pricing

    const spotDiscounts: Record<string, number> = {
      't3.micro': 0.0042,
      't3.small': 0.0084,
      't3.medium': 0.0168,
      'c6i.large': 0.034,
      'c6i.xlarge': 0.068,
    };

    return spotDiscounts[instanceType] || 0.02;
  }

  private async fetchGCPSpotPrice(region: string, instanceType: string): Promise<number> {
    // Mock GCP spot pricing (typically 60-90% discount)
    return 0.015;
  }

  private async fetchSpotInstancePrice(region: string, instanceType: string): Promise<number> {
    // Self-hosted spot instance pricing
    return 0.01; // Very cheap!
  }

  private getStandardPrice(provider: ProviderType): number {
    const standardPrices: Record<ProviderType, number> = {
      'aws-lambda': 0.06,           // per GB-hour
      'netlify': 0.02,              // per GB-hour (using pooled credits)
      'cloudflare-workers': 0.015,  // very efficient
      'vercel': 0.025,              // per GB-hour
      'google-cloud-functions': 0.055,
      'self-hosted': 0.01,          // cheapest option
      'cache': 0,                   // free!
    };

    return standardPrices[provider] || 0.05;
  }

  /**
   * Predict pricing trends (for proactive optimization)
   */
  async predictPricing(
    provider: ProviderType,
    hoursAhead: number
  ): Promise<{ timestamp: Date; predictedPrice: number }[]> {
    // In production, this would use ML model trained on historical pricing
    // For now, return current price with small random variation

    const currentPrice = this.getStandardPrice(provider);
    const predictions: { timestamp: Date; predictedPrice: number }[] = [];

    for (let i = 1; i <= hoursAhead; i++) {
      const timestamp = new Date(Date.now() + i * 60 * 60 * 1000);
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const predictedPrice = currentPrice * (1 + variation);

      predictions.push({ timestamp, predictedPrice });
    }

    return predictions;
  }
}

export default ProviderAdapter;
