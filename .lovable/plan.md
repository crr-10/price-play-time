
# Shareable URLs with "Copy Scenario" Button

## Overview

Make every page's state fully driven by URL search params so any scenario can be shared via link. Add a "Copy Scenario" button on each page that copies the current URL to clipboard with a toast confirmation.

## Changes Per Page

### 1. Plan List Page (`src/pages/PlanListValidation.tsx`)

**URL params to sync:** `platform`, `userType`, `currentPlan`, `currentDuration`, `startDate`, `currentBiz`, `currentUsers`

- Initialize all state from `useSearchParams` instead of hardcoded defaults
- Add a `useEffect` that updates the URL (via `setSearchParams`) whenever any state value changes (using `replace: true` so it doesn't pollute browser history)
- Add a "Copy Scenario" button in the header area

### 2. Checkout Page (`src/pages/CheckoutCalculator.tsx`)

**URL params to sync:** `plan`, `duration`, `coupon`, `userType`, `platform`, `currentPlan`, `startDate`, `currentDuration`, `currentBiz`, `currentUsers`, `purchaseType`, `oldDiscount`, `biz`, `users`

- Already reads some params on init -- extend to read ALL state from params (duration, coupon, enterprise config, old discount toggle, purchase type, etc.)
- Add a `useEffect` to write state back to URL on every change
- Add a "Copy Scenario" button in the header

### 3. PPD Calculator Page (`src/pages/PPDCalculator.tsx`)

**URL params to sync:** `plan`, `startDate`, `duration`, `purchaseType`, `oldDiscount`, `biz`, `users`

- Initialize all state from `useSearchParams`
- Add a `useEffect` to sync state back to URL
- Add a "Copy Scenario" button in the header

### 4. Copy Scenario Button

A small shared approach across all three pages:
- Button with a clipboard/link icon and "Copy Scenario" label
- On click: copies `window.location.href` to clipboard
- Shows a sonner toast: "Scenario link copied!"

## Technical Details

### URL Sync Pattern (same on all pages)

```typescript
const [searchParams, setSearchParams] = useSearchParams();

// Read initial state from params with fallbacks
const [platform, setPlatform] = useState<Platform>(
  (searchParams.get("platform") as Platform) === "web" ? "web" : "android"
);

// Sync state to URL
useEffect(() => {
  const params: Record<string, string> = {};
  if (platform !== "android") params.platform = platform;
  if (userType !== "fresh") params.userType = userType;
  // ... only include non-default values to keep URLs clean
  setSearchParams(params, { replace: true });
}, [platform, userType, /* ...other deps */]);
```

### Copy Button

```typescript
import { toast } from "sonner";
import { Link2 } from "lucide-react";

<Button variant="outline" size="sm" onClick={() => {
  navigator.clipboard.writeText(window.location.href);
  toast("Scenario link copied!");
}}>
  <Link2 className="h-3.5 w-3.5" /> Copy Scenario
</Button>
```

## Files Changed

| File | Change |
|------|--------|
| `src/pages/PlanListValidation.tsx` | Read/write all state to URL params, add Copy Scenario button |
| `src/pages/CheckoutCalculator.tsx` | Extend URL param sync to all state, add Copy Scenario button |
| `src/pages/PPDCalculator.tsx` | Read/write all state to URL params, add Copy Scenario button |
