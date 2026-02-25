

# Standalone PPD Calculator Page

## What Changes

Extract the "Current Plan Details" card (with all its selectors and PPD breakdown) into a dedicated page at `/ppd-calculator`, accessible from the home page. This makes it easy to quickly calculate upgrade credits without navigating through the full checkout flow.

## Details

### New file: `src/pages/PPDCalculator.tsx`

A standalone page containing the full "Current Plan Details" card from the checkout page. It will include:
- Current Plan selector (Silver/Diamond/Platinum/Enterprise)
- Plan Start Date picker
- Plan Duration selector (1-10 years)
- Purchase Type radio (for Platinum/Enterprise)
- Old vs New multi-year discount toggle (for duration > 1yr)
- Enterprise business/user steppers (for Enterprise)
- Plan end date and credit display
- PPD Breakdown collapsible (open by default on this page)
- Back button to home

The component will be self-contained, reusing the same state logic and calculations currently in CheckoutCalculator but focused solely on PPD credit calculation.

### `src/App.tsx`

Add route: `<Route path="/ppd-calculator" element={<PPDCalculator />} />`

### `src/pages/PlanListValidation.tsx` (home page)

Add a navigation card/button linking to `/ppd-calculator` alongside the existing checkout and QA links.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/PPDCalculator.tsx` | New standalone PPD calculator page |
| `src/App.tsx` | Add `/ppd-calculator` route |
| `src/pages/PlanListValidation.tsx` | Add entry point link to PPD calculator |
