

# Add Upgrade Case with Pro-Rata Credit

## Overview
Add a 4th user type called "Upgrade" to the testing tool. When selected, the tester picks their current plan (Diamond or Platinum), enters the plan start date, and the tool calculates a pro-rata credit for the remaining unused days. This credit is shown as a line item in the Price Details on the checkout page.

## How Upgrade Credit Works
- User is on Plan X (e.g., Diamond at 2,599/yr discounted price)
- They want to upgrade to Plan Y (e.g., Platinum)
- Credit = (discounted price of current plan) x (remaining days / total plan days)
- Remaining days = plan end date - today
- Total plan days = duration in years x 365
- The credit is subtracted from the final price (after discount, before GST)
- GST is calculated on (Price After Discount - Credit)

Example from screenshot: Diamond 1yr bought 24 Feb 2026, upgrading to Platinum 1yr on same day. Full 365 days remain, so credit = 2,599 x (365/365) = 2,599. Price after discount = 3,999. GST = 18% of (3,999 - 2,599) = 252. Total = 1,652.

## Changes

### 1. `src/lib/pricing-data.ts`
- Add `"upgrade"` to the `UserType` union type
- Add upgrade label to `USER_TYPE_LABELS`
- For upgrade, reuse `renewal_after` pricing (since upgrades use post-16-Feb pricing as shown in screenshots: Platinum MRP 8,000, discounted 3,999)
- Add `PLANS_BY_TYPE["upgrade"]` pointing to same data as `renewal_after`
- Add `MRP_TABLES["upgrade"]` and `ANNUAL_DISCOUNTED["upgrade"]` pointing to renewal_after data
- Add a new `calculateUpgradeCredit` function:
  - Inputs: current plan name, current plan duration, plan start date
  - Calculates remaining days from today to plan end date
  - Credit = ANNUAL_DISCOUNTED["fresh"][currentPlan] x years x (remainingDays / totalDays)
  - Returns the credit amount (rounded)
- Update `PriceBreakdown` interface to include optional `upgradeCredit` field
- Update `calculateBreakdown` to accept optional upgrade credit, subtract it before GST

### 2. `src/pages/PlanListValidation.tsx`
- Add `"upgrade"` to user type options
- When "Upgrade" is selected, show additional inputs:
  - "Current Plan" dropdown (Diamond or Platinum -- can't upgrade from Enterprise)
  - "Plan Start Date" date input
  - "Plan Duration" selector (1yr, 2yr, etc.)
- The plan cards should hide the current plan (can't upgrade to same plan) and only show higher plans
- Pass upgrade params via URL to checkout: `&currentPlan=diamond&startDate=2026-02-24&currentDuration=1yr`

### 3. `src/pages/CheckoutCalculator.tsx`
- Add `"upgrade"` to user type options
- When upgrade is selected, show inputs for current plan, start date, and current plan duration in the left column
- Calculate the pro-rata credit using `calculateUpgradeCredit`
- In Price Details, add a "Credit for the current plan" line between "Price After Discount" and "GST"
- GST is computed on (priceAfterDiscount - credit)
- Total = priceAfterDiscount - credit + GST

## Technical Details

**Credit Calculation:**
```text
totalDays = currentDuration (years) x 365
planEndDate = startDate + totalDays
remainingDays = max(0, planEndDate - today)
credit = round(ANNUAL_DISCOUNTED["fresh"][currentPlan] x currentYears x remainingDays / totalDays)
```

Note: The credit is based on the discounted price the user originally paid (fresh pricing), not MRP.

**Price Details layout for upgrade:**
```text
Original Price                    8,000
Total Discount (50%)            - 4,001
Price After Discount              3,999
Credit for the current plan     - 2,599
GST (18%)                           252
--------------------------------------
Total Price                       1,652
```

**Upgrade-specific UI on Plan List:**
- Current plan card shows "Current Plan" badge and "Manage Auto Renewal" button instead of "Buy"
- Higher plans show "Upgrade Plan" button instead of "Buy"
- Banner at top shows "Your [plan] plan will auto renew on [end date]"

**Upgrade-specific UI on Checkout:**
- New card/section in left column: "Current Plan Details" showing current plan, start date, end date, and credit amount
- Price Details card gains the credit line item

