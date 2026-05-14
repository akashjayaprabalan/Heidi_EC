
# Product Growth Heidi

This is the simplified standalone version of the Kinetic prototype. It keeps the same UI/UX and system behavior as the original app while using a smaller source architecture.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
3. Validate the app before shipping:
   `npm run check`

   
## Login Credentials

| Clinic               | Username | Password   |
|----------------------|----------|------------|
| Harbour Physio       | harbour  | harbour123 |
| Peak Performance     | peak     | peak123    |
| City Sports Rehab    | city     | city123    |
| Northside Physio     | north    | north123   |
| Bayside Movement     | bayside  | bayside123 |


## Supabase (optional, for persistence)

This app supports the same minimal Supabase-backed snapshot store as the original. Without Supabase, it still runs as an in-memory demo.

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
