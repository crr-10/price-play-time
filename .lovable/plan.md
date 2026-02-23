

# Add Silver Plan Across the Tool

## Overview
Add Silver as a full plan option visible everywhere (not just upgrade "current plan" dropdown). Silver is an Android-only plan with MRP 549 and discounted price 399, same across all user types.

## Silver Plan Data
- Annual MRP: 549
- Annual Discounted: 399
- Discount: ~27% (actual: 27.32%)
- Same price across Fresh, Renewal After, Renewal Before, and Upgrade cohorts
- Supports multi-year discounts like all other plans

## Changes

### 1. `src/lib/pricing-data.ts`
- Add `"silver"` to the `PlanName` type: `"silver" | "diamond" | "platinum" | "enterprise"`
- Add Silver to `PLAN_META`: name "Silver", discount ~27%, actual 27.32%
- Add Silver to all `ANNUAL_PRICES` entries (fresh, renewal_after, renewal_before): `{ mrp: 549, discounted: 399 }`
- Add Silver to `ANNUAL_DISCOUNTED` for all user types: 399
- Add Silver to `PLAN_DISCOUNTS`: 27
- Add Silver to `ACTUAL_PLAN_DISCOUNTS`: 27.32
- The `buildPlans`, `buildMrpTable`, and all Record types will automatically pick up Silver since they iterate over `PLAN_META` / `ANNUAL_PRICES`

### 2. `src/pages/PlanListValidation.tsx`
- Add Silver to `PLAN_BORDERS`: yellow/amber border
- Add Silver to `PLAN_BUTTON_STYLES`: matching color
- Add Silver to `PLAN_DESCRIPTIONS`: e.g. "Starter plan for individuals (Android only)"
- Add Silver to `PLAN_ORDER` array as the first entry (lowest tier)
- Add Silver as an option in the upgrade "Current Plan" dropdown (can upgrade from Silver)

### 3. `src/pages/CheckoutCalculator.tsx`
- Add Silver as an option in the plan selector dropdown
- Add Silver as an option in the upgrade "Current Plan" dropdown

## Technical Details

**Updated type:**
```text
PlanName = "silver" | "diamond" | "platinum" | "enterprise"
```

**Silver pricing entry (all user types):**
```text
silver: { mrp: 549, discounted: 399 }
```

**Discount calculation:**
```text
(549 - 399) / 549 = 27.32%
Displayed as: 27%
```

**Plan order for upgrade filtering:**
Silver < Diamond < Platinum < Enterprise

Silver will appear in plan cards, checkout calculator, and as a valid "current plan" for upgrade scenarios. Multi-year discounts (5%, 10%, 15%, 30%) apply the same way as other plans.

