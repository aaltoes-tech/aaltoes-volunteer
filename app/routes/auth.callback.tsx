import type { Route } from "./+types/auth.callback";
import { redirect } from "react-router";
import { oauth } from "../lib/oauth";
import { linearService } from "../lib/linear";
import { stateStore } from "./auth.authorize";
import { credentialStorage } from "~/lib/cred-storage";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error);
    return redirect(`/auth?error=${error}`);
  }

  // Validate required parameters
  if (!code || !state) {
    console.error("Missing code or state parameter");
    return redirect("/auth?error=missing_parameters");
  }

  // Validate state to prevent CSRF attacks
  const storedState = stateStore.get(state);
  if (!storedState) {
    console.error("Invalid or expired state");
    return redirect("/auth?error=invalid_state");
  }

  // Remove the used state
  stateStore.delete(state);

  try {
    // Exchange authorization code for access token
    const redirectUri = `${url.protocol}//${url.host}/auth/callback`;
    const tokenData = await oauth.exchangeCodeForToken(code, redirectUri);

    // Initialize Linear client with the access token and expiration
    await credentialStorage.storeToken(tokenData);
    linearService.initializeLinearClient(tokenData);

    console.log(
      `Successfully authorized Linear client with actor=app (expires at ${new Date(
        tokenData.expiresAt
      ).toUTCString()})`
    );

    // Redirect back to auth page
    return redirect("/auth?success=authorized");
  } catch (error) {
    console.error("Token exchange error:", error);
    return redirect("/auth?error=token_exchange_failed");
  }
}

export default function AuthCallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing authorization...</p>
      </div>
    </div>
  );
}
