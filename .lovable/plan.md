

# Fix: PPD Credit Based on Original Purchase Type

## Problem
The upgrade credit (PPD) calculation always uses the **Fresh** discounted price as the base for what the user originally paid. But if the user purchased their current plan as a **renewal** (after or before Feb 2024), they paid a higher price for Platinum (₹3,999 or ₹5,999) or Enterprise (₹5,999 or ₹8,999). This means the credit calculation underestimates what they're owed.

Silver and Diamond prices are identical across all cohorts, so this only matters for Platinum and Enterprise.

## Solution
Add a "Current Plan Purchase Type" selector in the upgrade flow's Current Plan Details card. It asks: **"How was this plan purchased?"** with options:
- First-time purchase (default) -- uses Fresh prices
- Renewal (after 16 Feb 2024) -- uses renewal_after prices
- Renewal (before 16 Feb 2024) -- uses renewal_before prices

This selector only appears when the current plan is **Platinum** or **Enterprise** (since Silver/Diamond prices don't vary).

The selected value is passed to `calculateUpgradeCredit` which uses the corresponding `ANNUAL_DISCOUNTED` tier.

## Technical Details

### `src/lib/pricing-data.ts`

Update `calculateUpgradeCredit` to accept a new optional parameter `currentPlanPurchaseType: UserType` (default `"fresh"`). Change line 227 from:
```
const annualDiscounted = ANNUAL_DISCOUNTED.fresh[currentPlan] + enterpriseAddon;
```
to:
```
const annualDiscounted = ANNUAL_DISCOUNTED[currentPlanPurchaseType][currentPlan] + enterpriseAddon;
```

### `src/pages/CheckoutCalculator.tsx`

1. Add state: `currentPlanPurchaseType` with type `UserType`, default `"fresh"`.

2. In the Current Plan Details card (upgrade section), after the current duration selector, add a "Plan Purchase Type" selector -- only visible when `currentPlan` is `"platinum"` or `"enterprise"`. Three radio options:
   - "First-time purchase" (fresh)
   - "Renewal (after 16 Feb 2024)" (renewal_after)  
   - "Renewal (before 16 Feb 2024)" (renewal_before)

3. Pass `currentPlanPurchaseType` to `calculateUpgradeCredit`.

4. In the PPD breakdown collapsible, show which purchase type is being used for the base price so QA can verify.

### `src/pages/QAChecklist.tsx`

Add a note in the PPD section mentioning that credit varies based on original purchase type, with example values for Platinum Fresh vs Renewal After.

### Files Changed

| File | Change |
|------|--------|
| `src/lib/pricing-data.ts` | Add `currentPlanPurchaseType` param to `calculateUpgradeCredit` |
| `src/pages/CheckoutCalculator.tsx` | Add purchase type selector in upgrade card, pass to credit calc |
| `src/pages/QAChecklist.tsx` | Add note about purchase type impact on PPD |

