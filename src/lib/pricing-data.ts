// All prices are Ex-GST in INR

export type PlanName = "silver" | "diamond" | "platinum" | "enterprise";
export type Platform = "android" | "web";

export const PLAN_PLATFORM: Record<PlanName, Platform[]> = {
  silver: ["android"],
  diamond: ["android", "web"],
  platinum: ["android", "web"],
  enterprise: ["android", "web"],
};
export type Duration = "1yr" | "2yr" | "3yr" | "4yr" | "5yr" | "6yr" | "7yr" | "8yr" | "9yr" | "10yr";
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

const ANNUAL_PRICES: Record<string, Record<PlanName, number>> = {
  fresh: { silver: 399, diamond: 2599, platinum: 2999, enterprise: 4999 },
  renewal_after: { silver: 399, diamond: 2599, platinum: 3999, enterprise: 5999 },
  renewal_before: { silver: 399, diamond: 2599, platinum: 5999, enterprise: 8999 },
};
// Upgrade uses same pricing as renewal_after
ANNUAL_PRICES.upgrade = ANNUAL_PRICES.renewal_after;

function backCalculateMRP(discounted: number, actualDiscountPercent: number): number {
  return Math.round(discounted / (1 - actualDiscountPercent / 100));
}

function buildPlans(userType: UserType): PlanInfo[] {
  return PLAN_META.map((meta) => {
    const discounted = ANNUAL_PRICES[userType][meta.key];
    const mrp = backCalculateMRP(discounted, meta.actualDiscountPercent);
    return {
      ...meta,
      annualMRP: mrp,
      annualDiscounted: discounted,
      monthlyMRP: Math.round(mrp / 12),
      monthlyDiscounted: Math.round(discounted / 12),
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
  const durations: Duration[] = ["1yr", "2yr", "3yr", "4yr", "5yr", "6yr", "7yr", "8yr", "9yr", "10yr"];
  const years = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const result = {} as Record<PlanName, Record<Duration, number>>;
  for (const meta of PLAN_META) {
    result[meta.key] = {} as Record<Duration, number>;
    const annualDiscounted = ANNUAL_PRICES[userType][meta.key];
    durations.forEach((d, i) => {
      result[meta.key][d] = backCalculateMRP(annualDiscounted * years[i], meta.actualDiscountPercent);
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
  "1yr": 1, "2yr": 2, "3yr": 3, "4yr": 4, "5yr": 5, "6yr": 6, "7yr": 7, "8yr": 8, "9yr": 9, "10yr": 10,
};

export const PLAN_DISCOUNTS: Record<PlanName, number> = {
  silver: 27, diamond: 28, platinum: 50, enterprise: 44,
};

export const ACTUAL_PLAN_DISCOUNTS: Record<PlanName, number> = {
  silver: 27.32, diamond: 27.79, platinum: 50.01, enterprise: 44.45,
};

export const MULTI_YEAR_DISCOUNTS: Record<Duration, number> = {
  "1yr": 0, "2yr": 5, "3yr": 10, "4yr": 10, "5yr": 15, "6yr": 15, "7yr": 25, "8yr": 25, "9yr": 25, "10yr": 30,
};

export const OLD_MULTI_YEAR_DISCOUNTS: Record<Duration, number> = {
  "1yr": 0, "2yr": 15, "3yr": 20, "4yr": 20, "5yr": 30, "6yr": 30, "7yr": 35, "8yr": 35, "9yr": 35, "10yr": 40,
};

export const DURATIONS: { key: Duration; label: string; extraOff: string }[] = [
  { key: "1yr", label: "1 Year", extraOff: "" },
  { key: "2yr", label: "2 Years", extraOff: "5% extra off" },
  { key: "3yr", label: "3 Years", extraOff: "10% extra off" },
  { key: "4yr", label: "4 Years", extraOff: "10% extra off" },
  { key: "5yr", label: "5 Years", extraOff: "15% extra off" },
  { key: "6yr", label: "6 Years", extraOff: "15% extra off" },
  { key: "7yr", label: "7 Years", extraOff: "25% extra off" },
  { key: "8yr", label: "8 Years", extraOff: "25% extra off" },
  { key: "9yr", label: "9 Years", extraOff: "25% extra off" },
  { key: "10yr", label: "10 Years", extraOff: "30% extra off" },
];

export const GST_RATE = 18;
export const COUPON_OPTIONS = [0, 5, 10, 15, 30];

// --- Enterprise Business & User Customization ---

export const ENTERPRISE_BASE = { businesses: 2, users: 3 };
export const ENTERPRISE_EXTRA_BUSINESS_COST = 1000; // discounted, per additional business
export const ENTERPRISE_MAX_BUSINESSES = 5; // 6+ = contact sales
export const ENTERPRISE_MAX_USERS = 15; // 16+ = contact sales

// Cumulative addon from base 3 users (discounted price)
export const ENTERPRISE_USER_SLAB_COSTS: { maxUsers: number; addon: number; label: string }[] = [
  { maxUsers: 3, addon: 0, label: "3" },
  { maxUsers: 4, addon: 500, label: "4" },
  { maxUsers: 5, addon: 1000, label: "5" },
  { maxUsers: 10, addon: 2000, label: "6-10" },
  { maxUsers: 15, addon: 5000, label: "11-15" },
];

export type EnterpriseUserSlab = 3 | 4 | 5 | 10 | 15 | 16;

export const ENTERPRISE_USER_STEPS: EnterpriseUserSlab[] = [3, 4, 5, 10, 15, 16];

export function getEnterpriseUserSlabLabel(slab: EnterpriseUserSlab): string {
  if (slab === 10) return "6-10";
  if (slab === 15) return "11-15";
  if (slab === 16) return "16+";
  return String(slab);
}

export function getEnterpriseUserAddon(userSlab: EnterpriseUserSlab): number {
  const entry = ENTERPRISE_USER_SLAB_COSTS.find((s) => s.maxUsers === userSlab);
  return entry?.addon ?? 0;
}

export interface EnterpriseAddonResult {
  addonCost: number;
  contactSales: boolean;
  businessAddon: number;
  userAddon: number;
}

export function getEnterpriseAddon(businesses: number, userSlab: EnterpriseUserSlab): EnterpriseAddonResult {
  if (businesses > ENTERPRISE_MAX_BUSINESSES || userSlab > ENTERPRISE_MAX_USERS) {
    return { addonCost: 0, contactSales: true, businessAddon: 0, userAddon: 0 };
  }
  const businessAddon = Math.max(0, businesses - ENTERPRISE_BASE.businesses) * ENTERPRISE_EXTRA_BUSINESS_COST;
  const userAddon = getEnterpriseUserAddon(userSlab);
  return { addonCost: businessAddon + userAddon, contactSales: false, businessAddon, userAddon };
}

export function getEnterpriseMRP(discountedTotal: number): number {
  return Math.round(discountedTotal / (1 - ACTUAL_PLAN_DISCOUNTS.enterprise / 100));
}

export function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function formatINR2(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- Upgrade Credit Calculation ---

export interface UpgradeCreditResult {
  credit: number;
  totalPaid: number;
  ppd: number;
  remainingDays: number;
  totalDays: number;
  multiYearDiscountPercent: number;
  annualDiscounted: number;
  years: number;
  subtotal: number;
}

export function calculateUpgradeCredit(
  currentPlan: PlanName,
  currentDuration: Duration,
  startDate: Date,
  enterpriseAddon: number = 0,
  currentPlanPurchaseType: UserType = "fresh",
  multiYearDiscountOverride?: number
): UpgradeCreditResult {
  const years = DURATION_YEARS[currentDuration];
  const totalDays = years * 365;
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const planEndDate = new Date(start);
  planEndDate.setDate(planEndDate.getDate() + totalDays);
  const today = new Date();
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const remainingDays = Math.max(0, Math.round((planEndDate.getTime() - todayNorm.getTime()) / (1000 * 60 * 60 * 24)));
  const annualDiscounted = ANNUAL_DISCOUNTED[currentPlanPurchaseType][currentPlan] + enterpriseAddon;
  const subtotal = annualDiscounted * years;
  const multiYearDiscountPercent = multiYearDiscountOverride ?? MULTI_YEAR_DISCOUNTS[currentDuration];
  const totalPaid = Math.round(subtotal * (1 - multiYearDiscountPercent / 100) * 100) / 100;
  const ppd = totalPaid / totalDays;
  const credit = Math.round(ppd * remainingDays);
  return { credit, totalPaid, ppd, remainingDays, totalDays, multiYearDiscountPercent, annualDiscounted, years, subtotal };
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
  upgradeCredit: number = 0,
  enterpriseAddon: number = 0
): PriceBreakdown {
  const years = DURATION_YEARS[duration];
  const baseAnnualDiscounted = ANNUAL_DISCOUNTED[userType][plan];
  const annualDiscounted = baseAnnualDiscounted + (plan === "enterprise" ? enterpriseAddon : 0);
  const originalPrice = plan === "enterprise"
    ? backCalculateMRP(annualDiscounted * years, ACTUAL_PLAN_DISCOUNTS[plan])
    : MRP_TABLES[userType][plan][duration];
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
