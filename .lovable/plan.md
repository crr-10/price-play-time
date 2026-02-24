

# Enterprise-to-Enterprise: "No Upgrade Selected" State

## Problem
When upgrading Enterprise-to-Enterprise with the same configuration (e.g., 2 businesses, 3 users -> 2 businesses, 3 users), the tool currently shows full pricing (Original Price, discounts, GST, etc.). This is wrong -- there's no actual upgrade happening. The real UI (screenshot 1) shows all prices as ₹0 and displays a message: **"Please select an option that is higher than your current plan."**

## Solution
Detect when an Enterprise-to-Enterprise upgrade has no actual upgrade (new businesses and users are the same as current), and replace the price breakdown with a prompt message.

## Technical Details

### `src/pages/CheckoutCalculator.tsx`

**New derived boolean** (around line 82):
```
const isEnterpriseNoUpgrade = isUpgrade && isEnterprise && isCurrentEnterprise
  && businesses === currentBusinesses && userSlab === currentUserSlab;
```

**Customise Plan card** -- after the Enterprise Configuration section (after the contact sales banner, around line 470):
- When `isEnterpriseNoUpgrade` is true, show a muted message:
  "Please select an option that is higher than your current plan."

**Price Details card** (right column, around line 526):
- Add `isEnterpriseNoUpgrade` as another condition alongside `contactSales`. When either is true, don't show the price breakdown.
- For the `isEnterpriseNoUpgrade` case, show a simple message (different from the Contact Sales one): an info icon with "Please select a higher configuration to see pricing."

This means the Price Details card has 3 states:
1. `contactSales` -- shows "Contact Sales" message
2. `isEnterpriseNoUpgrade` -- shows "Select higher config" message
3. Normal -- shows full price breakdown

### Files Changed

| File | Change |
|------|--------|
| `src/pages/CheckoutCalculator.tsx` | Add `isEnterpriseNoUpgrade` check; show message in Customise Plan card; add third state to Price Details card |

