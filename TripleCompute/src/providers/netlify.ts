/**
 * Netlify Functions Provider Adapter
 *
 * Integrates with Netlify's serverless functions using pooled credits
 * from the credit marketplace
 */

import axios from 'axios';
import { ProviderAdapter, ProviderConfig, ProviderType } from './index';
import { FunctionRequest, FunctionResponse } from '../router';

export interface NetlifyConfig extends ProviderConfig {
  siteId: string;
  creditPoolId?: string; // Use credits from marketplace
}

export class NetlifyAdapter extends ProviderAdapter {
  private netlifyConfig: NetlifyConfig;
  private currentCreditCost: number = 0.02; // Default: $0.02 per GB-hour

  constructor(config?: NetlifyConfig) {
    super(config || {
      apiKey: process.env.NETLIFY_API_KEY,
      siteId: process.env.NETLIFY_SITE_ID || '',
    });

    this.netlifyConfig = config || {
      apiKey: process.env.NETLIFY_API_KEY,
      siteId: process.env.NETLIFY_SITE_ID || '',
    };
  }

  getType(): ProviderType {
    return 'netlify';
  }

  async execute(request: FunctionRequest): Promise<FunctionResponse> {
    const startTime = Date.now();

    try {
      // Invoke Netlify function
      const response = await axios.post(
        `https://${this.netlifyConfig.siteId}.netlify.app/.netlify/functions/${request.functionId}`,
        request.payload,
        {
          headers: {
            'Content-Type': 'application/json',
            ...request.headers,
          },
          timeout: request.timeout || 30000,
        }
      );

      const executionTime = Date.now() - startTime;

      return {
        statusCode: response.status,
        body: response.data,
        headers: response.headers as Record<string, string>,
        metadata: {
          provider: 'netlify',
          executionTime,
          cost: 0,
          cached: false,
        },
      };
    } catch (error: any) {
      if (error.response) {
        return {
          statusCode: error.response.status,
          body: error.response.data,
          headers: error.response.headers || {},
          metadata: {
            provider: 'netlify',
            executionTime: Date.now() - startTime,
            cost: 0,
            cached: false,
          },
        };
      }

      throw new Error(`Netlify execution failed: ${error.message}`);
    }
  }

  async estimateCost(request: FunctionRequest): Promise<number> {
    // Netlify pricing: 5 credits per GB-hour
    // 1 credit ≈ $0.004 (on Pro plan with 5000 credits for $20)

    const memoryGB = (request.memory || 512) / 1024;
    const estimatedDurationHours = 0.5 / 3600; // Assume 500ms avg execution

    const gbHours = memoryGB * estimatedDurationHours;
    const credits = gbHours * 5; // 5 credits per GB-hour

    // Check if we have pooled credits available (cheaper)
    const pooledCreditCost = await this.getPooledCreditCost();

    if (pooledCreditCost > 0) {
      // Use pooled credits (typically 40-60% cheaper)
      return credits * pooledCreditCost;
    }

    // Otherwise use standard pricing
    const costPerCredit = 0.004; // Pro plan pricing
    return credits * costPerCredit;
  }

  async estimateLatency(userRegion: string): Promise<number> {
    // Netlify has edge functions, so latency is generally good
    // But varies by region

    const regionLatencies: Record<string, number> = {
      'us-east-1': 20,
      'us-west-2': 30,
      'eu-west-1': 50,
      'ap-southeast-1': 80,
      'default': 40,
    };

    return regionLatencies[userRegion] || regionLatencies['default'];
  }

  protected getPricing() {
    return {
      computePerGBHour: 0.02,  // $0.02 per GB-hour (5 credits × $0.004)
      bandwidthPerGB: 0.04,     // 10 credits × $0.004
      requestCost: 0.00001,     // Negligible
    };
  }

  /**
   * Get cost of pooled credits from marketplace
   */
  private async getPooledCreditCost(): Promise<number> {
    if (!this.netlifyConfig.creditPoolId) {
      return 0; // No pool configured
    }

    try {
      // In production, this would query the blockchain credit marketplace
      // For now, simulate a 50% discount
      const marketplaceCost = 0.002; // $0.002 per credit (50% off)
      return marketplaceCost;
    } catch {
      return 0;
    }
  }

  /**
   * Deploy a function to Netlify
   */
  async deployFunction(
    functionId: string,
    code: string,
    config: {
      memory?: number;
      timeout?: number;
      environment?: Record<string, string>;
    } = {}
  ): Promise<void> {
    // Use Netlify Deploy API
    const formData = new FormData();
    formData.append('functions', new Blob([code], { type: 'application/javascript' }), `${functionId}.js`);

    await axios.post(
      `https://api.netlify.com/api/v1/sites/${this.netlifyConfig.siteId}/deploys`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${this.netlifyConfig.apiKey}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  /**
   * Get current credit usage from Netlify
   */
  async getCreditUsage(): Promise<{
    used: number;
    total: number;
    remaining: number;
  }> {
    try {
      const response = await axios.get(
        `https://api.netlify.com/api/v1/accounts`,
        {
          headers: {
            'Authorization': `Bearer ${this.netlifyConfig.apiKey}`,
          },
        }
      );

      // Parse credit usage from account data
      const account = response.data[0];
      const billingPlan = account.billing_plan;

      // Extract credit info (structure depends on Netlify API)
      return {
        used: billingPlan.credits_used || 0,
        total: billingPlan.credits_total || 5000,
        remaining: (billingPlan.credits_total || 5000) - (billingPlan.credits_used || 0),
      };
    } catch (error) {
      console.error('Failed to fetch Netlify credit usage:', error);
      return { used: 0, total: 0, remaining: 0 };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple ping to Netlify API
      const response = await axios.get(
        `https://api.netlify.com/api/v1/sites/${this.netlifyConfig.siteId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.netlifyConfig.apiKey}`,
          },
          timeout: 5000,
        }
      );

      this.available = response.status === 200;
      return this.available;
    } catch {
      this.available = false;
      return false;
    }
  }
}

/**
 * Netlify Credit Marketplace Integration
 *
 * Allows users to buy/sell unused Netlify credits
 */
export class NetlifyCreditMarketplace {
  private apiEndpoint: string;

  constructor(apiEndpoint: string = 'https://api.triplecompute.io/credits') {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * List credits for sale
   */
  async sellCredits(
    amount: number,
    pricePerCredit: number,
    accountAuth: string
  ): Promise<{ listingId: string }> {
    const response = await axios.post(`${this.apiEndpoint}/listings`, {
      provider: 'netlify',
      amount,
      pricePerCredit,
      accountAuth, // Proof of credit ownership
    });

    return { listingId: response.data.id };
  }

  /**
   * Buy credits from marketplace
   */
  async buyCredits(
    listingId: string,
    amount: number,
    paymentMethod: string
  ): Promise<{ success: boolean; creditsTransferred: number }> {
    const response = await axios.post(`${this.apiEndpoint}/purchase`, {
      listingId,
      amount,
      paymentMethod,
    });

    return {
      success: response.data.success,
      creditsTransferred: response.data.amount,
    };
  }

  /**
   * Get current market price for credits
   */
  async getMarketPrice(provider: 'netlify' | 'vercel'): Promise<{
    avgPrice: number;
    lowestPrice: number;
    volume24h: number;
  }> {
    const response = await axios.get(`${this.apiEndpoint}/market/${provider}`);

    return {
      avgPrice: response.data.avgPrice,
      lowestPrice: response.data.lowestPrice,
      volume24h: response.data.volume24h,
    };
  }

  /**
   * Get available listings
   */
  async getListings(provider: 'netlify' | 'vercel', limit: number = 10): Promise<Array<{
    id: string;
    amount: number;
    pricePerCredit: number;
    seller: string;
    timestamp: Date;
  }>> {
    const response = await axios.get(`${this.apiEndpoint}/listings`, {
      params: { provider, limit },
    });

    return response.data.listings.map((listing: any) => ({
      ...listing,
      timestamp: new Date(listing.timestamp),
    }));
  }
}
