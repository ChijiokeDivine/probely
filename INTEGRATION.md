# Probely backend — integration guide

Everything in this drop is DB + business logic + on-chain wiring, with **no
UI**. It's built so each future screen is a thin fetch() call against one of
the REST routes below (or, for server components, a direct import of the
underlying `lib/services/*` function — same code, no extra HTTP hop).

## 1. Install & wire up

```bash
npm install viem @privy-io/node @zama-fhe/relayer-sdk @supabase/supabase-js @supabase/ssr
```

Add to `next.config.js` (required — the relayer SDK ships native WASM
bindings that webpack must not try to bundle):

```js
const nextConfig = {
  serverExternalPackages: ["@zama-fhe/relayer-sdk"], // Next 15+
  // experimental: { serverComponentsExternalPackages: ["@zama-fhe/relayer-sdk"] }, // Next 14
};
```

Copy `.env.example` to `.env.local` and fill in every value — see inline
comments for what each one is. The two you don't already have from your
existing auth/wallet setup are `CONTRACT_ADDRESS`, `SEPOLIA_RPC_URL`, and the
gas/cron tuning knobs (all have sane defaults).

Run the migration:

```bash
supabase db push   # or paste supabase/migrations/0001_blind_review_schema.sql
                    # into the SQL editor
```

The very first write to the contract (anyone creating a review, submitting a
score, etc.) will lazily create and persist your app's "operator" wallet (see
`lib/privy/operatorWallet.ts`) — **fund that address with Sepolia ETH** once
you see it logged/in the `app_wallets` table, since it's the wallet that
calls `submitRevealedScores` and pays for every gas drip to new users.

## 2. What's already wired from your existing auth system

Nothing changed in your signup/login/wallet-provisioning flow — `lib/wallet.ts`,
`lib/privy.ts`, `lib/supabase/*`, `app/api/wallet/ensure`,
`app/api/webhooks/wallet-provision`, and `app/auth/callback` are copied
through unmodified, with exactly one addition: `ensureWalletForUser` now
fires a non-blocking gas drip the moment a wallet is created, so a brand new
user never has to find a faucet before their first on-chain action.

## 3. Screen → endpoint map

### Candidates

| Screen | Call |
|---|---|
| "Add candidate" form | `POST /api/candidates` `{ fullName, email?, notes? }` |
| Candidate list (admin) | `GET /api/candidates` |
| Candidate detail (admin, full PII) | `GET /api/candidates/:id` |
| Candidate's review history (all rounds) | `GET /api/candidates/:id/rounds` |

**Never** fetch the `candidates` table directly for anything reviewer-facing —
go through `getCandidateBlindView(candidateId, reviewId)` in
`lib/services/candidates.ts`, which returns only `candidateRef` + `role`, no
name/email. This is the actual blind-hiring guarantee at the data layer.

### Reviews — admin side

| Screen | Call |
|---|---|
| "Create review" form (pick candidate, role, reviewers, deadline, weights, optional auto-advance rule) | `POST /api/reviews` |
| Admin's review list/dashboard | `GET /api/reviews` |
| Review detail page | `GET /api/reviews/:id` |
| "Cancel review" button | `POST /api/reviews/:id/cancel` |
| "Extend deadline" button | `POST /api/reviews/:id/extend-deadline` `{ newDeadlineAt }` |
| "Replace reviewer" button | `POST /api/reviews/:id/replace-reviewer` `{ oldReviewerProfileId, newReviewerProfileId }` |
| "Reveal results" button (single click) | `POST /api/reviews/:id/reveal` |
| ...or split into two steps for a progress UI | `POST /api/reviews/:id/request-reveal` then `POST /api/reviews/:id/finalize-reveal` |
| Results page (averages, std-dev, tags, weighted score) | `GET /api/reviews/:id/results` |

`createReview` body shape:

```ts
{
  candidateId: string;        // uuid, from /api/candidates
  role: string;
  reviewerProfileIds: string[]; // 2-20 profile ids, must already have wallets
  deadlineAt: string;         // ISO date, >= 1hr from now
  categoryWeights: {           // must sum to 10000
    problemSolving: number; technicalDepth: number; communication: number;
    collaboration: number; cultureGrowth: number;
  };
  autoAdvanceRule?: {          // optional, omit for "disabled"
    enabled: boolean; passThreshold: number; failThreshold: number;
    passAction: 0|1|2|3; failAction: 0|1|2|3; // see AutoAdvanceAction enum
  };
}
```

### Reviews — reviewer side

| Screen | Call |
|---|---|
| "My reviews" list | `GET /api/reviews/mine` |
| Scorecard submission form | `POST /api/reviews/:id/submit-score` `{ scores: {...0-10 each}, selectedTagBits?: number[] }` |

`selectedTagBits` are indices 0-7 into `REVIEW_TAGS` from
`lib/contracts/constants.ts` — render that array as your tag checkboxes
directly, it already has labels + polarity.

### Notifications

| Screen | Call |
|---|---|
| Notification bell / feed | `GET /api/notifications` (add `?unreadOnly=true` to filter) |
| Mark as read | `POST /api/notifications/:id/read` |

No email/push is wired up — `lib/services/notifications.ts#createNotification`
is the one place to add a real delivery channel (Resend, web push, ...)
later without touching any of the ~10 call sites across the service layer.

### Chain sync (ops, not user-facing)

`POST /api/chain/sync` (protected by `CRON_SECRET` if set) — catch-up
indexer, not on the critical path of anything. Every action service already
updates Postgres synchronously off its own transaction receipt; this just
backstops the one truly permissionless call (`submitRevealedScores`, which
anyone can call on-chain) and any requests that died mid-flight. Wire it to
a 5-minute cron.

## 4. Key invariants worth knowing before building UI

- **Scores never touch your server in plaintext for longer than one
  function call.** `submitScore` (`lib/services/scores.ts`) receives raw
  0-10 numbers from the client, encrypts them immediately, and only ever
  persists the resulting ciphertext handles — never the plaintext.
- **Reveal is two transactions, not one**, because the FHEVM decryption
  model is inherently two-step (mark public-decryptable → relayer signs →
  submit signed cleartext). `/api/reviews/:id/reveal` hides this behind one
  call; build a progress UI against the split endpoints if you want
  visible steps.
- **The reveal-finalize transaction is signed by the app's operator
  wallet, not the admin's** — this matches the contract's own design
  (`submitRevealedScores` is callable by anyone; only the KMS signature is
  checked). Don't be surprised the tx comes from a different address than
  the review's admin.
- **All five category scores share one ZK proof** per submission — you
  cannot let a reviewer submit categories independently/incrementally; the
  UI should collect all 5 + tags, then submit once.
- **`reviewerProfileIds` passed to `createReview` must already have
  provisioned wallets** (`wallet_status = 'created'`) — surface this in the
  reviewer-picker UI (e.g. grey out / show a "wallet pending" badge for
  anyone who signed up seconds ago).
