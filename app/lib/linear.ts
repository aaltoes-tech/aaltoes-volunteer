import { LinearClient } from "@linear/sdk";
import type { TokenData } from "./oauth";

let linearClient: LinearClient | null = null;

async function clearLinearClient(token?: TokenData): Promise<void> {
  if (!token) {
    linearClient = null;
    return;
  }

  try {
    await fetch("https://api.linear.app/oauth/revoke", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  } catch (error) {
    console.error("Error revoking token at Linear:", error);
    // Continue with local cleanup even if remote revocation fails
  }

  linearClient = null;
}

function getLinearClient({ token }: { token: TokenData }): LinearClient | null {
  if (linearClient) {
    return linearClient;
  }
  linearClient = new LinearClient({ accessToken: token.accessToken });
  return linearClient;
}

export const linearService = {
  clearLinearClient,
  getLinearClient,
};
