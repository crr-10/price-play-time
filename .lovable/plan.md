

# Expand Durations to 1-10 Years with Discount Snapping

## What Changes

Currently only 5 duration options exist (1, 2, 3, 5, 10 years). The admin panel allows any integer year from 1 to 10, so the tool needs all 10 options with discounts that snap to defined slabs.

## Discount Slab Mapping

```text
Year   Discount   Snaps To
 1       0%       (no discount)
 2       5%       2-year slab
 3      10%       3-year slab
 4      10%       3-year slab
 5      15%       5-year slab
 6      15%       5-year slab
 7      25%       7-year slab (NEW - user confirmed 25%)
 8      25%       7-year slab
 9      25%       7-year slab
10      30%       10-year slab
```

## Technical Details

### `src/lib/pricing-data.ts`

1. **Expand `Duration` type** from `"1yr" | "2yr" | "3yr" | "5yr" | "10yr"` to include all years: `"1yr" | "2yr" | "3yr" | "4yr" | "5yr" | "6yr" | "7yr" | "8yr" | "9yr" | "10yr"`.

2. **Update `DURATION_YEARS`** to include all 10 entries.

3. **Update `MULTI_YEAR_DISCOUNTS`** with snapped values:
   - 1yr: 0, 2yr: 5, 3yr: 10, 4yr: 10, 5yr: 15, 6yr: 15, 7yr: 25, 8yr: 25, 9yr: 25, 10yr: 30

4. **Update `DURATIONS` array** with all 10 entries, each showing the "extra off" label. Years that snap will show the slab discount (e.g., 4 Years shows "10% extra off" same as 3 Years).

5. **Update `buildMrpTable`** to iterate over all 10 durations.

### `src/pages/CheckoutCalculator.tsx`

The duration selector already maps over the `DURATIONS` array, so it will automatically pick up all 10 options. No changes expected unless the selector layout needs adjustment for 10 items (it uses radio buttons -- may need to switch to a dropdown or compact grid for better UX with 10 options).

### `src/pages/QAChecklist.tsx`

The MRP verification tables iterate over durations, so they will automatically expand. May need minor layout tweaks if the table gets too wide with 10 columns.

## Files Changed

| File | Change |
|------|--------|
| `src/lib/pricing-data.ts` | Expand Duration type, add all 10 years to DURATION_YEARS, MULTI_YEAR_DISCOUNTS, DURATIONS |
| `src/pages/CheckoutCalculator.tsx` | Possibly adjust duration selector layout for 10 options |
| `src/pages/QAChecklist.tsx` | Layout tweaks for wider MRP tables if needed |

