import { LinearClient } from "@linear/sdk";
import type { TokenData } from "./oauth";

let linearClient: LinearClient | null = null;

// Get the Linear client instance (auto-initialize if needed)
async function initializeLinearClient(token: TokenData): Promise<LinearClient> {
  if (!linearClient) {
    linearClient = new LinearClient({ accessToken: token.accessToken });
  }

  return linearClient;
}

export async function clearLinearClient(token?: TokenData): Promise<void> {
  if (!token) {
    linearClient = null;
    return;
  }

  try {
    await fetch('https://api.linear.app/oauth/revoke', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  } catch (error) {
    console.error('Error revoking token at Linear:', error);
    // Continue with local cleanup even if remote revocation fails
  }

  linearClient = null;
}

async function getLinearClient(): Promise<LinearClient | null> {
  return linearClient;
}

export const linearService = {
  initializeLinearClient,
  clearLinearClient,
  getLinearClient,
};
