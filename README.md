# aia-carnival-quiz

## Saving quiz submissions

Quiz answers are submitted to `/api/quiz-submissions` and stored in Supabase. Each row contains the five selected answer categories, the UI locale, the server-calculated persona, and a database-generated timestamp. The submission UUID is used for idempotent retries. No identity or contact information is collected.

### Supabase setup

1. Create a Supabase project and open its SQL Editor.
2. Run [`database/schema.sql`](./database/schema.sql).
3. Copy the project URL and create a **secret key** in the Supabase API Keys settings. Keep the secret key private; never add it to browser code or commit it. The API still supports the legacy service-role key during migration, but new projects should use the secret key.

### Local development

Copy `.env.example` to `.env.local`, replace the placeholders with the Supabase project URL and secret key, then start the site with `vercel dev`. A basic static file server can serve the page but cannot run the submission API.

### Vercel deployment

In the Vercel project settings, add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` for the relevant environments, then redeploy. The API validates the five answers and locale, calculates the persona on the server, and uses the private key to insert the submission. Row-level security is enabled, and direct `anon`/`authenticated` table access is revoked.

Use the Supabase dashboard or a privileged analytics tool to review submissions. Do not expose the service role key or create a public read endpoint for quiz responses.
