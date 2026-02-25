

# Update QA Checklist with Old/New Discount Slabs and PPD Enhancements

## Changes to `src/pages/QAChecklist.tsx`

### 1. Multi-Year Discount Table (Section 1) -- Add Old Discount Column
Currently only shows the new discount slabs. Add a side-by-side comparison:
- Add `OLD_MULTI_YEAR_DISCOUNTS` import
- Add a third column "Old Discount" to the `MultiYearDiscountTable` showing the legacy slab values next to the new ones

### 2. PPD Scenarios (Section 4) -- Expand with Old Discount and Purchase Type Cases
Currently has 3 basic scenarios. Add:
- A scenario using **old multi-year discount** (e.g., "Diamond 3yr, old discount (20%), 100 days ago") by passing `multiYearDiscountOverride` to `calculateUpgradeCredit`
- A scenario with **Platinum + renewal_after purchase type** to show cohort-dependent pricing
- A scenario with **Enterprise + addon** to cover addon-inclusive PPD

### 3. Upgrade Rules (Section 5) -- Add Old vs New Discount Note
Add a `CheckItem` documenting:
- The old/new multi-year discount toggle exists on both the Checkout page and the standalone PPD Calculator
- Old slabs apply to plans purchased before the discount reduction

### 4. Add PPD Calculator Link
- Add a link/button to the standalone `/ppd-calculator` page in the PPD section description, similar to how checkout scenarios link to `/calculator`
- Add "PPD Calculator" to the TOC jump links

### Files Changed

| File | Change |
|------|--------|
| `src/pages/QAChecklist.tsx` | Add old discount column, expand PPD scenarios, add upgrade rule note, add PPD Calculator link |

