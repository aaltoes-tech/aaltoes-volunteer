import type { Route } from "./+types/auth.revoke";
import { redirect } from "react-router";
import { linearService } from "../lib/linear";
import { credentialStorage } from "~/lib/cred-storage";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw new Response("Method not allowed", { status: 405 });
  }

  try {
    const tokenData = await credentialStorage.getToken("linear");

    if (!tokenData) {
      return redirect("/auth?error=no_token_found");
    }

    await linearService.clearLinearClient(tokenData);

    console.log("Successfully revoked Linear authorization");

    return redirect("/auth?success=revoked");
  } catch (error) {
    console.error("Revoke error:", error);
    return redirect("/auth?error=revoke_failed");
  }
}
