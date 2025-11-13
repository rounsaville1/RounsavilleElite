/**
 * TripleCompute Router - Core Request Routing Logic
 *
 * Intelligently routes function executions to the cheapest available provider
 * while maintaining performance and reliability guarantees.
 */

import { createHash } from 'crypto';
import { Redis } from 'ioredis';
import { ProviderAdapter, ProviderType } from '../providers';
import { CacheService } from '../cache';
import { MetricsCollector } from '../monitoring';

export interface FunctionRequest {
  functionId: string;
  payload: unknown;
  headers: Record<string, string>;
  userRegion: string;
  timeout?: number;
  memory?: number;
}

export interface FunctionResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  metadata: {
    provider: ProviderType;
    executionTime: number;
    cost: number;
    cached: boolean;
  };
}

export interface ProviderScore {
  provider: ProviderType;
  score: number;
  cost: number;
  estimatedLatency: number;
  reliability: number;
}

export class TripleComputeRouter {
  private redis: Redis;
  private cache: CacheService;
  private metrics: MetricsCollector;
  private providers: Map<ProviderType, ProviderAdapter>;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
    });

    this.cache = new CacheService(this.redis);
    this.metrics = new MetricsCollector();
    this.providers = new Map();

    this.initializeProviders();
  }

  /**
   * Main routing logic - handles incoming function requests
   */
  async route(request: FunctionRequest): Promise<FunctionResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Generate cache key
      const cacheKey = this.generateCacheKey(request);

      // Step 2: Check cache
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.metrics.recordCacheHit(request.functionId);
        return {
          statusCode: 200,
          body: cached,
          headers: { 'X-Cache': 'HIT' },
          metadata: {
            provider: 'cache' as ProviderType,
            executionTime: Date.now() - startTime,
            cost: 0,
            cached: true,
          },
        };
      }

      this.metrics.recordCacheMiss(request.functionId);

      // Step 3: Select optimal provider
      const selectedProvider = await this.selectProvider(request);

      // Step 4: Execute function on selected provider
      const provider = this.providers.get(selectedProvider.provider);
      if (!provider) {
        throw new Error(`Provider ${selectedProvider.provider} not initialized`);
      }

      const response = await provider.execute(request);

      // Step 5: Cache the result (if cacheable)
      if (this.isCacheable(request, response)) {
        const ttl = await this.cache.determineTTL(request.functionId, cacheKey);
        await this.cache.set(cacheKey, response.body, ttl);
      }

      // Step 6: Record metrics
      const executionTime = Date.now() - startTime;
      this.metrics.recordExecution({
        provider: selectedProvider.provider,
        functionId: request.functionId,
        executionTime,
        cost: selectedProvider.cost,
        success: response.statusCode < 400,
      });

      return {
        ...response,
        metadata: {
          provider: selectedProvider.provider,
          executionTime,
          cost: selectedProvider.cost,
          cached: false,
        },
      };
    } catch (error) {
      this.metrics.recordError(request.functionId, error);
      throw error;
    }
  }

  /**
   * Intelligent provider selection algorithm
   *
   * Weights:
   * - Cost: 50% (most important for our value prop)
   * - Latency: 30% (user experience)
   * - Reliability: 15% (uptime matters)
   * - Credit availability: 5% (marketplace liquidity)
   */
  async selectProvider(request: FunctionRequest): Promise<ProviderScore> {
    const scores: ProviderScore[] = [];

    // Get real-time pricing and availability for all providers
    for (const [providerType, adapter] of this.providers.entries()) {
      if (!adapter.isAvailable()) {
        continue; // Skip unavailable providers
      }

      // Get current cost estimate
      const cost = await adapter.estimateCost(request);

      // Estimate latency based on user region and provider capabilities
      const estimatedLatency = await adapter.estimateLatency(request.userRegion);

      // Get reliability score (success rate over last 24 hours)
      const reliability = await this.metrics.getReliability(providerType);

      // Check credit pool availability (for credit-based providers)
      const creditAvailability = await this.getCreditAvailability(providerType);

      // Calculate weighted score (higher is better)
      const normalizedCostScore = this.normalizeCostScore(cost);
      const normalizedLatencyScore = this.normalizeLatencyScore(estimatedLatency);

      const score =
        0.5 * normalizedCostScore +
        0.3 * normalizedLatencyScore +
        0.15 * reliability +
        0.05 * creditAvailability;

      scores.push({
        provider: providerType,
        score,
        cost,
        estimatedLatency,
        reliability,
      });
    }

    if (scores.length === 0) {
      throw new Error('No providers available');
    }

    // Sort by score (descending) and select the best
    scores.sort((a, b) => b.score - a.score);

    const selected = scores[0];

    // Log selection for analytics
    this.metrics.recordProviderSelection(selected);

    return selected;
  }

  /**
   * Generate deterministic cache key from request
   */
  private generateCacheKey(request: FunctionRequest): string {
    const hash = createHash('sha256');
    hash.update(request.functionId);
    hash.update(JSON.stringify(request.payload));
    // Optionally include certain headers that affect output
    if (request.headers['accept-language']) {
      hash.update(request.headers['accept-language']);
    }
    return `tc:cache:${hash.digest('hex')}`;
  }

  /**
   * Determine if response should be cached
   */
  private isCacheable(request: FunctionRequest, response: FunctionResponse): boolean {
    // Don't cache errors
    if (response.statusCode >= 400) {
      return false;
    }

    // Don't cache if Cache-Control says no-cache
    if (response.headers['cache-control']?.includes('no-cache')) {
      return false;
    }

    // Cache GET-like operations (deterministic functions)
    // Don't cache mutations or user-specific data
    const cacheControl = request.headers['x-triplecompute-cache'];
    if (cacheControl === 'no-cache') {
      return false;
    }

    return true;
  }

  /**
   * Initialize all provider adapters
   */
  private initializeProviders(): void {
    const { AWSLambdaAdapter } = require('../providers/aws');
    const { NetlifyAdapter } = require('../providers/netlify');
    const { CloudflareAdapter } = require('../providers/cloudflare');
    const { VercelAdapter } = require('../providers/vercel');
    const { SelfHostedAdapter } = require('../providers/self-hosted');

    this.providers.set('aws-lambda', new AWSLambdaAdapter());
    this.providers.set('netlify', new NetlifyAdapter());
    this.providers.set('cloudflare-workers', new CloudflareAdapter());
    this.providers.set('vercel', new VercelAdapter());
    this.providers.set('self-hosted', new SelfHostedAdapter());
  }

  /**
   * Get credit availability from marketplace
   */
  private async getCreditAvailability(provider: ProviderType): Promise<number> {
    if (!['netlify', 'vercel'].includes(provider)) {
      return 0; // Not a credit-based provider
    }

    const key = `tc:credits:${provider}:available`;
    const credits = await this.redis.get(key);

    if (!credits) {
      return 0;
    }

    // Normalize to 0-1 scale (assume 100K credits is "full availability")
    return Math.min(parseInt(credits) / 100000, 1);
  }

  /**
   * Normalize cost to 0-1 score (lower cost = higher score)
   */
  private normalizeCostScore(cost: number): number {
    // Assume cost range is $0.001 to $0.10 per request
    const minCost = 0.001;
    const maxCost = 0.10;

    // Invert so lower cost = higher score
    const normalized = 1 - ((cost - minCost) / (maxCost - minCost));
    return Math.max(0, Math.min(1, normalized));
  }

  /**
   * Normalize latency to 0-1 score (lower latency = higher score)
   */
  private normalizeLatencyScore(latency: number): number {
    // Assume latency range is 10ms to 1000ms
    const minLatency = 10;
    const maxLatency = 1000;

    // Invert so lower latency = higher score
    const normalized = 1 - ((latency - minLatency) / (maxLatency - minLatency));
    return Math.max(0, Math.min(1, normalized));
  }

  /**
   * Health check - verify all systems operational
   */
  async healthCheck(): Promise<{ healthy: boolean; details: Record<string, boolean> }> {
    const details: Record<string, boolean> = {};

    // Check Redis
    try {
      await this.redis.ping();
      details.redis = true;
    } catch {
      details.redis = false;
    }

    // Check each provider
    for (const [name, provider] of this.providers.entries()) {
      details[name] = provider.isAvailable();
    }

    const healthy = Object.values(details).every(v => v);

    return { healthy, details };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    await this.redis.quit();

    for (const provider of this.providers.values()) {
      await provider.shutdown();
    }
  }
}

/**
 * Express-compatible middleware for easy integration
 */
export function createRouterMiddleware() {
  const router = new TripleComputeRouter();

  return async (req: any, res: any, next: any) => {
    try {
      const functionRequest: FunctionRequest = {
        functionId: req.params.functionId || req.headers['x-function-id'],
        payload: req.body,
        headers: req.headers,
        userRegion: req.headers['cloudfront-viewer-country'] || 'us-east-1',
        timeout: parseInt(req.headers['x-timeout'] || '30000'),
        memory: parseInt(req.headers['x-memory'] || '512'),
      };

      const response = await router.route(functionRequest);

      // Set response headers
      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Add metadata headers
      res.setHeader('X-TripleCompute-Provider', response.metadata.provider);
      res.setHeader('X-TripleCompute-Cost', response.metadata.cost.toFixed(6));
      res.setHeader('X-TripleCompute-Time', response.metadata.executionTime.toString());

      res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Cloudflare Workers compatible handler
 */
export async function handleCloudflareRequest(request: Request): Promise<Response> {
  const router = new TripleComputeRouter();

  try {
    const url = new URL(request.url);
    const functionId = url.pathname.split('/')[2]; // /api/functions/:functionId

    const functionRequest: FunctionRequest = {
      functionId,
      payload: await request.json(),
      headers: Object.fromEntries(request.headers.entries()),
      userRegion: request.cf?.country as string || 'unknown',
      timeout: 30000,
      memory: 512,
    };

    const response = await router.route(functionRequest);

    return new Response(JSON.stringify(response.body), {
      status: response.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-TripleCompute-Provider': response.metadata.provider,
        'X-TripleCompute-Cost': response.metadata.cost.toFixed(6),
        'X-TripleCompute-Time': response.metadata.executionTime.toString(),
        ...response.headers,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
