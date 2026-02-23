
# UI Improvements for Upgrade Credit Section

## Three Changes

### 1. Make PPD Breakdown Collapsible
The PPD breakdown (lines 197-237) takes up a lot of vertical space. Convert it into a collapsible section using the existing Collapsible component. It will be collapsed by default, with just the "Credit Calculation (PPD Breakdown)" header as the trigger. Users can expand it when they need to verify the math.

### 2. Add "as of today" Clarification to Remaining Days
Change "Remaining Days" label to include today's date for clarity:
- From: `Remaining Days` -> `485`
- To: `Remaining Days (as of 24 Feb 2026)` -> `485`

This makes it clear that the remaining days calculation is based on the current date.

### 3. Show New Plan End Date
Add the new plan's end date below the "Plan Duration" selector in the Customise Plan card. This shows when the new upgraded plan will expire (calculated as today + selected duration in years * 365 days).

Display it as a small info line like:
`New plan ends: 23 Feb 2029` (for a 3-year plan selected today)

This appears for upgrade users only, right below the duration selector row.

## Technical Details

### `src/pages/CheckoutCalculator.tsx`

**Collapsible PPD Breakdown:**
- Import is already available (Collapsible, CollapsibleContent, CollapsibleTrigger)
- Add a `ppdOpen` state (default: `false`)
- Wrap the PPD detail rows (lines 201-236) in a Collapsible, keeping the header as the trigger
- The "Plan ends" and "Credit" summary line (lines 188-195) stays always visible

**Remaining Days label:**
- Change line 225 from `Remaining Days` to `Remaining Days (as of {format(new Date(), "dd MMM yyyy")})`

**New plan end date:**
- Calculate: `newPlanEndDate = addDays(new Date(), DURATION_YEARS[duration] * 365)`
- Show below the duration selector row (after line 279) only when `isUpgrade` is true
- Small text: `New plan ends: {format(newPlanEndDate, "dd MMM yyyy")}`
