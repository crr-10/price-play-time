

# Fix MRP Calculation: Back-Calculate from Discounted Price

## Problem
The tool stores hardcoded MRP values (e.g., Diamond = 3599/yr) and multiplies them for multi-year. The backend instead stores only the **discounted price** and **back-calculates MRP** using the plan discount percentage. This causes 1 rupee rounding differences.

Example (Diamond, 3yr, Fresh):
- Current tool: 3599 x 3 = **10,797**
- Backend: (2599 x 3) / (1 - 0.2779) = 10,797.67 → **10,798**

## Solution
Remove hardcoded MRP values entirely. Back-calculate MRP from discounted prices, matching the backend formula. This is already done for Enterprise via `getEnterpriseMRP()` -- we just need to generalize it to all plans.

## Technical Changes

### `src/lib/pricing-data.ts`

1. **Remove `mrp` from `ANNUAL_PRICES`** -- only store `discounted` values
2. **Back-calculate MRP everywhere** using: `Math.round(discounted / (1 - actualDiscountPercent / 100))`
3. **Update `buildPlans()`** to compute `annualMRP` from discounted price instead of reading it
4. **Update `buildMrpTable()`** to compute MRP per duration as `Math.round((discounted * years) / (1 - actualDiscountPercent / 100))` -- back-calculate from the total discounted amount for that duration, not per-year then multiply
5. **Update `calculateBreakdown()`** -- the `originalPrice` should use this same back-calculation for all plans (not just Enterprise)

### Key formula (applied per-plan, per-duration)

```text
totalDiscounted = annualDiscounted * years
originalPrice = Math.round(totalDiscounted / (1 - actualDiscountPercent / 100))
planDiscountAmount = originalPrice - totalDiscounted
```

This ensures Diamond 3yr = Math.round(7797 / 0.7221) = 10,798, matching the backend.

### Files Changed

| File | Change |
|------|--------|
| `src/lib/pricing-data.ts` | Remove hardcoded MRP, back-calculate from discounted price using actual discount percentages |

