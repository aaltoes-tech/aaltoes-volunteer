import { redirect } from "react-router";

import type { Route } from "./+types/auth.revoke";
import { linearService } from "~/lib/.server/linear";
import { credentialStorage } from "~/lib/.server/oauth/storage";
import { requireAdminAuth } from "~/lib/.server/sessions";

export async function action({ request }: Route.ActionArgs) {
  await requireAdminAuth(request);

  if (request.method !== "POST") {
    throw new Error("Method not allowed");
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
