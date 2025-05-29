import type { Route } from "./+types/auth";
import { getClientState, getOAuthConfig } from "../lib/oauth-config";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Linear OAuth Authentication" },
    { name: "description", content: "Authenticate with Linear API" },
  ];
}

export async function loader({}: Route.LoaderArgs) {
  const clientState = getClientState();
  const oauthConfig = getOAuthConfig();
  
  return {
    isLinearClientInitialized: clientState.isInitialized,
    hasAccessToken: !!clientState.accessToken,
    hasOAuthConfig: !!oauthConfig,
    oauthConfigClientId: oauthConfig?.clientId?.substring(0, 8) + '...' || 'Not set',
  };
}

export default function Auth({ loaderData }: Route.ComponentProps) {
  const { isLinearClientInitialized, hasAccessToken, hasOAuthConfig, oauthConfigClientId } = loaderData;

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
                <span className="text-sm text-gray-600">OAuth Configuration:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  hasOAuthConfig ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hasOAuthConfig ? '✓ Configured' : '✗ Not configured'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Client ID:</span>
                <span className="text-sm text-gray-900 font-mono">{oauthConfigClientId}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Access Token:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  hasAccessToken ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {hasAccessToken ? '✓ Available' : '✗ Not available'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Linear Client:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isLinearClientInitialized ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {isLinearClientInitialized ? '✓ Initialized' : '✗ Not initialized'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            
            {!isLinearClientInitialized ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Authorize this application to act on behalf of your Linear workspace using the actor=app flow. 
                  This allows the application to create issues and comments as the app rather than individual users.
                </p>
                
                <form action="/auth/authorize" method="post">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Authorize with Linear (actor=app)
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-green-600">
                  ✓ Successfully authorized! The Linear client is initialized and ready to use.
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