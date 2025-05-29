import type { TokenData } from ".";
import { redis } from "~/lib/.server/redis";
import { serialize, deserialize, type SuperJSONResult } from "superjson";

export interface CredentialStorageService {
  // Store a new token
  storeToken(tokenData: TokenData): Promise<void>;

  // Get a valid (non-expired) token
  getValidToken(provider?: string): Promise<TokenData | null>;

  // Get token regardless of expiration status
  getToken(provider?: string): Promise<TokenData | null>;

  // Check if we have a valid token
  hasValidToken(provider?: string): Promise<boolean>;

  // Clear tokens for a provider
  clearTokens(provider?: string): Promise<void>;

  // Clean up expired tokens
  cleanupExpiredTokens(): Promise<number>; // Returns number of cleaned up tokens

  // Close/cleanup the storage service
  close(): Promise<void>;
}

// In-memory storage implementation
export class InMemoryCredentialStorage implements CredentialStorageService {
  private tokens: Map<string, TokenData> = new Map();

  async storeToken(tokenData: TokenData): Promise<void> {
    this.tokens.set(tokenData.provider, tokenData);
    console.log(
      `Stored token for ${tokenData.provider} (expires at ${new Date(
        tokenData.expiresAt
      ).toISOString()})`
    );
  }

  async getValidToken(provider = "linear"): Promise<TokenData | null> {
    const token = this.tokens.get(provider);

    if (!token) {
      return null;
    }

    // Check if token is expired
    if (Date.now() >= token.expiresAt) {
      // Auto-cleanup expired token
      this.tokens.delete(provider);
      return null;
    }

    return token;
  }

  async getToken(provider = "linear"): Promise<TokenData | null> {
    return this.tokens.get(provider) || null;
  }

  async hasValidToken(provider = "linear"): Promise<boolean> {
    const token = await this.getValidToken(provider);
    return token !== null;
  }

  async clearTokens(provider = "linear"): Promise<void> {
    if (provider) {
      this.tokens.delete(provider);
      console.log(`Cleared tokens for ${provider}`);
    } else {
      // Clear all tokens if no provider specified
      this.tokens.clear();
      console.log("Cleared all tokens");
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [provider, token] of this.tokens.entries()) {
      if (now >= token.expiresAt) {
        this.tokens.delete(provider);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired tokens`);
    }

    return cleanedCount;
  }

  async close(): Promise<void> {
    // Nothing to close for in-memory storage
    this.tokens.clear();
  }

  // Debug method to see all tokens
  getAllTokens(): Map<string, TokenData> {
    return new Map(this.tokens);
  }

  // Get storage stats
  getStats(): {
    totalTokens: number;
    validTokens: number;
    expiredTokens: number;
  } {
    const now = Date.now();
    let validTokens = 0;
    let expiredTokens = 0;

    for (const token of this.tokens.values()) {
      if (now >= token.expiresAt) {
        expiredTokens++;
      } else {
        validTokens++;
      }
    }

    return {
      totalTokens: this.tokens.size,
      validTokens,
      expiredTokens,
    };
  }
}

// Redis storage implementation
export class RedisCredentialStorage implements CredentialStorageService {
  private keyPrefix = "cred:token:";

  private getKey(provider: string): string {
    return `${this.keyPrefix}${provider}`;
  }

  async storeToken(tokenData: TokenData): Promise<void> {
    const key = this.getKey(tokenData.provider);
    const serializedData = serialize(tokenData);

    // Calculate TTL in seconds from expiration timestamp
    const ttlSeconds = Math.max(
      1,
      Math.floor((tokenData.expiresAt - Date.now()) / 1000)
    );

    await redis.setex(key, ttlSeconds, serializedData);
    console.log(
      `Stored token for ${
        tokenData.provider
      } at ${key} in Redis (expires at ${new Date(
        tokenData.expiresAt
      ).toISOString()})`
    );
  }

  async getValidToken(provider = "linear"): Promise<TokenData | null> {
    const key = this.getKey(provider);
    const serializedData = (await redis.get(key)) as SuperJSONResult | null;

    if (!serializedData) {
      return null;
    }

    try {
      const tokenData = deserialize(serializedData) as TokenData;

      // Double-check expiration (Redis TTL should handle this, but let's be safe)
      if (Date.now() >= tokenData.expiresAt) {
        await redis.del(key);
        return null;
      }

      return tokenData;
    } catch (error) {
      console.error(`Failed to deserialize token for ${provider}:`, error);
      // Clean up corrupted data
      await redis.del(key);
      return null;
    }
  }

  async getToken(provider = "linear"): Promise<TokenData | null> {
    const key = this.getKey(provider);
    const serializedData = (await redis.get(key)) as SuperJSONResult | null;

    if (!serializedData) {
      return null;
    }

    try {
      return deserialize(serializedData) as TokenData;
    } catch (error) {
      console.error(`Failed to deserialize token for ${provider}:`, error);
      // Clean up corrupted data
      await redis.del(key);
      return null;
    }
  }

  async hasValidToken(provider = "linear"): Promise<boolean> {
    const token = await this.getValidToken(provider);
    return token !== null;
  }

  async clearTokens(provider?: string): Promise<void> {
    if (provider) {
      const key = this.getKey(provider);
      await redis.del(key);
      console.log(`Cleared tokens for ${provider}`);
    } else {
      // Clear all tokens by finding keys with our prefix
      const keys = await redis.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Cleared ${keys.length} tokens`);
      } else {
        console.log("No tokens to clear");
      }
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    // Redis automatically handles expiration via TTL, but let's scan for any
    // tokens that might have expired but weren't cleaned up
    const keys = await redis.keys(`${this.keyPrefix}*`);
    let cleanedCount = 0;

    for (const key of keys) {
      const serializedData = (await redis.get(key)) as SuperJSONResult | null;
      if (!serializedData) {
        // Already expired and cleaned up by Redis
        continue;
      }

      try {
        const tokenData = deserialize(serializedData) as TokenData;
        if (Date.now() >= tokenData.expiresAt) {
          await redis.del(key);
          cleanedCount++;
        }
      } catch (error) {
        // Clean up corrupted data
        await redis.del(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired/corrupted tokens`);
    }

    return cleanedCount;
  }

  async close(): Promise<void> {
    // Redis connection is managed elsewhere, just cleanup our data if needed
    await this.clearTokens();
  }

  // Debug method to see all tokens
  async getAllTokens(): Promise<Map<string, TokenData>> {
    const keys = await redis.keys(`${this.keyPrefix}*`);
    const tokens = new Map<string, TokenData>();

    for (const key of keys) {
      const serializedData = (await redis.get(key)) as SuperJSONResult | null;
      if (serializedData) {
        try {
          const tokenData = deserialize(serializedData) as TokenData;
          const provider = key.replace(this.keyPrefix, "");
          tokens.set(provider, tokenData);
        } catch (error) {
          console.error(`Failed to deserialize token from key ${key}:`, error);
        }
      }
    }

    return tokens;
  }

  // Get storage stats
  async getStats(): Promise<{
    totalTokens: number;
    validTokens: number;
    expiredTokens: number;
  }> {
    const keys = await redis.keys(`${this.keyPrefix}*`);
    const now = Date.now();
    let validTokens = 0;
    let expiredTokens = 0;

    for (const key of keys) {
      const serializedData = (await redis.get(key)) as SuperJSONResult | null;
      if (!serializedData) {
        // Key existed but data is gone (expired)
        expiredTokens++;
        continue;
      }

      try {
        const tokenData = deserialize(serializedData) as TokenData;
        if (now >= tokenData.expiresAt) {
          expiredTokens++;
        } else {
          validTokens++;
        }
      } catch (error) {
        // Corrupted data counts as expired
        expiredTokens++;
      }
    }

    return {
      totalTokens: keys.length,
      validTokens,
      expiredTokens,
    };
  }
}

// Singleton instance - you can swap this out with different implementations
export const credentialStorage: CredentialStorageService =
  new RedisCredentialStorage();
