

# Fix Pricing Logic + Checkout UI Overhaul

## Problem
The current `calculateBreakdown` uses `MRP x percentage` which gives non-round numbers (e.g., 28% of 3,599 = 1,007.72 -> rounds to 1,008, giving 2,591 instead of 2,599). The backend actually uses fixed discounted prices, and the "percentage" shown on UI (28%, 50%, 44%) is just a rounded display value.

Actual backend percentages:
- Diamond: (3599 - 2599) / 3599 = 27.79%
- Platinum: (5999 - 2999) / 5999 = 50.01%
- Enterprise: (8999 - 4999) / 8999 = 44.45%

## Changes

### 1. Fix `calculateBreakdown` in `src/lib/pricing-data.ts`
- Instead of `originalPrice * planDiscountPercent / 100`, compute plan discount as:
  - `priceAfterPlanDiscount = annualDiscounted * years` (e.g., Platinum 2yr = 2999 * 2 = 5998)
  - `planDiscountAmount = originalPrice - priceAfterPlanDiscount`
- Add `DURATION_YEARS` constant: `{ "1yr": 1, "2yr": 2, "3yr": 3, "5yr": 5, "10yr": 10 }`
- Store actual discount percentages (27.79, 50.01, 44.45) for display in the breakdown, but keep the rounded ones (28, 50, 44) for the UI badge display
- Add `ANNUAL_DISCOUNTED` lookup by plan and userType so the function can derive the correct post-discount price
- Multi-year and coupon discounts continue to apply sequentially on the post-plan-discount price (unchanged logic)

### 2. Redesign Checkout UI in `src/pages/CheckoutCalculator.tsx`
- **Two-column layout**: Left column has all selectors, right column has a sticky "Price Details" card
- **Price Details card** matching the production screenshots:
  - "Original Price" row with the MRP value
  - **Collapsible "Total Discount (X%)"** row in green with a chevron, expandable to show:
    - `{percent}% Discount` (plan discount amount, showing the actual % like 27.79%)
    - `Multi Year Extra Off` (amount, if applicable)
    - `Coupon Discount ({percent}%)` (amount, if applicable)
  - "Price After Discount" (bold)
  - "GST (18%)" row
  - Dashed separator
  - **"Total Price"** large and bold
- Selectors stay visible alongside the price card so testers don't scroll

### 3. Add New/Renewal toggle to Plan List page
- Add a toggle at the top of `src/pages/PlanListValidation.tsx` for New/Renewal user type
- When renewal data arrives, the plan cards and checklist will reflect renewal pricing

## Technical Details

**Files to modify:**
- `src/lib/pricing-data.ts` -- fix `calculateBreakdown`, add `DURATION_YEARS`, add `ANNUAL_DISCOUNTED` map
- `src/pages/CheckoutCalculator.tsx` -- two-column layout, collapsible discount breakdown, production-matching UI
- `src/pages/PlanListValidation.tsx` -- add user type toggle

**Calculation example (Platinum, 2yr, 15% coupon, new user):**
1. MRP = 11,998
2. Plan discount: 11,998 - (2,999 x 2) = 11,998 - 5,998 = 6,000
3. After plan discount: 5,998
4. Multi-year 5%: 5,998 x 5% = 300 -> After: 5,698
5. Coupon 15%: 5,698 x 15% = 855 -> After: 4,843
6. Total discount: 11,998 - 4,843 = 7,155
7. GST 18%: 4,843 x 18% = 872
8. Total: 4,843 + 872 = 5,715

