import type { Route } from "./+types/auth";
import { oauth } from "~/lib/oauth";
import { credentialStorage } from "~/lib/cred-storage";
import { linearService } from "~/lib/linear";
import { requireAdminAuth } from "~/lib/sessions.server";

export function meta({}: Route.MetaArgs) {
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
    linearService.clearLinearClient();
    return {
      isLinearClientInitialized: false,
      hasAccessToken: false,
      hasOAuthConfig: !!oauthConfig,
      oauthConfigClientId:
        oauthConfig?.clientId?.substring(0, 8) + "..." || "Not set",
      isTokenExpired: false,
      tokenExpirationInfo: null,
    };
  }

  const tokenInfo = await oauth.getTokenExpirationInfo(tokenData);
  const linearClient = await linearService.getLinearClient();

  return {
    isLinearClientInitialized: !!linearClient,
    hasAccessToken: !!tokenData,
    hasOAuthConfig: !!oauthConfig,
    oauthConfigClientId:
      oauthConfig?.clientId?.substring(0, 8) + "..." || "Not set",
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Linear OAuth Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage your Linear API integration with actor=app authorization
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  OAuth Configuration:
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                <span className="text-sm text-gray-900 font-mono">
                  {oauthConfigClientId}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Access Token:</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  ✓ In-Memory
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>

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
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                    <span className="block text-gray-600 mt-1">
                      Token expires in {tokenExpirationInfo.timeUntilExpiration}
                      .
                    </span>
                  )}
                </p>

                <form action="/auth/revoke" method="post">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
