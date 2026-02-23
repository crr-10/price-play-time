

# Add Renewal Pricing with Two Tiers

## Overview
Rename "New User" to "Fresh Plan Purchase" and split "Renewal" into two sub-cases:
- **Renewal (after 16 Feb 2024)**: Higher Platinum/Enterprise prices
- **Renewal (before 16 Feb 2024)**: Even higher Platinum/Enterprise prices

Diamond pricing stays the same across all three cases. Discount percentages (27.79%, 50.01%, 44.45%) remain unchanged.

## Pricing Data Summary

| Plan | Fresh | Renewal After 16 Feb | Renewal Before 16 Feb |
|------|-------|---------------------|-----------------------|
| Diamond MRP/yr | 3,599 | 3,599 | 3,599 |
| Diamond disc/yr | 2,599 | 2,599 | 2,599 |
| Platinum MRP/yr | 5,999 | 8,000 | 12,000 |
| Platinum disc/yr | 2,999 | 3,999 | 5,999 |
| Enterprise MRP/yr | 8,999 | 10,799 | 16,199 |
| Enterprise disc/yr | 4,999 | 5,999 | 8,999 |

Monthly prices are derived as annual/12 rounded.

## Changes

### 1. `src/lib/pricing-data.ts`
- Change `UserType` from `"new" | "renewal"` to `"fresh" | "renewal_after" | "renewal_before"`
- Add `PLANS` data per user type (3 sets of plan info with different MRP/discounted values)
- Update `MRP_TABLE` to have 3 variants (fresh, renewal_after, renewal_before) with multi-year values derived as `annualMRP * years`
- Update `ANNUAL_DISCOUNTED` with all 3 user types
- Update `calculateBreakdown` to accept the new `UserType`

### 2. `src/pages/PlanListValidation.tsx`
- Replace the New/Renewal toggle with a 3-option selector: "Fresh Plan Purchase" / "Renewal (after 16 Feb 2024)" / "Renewal (before 16 Feb 2024)"
- Plan cards update dynamically based on selected user type, showing correct MRP and discounted prices
- Pass selected user type to checkout page via URL params

### 3. `src/pages/CheckoutCalculator.tsx`
- Update the user type selector from a toggle to a 3-option control
- All price calculations automatically use the correct data for the selected user type
- Read initial user type from URL params

## Technical Details

**MRP Tables (multi-year = annual MRP x years):**

Fresh:
- Diamond: 3,599 / 7,198 / 10,797 / 17,995 / 35,990
- Platinum: 5,999 / 11,998 / 17,997 / 29,995 / 59,990
- Enterprise: 8,999 / 17,998 / 26,997 / 44,995 / 89,990

Renewal After 16 Feb:
- Diamond: 3,599 / 7,198 / 10,797 / 17,995 / 35,990
- Platinum: 8,000 / 16,000 / 24,000 / 40,000 / 80,000
- Enterprise: 10,799 / 21,598 / 32,397 / 53,995 / 107,990

Renewal Before 16 Feb:
- Diamond: 3,599 / 7,198 / 10,797 / 17,995 / 35,990
- Platinum: 12,000 / 24,000 / 36,000 / 60,000 / 120,000
- Enterprise: 16,199 / 32,398 / 48,597 / 80,995 / 161,990

**Monthly prices (annual discounted / 12, rounded):**

Fresh: Diamond 217, Platinum 250, Enterprise 417
Renewal After: Diamond 217, Platinum 333, Enterprise 500
Renewal Before: Diamond 217, Platinum 500, Enterprise 750

**Monthly MRP (annual MRP / 12, rounded):**

Fresh: Diamond 300, Platinum 500, Enterprise 750
Renewal After: Diamond 300, Platinum 667, Enterprise 900
Renewal Before: Diamond 300, Platinum 1,000, Enterprise 1,350
