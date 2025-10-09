# Local Development Setup

## Running the App Locally

The app requires **two servers** running simultaneously:
1. **Vite dev server** (port 5173) - for the frontend
2. **Vercel dev server** (port 3000) - for API routes (Stripe checkout, etc.)

### Quick Start

**Terminal 1** - Start the API server:
```bash
npm run dev:api
```

**Terminal 2** - Start the frontend:
```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

### Why Two Servers?

The app uses Vercel serverless functions for API routes like `/api/checkout`. These don't work with Vite alone. The Vite config is set up to automatically proxy `/api/*` requests to the Vercel dev server running on port 3000.

### Environment Variables

Make sure you have a `.env.local` file with:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY`
- `VITE_STRIPE_PRICE_PLAYER_MODE_ANNUAL`
- `STRIPE_SECRET_KEY` (for API server)
- `SUPABASE_SERVICE_ROLE_KEY` (for API server)

### Troubleshooting

**"POST /api/checkout 500 error"**
- Make sure the Vercel dev server is running (`npm run dev:api`)
- Check that port 3000 is not already in use
- Verify `STRIPE_SECRET_KEY` is set in `.env.local`

**"Cannot find module '@vercel/node'"**
```bash
npm install --save-dev vercel @vercel/node
```

**First time running `vercel dev`?**
- Vercel CLI may ask you to log in
- It may ask to link the project - you can choose "no" for local testing
- It will automatically detect the `api/` directory for serverless functions

