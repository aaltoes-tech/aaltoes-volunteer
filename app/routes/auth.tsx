import { Link } from "react-router";

import type { Route } from "./+types/auth";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { linearService } from "~/lib/.server/linear";
import { oauth } from "~/lib/.server/oauth";
import { credentialStorage } from "~/lib/.server/oauth/storage";
import { requireAdminAuth } from "~/lib/.server/sessions";

export function meta() {
  return [
    { title: "Linear OAuth Authentication" },
    { name: "description", content: "Authenticate with Linear API" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdminAuth(request);

  const oauthConfig = oauth.getOAuthConfig();
  const tokenData = await credentialStorage.getToken("linear");

  if (!tokenData) {
    await linearService.clearLinearClient();
    return {
      isLinearClientInitialized: false,
      hasAccessToken: false,
      hasOAuthConfig: !!oauthConfig,
      oauthConfigClientId: oauthConfig?.clientId.substring(0, 8)
        ? oauthConfig.clientId.substring(0, 8) + "..."
        : "Not set",
      isTokenExpired: false,
      tokenExpirationInfo: null,
    };
  }

  const tokenInfo = oauth.getTokenExpirationInfo(tokenData);
  const linearClient = linearService.getLinearClient({ token: tokenData });

  return {
    isLinearClientInitialized: !!linearClient,
    hasAccessToken: !!tokenData,
    hasOAuthConfig: !!oauthConfig,
    oauthConfigClientId: oauthConfig?.clientId.substring(0, 8)
      ? oauthConfig.clientId.substring(0, 8) + "..."
      : "Not set",
    isTokenExpired: tokenInfo.isExpired,
    tokenExpirationInfo: tokenInfo,
  };
}

export default function Auth({ loaderData }: Route.ComponentProps) {
  const {
    isLinearClientInitialized,
    hasAccessToken,
    hasOAuthConfig,
    oauthConfigClientId,
    isTokenExpired,
    tokenExpirationInfo,
  } = loaderData;

  return (
    <div className="bg-muted min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <h2 className="text-foreground mt-6 text-3xl font-extrabold">
            Linear OAuth Authentication
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Manage your Linear API integration with actor=app authorization
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    OAuth Configuration:
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      hasOAuthConfig
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {hasOAuthConfig ? "✓ Configured" : "✗ Not configured"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Client ID:
                  </span>
                  <span className="text-foreground font-mono text-sm">
                    {oauthConfigClientId}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Access Token:
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      hasAccessToken && !isTokenExpired
                        ? "bg-green-100 text-green-800"
                        : isTokenExpired
                          ? "bg-red-100 text-red-800"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {hasAccessToken && !isTokenExpired
                      ? "✓ Valid"
                      : isTokenExpired
                        ? "✗ Expired"
                        : "✗ Not available"}
                  </span>
                </div>

                {!!tokenExpirationInfo && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Token Expires:
                    </span>
                    <span
                      className={`text-xs ${
                        tokenExpirationInfo.isExpired
                          ? "text-red-600"
                          : "text-foreground"
                      }`}
                    >
                      {tokenExpirationInfo.isExpired
                        ? "Expired"
                        : tokenExpirationInfo.timeUntilExpiration
                          ? `In ${tokenExpirationInfo.timeUntilExpiration}`
                          : "Unknown"}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Linear Client:
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isLinearClientInitialized
                        ? "bg-green-100 text-green-800"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isLinearClientInitialized
                      ? "✓ Initialized"
                      : "✗ Not initialized"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Storage:
                  </span>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    ✓ Redis
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {!isLinearClientInitialized || isTokenExpired ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    {isTokenExpired
                      ? "Your token has expired. Re-authorize to continue using the Linear API."
                      : "Authorize this application to act on behalf of your Linear workspace using the actor=app flow. This allows the application to create issues and comments as the app rather than individual users."}
                  </p>

                  <form action="/auth/authorize" method="post">
                    <Button className="w-full" type="submit" variant="default">
                      {isTokenExpired
                        ? "Re-authorize with Linear"
                        : "Authorize with Linear (actor=app)"}
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-green-600">
                    ✓ Successfully authorized! The Linear client is initialized
                    and ready to use.
                    {!!tokenExpirationInfo && (
                      <span className="text-muted-foreground mt-1 block">
                        Token expires in{" "}
                        {tokenExpirationInfo.timeUntilExpiration}.
                      </span>
                    )}
                  </p>

                  <form action="/auth/revoke" method="post">
                    <Button
                      className="w-full"
                      type="submit"
                      variant="destructive"
                    >
                      Revoke Authorization
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button variant="ghost" asChild>
              <Link to="/">← Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
