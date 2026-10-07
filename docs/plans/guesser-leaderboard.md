# Mapant Guesser accounts and leaderboard

## Scope and decisions

- `/guesser` becomes the public leaderboard and game landing page; move gameplay to `/guesser/game`. Keep the existing maps, checkpoints, five rounds, scoring curve, and French UI.
- Playing requires no account. After a completed game, offer signup with pseudonym and email or login with email. Both require a one-time email code before creating an authenticated session or publishing a score. Logged-in players' completed games are saved automatically.
- Keep all games and their rounds in D1, including anonymous and abandoned games. Only completed games attached to an account enter the leaderboard. A finished anonymous game can be claimed within 24 hours of completion.
- Rank each player's best game by total points descending, then total round time ascending. Exclude coverage searches and time between rounds. Exactly equal points and times share a rank; completion date and game ID provide stable display order. Never combine points from one game with time from another.
- Use 30-day sessions with fixed expiry from authentication. Email and pseudonym are unique. Account deletion, pseudonym moderation/verification, profile editing, daily challenges, and live leaderboard updates are outside this release.
- Server authority prevents fabricated totals, edited timers, replayed submissions, and client-selected targets. Target coordinates and tile requests remain inspectable with the current maps; preventing coordinate-based cheating is outside scope.

## 1. D1 and Drizzle foundation

- Add a D1 binding and types alongside the existing R2 binding. At implementation time, resolve the latest compatible v1 RC releases of `drizzle-orm` and `drizzle-kit`, pin exact versions, and commit the lockfile.
- Define the schema and indexes in server-only modules; use `drizzle-orm/d1` for application queries. Generate and commit SQL migrations with Drizzle Kit; apply them through Wrangler for local and production D1, using a single migration history. Verify the chosen RC's migration layout works with Wrangler before establishing scripts.
- Add commands for generation and explicit local/remote migration application. Keep development data separate from production; apply migrations before deploying code that requires them.

| Table             | Main contents and constraints                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`           | Random ID, display pseudonym, unique normalized pseudonym and email, verified/created timestamps.                                                  |
| `sessions`        | Hash of random session token, user ID, created/expiry timestamps; indexed expiry.                                                                  |
| `auth_challenges` | Browser-bound signup/login intent, normalized email, proposed pseudonym, keyed code digest, expiry, attempt count, consumption state.              |
| `guest_sessions`  | Hash of guest cookie token, created/expiry timestamps; owns anonymous games.                                                                       |
| `games`           | Guest/user ownership, status, scoring version, total points/time, created/completed/claim timestamps. Preserve guest provenance after claiming.    |
| `game_rounds`     | Game ID and unique round number, server target, start/deadline, submitted guess, server receipt time, result, elapsed milliseconds, submission ID. |
| `rate_limits`     | Expiring counters for authentication/email and game creation endpoints, keyed without retaining raw IP addresses.                                  |

Use foreign keys, score/range checks, unique constraints, and indexes for ownership, best-game queries, and expiry. Use D1-compatible atomic batches and conditional writes for game transitions, code consumption, and claims; do not assume interactive transactions. Explicitly handle zero-row conditional updates as conflicts, not success.

## 2. Server-managed games and timing

- Add server services and endpoints under `/api/guesser` for creating/resuming a game, starting its next round, submitting a guess, and claiming a finished game. Validate ownership, coordinates, round order, and completion on every mutation; protect writes against cross-origin requests.
- Move coverage selection to the server, reusing the France boundary and scoring helpers. In production, query the existing R2/PMTiles service directly rather than making HTTP requests back to the Worker. Retain an injectable local tile-server path for development.
- Prepare only the next round. Atomically persist its target and `startedAt` after coverage succeeds, immediately before returning it; `deadlineAt = startedAt + 300,000 ms`. Retries return the same active round and deadline. Failed coverage searches consume no playing time and preserve prior results.
- Return server time and the deadline for the UI countdown; client clocks never decide eligibility or ranking. A slow initial response consumes some round time; do not add a client-controlled start acknowledgement that could expose a target before timing begins.
- Lock guess editing and auto-submit the tentative guess at the visible five-minute deadline. Accept a first submission whose server receipt time is at or before `deadlineAt + 5,000 ms`. Capture receipt time at request entry, before database work. Ignore client-provided timestamps for validation.
- Record `elapsedMs = min(300,000, max(0, receivedAt - startedAt))`; sum round times for the game tie-breaker. Thus normal submission latency counts, grace-period submissions count as five minutes, and no-guess/expired rounds count as five minutes with zero points.
- The grace period intentionally permits up to five extra seconds for a modified client: the server cannot prove when an offline client sent a request. Do not reveal an unanswered round's result until submission or the grace period expires.
- Persist and score each round once, with server-computed distance and points. Exact submission retries return the saved result; conflicting submissions cannot replace it. Coordinate timeout finalization with submissions atomically, including concurrent tabs. On reads/next-round requests after the grace period, finalize unanswered rounds; no per-game background timer is required.
- Finish only after five finalized rounds. Prevent duplicate round starts, skipped rounds, ownership changes, and total-score overrides. Store a scoring version for future rule changes.

## 3. Browser recovery and ownership

- Issue a separate opaque, `HttpOnly` guest cookie for anonymous game ownership, valid for 30 days and renewed during active use. Local storage contains versioned game/round IDs, tentative guesses, and pending submission IDs/payloads; never authentication tokens, email codes, or authoritative results.
- Persist tentative guesses and queued submissions before sending. On reload, fetch the authoritative game using the cookie, reconcile the local draft, and retry pending submissions idempotently. Local storage is best-effort: blocked storage must not prevent playing.
- A refresh or hidden tab never pauses timing. If recovery occurs after the grace period without an accepted submission, that round scores zero; explain this rather than accepting backdated local data. Never reveal a locally calculated result while a server submission remains uncertain.
- Keep pending completed games through login/signup errors and refreshes. After verification, claim the selected game exactly once using both guest ownership and the new account session. A claim failure can be retried independently of authentication. Login alone does not silently claim every historical game on a shared device.
- Keep a started game's ownership fixed. If authentication occurs mid-game, claim that guest game on completion; do not attach it to whichever account happens to be signed in without validating its guest owner. On logout/account switch, clear local references to another user's private game and recheck access server-side.

## 4. Signup, login, and sessions

- Pseudonyms: trim and normalize Unicode (NFKC), allow 3–24 letters/numbers/spaces/underscores/hyphens, reject control characters, and enforce case-insensitive normalized uniqueness. Preserve the chosen display casing. This is input validation, not content moderation.
- Emails: validate, trim, and use a lowercase canonical value consistently for account uniqueness and login. Do not strip provider-specific dots or `+` suffixes. Enforce both uniqueness rules in D1, including concurrent signups.
- Send a cryptographically random six-digit code, valid for 10 minutes, with at most five verification attempts. Store an HMAC digest using a server secret and bind the challenge to a browser cookie. A resend invalidates the previous code and has a 60-second cooldown.
- Enforce bounded email sends per normalized address and IP, plus verification and account/game creation rate limits. Initial send limits: five per address/hour and twenty per IP/hour; make these configurable. Use generic pre-verification responses to limit email-account enumeration. Never log cookies; production logs must also exclude codes and full recipient addresses. Local development intentionally prints verification emails as described below.
- Create users only after successful code verification. A signup request for an existing email must authenticate through that mailbox and must not overwrite its pseudonym. If a proposed pseudonym becomes unavailable, retain a short-lived, browser-bound verified challenge so the user can choose another without restarting email verification.
- Atomically consume the challenge and create the user/session as applicable; simultaneous verification attempts cannot reuse it. Issue a high-entropy opaque session cookie (`Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, no domain) and store only its hash in D1. Use production `__Host-` cookie names and a documented local-development configuration.
- Resolve sessions in `src/hooks.server.ts`, expose only safe account fields to pages, and enforce expiry on every authenticated request. Provide logout that revokes the current session. Preserve `Cache-Control: no-store` for authentication, game state, and personalized pages.
- Use a small server-only email adapter with shared French plain-text/HTML templates. In local development, print the recipient, subject, and rendered plain-text body (including the verification code) to the development server console instead of calling Cloudflare Email Sending. Select this adapter explicitly through the local development environment; require no email binding, credentials, or service access locally. Keep code generation, persistence, expiry, verification, and rate limits identical so signup and login can be tested end to end using the printed code.
- In production, use Cloudflare Email Sending; the owner will configure the sending service/domain. Missing production email configuration must fail clearly rather than fall back to console output. Handle rejected sends, delivery delays, and resend errors without losing the game or claiming that a score was saved. Document where developers find locally printed emails.

## 5. Leaderboard and UI

- Server-render `/guesser` with game rules, a Play button, signup/login/logout controls, top 100 players, and the current user's rank even when outside that list. Display pseudonym, points, total playing time, and achievement date. Match displayed time precision to the milliseconds used for ranking.
- Query each user's best eligible game and rank those rows with deterministic ordering; add appropriate indexes and verify query performance with representative data. Keep all other game records without exposing their private ownership data publicly.
- At game completion, show the round summary, total time, and explicit saving/saved/error state. Anonymous players get optional signup/login; authenticated players get automatic saving and whether they achieved a personal best. Retry safely on network errors.
- Refresh the leaderboard after a successful write/claim so the user's score and rank appear immediately; start without leaderboard caching or read replicas. Provide usable empty/error states, accessible code entry, and mobile layouts.
- Clearly state that pseudonym and best score are public and email is used for authentication. Update site navigation, metadata, README, and `docs/mapant-guesser.md` for the new routes and server requirements.

## 6. Verification and rollout

- Unit-test scoring and tie-breaking, deadline/grace boundaries, elapsed-time clamping, canonicalization, and code/session expiry. Use integration tests against local D1 for migrations, atomic state transitions, duplicate/concurrent submissions, code reuse, uniqueness races, unauthorized access, one-time claims, and leaderboard selection.
- Exercise the complete guest game → signup → code → saved leaderboard flow and existing-account login locally using codes printed in the server console, with no email service configured. Verify local mode makes no email service calls and production cannot use the console adapter. Cover refreshes, blocked local storage, pending retries, background-tab expiry, lost connectivity, duplicate tabs, failed email sends, logout, and an expired session at game completion. Regression-check maps and checkpoints after moving the route.
- Run `npm run check`, `npm test -- --run`, `npm run build`, and formatting checks for changed files. Verify both an empty-database migration and an existing-database upgrade locally.
- Add scheduled cleanup for expired challenges, sessions, guest credentials, and rate-limit counters; retain games/rounds as requested. An anonymous game whose owner credential has expired remains stored but cannot be reclaimed through its public ID.
- Configure D1, email binding/sender, and the code-HMAC secret; apply production migrations, deploy, then smoke-test email delivery, cookie persistence, a full game, and immediate leaderboard visibility. Monitor game/auth errors and email failures without sensitive payloads.

## References

- [Drizzle with Cloudflare D1](https://orm.drizzle.team/docs/sqlite/connect-cloudflare-d1)
- [Cloudflare Email Sending setup](https://developers.cloudflare.com/email-service/get-started/send-emails/)
- [D1 database API and atomic batches](https://developers.cloudflare.com/d1/worker-api/d1-database/)
