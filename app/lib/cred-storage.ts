import type { TokenData } from "./oauth";

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

// Singleton instance - you can swap this out with different implementations
export const credentialStorage: CredentialStorageService =
  new InMemoryCredentialStorage();
