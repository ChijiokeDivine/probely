# Honio

Honio is a blind hiring review platform built to make candidate evaluation fairer, more consistent, and less vulnerable to bias. The core idea is simple: reviewers submit their feedback privately, and the system only reveals the outcome when the review is ready to be evaluated.

- I abstracted wallet signing and smart contract interactions so they happen automatically in the background. When a user signs up, a Privy wallet is created for them, allowing them to use the app without managing a crypto wallet themselves.
  
- fund this wallet with sepoilia eth to use the web app comfortably - 0x65d25dbB227FB9CA1afBeFf7f5c8CcE807a58a7B (admin wallet, paymaster coming soon)

## Why this project exists

Hiring decisions are often shaped by inconsistent feedback, hidden social dynamics, and pressure to make fast calls based on first impressions. Honio exists to give teams a more structured way to review candidates by separating the act of evaluation from the act of comparison.

The goal is not just to collect feedback, but to preserve the integrity of that feedback until the right moment. That makes the process more thoughtful, more private, and easier to trust.

## What made me build it

I built Honio because I wanted a better way to run interview reviews for hiring teams:

- reduce bias from visible feedback loops
- create a more consistent review experience
- keep reviewer input private until the process is ready to reveal
- make it easier for teams to compare candidates based on evidence rather than instinct

The product also explores a more experimental layer: using encrypted computation so scores can remain private until a reveal point without exposing raw reviewer values too early.

## How it works

1. An admin creates a review for a candidate.
2. Reviewers are invited to evaluate the candidate using weighted categories.
3. Each reviewer submits their scores privately.
4. The backend handles encryption and coordination through the review workflow.
5. Once all required reviewers have submitted, the system can reveal the aggregated results.
6. The team sees the outcome with weighted scores, review status, and related signals.

### Core building blocks

- Next.js for the product experience and API routes
- Supabase for authentication and data storage
- Privy for server-side wallet management
- A smart contract and FHE-backed relayer flow for private score handling
- Sepolia for contract interactions

## Developer setup

### Prerequisites

- Node.js 20+
- pnpm
- Access to Supabase, Privy, and a Sepolia RPC endpoint

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Create a `.env.local` file and add the environment variables required by the app. At a minimum, you will likely need:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PRIVY_APP_ID=
PRIVY_APP_SECRET=
SEPOLIA_RPC_URL=
```

Depending on your deployment and feature set, you may also need additional values for contract addresses, wallet funding, webhook secrets, and mail delivery.

### 3. Run the app locally

```bash
pnpm dev
```

Then open http://localhost:3000 in your browser.

### 4. Useful commands

```bash
pnpm build
pnpm lint
```

## Project structure

- `app/` — Next.js routes, pages, and UI
- `lib/` — auth, wallet, contract, FHE, Supabase, and service-layer integrations
- `supabase/migrations/` — database schema updates
- `public/` — static assets

## Notes

This is an early-stage product, and the repository includes both the product experience and the infrastructure needed to support private, on-chain review flows. If you are contributing, keep the privacy and trust model in mind: reviewer inputs should remain private until the intended reveal stage.
