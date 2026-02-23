// All prices are Ex-GST in INR

export type PlanName = "silver" | "diamond" | "platinum" | "enterprise";
export type Duration = "1yr" | "2yr" | "3yr" | "5yr" | "10yr";
export type UserType = "fresh" | "renewal_after" | "renewal_before" | "upgrade";

export interface PlanInfo {
  name: string;
  key: PlanName;
  monthlyMRP: number;
  monthlyDiscounted: number;
  annualMRP: number;
  annualDiscounted: number;
  discountPercent: number;
  actualDiscountPercent: number;
}

const PLAN_META: { name: string; key: PlanName; discountPercent: number; actualDiscountPercent: number }[] = [
  { name: "Silver", key: "silver", discountPercent: 27, actualDiscountPercent: 27.32 },
  { name: "Diamond", key: "diamond", discountPercent: 28, actualDiscountPercent: 27.79 },
  { name: "Platinum", key: "platinum", discountPercent: 50, actualDiscountPercent: 50.01 },
  { name: "Enterprise", key: "enterprise", discountPercent: 44, actualDiscountPercent: 44.45 },
];

const ANNUAL_PRICES: Record<string, Record<PlanName, { mrp: number; discounted: number }>> = {
  fresh: {
    silver: { mrp: 549, discounted: 399 },
    diamond: { mrp: 3599, discounted: 2599 },
    platinum: { mrp: 5999, discounted: 2999 },
    enterprise: { mrp: 8999, discounted: 4999 },
  },
  renewal_after: {
    silver: { mrp: 549, discounted: 399 },
    diamond: { mrp: 3599, discounted: 2599 },
    platinum: { mrp: 8000, discounted: 3999 },
    enterprise: { mrp: 10799, discounted: 5999 },
  },
  renewal_before: {
    silver: { mrp: 549, discounted: 399 },
    diamond: { mrp: 3599, discounted: 2599 },
    platinum: { mrp: 12000, discounted: 5999 },
    enterprise: { mrp: 16199, discounted: 8999 },
  },
};
// Upgrade uses same pricing as renewal_after
ANNUAL_PRICES.upgrade = ANNUAL_PRICES.renewal_after;

function buildPlans(userType: UserType): PlanInfo[] {
  return PLAN_META.map((meta) => {
    const prices = ANNUAL_PRICES[userType][meta.key];
    return {
      ...meta,
      annualMRP: prices.mrp,
      annualDiscounted: prices.discounted,
      monthlyMRP: Math.round(prices.mrp / 12),
      monthlyDiscounted: Math.round(prices.discounted / 12),
    };
  });
}

export const PLANS_BY_TYPE: Record<UserType, PlanInfo[]> = {
  fresh: buildPlans("fresh"),
  renewal_after: buildPlans("renewal_after"),
  renewal_before: buildPlans("renewal_before"),
  upgrade: buildPlans("upgrade"),
};

// Default PLANS kept for backward compat — use PLANS_BY_TYPE in UI
export const PLANS = PLANS_BY_TYPE.fresh;

// MRP tables per user type (multi-year = annual MRP × years)
function buildMrpTable(userType: UserType): Record<PlanName, Record<Duration, number>> {
  const durations: Duration[] = ["1yr", "2yr", "3yr", "5yr", "10yr"];
  const years = [1, 2, 3, 5, 10];
  const result = {} as Record<PlanName, Record<Duration, number>>;
  for (const plan of ["silver", "diamond", "platinum", "enterprise"] as PlanName[]) {
    result[plan] = {} as Record<Duration, number>;
    const annualMrp = ANNUAL_PRICES[userType][plan].mrp;
    durations.forEach((d, i) => {
      result[plan][d] = annualMrp * years[i];
    });
  }
  return result;
}

export const MRP_TABLES: Record<UserType, Record<PlanName, Record<Duration, number>>> = {
  fresh: buildMrpTable("fresh"),
  renewal_after: buildMrpTable("renewal_after"),
  renewal_before: buildMrpTable("renewal_before"),
  upgrade: buildMrpTable("upgrade"),
};

// Keep old exports for compat
export const MRP_TABLE = MRP_TABLES.fresh;
export const MRP_TABLE_RENEWAL = MRP_TABLES.renewal_after;

export const ANNUAL_DISCOUNTED: Record<UserType, Record<PlanName, number>> = {
  fresh: { silver: 399, diamond: 2599, platinum: 2999, enterprise: 4999 },
  renewal_after: { silver: 399, diamond: 2599, platinum: 3999, enterprise: 5999 },
  renewal_before: { silver: 399, diamond: 2599, platinum: 5999, enterprise: 8999 },
  upgrade: { silver: 399, diamond: 2599, platinum: 3999, enterprise: 5999 },
};

export const DURATION_YEARS: Record<Duration, number> = {
  "1yr": 1, "2yr": 2, "3yr": 3, "5yr": 5, "10yr": 10,
};

export const PLAN_DISCOUNTS: Record<PlanName, number> = {
  silver: 27, diamond: 28, platinum: 50, enterprise: 44,
};

export const ACTUAL_PLAN_DISCOUNTS: Record<PlanName, number> = {
  silver: 27.32, diamond: 27.79, platinum: 50.01, enterprise: 44.45,
};

export const MULTI_YEAR_DISCOUNTS: Record<Duration, number> = {
  "1yr": 0, "2yr": 5, "3yr": 10, "5yr": 15, "10yr": 30,
};

export const DURATIONS: { key: Duration; label: string; extraOff: string }[] = [
  { key: "1yr", label: "1 Year", extraOff: "" },
  { key: "2yr", label: "2 Years", extraOff: "5% extra off" },
  { key: "3yr", label: "3 Years", extraOff: "10% extra off" },
  { key: "5yr", label: "5 Years", extraOff: "15% extra off" },
  { key: "10yr", label: "10 Years", extraOff: "30% extra off" },
];

export const GST_RATE = 18;
export const COUPON_OPTIONS = [0, 5, 10, 15, 30];

export function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function formatINR2(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- Upgrade Credit Calculation ---

export function calculateUpgradeCredit(
  currentPlan: PlanName,
  currentDuration: Duration,
  startDate: Date
): number {
  const years = DURATION_YEARS[currentDuration];
  const totalDays = years * 365;
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const planEndDate = new Date(start);
  planEndDate.setDate(planEndDate.getDate() + totalDays);
  const today = new Date();
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const remainingDays = Math.max(0, Math.round((planEndDate.getTime() - todayNorm.getTime()) / (1000 * 60 * 60 * 24)));
  const annualDiscounted = ANNUAL_DISCOUNTED.fresh[currentPlan];
  const credit = Math.round(annualDiscounted * years * remainingDays / totalDays);
  return credit;
}

export interface PriceBreakdown {
  originalPrice: number;
  planDiscountPercent: number;
  actualPlanDiscountPercent: number;
  planDiscountAmount: number;
  priceAfterPlanDiscount: number;
  multiYearDiscountPercent: number;
  multiYearDiscountAmount: number;
  priceAfterMultiYear: number;
  couponDiscountPercent: number;
  couponDiscountAmount: number;
  priceAfterCoupon: number;
  totalDiscountAmount: number;
  totalDiscountPercent: number;
  upgradeCredit: number;
  gstAmount: number;
  totalPrice: number;
}

export function calculateBreakdown(
  plan: PlanName,
  duration: Duration,
  couponPercent: number,
  userType: UserType,
  upgradeCredit: number = 0
): PriceBreakdown {
  const originalPrice = MRP_TABLES[userType][plan][duration];
  const years = DURATION_YEARS[duration];
  const annualDiscounted = ANNUAL_DISCOUNTED[userType][plan];
  const priceAfterPlanDiscount = annualDiscounted * years;
  const planDiscountAmount = originalPrice - priceAfterPlanDiscount;

  const planDiscountPercent = PLAN_DISCOUNTS[plan];
  const actualPlanDiscountPercent = ACTUAL_PLAN_DISCOUNTS[plan];

  const multiYearDiscountPercent = MULTI_YEAR_DISCOUNTS[duration];
  const multiYearDiscountAmount = Math.round(priceAfterPlanDiscount * multiYearDiscountPercent / 100);
  const priceAfterMultiYear = priceAfterPlanDiscount - multiYearDiscountAmount;

  const couponDiscountPercent = couponPercent;
  const couponDiscountAmount = Math.round(priceAfterMultiYear * couponDiscountPercent / 100);
  const priceAfterCoupon = priceAfterMultiYear - couponDiscountAmount;

  const totalDiscountAmount = originalPrice - priceAfterCoupon;
  const compoundedDiscount = 1 - (1 - actualPlanDiscountPercent / 100) * (1 - multiYearDiscountPercent / 100) * (1 - couponDiscountPercent / 100);
  const totalDiscountPercent = Math.round(compoundedDiscount * 100);

  const priceAfterCredit = Math.max(0, priceAfterCoupon - upgradeCredit);
  const gstAmount = Math.round(priceAfterCredit * GST_RATE / 100);
  const totalPrice = priceAfterCredit + gstAmount;

  return {
    originalPrice, planDiscountPercent, actualPlanDiscountPercent,
    planDiscountAmount, priceAfterPlanDiscount,
    multiYearDiscountPercent, multiYearDiscountAmount, priceAfterMultiYear,
    couponDiscountPercent, couponDiscountAmount, priceAfterCoupon,
    totalDiscountAmount, totalDiscountPercent,
    upgradeCredit, gstAmount, totalPrice,
  };
}

export const USER_TYPE_LABELS: Record<UserType, string> = {
  fresh: "Fresh Plan Purchase",
  renewal_after: "Renewal (after 16 Feb 2024)",
  renewal_before: "Renewal (before 16 Feb 2024)",
  upgrade: "Upgrade (existing user)",
};
