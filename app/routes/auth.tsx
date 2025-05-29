import type { Route } from "./+types/auth";
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
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Linear OAuth Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage your Linear API integration with actor=app authorization
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Status</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
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
                <span className="text-sm text-gray-600">Client ID:</span>
                <span className="font-mono text-sm text-gray-900">
                  {oauthConfigClientId}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Access Token:</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    hasAccessToken && !isTokenExpired
                      ? "bg-green-100 text-green-800"
                      : isTokenExpired
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
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
                  <span className="text-sm text-gray-600">Token Expires:</span>
                  <span
                    className={`text-xs ${
                      tokenExpirationInfo.isExpired
                        ? "text-red-600"
                        : "text-gray-900"
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
                <span className="text-sm text-gray-600">Linear Client:</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    isLinearClientInitialized
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {isLinearClientInitialized
                    ? "✓ Initialized"
                    : "✗ Not initialized"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Storage:</span>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  ✓ Redis
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Actions</h3>

            {!isLinearClientInitialized || isTokenExpired ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {isTokenExpired
                    ? "Your token has expired. Re-authorize to continue using the Linear API."
                    : "Authorize this application to act on behalf of your Linear workspace using the actor=app flow. This allows the application to create issues and comments as the app rather than individual users."}
                </p>

                <form action="/auth/authorize" method="post">
                  <button
                    type="submit"
                    className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                  >
                    {isTokenExpired
                      ? "Re-authorize with Linear"
                      : "Authorize with Linear (actor=app)"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-green-600">
                  ✓ Successfully authorized! The Linear client is initialized
                  and ready to use.
                  {!!tokenExpirationInfo && (
                    <span className="mt-1 block text-gray-600">
                      Token expires in {tokenExpirationInfo.timeUntilExpiration}
                      .
                    </span>
                  )}
                </p>

                <form action="/auth/revoke" method="post">
                  <button
                    type="submit"
                    className="flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                  >
                    Revoke Authorization
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="text-center">
            <a
              href="/"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
