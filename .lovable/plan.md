

# QA Checklist Page

## What We're Building
A new `/qa-checklist` page that serves as a comprehensive testing reference for the pricing and checkout changes described in the PRD. QA can open this page and see exactly what to verify, with direct links to the relevant pages in the tool (plan list / checkout) pre-configured with the right parameters.

## Page Structure

### Section 1: Multi-Year Discount Verification
A table showing each tenure (1, 2, 3, 5, 10 years) with the expected discount percentages. QA compares these against what they see on staging.

| Tenure | Expected Discount |
|--------|------------------|
| 1 year | 0% |
| 2 years | 5% |
| 3 years | 10% |
| 5 years | 15% |
| 10 years | 30% |

### Section 2: Label Price (MRP) and Discount % Validation
For each of the 4 user types (Fresh, Renewal After, Renewal Before, Upgrade), show a table of all 4 plans with:
- Expected MRP (struck-through price)
- Expected discount %
- Expected final annual price

Values pulled directly from `pricing-data.ts` so it's always in sync with the code. Each scenario has a "Open in Plan List" link that navigates to `/?userType=...`.

### Section 3: Checkout Price Breakdown Scenarios
Pre-built test scenarios with "Open in Checkout" links:
- Fresh + Platinum + 1yr (baseline)
- Fresh + Diamond + 3yr (multi-year discount)
- Renewal After + Platinum + 2yr
- Renewal Before + Enterprise + 5yr
- Upgrade: Diamond to Platinum, 1yr
- Upgrade: Silver to Diamond, 3yr

Each scenario shows the expected values (original price, discount %, price after discount, GST, total) computed from the existing `calculateBreakdown` function -- so QA can compare against staging.

### Section 4: Upgrade Credit (PPD) Verification
Test cases for upgrade credit calculation:
- Diamond 1yr started recently -- expected PPD and credit
- Diamond 2yr (5% multi-year discount) -- verify PPD is lower
- Platinum 3yr (10% discount) -- verify credit calculation

Each shows the expected PPD breakdown inline.

### Section 5: Platform Filter Checks
- Android: all 4 plans visible
- Web: Silver hidden, only 3 plans visible
- Switching from Android to Web while Silver is selected auto-switches to Diamond

### Section 6: Coupon/Discount Rules
- Fresh users: coupon section enabled
- Renewal users: coupon section disabled with message
- Upgrade users: coupon section disabled with message

### Section 7: Edge Cases
- Negative total price (credit > price after discount)
- Expired plan (remaining days = 0, credit = 0)
- Same-day start (maximum remaining days)
- GST computed on post-credit amount

## Technical Details

### New file: `src/pages/QAChecklist.tsx`
- Import pricing data functions and constants from `pricing-data.ts`
- Compute expected values dynamically using the same functions the checkout uses (`calculateBreakdown`, `calculateUpgradeCredit`)
- Each test scenario rendered as a card with expected values and a link to open that scenario in the plan list or checkout page
- Uses existing UI components (Card, Table, Badge, Button)

### `src/App.tsx`
- Add route: `<Route path="/qa" element={<QAChecklist />} />`

### Navigation
- Add a small "QA Checklist" link in the header of the Plan List page so it's easily discoverable

