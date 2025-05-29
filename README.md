# AaltoES TaskBridge

A React Router v7 application with Linear OAuth integration using the `actor=app` authorization flow.

## Features

- Linear OAuth2 integration with `actor=app` parameter
- Server-side authorization flow implementation
- Real-time status display of Linear client initialization
- Secure state management for OAuth flow

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Linear OAuth

1. Go to your Linear workspace settings
2. Create a new OAuth2 Application
3. Set the redirect URL to: `http://localhost:5173/auth/callback` (for development)
4. Note down your Client ID and Client Secret

### 3. Environment Variables

Create a `.env` file (optional - the app will use placeholder values for demo):

```bash
LINEAR_CLIENT_ID=your_linear_client_id
LINEAR_CLIENT_SECRET=your_linear_client_secret
```

### 4. Run the Application

```bash
pnpm dev
```

Visit `http://localhost:5173` and navigate to the "Linear OAuth (actor=app)" link to start the authorization flow.

## OAuth Flow

The application implements the Linear OAuth2 flow with the following features:

1. **Actor=App Authorization**: Uses `actor=app` parameter so the application acts as itself rather than individual users
2. **Server-side Implementation**: All OAuth logic is handled server-side for security
3. **State Validation**: Implements CSRF protection using state parameters
4. **In-memory Storage**: Credentials and tokens are stored in memory (for production, use persistent storage)

## Routes

- `/` - Home page with link to OAuth
- `/auth` - OAuth status and authorization management
- `/auth/authorize` - Redirects to Linear OAuth
- `/auth/callback` - Handles OAuth callback
- `/auth/revoke` - Revokes authorization

## Technical Details

- **Framework**: React Router v7
- **OAuth Library**: openid-client (v6)
- **Linear SDK**: @linear/sdk
- **Styling**: Tailwind CSS

The implementation follows Linear's OAuth2 documentation and uses the `actor=app` parameter to allow the application to create issues and comments as the app rather than individual users.
