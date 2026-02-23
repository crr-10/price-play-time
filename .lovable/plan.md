
# Pricing Validation Tool for myBillBook

An internal tool for dev/QA teams to quickly validate pricing calculations across all plans, durations, and discount scenarios.

## Page 1: Plan List Validation
- Shows all 3 plans (Diamond, Platinum, Enterprise) side by side, matching the current plan list page layout
- Displays for each plan: monthly price (crossed-out original → discounted), annual price (crossed-out → discounted), and discount badge (28%, 50%, 44%)
- A checklist-style section where testers can verify:
  - Monthly prices: ₹217, ₹250, ₹417
  - Annual prices: ₹2,599, ₹2,999, ₹4,999
  - Crossed-out prices: ₹300, ₹500, ₹750 (monthly) and ₹3,599, ₹5,999, ₹8,999 (annual)
  - Discount percentages: 28%, 50%, 44%
  - Monthly × 12 validation (e.g., ₹217 × 12 = ₹2,604 vs displayed ₹2,599)

## Page 2: Plan Detail / Checkout Price Calculator
- **Selectors at the top** (like the spreadsheet):
  - Select Plan: Diamond / Platinum / Enterprise
  - Select Duration: 1 Year, 2 Years (5% extra off), 3 Years (10%), 5 Years (15%), 10 Years (30%)
  - Select Coupon Discount: 0%, 5%, 10%, 15%, 30% (or custom %)
  - Toggle: New User / Renewal User
- **Price breakdown display** (matching the checkout page layout):
  - Original Price (from MRP table, e.g., Platinum 1yr = ₹5,999; 2yr = ₹11,998)
  - Plan Discount (28% / 50% / 44% depending on plan)
  - Multi-Year Extra Off (5% / 10% / 15% / 30% based on duration)
  - Coupon Discount (based on selected coupon %)
  - Total Discount (sum of all, shown as percentage and amount)
  - Price After Discount
  - GST (18%)
  - Total Price
- All calculations are done client-side using hardcoded pricing data

## Hardcoded Data
- **MRP (Ex GST) table**: Diamond (3,599 / 7,198 / 10,797 / 17,995 / 35,990), Platinum (5,999 / 11,998 / 17,997 / 29,995 / 59,990), Enterprise (8,999 / 17,998 / 26,997 / 44,995 / 89,990)
- **Plan discounts**: Diamond 28%, Platinum 50%, Enterprise 44%
- **Multi-year discounts**: 1yr = 0%, 2yr = 5%, 3yr = 10%, 5yr = 15%, 10yr = 30%
- **GST**: 18%
- For renewal users: same structure with different base prices (placeholder until you share the renewal pricing data)

## UX
- Clean, simple interface — no login needed
- Navigation between Plan List page and Detail Calculator
- Results update instantly as selections change
- Clear formatting with ₹ currency, comma separators
