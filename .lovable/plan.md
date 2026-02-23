

# Platform Filter and Side-by-Side Plan Cards

## What Changes

### 1. Add Platform Selector (Android / Web)
A new "Platform" dropdown next to the existing "User Type" selector. When "Android" is selected, all 4 plans show (Silver, Diamond, Platinum, Enterprise). When "Web" is selected, Silver is hidden since it's Android-only -- only Diamond, Platinum, Enterprise appear.

This filter will be added to both the Plan List page and the Checkout Calculator page.

### 2. Show Plan Cards Side by Side
Currently, on larger screens, the grid only goes up to 3 columns. With 4 plans, it falls back to single-column stacking. The fix is to always use a 4-column grid on desktop (regardless of plan count), so all plans sit side by side without scrolling.

For smaller plan counts (e.g., 3 plans on Web, or fewer during upgrade), the grid will still adapt (3-col, 2-col, etc.).

---

## Technical Details

### `src/lib/pricing-data.ts`
- Add a `Platform` type: `"android" | "web"`
- Add a `PLAN_PLATFORM` map indicating which plans are available on which platform:
  - Silver: android only
  - Diamond, Platinum, Enterprise: both

### `src/pages/PlanListValidation.tsx`
- Add `platform` state (default: `"android"`)
- Add Platform selector next to User Type selector
- Filter `visiblePlans` by platform (exclude Silver when platform is "web")
- Change grid classes to support 4 columns: use `md:grid-cols-4` when 4 plans are visible, `md:grid-cols-3` for 3, etc.
- Increase `max-w` from `5xl` to `6xl` to give 4 cards enough room

### `src/pages/CheckoutCalculator.tsx`
- Add `platform` state
- Add Platform selector in the header area
- Filter the plan dropdown options by platform (hide Silver when "web" selected)
- If current selected plan is Silver and user switches to Web, auto-switch to Diamond

