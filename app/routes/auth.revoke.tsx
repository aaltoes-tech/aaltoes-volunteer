import type { Route } from "./+types/auth.revoke";
import { redirect } from "react-router";
import { clearClientState, getClientState } from "../lib/oauth-config";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw new Response("Method not allowed", { status: 405 });
  }

  try {
    const clientState = getClientState();
    
    // Optionally call Linear's revoke endpoint if we have an access token
    if (clientState.accessToken) {
      try {
        await fetch('https://api.linear.app/oauth/revoke', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${clientState.accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      } catch (error) {
        console.error('Error revoking token at Linear:', error);
        // Continue with local cleanup even if remote revocation fails
      }
    }
    
    // Clear local client state
    clearClientState();
    
    console.log('Successfully revoked Linear authorization');
    
    return redirect('/auth?success=revoked');
  } catch (error) {
    console.error('Revoke error:', error);
    return redirect('/auth?error=revoke_failed');
  }
} 