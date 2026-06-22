# Plan: Add "Fresh — After 22 Jun 2026" pricing cohort

## Overview
Introduce the new catalog (Starter / Standard / Growth / Advanced) as a **4th cohort** alongside existing Fresh / Renewal-After / Renewal-Before. Old plan names (Silver/Diamond/Platinum/Enterprise) remain untouched for legacy cohorts. New cohort applies to users whose first purchase is on/after **22 Jun 2026**, and also to their future renewals.

## Cohort mapping
| New name | Maps to existing tier | Monthly | Yearly (ex-GST) |
|---|---|---|---|
| Starter  | Silver     | ₹199        | ₹1,990 |
| Standard | Diamond    | ₹349        | ₹3,490 |
| Growth   | Platinum   | ₹399        | ₹3,990 |
| Advanced | Enterprise | Not self-serve | Starts at ₹6,840/yr |

Internally we keep the 4 tier keys (`silver/diamond/platinum/enterprise`) and only swap **display name + price** when the active cohort is `fresh_v2_2026`.

## Rules
- Multi-year slabs, plan-level discount %, coupons, GST 18% — **identical** to current Fresh logic.
- Advanced reuses Enterprise customization (extra businesses, user slabs) on top of ₹6,840 base.
- Renewal of a `fresh_v2_2026` user → stays on the new catalog (a new "Renewal — v2" sub-cohort that mirrors the new prices, no separate price table needed since prices = fresh_v2).
- Upgrade credit calc unchanged; uses the cohort's own price table.

## Changes

### 1. `src/lib/pricing-data.ts`
- Add cohort key `fresh_v2_2026` to `ANNUAL_DISCOUNTED` and `PLANS_BY_TYPE` with new prices.
- Add `MONTHLY_PRICES_V2 = { silver:199, diamond:349, growth:399, enterprise:0 }` (or extend `MONTHLY_PRICES` keyed by cohort).
- Add `PLAN_DISPLAY_NAMES_V2 = { silver:"Starter", diamond:"Standard", platinum:"Growth", enterprise:"Advanced" }`.
- Add `NEW_CATALOG_CUTOFF = "2026-06-22"`.
- Update Enterprise base price for v2 cohort = ₹6,840 (keep customization add-ons same).

### 2. Cohort selector UI (Plan List + Calculator + QA)
- Extend the cohort dropdown / radio from 3 → 4 options: `Fresh`, `Fresh — After 22 Jun 2026 (new catalog)`, `Renewal After`, `Renewal Before`.
- When the new cohort is active, swap displayed plan names via a helper `getPlanDisplayName(plan, cohort)`.

### 3. `src/pages/PlanListValidation.tsx` & `src/pages/CheckoutCalculator.tsx`
- Read prices via existing `getAnnualPrice(plan, cohort)` — it'll just look up `fresh_v2_2026`.
- Use display-name helper in headings/cards.
- Advanced/Enterprise: continue showing customization UI, base swapped to ₹6,840.

### 4. `src/pages/PricingRules.tsx` (the summary page)
- Add the new cohort to:
  - Section 1 (User Cohorts) — add "Fresh — After 22 Jun 2026" row.
  - Section 2 (Annual Base Prices) — new column, plus a small note explaining the renamed plans.
  - Section 7 (Monthly Plans) — show new monthly prices alongside old.
- Replace the amber callout to also note: "Now also tracking a new Fresh cohort from 22 Jun 2026 with a renamed catalog — this further fragments backend pricing tables. Worth weighing against the legacy renewal split."

### 5. QA scenarios (`src/pages/QAChecklist.tsx`)
- Add a few pre-configured scenarios for the new cohort (Starter 1yr, Growth 3yr w/ multi-year, Advanced base + customization).

## Out of scope
- No changes to discount sequence, GST, coupon engine, or upgrade-credit formula.
- No date-based auto-cohort detection from a user's signup date — cohort remains a manual selector in the QA prototype.

Ready for your go-ahead.