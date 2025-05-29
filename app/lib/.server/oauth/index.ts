interface OAuthConfig {
  clientId: string;
  clientSecret: string;
}

export interface TokenData {
  accessToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
  createdAt: number; // Unix timestamp in milliseconds
  provider: string;
}

// Get OAuth configuration
function getOAuthConfig(): OAuthConfig | null {
  if (process.env.LINEAR_CLIENT_ID && process.env.LINEAR_CLIENT_SECRET) {
    return {
      clientId: process.env.LINEAR_CLIENT_ID,
      clientSecret: process.env.LINEAR_CLIENT_SECRET,
    };
  }
  return null;
}

// Generate authorization URL for Linear with actor=app
function generateAuthorizationUrl(
  redirectUri: string,
  state: string
): string {
  const config = getOAuthConfig();
  if (!config) {
    throw new Error("OAuth configuration not set");
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "read,write",
    state: state,
    actor: "app", // This makes the OAuth app act as the application rather than the user
  });

  return `https://linear.app/oauth/authorize?${params.toString()}`;
}

// Exchange authorization code for access token
async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<TokenData> {
  const config = getOAuthConfig();
  if (!config) {
    throw new Error("OAuth configuration not set");
  }

  const response = await fetch("https://api.linear.app/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  const data = await response.json() as {
    access_token: string;
    expires_in: number;
  };
  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 315705599) * 1000, // Default to ~10 years if not provided
    createdAt: Date.now(),
    provider: "linear",
  };
}

function shouldRefreshToken(tokenData: TokenData): boolean {
  const twentyFourHoursFromNow = Date.now() + 24 * 60 * 60 * 1000;
  return tokenData.expiresAt < twentyFourHoursFromNow;
}

function getTokenExpirationInfo(token: TokenData): {
  expiresAt: Date | null;
  timeUntilExpiration: string | null;
  isExpired: boolean;
} {
  const expiresAt = new Date(token.expiresAt);
  const now = Date.now();
  const msUntilExpiration = token.expiresAt - now;

  if (msUntilExpiration <= 0) {
    return { expiresAt, timeUntilExpiration: "Expired", isExpired: true };
  }

  const days = Math.floor(msUntilExpiration / (24 * 60 * 60 * 1000));
  const hours = Math.floor(
    (msUntilExpiration % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
  );

  let timeString = "";
  if (days > 0) {
    timeString += `${days} day${days !== 1 ? "s" : ""}`;
    if (hours > 0) timeString += `, ${hours} hour${hours !== 1 ? "s" : ""}`;
  } else if (hours > 0) {
    timeString += `${hours} hour${hours !== 1 ? "s" : ""}`;
  } else {
    const minutes = Math.floor(
      (msUntilExpiration % (60 * 60 * 1000)) / (60 * 1000)
    );
    timeString = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }

  return {
    expiresAt,
    timeUntilExpiration: timeString,
    isExpired: false,
  };
}

// Generate random state for OAuth security
function generateRandomState(): string {
  return crypto.randomUUID();
}

export const oauth = {
  getOAuthConfig,
  generateAuthorizationUrl,
  exchangeCodeForToken,
  shouldRefreshToken,
  getTokenExpirationInfo,
  generateRandomState,
};
