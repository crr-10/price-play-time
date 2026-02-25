

# Add Old vs New Multi-Year Discount Toggle for Upgrade PPD

## Problem
Before a certain date, multi-year discounts were higher. When calculating PPD credit for an upgrade, the user may have originally purchased their plan under the old (higher) discount slabs. Currently, the tool always uses the new (reduced) discounts for PPD calculation, which underestimates the credit for users who bought under old pricing.

## Old vs New Discount Slabs

```text
Duration   Old Discount   New Discount
1 year        0%              0%
2 years      15%              5%
3 years      20%             10%
4 years      20%             10%
5 years      25%             15%
6 years      25%             15%
7 years      35%             25%
8 years      35%             25%
9 years      35%             25%
10 years     40%             30%
```

## Solution

### `src/lib/pricing-data.ts`
1. Add a new constant `OLD_MULTI_YEAR_DISCOUNTS` with the old slab values (snapped for intermediate years: 4yr->20%, 6yr->25%, 8yr/9yr->35%).
2. Update `calculateUpgradeCredit` to accept an optional `multiYearDiscountOverride?: number` parameter. When provided, use it instead of looking up `MULTI_YEAR_DISCOUNTS[currentDuration]`.

### `src/pages/CheckoutCalculator.tsx`
1. Add state: `useOldMultiYearDiscount` (boolean, default `false`).
2. In the Current Plan Details card, when `currentDuration` is not `"1yr"`, show a toggle/radio:
   - "New discount slabs (X%)" -- shows the current slab discount for that duration
   - "Old discount slabs (Y%)" -- shows the old slab discount for that duration
3. Pass the appropriate discount percentage to `calculateUpgradeCredit` based on the toggle.
4. In the PPD breakdown, the multi-year discount line already shows the percentage -- it will automatically reflect the selected value.

## Files Changed

| File | Change |
|------|--------|
| `src/lib/pricing-data.ts` | Add `OLD_MULTI_YEAR_DISCOUNTS` constant; add `multiYearDiscountOverride` param to `calculateUpgradeCredit` |
| `src/pages/CheckoutCalculator.tsx` | Add old/new discount toggle in Current Plan Details; pass override to credit calc |

