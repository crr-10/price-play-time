

# Fix Upgrade Credit Calculation & Show PPD Breakdown

## Problem
The current credit calculation ignores the multi-year discount. It computes credit as:
```text
credit = annualDiscounted * years * remainingDays / totalDays
```

But the user actually paid less due to multi-year discount. For example, Diamond 2-year:
- Current (wrong): 2599 * 2 = 5198, PPD = 5198/730 = 7.12
- Correct: 2599 * 2 * (1 - 5/100) = 4938.10, PPD = 4938.10/730 = 6.76

The credit should be based on what the user actually paid (after multi-year discount, but coupons are excluded from credit calculation).

## Changes

### 1. `src/lib/pricing-data.ts` - Fix `calculateUpgradeCredit`
- Apply multi-year discount to the total paid amount before computing PPD
- Formula becomes:
```text
totalPaid = annualDiscounted * years * (1 - multiYearDiscount/100)
PPD = totalPaid / totalDays
credit = PPD * remainingDays
```
- Return additional details (totalPaid, PPD, remainingDays, totalDays) for the UI breakdown
- Change return type to an object: `{ credit, totalPaid, ppd, remainingDays, totalDays, multiYearDiscountPercent }`

### 2. `src/pages/CheckoutCalculator.tsx` - Show PPD Breakdown in Current Plan Details Card
- Use the new return object from `calculateUpgradeCredit`
- Below the existing "Credit" line in the Current Plan Details card, add a detailed PPD calculation breakdown showing:
  - Annual discounted price of current plan
  - Total before multi-year discount (annual * years)
  - Multi-year discount applied (if any)
  - Total paid (after multi-year discount)
  - Total days in plan
  - Remaining days
  - PPD (Plan Price per Day) = totalPaid / totalDays
  - Credit = PPD * remainingDays
- This breakdown only appears in the Current Plan Details card (not in the Price Details card on the right)

### 3. `src/pages/CheckoutCalculator.tsx` - Update references
- Update the `upgradeCredit` variable to extract `.credit` from the returned object
- Store the full object for rendering the PPD breakdown

## Example Calculation (Diamond, 2yr, started recently)
```text
Annual Discounted: 2,599
Years: 2
Subtotal: 2,599 x 2 = 5,198
Multi-year discount: 5%
Total Paid: 5,198 x 0.95 = 4,938
Total Days: 730
PPD: 4,938 / 730 = 6.77
Remaining Days: 729 (if started yesterday)
Credit: 6.77 x 729 = 4,935
```

