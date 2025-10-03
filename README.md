# AgroAssist Cloud

A modern farm management platform with AI-powered insights for precision agriculture.

## Features

- Crop growth tracking and management
- AI-powered growth stage analysis
- Weather and environmental monitoring
- Field mapping and geolocation
- Image upload and analysis

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI/ML**: OpenAI API
- **Maps**: Mapbox GL JS
- **Authentication**: Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (https://supabase.com/)
- Mapbox Access Token (https://account.mapbox.com/access-tokens/)
- OpenAI API Key (optional, for AI features)

### Environment Setup

1. Copy the `.env.example` file to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

2. Update the following environment variables in the `.env` file:
   - `VITE_API_URL`: URL of your API server (default: http://localhost:3001)
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (server-side only)
   - `VITE_MAPBOX_ACCESS_TOKEN`: Your Mapbox access token
   - `VITE_OPENAI_API_KEY`: (Optional) Your OpenAI API key for AI features

## Development

### Client Setup

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

2. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Server Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The API server will be available at [http://localhost:3001](http://localhost:3001)

## Project Structure

```
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/              # Page components
│   ├── services/           # API service functions
│   ├── types/              # TypeScript type definitions
│   └── ...
├── server/                 # Backend server code
│   ├── api/                # API route handlers
│   ├── types/              # TypeScript type definitions
│   └── index.ts            # Server entry point
├── public/                 # Static files
└── ...
```

## Deployment

### Client

The client can be deployed to any static hosting service (Vercel, Netlify, etc.) or served from a CDN.

### Server

The server should be deployed to a Node.js hosting service (Railway, Render, Heroku, etc.) with the appropriate environment variables set.

## License

MIT

---

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9e272b49-fd07-475c-b840-a2aebb291053) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9e272b49-fd07-475c-b840-a2aebb291053) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
