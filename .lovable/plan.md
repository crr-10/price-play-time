

# Restrict Upgrade Duration Based on Remaining Days + Show Expiry on Plan List

## Overview

Two changes:
1. On the **Plan List page** (upgrade mode), show a banner: "Your [plan] plan expires on [date]" (matching the screenshot)
2. On the **Checkout page** (upgrade mode), filter the duration dropdown so users can only select durations >= their remaining time (rounded up to the next year ceiling)

## Duration Restriction Logic

```text
remainingDays = planEndDate - today
minYears = Math.ceil(remainingDays / 365)
```

- remaining <= 365 days (1yr) --> show 1yr and above
- remaining <= 730 days (2yr) --> show 2yr and above
- remaining <= 1095 days (3yr) --> show 3yr and above
- etc.

If the currently selected duration is below the minimum, auto-adjust it upward.

## Changes

### 1. Plan List Page (`src/pages/PlanListValidation.tsx`)

- Change the existing "auto renew" text (line 271) to match the production wording: **"Your [plan] plan expires on [date]"**
- Style it as a prominent banner above the plan cards (matching the screenshot -- centered, light background)

### 2. Checkout Page (`src/pages/CheckoutCalculator.tsx`)

- Calculate `minDuration` from remaining days of current plan:
  ```typescript
  const remainingDays = upgradeCreditResult?.remainingDays ?? 0;
  const minUpgradeYears = Math.max(1, Math.ceil(remainingDays / 365));
  ```
- Filter `DURATIONS` in the dropdown to only show durations where `DURATION_YEARS[d.key] >= minUpgradeYears`
- Add a `useEffect` to auto-adjust `duration` upward if the current selection falls below the minimum
- This only applies when `userType === "upgrade"`

### 3. Pricing Data (`src/lib/pricing-data.ts`)

No changes needed -- all required data (DURATION_YEARS, DURATIONS) already exists.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/PlanListValidation.tsx` | Update expiry banner text to "Your [plan] plan expires on [date]" |
| `src/pages/CheckoutCalculator.tsx` | Filter duration dropdown based on remaining days, auto-adjust selection |
