

# Enterprise Plan: Business & User Customization

## Pricing Analysis (Back-Calculated from User Data)

The Enterprise base price (2 businesses, 3 users) varies by user type but addon costs are constant. The 44.45% discount rate stays fixed, so MRP scales proportionally.

```text
Enterprise Base (discounted, annual):
  Fresh:          4,999
  Renewal After:  5,999
  Renewal Before: 8,999

Additional Business Cost (discounted, per business):
  +1 business (3 total): +1,000
  +2 business (4 total): +2,000
  +3 business (5 total): +3,000
  6+ businesses: Contact Sales

Additional User Cost (discounted, slab-based):
  4 users:    +500
  5 users:    +1,000
  6-10 users: +2,000
  11-15 users:+5,000
  16+ users:  Contact Sales

Cross-check: 4 biz, 4 users (Fresh)
  = 4,999 + 2,000 + 500 = 7,499 (matches)
  MRP = 7,499 / 0.5555 = 13,500 (screenshot shows 14,400... let me re-check)
```

Wait -- the screenshot shows 5 businesses, 3 users = discounted 7,999, MRP 14,400.
MRP = 7,999 / (1 - 0.4445) = 7,999 / 0.5555 = 14,399.64 ~ 14,400. Confirmed.

For the base: 4,999 / 0.5555 = 8,999.1 ~ 8,999. Confirmed.

MRP formula: `Math.round(discountedTotal / (1 - 0.4445))`

## Changes

### 1. `src/lib/pricing-data.ts` -- Enterprise Addon Data & Helpers

Add enterprise configuration types and pricing constants:

```text
ENTERPRISE_BASE = { businesses: 2, users: 3 }
ENTERPRISE_EXTRA_BUSINESS_COST = 1000  (per additional business, discounted)
ENTERPRISE_MAX_BUSINESSES = 5  (6+ = contact sales)

ENTERPRISE_USER_SLAB_COSTS (discounted, cumulative addon from base 3 users):
  3 users:  0
  4 users:  500
  5 users:  1000
  6-10:     2000
  11-15:    5000
  16+:      contact sales

ENTERPRISE_MAX_USERS = 15  (16+ = contact sales)
```

Add helper function:
- `getEnterpriseAddon(businesses, users)` -- returns `{ addonCost, contactSales }` with the total addon on discounted price
- `getEnterpriseTotalDiscounted(userType, businesses, users)` -- returns base + addon
- `getEnterpriseMRP(discountedTotal)` -- returns `Math.round(discountedTotal / (1 - 0.4445))`

Modify `calculateBreakdown` to accept optional `enterpriseAddon` parameter (default 0). This addon is added to both the original MRP and the discounted price proportionally.

### 2. `src/pages/CheckoutCalculator.tsx` -- Business & User Selectors

Add state:
- `businesses` (default 2, min 2, max 5 for selectable; 6+ shows "Contact Sales")
- `users` (default 3, min 3; selectable values: 3, 4, 5, 6-10, 11-15; 16+ shows "Contact Sales")

UI (only shown when `plan === "enterprise"`):
- "Number of Businesses" row with -/+ stepper (like the screenshot), between Duration and Coupon sections
- "Number of Users" row with -/+ stepper
- When contact sales threshold is hit, show a message instead of price calculation
- The +/- buttons enforce min = base values (2 businesses, 3 users)

For **upgrades to Enterprise** or **Enterprise-to-Enterprise upgrades**:
- Allow Enterprise as a current plan option (it's currently missing from the selector)
- When current plan is Enterprise, show current businesses/users selectors in the Current Plan Details card
- New plan businesses/users must be >= current values (no downgrade)
- The - button is disabled when at the current plan's values

Price integration:
- Compute enterprise addon, pass to `calculateBreakdown` 
- The addon affects Original Price (MRP) and Price After Discount proportionally
- All downstream calculations (multi-year, coupon, GST) work on the new totals

### 3. `src/pages/PlanListValidation.tsx` -- Enterprise-to-Enterprise Upgrade

Currently the upgrade plan selector excludes "enterprise" as a current plan option, and the visible plans filter only shows plans with a higher index. Changes:
- Add "Enterprise" to the current plan dropdown
- When current plan is Enterprise, show Enterprise in the upgrade targets (enterprise-to-enterprise)
- Add businesses/users selectors in the upgrade config card for Enterprise current plans

### 4. `src/pages/QAChecklist.tsx` -- Enterprise Addon Test Cases

Add a new section "Enterprise Business & User Pricing" with:
- Table of expected addon costs per configuration
- Test scenarios: Fresh Enterprise 5 biz / 3 users = 7,999; 2 biz / 11-15 users = 9,999
- Upgrade scenario: Platinum to Enterprise with custom config
- Enterprise-to-Enterprise upgrade scenario

### 5. Upgrade Credit for Enterprise Current Plans

When the current plan is Enterprise with addons, the credit calculation needs the total discounted price (base + addons). Modify `calculateUpgradeCredit` to accept an optional `enterpriseAddon` parameter that gets added to the annual discounted price before computing PPD.

## User Slab Selection UX

For the user count, since slabs are ranges (6-10, 11-15), the selector works as:
- Values 3, 4, 5 are individual increments (+/- by 1)
- Clicking + from 5 jumps to "6-10" (displayed as a slab label)
- Clicking + from "6-10" jumps to "11-15"
- Clicking + from "11-15" shows "Contact Sales" state
- Clicking - from "6-10" goes back to 5

Similarly for businesses: individual increments 2-5, then "Contact Sales" at 6+.

## Contact Sales State

When either businesses or users hit the contact sales threshold:
- Price Details card shows "Contact Sales for Pricing" instead of calculated prices
- The "Make Payment" equivalent area shows a "Contact Sales" message
- The selectors still allow going back down

## File Summary

| File | Change |
|------|--------|
| `src/lib/pricing-data.ts` | Enterprise addon constants, helper functions, modified `calculateBreakdown` and `calculateUpgradeCredit` |
| `src/pages/CheckoutCalculator.tsx` | Business/user selectors, contact sales state, enterprise addon integration |
| `src/pages/PlanListValidation.tsx` | Enterprise as current plan option, enterprise-to-enterprise upgrades |
| `src/pages/QAChecklist.tsx` | Enterprise addon test cases section |

