import { redirect } from "react-router";

import type { Route } from "./+types/auth.authorize";
import { requireAdminAuth } from "~/lib/.server/sessions";
import { oauth } from "../lib/.server/oauth";

// Store state in memory for validation (in production, use session storage)
const stateStore = new Map<string, { timestamp: number }>();

export async function action({ request }: Route.ActionArgs) {
  await requireAdminAuth(request);
  if (request.method !== "POST") {
    throw new Error("Method not allowed");
  }

  try {
    // Generate a random state for CSRF protection
    const state = oauth.generateRandomState();

    // Store state with timestamp for validation
    stateStore.set(state, { timestamp: Date.now() });

    // Clean up old states (older than 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [key, value] of stateStore.entries()) {
      if (value.timestamp < tenMinutesAgo) {
        stateStore.delete(key);
      }
    }

    // Get the base URL from the request
    const url = new URL(request.url);
    const redirectUri = `${url.protocol}//${url.host}/auth/callback`;

    // Generate authorization URL with actor=app
    const authUrl = oauth.generateAuthorizationUrl(redirectUri, state);

    return redirect(authUrl);
  } catch (error) {
    console.error("OAuth authorization error:", error);
    return redirect("/auth?error=oauth_config_error");
  }
}

// Export the state store for callback validation
export { stateStore };
