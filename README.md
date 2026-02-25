<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/49af065b-86b3-4cc2-a7d5-7576337580b5

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Supabase (optional, for persistence)

This repo now supports a minimal Supabase-backed snapshot store. Without Supabase, it still runs as an in-memory demo.

1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Optional: `VITE_SUPABASE_SNAPSHOT_ID` (defaults to `kinetic-demo`)
4. Install/update dependencies:
   `npm install`
5. Start the app:
   `npm run dev`

Note: `supabase/schema.sql` enables public read/write policies for a demo snapshot table. Tighten this before any real deployment.

## Security Notes

- `.env.local` is ignored by git. Keep real secrets there and never commit them.
- This app is a browser-only demo. Do not put production API keys in frontend code or Vite config because they will be exposed to users.
- Use a backend or serverless function for any real secret/key usage.
