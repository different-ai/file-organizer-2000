# First-run activation plan

Status: Phase 1 implemented and tried in a demo vault (see the PR that adds this file). Phases 0, 2 and 3 not started. Written 2026-10-17.

## Why

Findings from the one-month obsidianthemes.com sponsorship review (Sep 18 to Oct 17, 2026), PostHog, Stripe and the plugin code:

- Plugin downloads are about 700 a month (stats repo: `data/monthly.csv`) and about 1 in 100 downloads becomes a subscription. The sponsorship's 45 visitors cannot move that.
- Of about 100 subscriptions created since late January: about 21 still active or trialing, 39 cancelled during the 7-day trial, 16 failed the first charge, 21 cancelled after the trial. About 55% never pay. Cancellation feedback: 20 "unused", 18 "other", 11 "too expensive".
- Dunning is already handled in Stripe, so payment retries are out of scope.
- The first-run experience in the plugin leads straight to an error (details below). Verified by reading code only; the plugin has not been run for this plan.

## What a new user sees today (code references)

1. Nothing opens on install. `onload` in `packages/plugin/index.ts` registers views and commands only.
2. The ribbon icon (`handlers/commandHandlers.ts:11`) opens the organizer. With no key it shows "License key error: Invalid license key" (`views/assistant/organizer/components/license-validator.tsx`).
3. Settings says "Enter your license key" with no way to get one (`views/settings/general-tab.tsx:198`). The sign-up/sign-in form is further down (`views/settings/account-data.tsx`).
4. `OnboardingWizard` (`views/assistant/dashboard/onboarding-wizard.tsx`) exists but only appears through the "Open dashboard" command. The dashboard it sits in has placeholder content.
5. New accounts get a "Free Plan": 100,000 tokens, 0 audio minutes, marked active (`packages/web/drizzle/schema.ts:121`). The monthly reset skips them (`app/api/cron/reset-tokens/route.ts`), so it is a one-time allowance. Nothing in the plugin or on the site says so.
6. Cancelling sets subscription and payment status to `canceled` and billing cycle to `none` (`webhook/handlers/subscription-canceled.ts`), and the API throws "Subscription inactive" (403) for inactive accounts. A lapsed trial user probably loses access (inferred, not tested).

## Goal

A new user gets from install to one organized note in the first session, knowing they have free usage, and is offered the trial only after seeing value.

Success measures (first 30 days after release):
- Share of installs that sign up (accounts created per 100 downloads).
- Share of accounts that activate (tokens used above 0).
- Trial starts per 100 downloads (baseline about 1).
- Share of trials that reach a paid first charge (baseline about 45%).

## Decisions

1. **Cancelled or failed subscriptions:** keep them on the free plan instead of locking them out. Because the free allowance is one-time, a fallback only helps users who still have tokens, so first count cancelled users with tokens left. Minimum version: replace "Subscription inactive" with a clear "Your subscription ended, resume here" message linking to `/onboarding`, with no access change.
2. **Free allowance:** stays a one-time 100K tokens. No monthly reset (it would need new billing states for little gain).
3. **Trial start:** stays on the web `/onboarding` page. The plugin sends users there at the right moments (after the first organized note, or when free usage runs low) with a direct link. No in-plugin checkout.
4. **Stale tier config:** the seed says `paid` is 1M tokens (`packages/web/drizzle/schema.ts`), but the reset job and checkout handler use 5M. The seed only inserts when the table is empty, and only `app/api/token-usage/route.ts` reads it. Update the seed to 5M and check the live `tier_config` row. Low risk.

## Phases

### Phase 0: Measure first (small), server-side only
Obsidian's developer policies prohibit client-side telemetry in directory plugins (https://docs.obsidian.md/Community+directory/Developer+policies), and the plugin has none today. Server-side telemetry is allowed if disclosed with a privacy policy link. So measure from the server, not the plugin:
- Funnel from data the server already has: accounts created (`/api/sign-up`, `/api/sign-in`, Clerk), license key checks (`/api/check-key`), activation = accounts with `tokenUsage > 0` in `UserUsageTable`, trial starts and conversions from Stripe.
- Send PostHog server-side events (posthog-node is already in `packages/web`) from those routes. Use user ids only, never vault content. Check the privacy policy covers it.
- Track `accounts.notecompanion.ai` sign-up completion, which PostHog cannot see now.
- Record baselines first: installs (stats repo), signed-up, activated (tokens used), trial started, first charge paid.

### Phase 1: Fix the first screen (core change)
- Open the onboarding wizard automatically on first load when `hasRunOnboarding` is false and there is no API key. Wire it from `onload` after layout is ready.
- Replace the "License key error" first impression: with no key, the organizer panel shows a sign-in/sign-up prompt, not an error.
- Settings: put the sign-in/sign-up block above the license key box and add a "Get a key" link.
- Wizard copy: say plainly that free usage is included and the trial is optional later.
- Finish the wizard on a guided first action: organize one real note (or a sample note in `_NoteCompanion/Inbox`) so the user sees the result before leaving.
- Remove or hide the placeholder dashboard sections so the wizard does not lead into unfinished UI.

### Phase 2: Free allowance and upgrade moments
- Show remaining free usage in the organizer panel from the first session, not only at 80%.
- Offer the trial when the free allowance is nearly used or after the first successful organize, with a direct link to `/onboarding`.
- Implement decision 1 (resume message first; access change only after counting cancelled users with tokens left). Any API change must stay backward compatible with older plugin versions (see AGENTS.md, "API Backward Compatibility").

### Phase 3: Site and campaign
- Homepage FAQ: answer "Is there a free version?" clearly (two campaign visitors opened it).
- Decide on the uncommitted `/obsidian` landing page (packages/landing/app/(landing)/obsidian/page.tsx) and the navbar change that hides "Start" there. Keep them only if a sponsorship renewal goes ahead. They help install clicks, which are not the bottleneck.
- Sponsorship renewal (about USD 30): only after Phases 0 and 1 are live, with the same UTM and a decision rule written down in advance, for example fewer than 2 trials attributable to it means stop.

## Out of scope
- Dunning and payment retries (done in Stripe).
- Pricing changes.
- Mobile app.

## Risks
- Auto-opening a view on first load could annoy existing users: gate it on `hasRunOnboarding` false and no API key, and never reopen it after "Skip".
- Changing what cancelled users can do affects existing subscribers; ship the message-only version first.
- Plugin releases are not controllable per user; keep the server behavior compatible with old versions.
