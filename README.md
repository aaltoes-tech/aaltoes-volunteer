# Aaltoes HelpMe! 🚀

A task management and issue tracking web application that integrates with Linear to help organizations expose their pending issues to the community. Originally designed for Aaltoes, this tool bridges the gap between task assignment and community contribution.

## 🌟 Features

- **Linear Integration**: OAuth integration with Linear for issue management
- **Task Visualization**: Clean, game-inspired UI for viewing available issues
- **Point-based System**: Estimate-based task scoring for prioritization
- **Admin Dashboard**: Secure admin authentication for system management
- **Real-time Updates**: Live synchronization with Linear workspace
- **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS

## 🛠️ Technology Stack

- **Frontend**: React 19 + React Router 7
- **Backend**: Node.js with React Router SSR
- **Styling**: Tailwind CSS + Radix UI components
- **Database**: Upstash Redis for session and token storage
- **Authentication**: Linear OAuth2 + Admin session management
- **Package Manager**: pnpm

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- pnpm (recommended) or npm
- Linear account with API access
- Upstash Redis instance

### Environment Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd aaltoes-helpme
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp env.example .env
```

4. Configure your `.env` file:

```env
# Linear OAuth Configuration
LINEAR_CLIENT_ID=your_linear_client_id
LINEAR_CLIENT_SECRET=your_linear_client_secret
LINEAR_REDIRECT_URI=http://localhost:5173/auth

# Upstash Redis Configuration
KV_REST_API_URL=https://your-redis-instance.upstash.io
KV_REST_API_TOKEN=your_redis_token

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# Application Configuration
SESSION_SECRET=your_session_secret_here
ORG_NAME=Aaltoes
NODE_ENV=development
```

### Development

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
pnpm build
pnpm start
```

## 🔧 Configuration

### Linear OAuth Setup

1. Go to your Linear organization settings
2. Navigate to **API** → **OAuth Applications**
3. Create a new application with:
   - **Redirect URI**: `http://localhost:5173/auth/callback` (development) or your production URL
   - **Scopes**: Select appropriate permissions for issue management

### Upstash Redis Setup

1. Create an account at [Upstash](https://upstash.com)
2. Create a new Redis database
3. Copy the REST API URL and token to your environment variables

Alternatively, use Vercel Marketplace to set up Upstash Redis.

## 📖 Usage

### Admin Workflow

1. Navigate to `/admin/login` and authenticate with admin credentials
2. Go to `/auth` to set up Linear OAuth integration
3. Authorize the application to access your Linear workspace
4. The system will now sync issues assigned to the authenticated user

### User Experience

- Visit the home page to view available issues
- Issues are displayed with titles, point estimates, and descriptions
- Click the info icon to view full issue details
- Task claiming functionality is coming soon

## 🏗️ Architecture

```
app/
├── routes/           # Application routes and pages
│   ├── home.tsx     # Main task dashboard
│   ├── auth.tsx     # OAuth management
│   └── admin.*      # Admin authentication
├── lib/
│   ├── .server/     # Server-side utilities
│   │   ├── linear.ts    # Linear API integration
│   │   ├── oauth/       # OAuth flow management
│   │   └── sessions.ts  # Session management
│   └── utils.ts     # Client utilities
├── components/      # Reusable UI components
└── app.css         # Global styles
```

## 🚧 Roadmap

- [ ] Task claiming functionality
- [ ] User authentication system
- [ ] Advanced filtering and search
- [ ] Notification system
- [ ] Analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier

## 📄 License

This project is part of the Aaltoes organization. Licensed under the MIT license.

## 🆘 Support

For support and questions:

- Open an issue in this repository
- Contact the Aaltoes development team
- Check the Linear integration documentation

---

Built with ❤️ by the Aaltoes community
