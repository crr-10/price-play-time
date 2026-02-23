// All prices are Ex-GST in INR

export type PlanName = "diamond" | "platinum" | "enterprise";
export type Duration = "1yr" | "2yr" | "3yr" | "5yr" | "10yr";
export type UserType = "new" | "renewal";

export interface PlanInfo {
  name: string;
  key: PlanName;
  monthlyMRP: number;
  monthlyDiscounted: number;
  annualMRP: number;
  annualDiscounted: number;
  discountPercent: number;
}

export const PLANS: PlanInfo[] = [
  {
    name: "Diamond",
    key: "diamond",
    monthlyMRP: 300,
    monthlyDiscounted: 217,
    annualMRP: 3599,
    annualDiscounted: 2599,
    discountPercent: 28,
  },
  {
    name: "Platinum",
    key: "platinum",
    monthlyMRP: 500,
    monthlyDiscounted: 250,
    annualMRP: 5999,
    annualDiscounted: 2999,
    discountPercent: 50,
  },
  {
    name: "Enterprise",
    key: "enterprise",
    monthlyMRP: 750,
    monthlyDiscounted: 417,
    annualMRP: 8999,
    annualDiscounted: 4999,
    discountPercent: 44,
  },
];

// MRP (Ex GST) for each plan × duration
export const MRP_TABLE: Record<PlanName, Record<Duration, number>> = {
  diamond:    { "1yr": 3599, "2yr": 7198,  "3yr": 10797, "5yr": 17995, "10yr": 35990 },
  platinum:   { "1yr": 5999, "2yr": 11998, "3yr": 17997, "5yr": 29995, "10yr": 59990 },
  enterprise: { "1yr": 8999, "2yr": 17998, "3yr": 26997, "5yr": 44995, "10yr": 89990 },
};

// Placeholder — same as new user until renewal data is shared
export const MRP_TABLE_RENEWAL: Record<PlanName, Record<Duration, number>> = {
  diamond:    { "1yr": 3599, "2yr": 7198,  "3yr": 10797, "5yr": 17995, "10yr": 35990 },
  platinum:   { "1yr": 5999, "2yr": 11998, "3yr": 17997, "5yr": 29995, "10yr": 59990 },
  enterprise: { "1yr": 8999, "2yr": 17998, "3yr": 26997, "5yr": 44995, "10yr": 89990 },
};

export const PLAN_DISCOUNTS: Record<PlanName, number> = {
  diamond: 28,
  platinum: 50,
  enterprise: 44,
};

export const MULTI_YEAR_DISCOUNTS: Record<Duration, number> = {
  "1yr": 0,
  "2yr": 5,
  "3yr": 10,
  "5yr": 15,
  "10yr": 30,
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

export interface PriceBreakdown {
  originalPrice: number;
  planDiscountPercent: number;
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
  gstAmount: number;
  totalPrice: number;
}

export function calculateBreakdown(
  plan: PlanName,
  duration: Duration,
  couponPercent: number,
  userType: UserType
): PriceBreakdown {
  const table = userType === "new" ? MRP_TABLE : MRP_TABLE_RENEWAL;
  const originalPrice = table[plan][duration];
  const planDiscountPercent = PLAN_DISCOUNTS[plan];
  const planDiscountAmount = Math.round(originalPrice * planDiscountPercent / 100);
  const priceAfterPlanDiscount = originalPrice - planDiscountAmount;

  const multiYearDiscountPercent = MULTI_YEAR_DISCOUNTS[duration];
  const multiYearDiscountAmount = Math.round(priceAfterPlanDiscount * multiYearDiscountPercent / 100);
  const priceAfterMultiYear = priceAfterPlanDiscount - multiYearDiscountAmount;

  const couponDiscountPercent = couponPercent;
  const couponDiscountAmount = Math.round(priceAfterMultiYear * couponDiscountPercent / 100);
  const priceAfterCoupon = priceAfterMultiYear - couponDiscountAmount;

  const totalDiscountAmount = originalPrice - priceAfterCoupon;
  const totalDiscountPercent = originalPrice > 0 ? Math.round((totalDiscountAmount / originalPrice) * 100) : 0;

  const gstAmount = Math.round(priceAfterCoupon * GST_RATE / 100);
  const totalPrice = priceAfterCoupon + gstAmount;

  return {
    originalPrice,
    planDiscountPercent,
    planDiscountAmount,
    priceAfterPlanDiscount,
    multiYearDiscountPercent,
    multiYearDiscountAmount,
    priceAfterMultiYear,
    couponDiscountPercent,
    couponDiscountAmount,
    priceAfterCoupon,
    totalDiscountAmount,
    totalDiscountPercent,
    gstAmount,
    totalPrice,
  };
}
