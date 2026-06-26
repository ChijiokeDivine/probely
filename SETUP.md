# Wallet-on-signup setup checklist

What this gives you: every user who signs up through Supabase (email/password
or Google) automatically gets a Privy-backed Ethereum wallet, with zero
wallet UI, zero Privy login, zero "connect wallet" button anywhere. Privy is
pure server-side wallet infra here — `@privy-io/node`'s Wallet API, not the
React SDK.

## 1. Install dependencies

```bash
npm install @supabase/ssr @supabase/supabase-js @privy-io/node
```

## 2. Confirm the `@/*` path alias

These files import via `@/lib/...`. If your `tsconfig.json` doesn't already
have this (default in any `create-next-app` project), add it:

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./*"] }
  }
}
```

## 3. Env vars

Copy `.env.local.example` → `.env.local` and fill in:
- Supabase URL/anon key/service role key (Settings → API)
- A random `SUPABASE_WEBHOOK_SECRET` you make up
- Privy app ID + secret (Dashboard → Settings → Basics) — no login methods
  or embedded-wallet config needed, since the client SDK is never used.

## 4. Run the migration

Paste `supabase/migrations/0001_profiles_and_wallets.sql` into the Supabase
SQL editor and run it. This creates `profiles` and a trigger that inserts a
bare row the instant any new `auth.users` row appears, regardless of signup
method.

## 5. Turn on Google sign-in

Supabase dashboard → Authentication → Providers → Google → enable, paste in
your Google OAuth client ID/secret. In Google Cloud Console, add this as an
authorized redirect URI:
```
https://<your-project-ref>.supabase.co/auth/v1/callback
```
Then in Supabase → Authentication → URL Configuration, add to **Redirect
URLs**:
```
http://localhost:3000/auth/callback
https://<your-production-domain>/auth/callback
```

## 6. Wire the Database Webhook (the part that makes this "automatic")

Supabase dashboard → Database → Webhooks → Create a new webhook:
- Table: `public.profiles`
- Events: `INSERT`
- Type: HTTP Request → `POST https://<your-deployed-app>/api/webhooks/wallet-provision`
- HTTP Headers: `x-webhook-secret: <the value you put in SUPABASE_WEBHOOK_SECRET>`

**Local dev note:** Supabase needs a public URL to call, so this webhook
can't reach `localhost` directly. During local dev you don't need to set it
up at all — `/auth/callback` and `/api/wallet/ensure` already cover wallet
creation as fallbacks (see comments in `lib/wallet.ts`). Set the webhook up
for real once you deploy, or point it at an ngrok/cloudflared tunnel if you
want to test it before then.

## 7. What's intentionally not built yet

- `/dashboard` doesn't exist — signup/login redirect there on success, so
  you'll see a 404 until that page exists. That's the next task.
- No UI shows the wallet address anywhere. It's sitting in
  `profiles.wallet_address` / `profiles.privy_wallet_id`, ready for whatever
  the dashboard or the create-review flow needs it for later.

## How a signup actually flows, end to end

1. User submits the signup form (or clicks "Continue with Google").
2. Supabase creates the `auth.users` row → the trigger inserts a bare
   `profiles` row → the Database Webhook fires → `/api/webhooks/wallet-provision`
   calls `ensureWalletForUser` → Privy's `wallets().create({chain_type:
   "ethereum"})` mints a wallet → its id + address get written onto that
   user's `profiles` row.
3. By the time the user is on `/dashboard`, their wallet already exists.
   Nothing in the UI ever asked them about it.
