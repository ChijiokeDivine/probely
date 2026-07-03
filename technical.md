# Probely — Technical Specification (Remaining Work)
### Blind Hiring Review Platform powered by Zama FHEVM

**Version:** 2.0 — Updated after codebase review  
**App name:** Probely  
**Status:** Infrastructure complete. UI pages remaining.

---

## What's Already Built — Do Not Rebuild

Before reading anything else, understand what's done so you don't duplicate work.

### Auth (Supabase — not Clerk)
`/login`, `/signup`, `/forgot-password`, `/reset-password` pages are all complete with email/password and Google OAuth. Auth callback route is done. Do not touch these.

### Wallet system (Privy — not MetaMask/RainbowKit)
Every user gets a **server-side Privy embedded wallet** created automatically on signup. Users never see a wallet, never install MetaMask, never click "Connect wallet." All blockchain transactions are signed server-side by Privy. This is the single most important architectural fact to understand before building any UI.

### Smart contract
Already deployed on Sepolia. Full ABI is at `lib/contracts/BlindReview.abi.ts`. Do not write a new contract. The contract has:
- 5 fixed scoring categories: `problemSolving`, `technicalDepth`, `communication`, `collaboration`, `cultureGrowth`
- Weights in basis points (must sum to 10,000)
- Per-category sum AND sum-of-squares stored encrypted (enables variance calculation post-reveal without ever seeing individual scores)
- 8 signal tag bits (4 positive, 4 negative) packed into a `uint8` mask
- Auto-advance rules (passThreshold / failThreshold / passAction / failAction)
- Reviewer replacement
- Multi-round candidates (same `candidateRef` across rounds)
- Deadline extension (once per review)
- Cancel review
- `ReviewStatus` enum: `Active=0`, `RevealRequested=1`, `Revealed=2`, `Cancelled=3`

### All backend infrastructure
Everything in `lib/` is complete:
- `lib/supabase/` — browser, server, and admin Supabase clients
- `lib/privy.ts` + `lib/privy/` — Privy node client, operator wallet, viem account builder
- `lib/wallet.ts` — `ensureWalletForUser()` (creates Privy wallet for every new user)
- `lib/contract.ts` + `lib/contracts/` — constants, types, ABI, public/write viem clients
- `lib/fhe/` — `encryptScores()`, `publicDecrypt()`, FHEVM relayer instance
- `lib/chain/sync.ts` — chain event indexer
- `lib/auth/authz.ts` + `lib/auth/respond.ts` — session/profile helpers, HttpError, errorResponse
- `lib/services/reviews.ts` — createReview, listReviews, cancelReview, extendDeadline, replaceReviewer
- `lib/services/scores.ts` — submitScore (encrypts + sends tx server-side)
- `lib/services/reveal.ts` — requestReveal, finalizeReveal, requestAndFinalizeReveal
- `lib/services/results.ts` — getReviewResults (averages, std dev, weighted score, tags)
- `lib/services/candidates.ts` — createCandidate, getCandidateBlindView, getCandidateRounds
- `lib/services/notifications.ts` — createNotification, listNotifications, markNotificationRead
- `lib/services/activity.ts` — recordPendingTransaction, markTransactionConfirmed/Failed
- `lib/services/walletFunding.ts` — ensureWalletFunded (gas drip from operator wallet)

### All API routes
Every route handler is complete:
```
POST /api/candidates              GET  /api/candidates
GET  /api/candidates/[id]         GET  /api/candidates/[id]/rounds
POST /api/chain/sync
POST /api/wallet/ensure
POST /api/webhooks/wallet-provision
GET  /api/notifications           POST /api/notifications/[id]/read
POST /api/reviews                 GET  /api/reviews
GET  /api/reviews/mine
GET  /api/reviews/[id]
POST /api/reviews/[id]/submit-score
POST /api/reviews/[id]/cancel
POST /api/reviews/[id]/request-reveal
POST /api/reviews/[id]/reveal
POST /api/reviews/[id]/finalize-reveal
GET  /api/reviews/[id]/results
POST /api/reviews/[id]/replace-reviewer
POST /api/reviews/[id]/extend-deadline
```

---

## Tech Stack (Actual)

| Layer | What's used | Notes |
|---|---|---|
| Framework | Next.js (App Router) | Already configured |
| Auth | Supabase | Email + Google OAuth, all done |
| Wallets | Privy (server-side) | Users never see a wallet UI |
| DB | Supabase (PostgreSQL) | Schema already exists |
| FHE | `@zama-fhe/relayer-sdk/node` | Server-side only, never browser |
| Blockchain reads | viem `PublicClient` | `lib/contracts/client.ts` |
| Blockchain writes | viem `WalletClient` via Privy | `lib/privy/viemAccount.ts` |
| Font | Plus Jakarta Sans | Already in layout.tsx |
| Styling | Tailwind CSS | Already configured |
| Network | Sepolia testnet | Contract deployed |

**Critical: no client-side blockchain code.** Every contract call (createReview, submitScores, requestReveal, etc.) goes through a Next.js API route → service function → Privy wallet → Sepolia RPC. The browser never touches viem, wagmi, ethers, or any wallet SDK.

---

## Database Tables (Reference)

You'll be reading from these in your UI. You don't define the schema — it's already in Supabase.

```
profiles              — id, full_name, wallet_address, privy_wallet_id, wallet_status
candidates            — id, candidate_ref, full_name, email, notes, created_by
reviews               — id, admin_id, candidate_id, candidate_ref, role, reviewer_count,
                        submitted_count, deadline, category_weights (JSON), auto_advance_rule (JSON),
                        status (draft/pending_tx/active/reveal_requested/revealed/cancelled/failed),
                        chain_review_id, round_number, extension_used, create_tx_hash, error_message
review_reviewers      — id, review_id, reviewer_id, wallet_address, is_active, has_submitted,
                        submitted_at, tag_mask, submit_tx_hash, replaced_by_reviewer_id
review_results        — review_id, sum_problem_solving, sum_technical_depth, sum_communication,
                        sum_collaboration, sum_culture_growth, sum_sq_*, reviewer_count,
                        tag_counts (number[8]), weighted_score, reveal_tx_hash
review_reveals        — review_id, requested_by, request_tx_hash, handles (JSON), status,
                        decryption_proof, abi_encoded_clear_values, finalize_tx_hash, finalized_at
review_events         — review_id, chain_review_id, event_type, tx_hash, block_number, log_index, payload
review_score_submissions — review_id, reviewer_id, tx_hash, handles (JSON), tag_mask, status
notifications         — id, profile_id, type, title, body, review_id, read_at
wallet_transactions   — id, profile_id, action, review_id, status, tx_hash, confirmed_at, error_message
chain_sync_state      — id, last_synced_block
app_wallets           — key, privy_wallet_id, wallet_address
```

**`category_weights` JSON shape:**
```json
{ "problemSolving": 2500, "technicalDepth": 2500, "communication": 2000, "collaboration": 1500, "cultureGrowth": 1500 }
```
Values are basis points. Must sum to 10,000.

**`auto_advance_rule` JSON shape:**
```json
{ "enabled": true, "passThreshold": 75000, "failThreshold": 50000, "passAction": 1, "failAction": 3 }
```
Thresholds are on the same 0–100,000 scale as `weighted_score` in `review_results`. Actions: `0=None`, `1=AdvanceToNextRound`, `2=SendOffer`, `3=SendRejection`.

---

## What Still Needs to Be Built — UI Pages Only

Everything below is frontend work. Every API call it needs already exists.

---

## Page 1: Onboarding — `/onboarding`

**Who sees it:** New users only (first login, no existing profile data).  
**Redirect logic:** After signup → check if `profiles.full_name` is set → if not → `/onboarding`. After onboarding → `/dashboard`.

**What to build:**

```
Single page, centered card layout.

Step 1: Your role
├── Heading: "How will you use Probely?"
├── Two large option cards (click to select):
│   ├── "I'm hiring" — icon: briefcase
│   │   subtext: "Create reviews, manage interviewers"
│   └── "I was invited to review" — icon: clipboard-check
│       subtext: "Submit interview feedback"
└── [Continue] button (disabled until one selected)

Step 2: Your details
├── Name input (label: "Full name") — required
├── Company input (label: "Company") — optional, shown only for "I'm hiring" role
└── [Finish setup] button

On submit:
└── PATCH /api/profile (you'll need to create this route)
    Body: { fullName, company?, role: "admin" | "reviewer" }
    → Updates profiles.full_name in DB
    → Redirects to /dashboard (admin) or /inbox (reviewer)

Wallet status note:
└── By the time they reach onboarding, their Privy wallet is either already
    created (webhook fired) or being created. Do NOT show wallet setup UI.
    The wallet is invisible to users. If wallet_status is not "created" when
    they later try to perform an action, the API will return 409 — handle
    that gracefully at the action level, not here.
```

**API route to add:**
```typescript
// app/api/profile/route.ts
// PATCH: update profiles.full_name, company
// Use requireSession() from lib/auth/authz.ts to get userId
// Use createAdminClient() to update profiles row
// This is the only new API route needed — everything else exists
```

---

## Page 2: Admin Dashboard — `/dashboard`

**Who sees it:** Users with admin role. Redirect reviewers to `/inbox`.  
**Layout:** Persistent sidebar (left, ~220px) + scrollable main content (right).

### Sidebar (shared across all admin pages)

```
Logo: Probely wordmark + icon

Navigation links (with active state):
├── Dashboard          /dashboard
├── Reviews            /reviews
├── Candidates         /candidates
├── Analytics          /analytics
├── Team               /settings/team
└── Templates          /settings/templates

Bottom of sidebar:
├── Notification bell (badge with unread count)
│   └── GET /api/notifications?unreadOnly=true → show count
└── User avatar + name + logout button
    └── supabase.auth.signOut() → redirect to /login
```

### Main content

```
Greeting: "Good morning, [name]"
Date: current date

Stats row — 4 metric cards, fetched from GET /api/reviews
├── Active reviews     (status === "active", count)
├── Ready to reveal    (status === "active" AND submitted_count === reviewer_count)
├── Revealed this month (status === "revealed", createdAt in current month, count)
└── Avg score this month
    (mean of review_results.weighted_score / 10000 for revealed reviews this month)

Alert banners (shown conditionally, above the table)
├── If any reviews are ready to reveal:
│   "N reviews are ready to reveal" [Go to reviews →]
└── If any reviewer hasn't submitted and deadline < 48h:
    "Deadline approaching: [Role] — only N reviewers have submitted"

Reviews table
Fetch: GET /api/reviews → returns reviews array

Columns:
├── Candidate    → show candidateRef (candidate name is PII — don't show here unless you
│                  fetch candidates separately and join. For now candidateRef is fine)
├── Role         → review.role
├── Reviewers    → "3/4" — submitted_count / reviewer_count, with green dots for submitted
├── Status badge → color-coded (see status colors below)
├── Deadline     → relative time ("3 days" / "2 hours" — red if < 24h, amber if < 72h)
└── Action       → context-sensitive button (see below)

Status badge colors:
├── draft          → gray
├── pending_tx     → gray + spinner (tx broadcasting)
├── active         → blue
├── reveal_requested → amber + spinner (decrypting)
├── revealed       → green
├── cancelled      → red/muted
└── failed         → red

Action button logic:
├── draft / pending_tx   → [Processing...] (disabled)
├── active, not ready    → [View] → /reviews/[id]
├── active, ready        → [Reveal results] → POST /api/reviews/[id]/reveal → poll for status
├── reveal_requested     → [Decrypting...] (disabled, poll every 5s)
├── revealed             → [See results] → /reviews/[id]/results
└── cancelled / failed   → [View] → /reviews/[id]

Clicking any row navigates to /reviews/[id].

Empty state (no reviews yet):
└── Centered illustration + "No reviews yet. Create your first review to get started."
    [Create review] button → /reviews/new
```

---

## Page 3: Create Review Wizard — `/reviews/new`

**5-step wizard. Progress indicator at top showing Step X of 5.**

### Step 1: Candidate

```
Heading: "Who are you reviewing?"

Two paths:
├── Search existing candidates
│   GET /api/candidates → renders autocomplete list
│   Show: full_name + email (from candidates table — admin-visible)
│   Select one → store candidateId in wizard state
│
└── Add new candidate
    Toggle: "New candidate"
    Fields:
    ├── Full name (required)
    ├── Email (optional — for result notification later)
    └── Notes (optional — internal, never shown to reviewers)
    On proceed: POST /api/candidates → { fullName, email?, notes? }
    → Returns candidateId, store it

[Next →] — disabled until candidateId is set
```

### Step 2: Role & Interview details

```
Fields:
├── Role title (required) — text input, e.g. "Senior Backend Engineer"
│   Suggestions dropdown: Engineering / Product / Design / Sales / Marketing / Other
├── Interview date (optional) — date picker (shown to reviewers as context)
└── Notes for reviewers (optional) — shown on scorecard, e.g. "Focus on system design"

[← Back]  [Next →]
```

### Step 3: Category weights

```
Heading: "How should scores be weighted?"
Subheading: "Total must equal 100%"

Five rows, one per category:
├── Problem solving
├── Technical depth
├── Communication
├── Collaboration
└── Culture & growth

Each row:
├── Category name (label)
├── Percentage input (number, 0-100)
└── Description (small, e.g. "Logical thinking, first principles, problem decomposition")

Quick presets (click to auto-fill):
├── [Engineering]    → 25 / 25 / 20 / 15 / 15
├── [Product]        → 15 / 10 / 25 / 25 / 25
├── [Design]         → 15 / 20 / 25 / 20 / 20
└── [Operations]     → 20 / 15 / 25 / 20 / 20

Running total: "Total: 95% — must equal 100%" (red if ≠ 100, green if = 100)

[← Back]  [Next →] (disabled if total ≠ 100%)
```

**Weight conversion:** UI shows percentages. Before sending to API, multiply by 100 to get basis points. e.g. 25% → 2500.

### Step 4: Reviewers & Deadline

```
Add reviewers:
├── Search teammates input (GET /api/candidates is for candidates, you need a team members endpoint)
│   → GET /api/profile/team (new route to add — see below)
│   → Shows name + email, searchable
│   → Each reviewer shows wallet_status — warn if "pending" (rare but possible)
├── On select: add to reviewer list below
└── Minimum 2 required, maximum 20

Reviewer list:
└── Each added reviewer:
    ├── Avatar + name
    ├── [Remove] button
    └── Wallet status indicator (green check or amber "wallet pending")

Deadline:
├── Date + time picker
└── Quick options: [3 days] [5 days] [1 week] [2 weeks]

Auto-advance rules (optional, collapsible):
├── Toggle: "Auto-advance or reject based on final score"
├── Pass threshold: ≥ [  ]% advance → action dropdown (Next round / Send offer)
├── Fail threshold: ≤ [  ]% reject → action dropdown (Send rejection)
└── Note: "Thresholds are compared against the weighted average score"

Note on threshold conversion: UI takes 0-100 percentage.
API needs 0-100,000 basis points. Multiply by 1000. e.g. 75% → 75000.

[← Back]  [Next →]
```

**New API route needed:**
```typescript
// app/api/profile/team/route.ts
// GET: return all profiles in the same company/workspace
// For hackathon: return all profiles except the current user
// Use requireSession() to get userId, createAdminClient() to query profiles
```

### Step 5: Review & Launch

```
Summary card:
├── Candidate: [name or candidateRef]
├── Role: [role title]
├── Reviewers: [N] people listed
├── Weights: visual percentage bars for each category
├── Deadline: [formatted date]
└── Auto-advance: enabled/disabled summary

Pricing/gas note: "Creating a review uses a small amount of Sepolia ETH for gas.
This is handled automatically — you don't need to do anything."

[← Back]  [Create review]

On click [Create review]:
├── Show loading state: "Creating review on-chain..."
├── POST /api/reviews
│   Body: { candidateId, role, reviewerProfileIds[], deadlineAt, categoryWeights, autoAdvanceRule? }
│
├── Loading stages to show (poll or just show sequence):
│   "Encrypting review data..."
│   "Broadcasting transaction..."
│   "Waiting for confirmation..." (this can take 15-30 seconds)
│   "✓ Review created"
│
├── On success → redirect to /reviews/[id]
└── On error → show error message with retry button
    Common errors:
    - 409 "Reviewer wallet not ready" → tell them to wait a moment and retry
    - 409 "Your wallet is still being set up" → same
    - 502 → "Blockchain transaction failed. Check your internet and try again."
```

---

## Page 4: Review Detail — `/reviews/[id]`

**Who sees it:** Admin only.  
**Data:** `GET /api/reviews/[id]` — returns review + `review_reviewers` array.

```
Header card:
├── Role title (large)
├── Candidate ref (smaller, muted)
├── Status badge
├── Round number badge (if > 1: "Round 2")
└── Deadline countdown (CountdownTimer component)

Three tabs: Overview | Activity | Settings

═══ TAB 1: Overview ═══

Reviewer progress section:
Heading: "Reviewer submissions"

For each reviewer in review_reviewers (where is_active = true):
├── Avatar circle (initials)
├── Name (fetch from profiles by reviewer_id)
├── Status:
│   ├── has_submitted = true → "Submitted ✓" (green) + timestamp ("2 hours ago")
│   └── has_submitted = false → "Pending..." (gray) + [Send reminder] button
│
└── Replaced reviewer (is_active = false):
    Show as strikethrough + "Replaced" badge

Progress bar: submitted_count / reviewer_count

Reveal section (shown only when all submitted OR deadline passed):
├── If all submitted:
│   Green banner: "All N reviewers have submitted. Ready to reveal."
│   [Reveal results] button
│
├── If deadline passed with partial submissions:
│   Amber banner: "Deadline passed with N/M submissions."
│   [Reveal with partial results] button (same endpoint, contract allows it)
│
└── Reveal button behavior:
    Click → POST /api/reviews/[id]/reveal
    Show loading: "Requesting decryption..." → "Decrypting scores..." → "Storing results..."
    Note: This can take 30-90 seconds (Gateway round-trip)
    Poll GET /api/reviews/[id] every 5 seconds until status = "revealed"
    On revealed → redirect to /reviews/[id]/results

Quick actions row (top right of page):
├── [Send reminder to all] → POST /api/reviews/[id]/remind (new route — see below)
├── [Extend deadline] → modal → POST /api/reviews/[id]/extend-deadline
│   Body: { newDeadlineAt: ISO string }
│   Note: can only extend once (extension_used flag)
├── [Replace reviewer] → modal → select old reviewer → search new → POST /api/reviews/[id]/replace-reviewer
│   Body: { oldReviewerProfileId, newReviewerProfileId }
└── [Cancel review] → confirm modal → POST /api/reviews/[id]/cancel

═══ TAB 2: Activity ═══

Fetch: GET /api/reviews/[id]/events (new route — see below)
Returns: review_events rows ordered by created_at desc

Show as chronological feed:
├── Icon per event type
├── Human-readable message:
│   ReviewCreated → "Review created on-chain"
│   ScoreSubmitted → "A reviewer submitted their score"  (never say which reviewer)
│   DeadlineExtended → "Deadline extended to [new date]"
│   ReviewerReplaced → "A reviewer was replaced"
│   RevealRequested → "Reveal requested"
│   Revealed → "Results revealed"
│   ReviewCancelled → "Review was cancelled"
│   AutoAdvanceTriggered → "Auto-advance triggered: [action label]"
└── Timestamp + Etherscan link for tx_hash (format: "View on Etherscan ↗")

═══ TAB 3: Settings ═══

Review configuration (read-only display + edit options):
├── Role title (editable inline — PATCH /api/reviews/[id])
├── Category weights (read-only after launch — cannot change once on-chain)
├── Auto-advance rules (editable — PATCH /api/reviews/[id])
└── Danger zone:
    [Cancel review] — disabled if status ≠ active
```

**New API routes needed:**
```typescript
// app/api/reviews/[id]/remind/route.ts
// POST: send reminders to all pending reviewers
// Body: { message?: string }
// → Query review_reviewers where has_submitted = false
// → Create notifications for each: { type: "reminder", title: "Reminder: ...", reviewId }
// → Later: wire up Resend email here

// app/api/reviews/[id]/events/route.ts
// GET: return review_events for this review, ordered desc
// requireReviewAdmin check

// PATCH /api/reviews/[id]/route.ts — add PATCH to existing route
// Body: { role?, autoAdvanceRule? }
// requireReviewAdmin check
```

---

## Page 5: Results Page — `/reviews/[id]/results`

**Who sees it:** Admin (full view). Reviewers get a limited version — see Page 9.  
**Data:** `GET /api/reviews/[id]/results`

The `results` service returns:
```typescript
{
  reviewerCount: number,
  categories: [{ category, sum, sumOfSquares, average, stdDev }],
  weightedScoreRaw: number,       // 0-100,000
  weightedAverageOutOf10: number, // 0-10 (already divided)
  tags: [{ bit, polarity, label, count }],
  revealedAt: string,
  revealTxHash: string
}
```

```
Score hero (top section):
├── Large circular gauge (Recharts RadialBar or SVG arc)
│   Shows: weightedAverageOutOf10 formatted to 1 decimal (e.g. "7.4")
│   Color:
│   ├── ≥ 7.5 → green
│   ├── 5.0 - 7.4 → amber
│   └── < 5.0 → red
│
├── Panel confidence badge (derived from stdDev values):
│   Compute: mean of all 5 category stdDevs
│   ├── mean < 1.0 → "High confidence" (green)
│   ├── mean < 2.0 → "Moderate agreement" (amber)
│   └── mean ≥ 2.0 → "Split panel — consider a tie-breaker interview" (red)
│
└── Meta: "Based on N reviewers · Revealed [date]"

Category breakdown (horizontal bars):
For each category:
├── Category name (left)
├── Horizontal bar (proportional to average out of 10)
├── Average value at end: "7.8"
└── Small std dev indicator: "±1.2" (shows panel disagreement per category)

Sorted by average descending — highest first.
Highlight: "Strongest: [Category]" / "Most variable: [Category]"

Signal tags section:
Two columns:
├── Positive signals (green badges with counts):
│   Filter tags where polarity === "positive" AND count > 0
│   e.g. "3× Strong first-principles" "2× Excellent communicator"
│
└── Negative signals (red badges with counts):
    Filter tags where polarity === "negative" AND count > 0
    e.g. "2× Struggled under pressure"

Decision actions:
Three buttons:
├── [Advance to next stage]
│   → Modal: "This will create a new review round for the same candidate"
│   → POST /api/candidates/[candidateId]/rounds (create round 2)
│   → Actually: POST /api/reviews with same candidateId, new reviewers, new deadline
│
├── [Send offer] (if passAction = SendOffer and triggered, or manual)
│   → Placeholder for now — log intent to notifications
│
└── [Archive (not moving forward)]
    → PATCH /api/reviews/[id] { status: "archived" } — add archived to status enum

Blockchain proof (collapsible "Verify integrity" section):
├── Review created: [tx_hash] [Etherscan ↗]
├── [N] score submissions: [timestamp] each, [tx_hash] (from review_score_submissions table)
├── Reveal requested: [request_tx_hash] [Etherscan ↗]
└── Results finalized: [finalize_tx_hash] [Etherscan ↗]

Statement: "Individual scores were encrypted on-chain and never readable by
any party. Only the aggregate totals were decrypted by Zama's Gateway."
```

---

## Page 6: Reviewer Invite Page — `/invite/[token]`

**Who sees it:** Reviewers who click their invite link. Public route — no auth required to view, but auth required to accept.

**What is the "token"?** The `review_reviewers.id` UUID. This is the invite token. Store this in the invite email URL.

**Data:** `GET /api/invite/[token]` — new route needed.

```
GET /api/invite/[token]:
└── Query: SELECT review_reviewers.*, reviews.role, reviews.deadline, reviews.reviewer_count
    FROM review_reviewers
    JOIN reviews ON review_reviewers.review_id = reviews.id
    WHERE review_reviewers.id = [token]
    AND review_reviewers.is_active = true
    → Return: { role, deadline, totalReviewers, reviewId, alreadySubmitted }
    → Public route — no auth needed (token is the auth)
```

**Page layout:**
```
Company header: "Probely" logo

Context card:
├── "You've been invited to review"
├── Role: "[Role title]"
├── Deadline: "Submit by [date]"
└── "You're one of N reviewers"

How it works (3 bullets):
├── "Your score is encrypted before it leaves your browser"
├── "No one can see individual scores — only the final average"
└── "You'll receive the result once all reviewers have submitted"

Categories preview:
"You'll score this candidate across:"
└── Problem solving · Technical depth · Communication · Collaboration · Culture & growth

If alreadySubmitted = true:
└── Show: "You've already submitted your score for this review. Thank you."

If not submitted:
└── Two buttons:
    ├── [Accept and score →]
    │   → If logged in: redirect to /scorecard/[token]
    │   → If not logged in: redirect to /login?next=/scorecard/[token]
    │   → NOTE: After login, the ?next redirect must take them to the scorecard
    │
    └── [I have a conflict of interest]
        → Small modal: "Reason (optional)" textarea + [Confirm decline]
        → POST /api/invite/[token]/decline { reason? }
        → Updates review_reviewers.is_active = false (or add a declined flag)
        → Shows: "Declined. The review admin has been notified."
```

**New API routes:**
```typescript
// app/api/invite/[token]/route.ts
// GET: public route, returns invite context
// token = review_reviewers.id

// app/api/invite/[token]/decline/route.ts
// POST: mark reviewer as declined
// Body: { reason?: string }
```

---

## Page 7: Scorecard — `/scorecard/[token]`

**The most important page. Polish this more than anything else.**  
**token** = `review_reviewers.id`  
**Auth required.** After login, user must be the reviewer who owns this token.

**Data to fetch on load:**
```
GET /api/scorecard/[token]
→ Returns: {
    reviewId, role, deadline, interviewDate?,
    notesForReviewers?,    // from create review step 2
    categoryWeights,       // to show which categories and their weights
    alreadySubmitted: boolean
  }
  If alreadySubmitted = true → show post-submit confirmation screen instead
```

**New API route:**
```typescript
// app/api/scorecard/[token]/route.ts
// GET: validate token belongs to logged-in user, return review context (blind view only)
// Check: review_reviewers.reviewer_id === authenticated user's profile id
// If mismatch → 403 "This scorecard belongs to a different account"

// POST: store off-chain data after submission confirmed by service
// Body: { txHash, qualitativeNotes, categoryNotes, gutReaction, positiveTags, negativeTags }
// → Store in review_reviewers row (add columns) or a separate table
```

**Page layout (distraction-free, no sidebar):**
```
Top bar (minimal):
├── Probely logo (small, left)
├── "Confidential review — submit before [deadline]" (center)
└── Countdown timer (right, red if < 24h)

Context panel:
├── Role: "Senior Backend Engineer"
├── Deadline: [formatted]
└── Notes from admin (if any): shown as a light info card

Gut reaction (before scoring — helps calibrate):
Label: "Before you start, your overall reaction to this candidate is:"
Five segmented buttons: [Strong yes] [Leaning yes] [Neutral] [Leaning no] [Strong no]
Note: This is stored locally and NOT submitted to the blockchain.
      It's just a calibration tool shown only to the reviewer.

Scoring section — one block per category (5 total):
For each category in categoryWeights:
├── Category name + weight badge ("Problem Solving — 25%")
├── Description (from a lookup table — see below)
├── Score slider: 1-10
│   Labels at key points: 1="Far below" 5="Meets expectations" 10="Exceptional"
│   Current value shown numerically next to slider
└── Observation prompt (optional textarea, 2 rows):
    Placeholder: "What specifically did you observe? (optional)"

Category descriptions lookup table (hardcode in UI):
{
  problemSolving: "Assess logical thinking, ability to break down complex problems, and approach to ambiguous situations",
  technicalDepth: "Depth of technical knowledge, ability to explain trade-offs, performance on technical questions",
  communication: "Clarity of expression, active listening, ability to explain complex ideas simply",
  collaboration: "Evidence of team orientation, handling disagreement, support for others",
  cultureGrowth: "Alignment with company values, curiosity, learning mindset, growth potential"
}

Signal tags:
Label: "Quick signals (select all that apply)"

Positive (green, multi-select checkboxes styled as tags):
Pulled from REVIEW_TAGS in lib/contracts/constants.ts where polarity = "positive":
- bit 0: "Strong first-principles"
- bit 1: "Excellent communicator"  
- bit 2: "Growth trajectory"
- bit 3: "Handled ambiguity well"

Negative (red):
- bit 4: "Vague on technicals"
- bit 5: "Seemed disengaged"
- bit 6: "Struggled under pressure"
- bit 7: "Rehearsed answers"

Store selected bits as array of bit indices → will be encoded to tagMask before submission.

Qualitative notes (required):
├── Label: "Overall observations (minimum 50 words)"
├── Textarea, tall (6 rows)
├── Prompts as placeholder text:
│   "What stood out positively?"
│   "Any concerns?"
│   "How did they compare to others you've seen for this role?"
└── Word count: "34 / 50 minimum" → turns green at 50

Score preview card (sticky bottom or just before submit button):
├── Shows each category score the reviewer entered
├── Shows weighted average: "Your weighted score: 7.2/10"
│   Compute: Σ(score_i × weight_i) / 10,000
└── Warning: "Once submitted, your score cannot be changed"

Submit button: [Submit my score]
├── Disabled until: all 5 categories scored + qualitative notes ≥ 50 words
├── On click:
│   Step 1: Validate locally
│   Step 2: POST /api/reviews/[id]/submit-score
│            Body: { scores: { problemSolving, technicalDepth, communication, collaboration, cultureGrowth },
│                   selectedTagBits: number[] }
│            This endpoint handles encryption + blockchain tx server-side
│   Step 3: Show loading states:
│           "Encrypting your scores..." (~1-2 seconds)
│           "Submitting to blockchain..." (~15-30 seconds for Sepolia)
│           "Confirming..." 
│   Step 4: On 200 response → store qualitative notes:
│            POST /api/scorecard/[token] { txHash, qualitativeNotes, categoryNotes, gutReaction, positiveTags, negativeTags }
│   Step 5: Show confirmation screen (replace entire page content)
│
└── On error:
    409 "Already submitted" → show "You've already submitted"
    409 "Deadline passed" → show "The deadline has passed — contact HR"
    403 "Not authorized" → show "This scorecard is not assigned to your account"
    502 → "Submission failed. Please try again." + retry button

Post-submit confirmation screen:
├── Large green checkmark animation
├── "Your score is sealed."
├── "It cannot be changed or read by anyone — including us."
├── Etherscan link: "View your submission on Etherscan ↗" (txHash from response)
├── "The result will be shared once all reviewers have submitted."
└── [Close] button (or just leave on this screen)
```

---

## Page 8: Reviewer Inbox — `/inbox`

**Who sees it:** Reviewers. Redirect admins to `/dashboard`.**

**Data:**
```
GET /api/reviews/mine
→ Returns review_reviewers rows joined with reviews, where reviewer_id = current user
→ Split into: pending (has_submitted = false, status = active) vs completed
```

```
Header: "My reviews"

Pending section (shown first):
If none: "You're all caught up — no pending reviews"
Each card:
├── Role title
├── "Deadline in [countdown]" — red if < 24h
├── "N of M reviewers have submitted" (submitted_count / reviewer_count)
├── Status: "Waiting for you" badge (amber)
└── [Open scorecard →] → /scorecard/[review_reviewers.id]

Completed section:
Each card:
├── Role title
├── "Submitted [relative date]"
├── Status:
│   ├── review.status = "active" → "Awaiting other reviewers"
│   ├── review.status = "reveal_requested" → "Decrypting results..."
│   └── review.status = "revealed" → "Result available" [See result →]
└── [See result] → /reviews/[id]/results (reviewer-limited view)
```

---

## Page 9: Reviewer Results View

**Reuse the results page** at `/reviews/[id]/results` but show a limited version based on whether the viewer is the admin or a reviewer.

**Detection logic:**
```typescript
// In the results page, after fetching results:
const isAdmin = review.admin_id === currentUser.id;
// If not admin, check if they're a reviewer:
const isReviewer = review_reviewers.some(r => r.reviewer_id === currentUser.id && r.is_active);
// Redirect to 403 if neither
```

**Reviewer sees (subset of admin view):**
```
├── Final weighted average (same gauge)
├── Category breakdown (same bars)
├── Signal tags summary (same)
└── Statement: "Individual scores from all reviewers remain private.
    You're seeing only the panel average."

Reviewer does NOT see:
├── Decision action buttons (Advance / Archive / Send offer)
├── Full activity log
├── Settings tab
└── Blockchain proof section (keep it simple for reviewers)
```

---

## Page 10: Analytics — `/analytics`

**Who sees it:** Admin only. Lower priority — build this last.**

```
Date range filter: [Last 30 days ▾]

Row 1: Stats (4 metric cards)
├── Total reviews completed (status = revealed, in range)
├── Average score (mean weighted_average_out_of_10 across revealed reviews)
├── Avg days to reveal (createdAt to revealedAt, in range)
└── Panel split rate (% of reviews where mean stdDev > 2.0)

Row 2: Reviews over time
Line chart (Recharts LineChart):
└── X: week, Y: count — two lines: Reviews created, Reviews revealed

Row 3: Category averages
Horizontal bar chart:
└── For each of 5 categories: avg across all revealed reviews

Row 4: Score distribution
Histogram (bar chart):
└── X: score range (0-2, 2-4, 4-6, 6-8, 8-10), Y: count of reviews
    Visualises whether scoring is skewed or balanced

Data source: GET /api/reviews + GET /api/reviews/[id]/results for each
For hackathon: fetch all reviews, compute aggregates client-side (N is small)
```

---

## Page 11: Team Management — `/settings/team`

```
Header: "Team"

Member list (GET /api/profile/team):
Table columns: Name | Email | Role | Reviews participated | Joined
├── Role badge: Admin / Reviewer (click to toggle — PATCH /api/profile/[id]/role, new route)
└── [Remove] button (soft delete from team — for hackathon, just note as future feature)

Invite section:
├── Email input + [Invite] button
│   → POST /api/invitations (new route — sends email, creates pending record)
│   → For hackathon scope: create the profile record directly if email already has an account
│   → Display "Invite sent to [email]"
└── Pending invites shown below (greyed out)
```

---

## Page 12: Landing Page Additions — `/`

The landing page (`app/page.tsx`) is mostly built (hero, navbar, FlowmapBackground, LogoTicker, UnifyFinancesSection, pricing section). 

**Add these sections below what exists:**

```
Section: How it works
Three-step horizontal layout:
├── 1. Create a review — Set up the candidate, pick reviewers, set a deadline
├── 2. Score privately — Each interviewer submits encrypted feedback
└── 3. Results revealed — Cryptographically proven average, no individual bias

Section: Why FHE matters (the privacy guarantee)
Two-column:
├── Left: "Normal tools: anonymity is a promise" — admin sees all scores
└── Right: "Probely: privacy is a proof" — even we can't see individual scores
    "Powered by Zama FHEVM" badge

Section: Built on blockchain
Simple stat row:
├── Live counter: "X reviews completed on-chain" (GET /api/stats → count revealed reviews)
├── "All results verifiable on Etherscan"
└── Sepolia testnet badge (for hackathon — swap to mainnet when ready)
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# Privy (server-side only — never prefix with NEXT_PUBLIC_)
PRIVY_APP_ID=...
PRIVY_APP_SECRET=...
PRIVY_OPERATOR_WALLET_ID=...      # optional — pins the operator wallet
PRIVY_OPERATOR_WALLET_ADDRESS=... # optional — pins the operator wallet

# Blockchain
CONTRACT_ADDRESS=0x...            # deployed BlindReview contract on Sepolia
SEPOLIA_RPC_URL=https://...       # Alchemy or Infura Sepolia endpoint
CONTRACT_DEPLOY_BLOCK=...         # block number of deployment (for chain sync)

# Gas drip (optional — defaults built into walletFunding.ts)
GAS_DRIP_AMOUNT_ETH=0.02
GAS_TOP_UP_THRESHOLD_ETH=0.005

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Component Reference

Build these reusable components (don't reinvent per page):

```
components/ui/
├── CountdownTimer.tsx    — shows "3d 4h 12m" with color urgency
├── StatusBadge.tsx       — colored pill for review status
├── MetricCard.tsx        — stat display (number + label)
├── ProgressDots.tsx      — reviewer submission progress (filled/empty dots)
└── EtherscanLink.tsx     — formats tx hash + external link

components/review/
├── ReviewTable.tsx        — the dashboard table (sortable, filterable)
├── ReviewerList.tsx       — reviewer progress list with status icons
├── RevealButton.tsx       — full reveal flow (loading states, polling)
└── ScoreGauge.tsx         — circular score display (Recharts RadialBar)

components/scorecard/
├── CategorySlider.tsx     — single category input (slider + notes textarea)
├── TagSelector.tsx        — positive/negative tag multi-select
└── ScorePreview.tsx       — summary card shown before submit

components/layout/
├── Sidebar.tsx            — admin nav sidebar
└── PageHeader.tsx         — page title + breadcrumb
```

---

## Build Order

Build in this exact sequence. Each phase is testable before moving forward.

### Phase 1 — Navigation skeleton (Day 1 morning)
1. Create `components/layout/Sidebar.tsx` with all nav links
2. Create `/dashboard` shell page with sidebar layout
3. Create `/inbox` shell page
4. Wire role-based redirect: admin → /dashboard, reviewer → /inbox
5. Add `/onboarding` page + PATCH /api/profile route

**Test:** Signup → onboarding → dashboard or inbox based on role.

### Phase 2 — Dashboard + Review list (Day 1 afternoon)
1. Build ReviewTable component
2. Connect to GET /api/reviews
3. Build StatusBadge, CountdownTimer, ProgressDots components
4. Build the 4 metric cards (derive from reviews array client-side for now)
5. Build create review wizard Steps 1-5

**Test:** See review list. Create a review through the full wizard. Verify it appears in the list.

### Phase 3 — Scorecard (Day 2 — most critical)
1. Build `/invite/[token]` page + GET /api/invite/[token] route
2. Build `/scorecard/[token]` page
3. Build CategorySlider, TagSelector, ScorePreview components
4. Wire submit → POST /api/reviews/[id]/submit-score
5. Build post-submit confirmation screen
6. Wire qualitative notes storage → POST /api/scorecard/[token]

**Test:** Full flow — admin creates review → reviewer clicks invite link → fills scorecard → submits → admin sees "1/N submitted" on review detail.

### Phase 4 — Reveal + Results (Day 2 afternoon / Day 3)
1. Build review detail page `/reviews/[id]` with tabs
2. Build RevealButton with polling logic
3. Build results page `/reviews/[id]/results`
4. Build ScoreGauge, category breakdown bars, tag summary
5. Wire reviewer-limited view detection

**Test:** All reviewers submit → admin clicks reveal → wait for Gateway → results page shows score, categories, tags, blockchain proof.

### Phase 5 — Polish + Analytics (Day 3)
1. Reviewer inbox `/inbox` — full implementation
2. Analytics page `/analytics` — basic charts
3. Team management `/settings/team`
4. Landing page additions (How it works, privacy guarantee sections)
5. Notifications bell in sidebar

### Phase 6 — Demo prep
1. Pre-create a test company with 2 reviewers in Supabase
2. Write the demo script (see below)
3. Seed a review that's "Ready to reveal" for the live demo

---

## Demo Script (For Hackathon Presentation)

**Setup before presenting:**
- Two browser windows open, both logged in as different users (admin + reviewer 1)
- Incognito window ready for reviewer 2
- A review in "active" state with 1 of 2 submissions already done

**Live walkthrough (~5 minutes):**

1. Open Etherscan → show the contract → show `ScoreSubmitted` events → point out: all values are ciphertext blobs, completely unreadable. That's the proof.

2. Window 2 (Reviewer 1) — open scorecard, fill in scores (8, 7, 9, 6, 8), add some notes, select two signal tags, click Submit. Show the loading states. Show the Etherscan confirmation link.

3. Window 1 (Admin) — dashboard now shows "2/2 submitted." Click Review detail. Show the reviewer list — both green checkmarks, no scores visible anywhere.

4. Click [Reveal results]. Show "Decrypting..." loading state. Wait 30-60 seconds.

5. Results page appears. Show the gauge (e.g. 7.6/10). Show category breakdown. Show signal tags. Click "Verify integrity" → show each Etherscan link → everything on-chain, cryptographically verified.

6. Final line: "This is the only hiring tool where the privacy guarantee isn't a policy. It's a proof."

---

*All pages above connect to existing API routes. New routes needed: PATCH /api/profile, GET /api/profile/team, GET /api/invite/[token], POST /api/invite/[token]/decline, GET /api/scorecard/[token], POST /api/scorecard/[token], GET /api/reviews/[id]/events, POST /api/reviews/[id]/remind.*