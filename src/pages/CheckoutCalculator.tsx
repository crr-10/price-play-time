import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Plus, Minus, Phone, Info, Link2 } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import { toast } from "sonner";
import {
  type PlanName, type Duration, type UserType, type Platform, type EnterpriseUserSlab,
  type BillingPeriod, type MonthlyVariant,
  PLANS_BY_TYPE, DURATIONS, DURATION_YEARS, MULTI_YEAR_DISCOUNTS, OLD_MULTI_YEAR_DISCOUNTS,
  COUPON_OPTIONS, USER_TYPE_LABELS, PLAN_PLATFORM,
  ENTERPRISE_BASE, ENTERPRISE_MAX_BUSINESSES, ENTERPRISE_USER_STEPS,
  getEnterpriseAddon, getEnterpriseUserSlabLabel,
  calculateBreakdown, calculateUpgradeCredit, calculateCustomUpgradeCredit, formatINR, formatINR2,
  MONTHLY_PRICES, MONTHLY_DISCOUNTED_FIRST_MONTH, GST_RATE,
  MONTHLY_PLAN_DAYS, MONTHLY_CREDIT_DAYS,
  calculateMonthlyBreakdown, calculateMonthlyToMonthlyUpgrade, calculateMonthlyToYearlyUpgrade,
  calculateMonthlyUpgradeCredit,
} from "@/lib/pricing-data";

const USER_TYPES: UserType[] = ["fresh", "renewal_after", "renewal_before", "upgrade"];
const PLAN_ORDER: PlanName[] = ["silver", "diamond", "platinum", "enterprise"];

const CheckoutCalculator = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [plan, setPlan] = useState<PlanName>(
    (["silver", "diamond", "platinum", "enterprise"].includes(searchParams.get("plan") || "")
      ? searchParams.get("plan") as PlanName : "platinum")
  );
  const [duration, setDuration] = useState<Duration>(
    (searchParams.get("duration") as Duration) || "1yr"
  );
  const [coupon, setCoupon] = useState<number>(
    Number(searchParams.get("coupon")) || 0
  );
  const [customCoupon, setCustomCoupon] = useState<string>("");
  const [useCustomCoupon, setUseCustomCoupon] = useState(false);
  const [userType, setUserType] = useState<UserType>(
    (["fresh", "renewal_after", "renewal_before", "upgrade"].includes(searchParams.get("userType") || "")
      ? searchParams.get("userType") as UserType : "fresh")
  );
  const [discountOpen, setDiscountOpen] = useState(searchParams.get("custom") === "1");
  const [ppdOpen, setPpdOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>(
    searchParams.get("platform") === "web" ? "web" : "android"
  );
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(
    searchParams.get("billing") === "monthly" ? "monthly" : "yearly"
  );
  const [monthlyVariant, setMonthlyVariant] = useState<MonthlyVariant>(
    searchParams.get("variant") === "B" ? "B" : "A"
  );
  const [monthlyIsFirstMonth, setMonthlyIsFirstMonth] = useState(true);

  // Enterprise customization
  const [businesses, setBusinesses] = useState<number>(
    Number(searchParams.get("biz")) || ENTERPRISE_BASE.businesses
  );
  const [userSlab, setUserSlab] = useState<EnterpriseUserSlab>(
    (Number(searchParams.get("users")) || 3) as EnterpriseUserSlab
  );

  // Upgrade-specific state
  const [currentPlan, setCurrentPlan] = useState<PlanName>(
    (["silver", "diamond", "platinum", "enterprise"].includes(searchParams.get("currentPlan") || "")
      ? searchParams.get("currentPlan") as PlanName : "diamond")
  );
  const [startDate, setStartDate] = useState<string>(
    searchParams.get("startDate") || format(new Date(), "yyyy-MM-dd")
  );
  const [currentDuration, setCurrentDuration] = useState<Duration>(
    (searchParams.get("currentDuration") as Duration) || "1yr"
  );
  const [currentBillingPeriod, setCurrentBillingPeriod] = useState<BillingPeriod>(
    searchParams.get("currentBilling") === "monthly" ? "monthly" : "yearly"
  );
  const [currentBusinesses, setCurrentBusinesses] = useState<number>(
    Number(searchParams.get("currentBiz")) || ENTERPRISE_BASE.businesses
  );
  const [currentUserSlab, setCurrentUserSlab] = useState<EnterpriseUserSlab>(
    (Number(searchParams.get("currentUsers")) || 3) as EnterpriseUserSlab
  );
  const [currentPlanPurchaseType, setCurrentPlanPurchaseType] = useState<UserType>(
    (["fresh", "renewal_after", "renewal_before"].includes(searchParams.get("purchaseType") || "")
      ? searchParams.get("purchaseType") as UserType : "fresh")
  );
  const [useOldMultiYearDiscount, setUseOldMultiYearDiscount] = useState(
    searchParams.get("oldDiscount") === "1"
  );
  // Custom pricing (sales-sold plans) — yearly current plans only
  const [useCustomPricing, setUseCustomPricing] = useState(searchParams.get("custom") === "1");
  const [customAmountPaid, setCustomAmountPaid] = useState<string>(
    searchParams.get("customAmount") || "10000"
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    searchParams.get("customEnd") || format(addDays(new Date(), 365), "yyyy-MM-dd")
  );

  // Derived
  const isUpgrade = userType === "upgrade";
  const isMonthly = billingPeriod === "monthly";
  const isCurrentMonthly = currentBillingPeriod === "monthly";
  const isEnterprise = plan === "enterprise";
  const isCurrentEnterprise = currentPlan === "enterprise";


  // Sync state to URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (plan !== "platinum") params.plan = plan;
    if (billingPeriod !== "yearly") params.billing = billingPeriod;
    if (isMonthly && monthlyVariant !== "A") params.variant = monthlyVariant;
    if (duration !== "1yr" && !isMonthly) params.duration = duration;
    if (platform !== "android") params.platform = platform;
    if (userType !== "fresh") params.userType = userType;
    const effectiveCouponVal = useCustomCoupon ? Math.min(100, Math.max(0, Number(customCoupon) || 0)) : coupon;
    if (effectiveCouponVal > 0 && !isMonthly) params.coupon = String(effectiveCouponVal);
    if (plan === "enterprise" && !isMonthly) {
      if (businesses !== ENTERPRISE_BASE.businesses) params.biz = String(businesses);
      if (userSlab !== 3) params.users = String(userSlab);
    }
    if (isUpgrade) {
      if (currentPlan !== "diamond") params.currentPlan = currentPlan;
      if (isCurrentMonthly) {
        params.currentBilling = "monthly";
      } else {
        if (currentDuration !== "1yr") params.currentDuration = currentDuration;
      }
      if (startDate !== format(new Date(), "yyyy-MM-dd")) params.startDate = startDate;
      if (!isCurrentMonthly && currentPlanPurchaseType !== "fresh") params.purchaseType = currentPlanPurchaseType;
      if (!isCurrentMonthly && useOldMultiYearDiscount) params.oldDiscount = "1";
      if (currentPlan === "enterprise") {
        if (currentBusinesses !== ENTERPRISE_BASE.businesses) params.currentBiz = String(currentBusinesses);
        if (currentUserSlab !== 3) params.currentUsers = String(currentUserSlab);
      }
    }
    if (isUpgrade && useCustomPricing && !isCurrentMonthly) {
      params.custom = "1";
      params.customAmount = customAmountPaid;
      params.customEnd = customEndDate;
    }
    setSearchParams(params, { replace: true });
  }, [plan, duration, billingPeriod, monthlyVariant, platform, userType, coupon, customCoupon, useCustomCoupon, businesses, userSlab, currentPlan, startDate, currentDuration, currentBillingPeriod, currentBusinesses, currentUserSlab, currentPlanPurchaseType, useOldMultiYearDiscount, useCustomPricing, customAmountPaid, customEndDate]);

  const effectiveCoupon = useCustomCoupon
    ? Math.min(100, Math.max(0, Number(customCoupon) || 0))
    : coupon;

  // Enterprise addon
  const enterpriseResult = isEnterprise ? getEnterpriseAddon(businesses, userSlab) : null;
  const enterpriseAddon = enterpriseResult?.addonCost ?? 0;
  const contactSales = enterpriseResult?.contactSales ?? false;

  // Current enterprise addon for upgrade credit
  const currentEnterpriseResult = isUpgrade && isCurrentEnterprise
    ? getEnterpriseAddon(currentBusinesses, currentUserSlab)
    : null;
  const currentEnterpriseAddon = currentEnterpriseResult?.addonCost ?? 0;

  // Calculate remaining days for current plan
  const isCustomUpgrade = isUpgrade && useCustomPricing && !isCurrentMonthly;

  const currentPlanEndDate = isUpgrade
    ? isCurrentMonthly
      ? addDays(new Date(startDate), MONTHLY_PLAN_DAYS)
      : isCustomUpgrade
        ? new Date(customEndDate)
        : addDays(new Date(startDate), DURATION_YEARS[currentDuration] * 365)
    : null;

  const currentRemainingDays = isUpgrade && currentPlanEndDate
    ? Math.max(0, differenceInDays(currentPlanEndDate, new Date()))
    : 0;

  // Enterprise-to-Enterprise no upgrade check
  const isEnterpriseNoUpgrade = isUpgrade && isEnterprise && isCurrentEnterprise
    && businesses === currentBusinesses && userSlab === currentUserSlab
    && !isCurrentMonthly && !isMonthly;

  // --- YEARLY UPGRADE CREDIT ---
  const multiYearOverride = !isCurrentMonthly && currentDuration !== "1yr" && useOldMultiYearDiscount
    ? OLD_MULTI_YEAR_DISCOUNTS[currentDuration]
    : undefined;
  // Sales inputs amount INCLUDING GST; strip GST (18%) before credit calc
  const customAmountExGst = (Number(customAmountPaid) || 0) / 1.18;
  const customCreditResult = isCustomUpgrade
    ? calculateCustomUpgradeCredit(customAmountExGst, new Date(startDate), new Date(customEndDate))
    : null;
  // Always compute the standard credit (even when custom override is on) so it can be shown for reference
  const standardUpgradeCreditResult = isUpgrade && !isCurrentMonthly
    ? calculateUpgradeCredit(currentPlan, currentDuration, new Date(startDate), isCurrentEnterprise ? currentEnterpriseAddon : 0, currentPlanPurchaseType, multiYearOverride)
    : null;
  // Unified shape used by downstream UI/effects
  const upgradeCreditResult = isCustomUpgrade && customCreditResult
    ? {
        credit: customCreditResult.credit,
        totalPaid: customCreditResult.totalPaid,
        ppd: customCreditResult.ppd,
        remainingDays: customCreditResult.remainingDays,
        totalDays: customCreditResult.totalDays,
        multiYearDiscountPercent: 0,
        annualDiscounted: 0,
        years: 0,
        subtotal: 0,
      }
    : standardUpgradeCreditResult;
  const yearlyUpgradeCredit = upgradeCreditResult?.credit ?? 0;

  // --- MONTHLY UPGRADE CREDIT ---
  const monthlyUpgradeCreditResult = isUpgrade && isCurrentMonthly
    ? calculateMonthlyUpgradeCredit(currentPlan, currentRemainingDays)
    : null;

  // Auto-switch plan if not available on current platform
  const allPlans = PLANS_BY_TYPE[userType];
  const platformPlans = allPlans.filter((p) => PLAN_PLATFORM[p.key].includes(platform));

  useEffect(() => {
    if (!PLAN_PLATFORM[plan].includes(platform) && platformPlans.length > 0) {
      setPlan(platformPlans[0].key);
    }
  }, [platform, plan]);

  // Auto-adjust duration upward if below minimum for yearly upgrade
  useEffect(() => {
    if (!isUpgrade || isMonthly) return;
    const remainingDays = isCurrentMonthly ? 0 : (upgradeCreditResult?.remainingDays ?? 0);
    const minUpgradeYears = Math.max(1, Math.ceil(remainingDays / 365));
    if (DURATION_YEARS[duration] < minUpgradeYears) {
      const validDuration = DURATIONS.find((d) => DURATION_YEARS[d.key] >= minUpgradeYears);
      if (validDuration) setDuration(validDuration.key);
    }
  }, [isUpgrade, isMonthly, isCurrentMonthly, upgradeCreditResult?.remainingDays, duration]);

  // Enforce upgrade constraints
  const minBusinesses = isUpgrade && isCurrentEnterprise && isEnterprise ? currentBusinesses : ENTERPRISE_BASE.businesses;
  const minUserSlabIdx = isUpgrade && isCurrentEnterprise && isEnterprise
    ? ENTERPRISE_USER_STEPS.indexOf(currentUserSlab)
    : 0;

  // --- PRICE CALCULATIONS ---
  // Monthly purchase (non-upgrade)
  const monthlyBreakdown = isMonthly && !isUpgrade
    ? calculateMonthlyBreakdown(plan, monthlyVariant, monthlyIsFirstMonth)
    : null;

  // Monthly→Monthly upgrade
  const monthlyToMonthlyResult = isUpgrade && isCurrentMonthly && isMonthly
    ? calculateMonthlyToMonthlyUpgrade(currentPlan, plan, currentRemainingDays)
    : null;

  // Monthly→Yearly upgrade
  const monthlyToYearlyResult = isUpgrade && isCurrentMonthly && !isMonthly
    ? calculateMonthlyToYearlyUpgrade(currentPlan, plan, duration, currentRemainingDays, "fresh", isEnterprise ? enterpriseAddon : 0)
    : null;

  // Yearly purchase/upgrade (existing logic)
  // In custom upgrade mode, let the current plan purchase type drive the new plan's pricing tier
  // (renewal_before → renewal_before pricing; fresh/renewal_after → upgrade/renewal_after pricing)
  const effectiveBreakdownUserType: UserType = isCustomUpgrade
    ? (currentPlanPurchaseType === "renewal_before" ? "renewal_before" : "upgrade")
    : userType;
  const yearlyBreakdown = !isMonthly && !isCurrentMonthly
    ? (contactSales ? null : calculateBreakdown(plan, duration, isUpgrade ? 0 : effectiveCoupon, effectiveBreakdownUserType, isUpgrade ? yearlyUpgradeCredit : 0, enterpriseAddon))
    : !isMonthly && isCurrentMonthly
    ? null // handled by monthlyToYearlyResult
    : null;

  const selectedPlan = platformPlans.find((p) => p.key === plan) || platformPlans[0];

  const planEndDate = isUpgrade
    ? currentPlanEndDate
    : null;

  const currentPlanName = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);

  // User slab stepper
  const userSlabIdx = ENTERPRISE_USER_STEPS.indexOf(userSlab);
  const canDecUsers = userSlabIdx > Math.max(0, minUserSlabIdx);
  const canIncUsers = userSlabIdx < ENTERPRISE_USER_STEPS.length - 1;
  const decUsers = () => { if (canDecUsers) setUserSlab(ENTERPRISE_USER_STEPS[userSlabIdx - 1]); };
  const incUsers = () => { if (canIncUsers) setUserSlab(ENTERPRISE_USER_STEPS[userSlabIdx + 1]); };

  // Business stepper
  const canDecBiz = businesses > minBusinesses;
  const canIncBiz = businesses <= ENTERPRISE_MAX_BUSINESSES;
  const decBiz = () => { if (canDecBiz) setBusinesses(businesses - 1); };
  const incBiz = () => { if (canIncBiz) setBusinesses(businesses + 1); };

  // Filter plans for upgrade
  const getAvailablePlans = () => {
    if (!isUpgrade) return platformPlans;
    return platformPlans.filter((p) => {
      const newIdx = PLAN_ORDER.indexOf(p.key);
      const curIdx = PLAN_ORDER.indexOf(currentPlan);
      if (p.key === "enterprise" && currentPlan === "enterprise") return true;
      return newIdx > curIdx;
    });
  };
  const availableNewPlans = getAvailablePlans();

  // Same plan check for monthly→monthly
  const isMonthlyNoUpgrade = isUpgrade && isCurrentMonthly && isMonthly && currentPlan === plan;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Checkout</h1>
              <p className="text-xs text-muted-foreground">Pricing validation tool</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast("Scenario link copied!");
            }}>
              <Link2 className="h-3.5 w-3.5" /> Copy Scenario
            </Button>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs">Platform:</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                <SelectTrigger className="w-28 text-xs h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="android" className="text-xs">Android</SelectItem>
                  <SelectItem value="web" className="text-xs">Web</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs">User:</Label>
              <Select value={userType} onValueChange={(v) => setUserType(v as UserType)}>
                <SelectTrigger className="w-56 text-xs h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {USER_TYPES.map((ut) => (
                    <SelectItem key={ut} value={ut} className="text-xs">{USER_TYPE_LABELS[ut]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {userType !== "fresh" && userType !== "upgrade" && (
            <p className="text-xs text-muted-foreground">
              {userType === "renewal_after" ? "First plan purchased after 16 Feb 2024" : "First plan purchased before 16 Feb 2024"}
            </p>
          )}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Customise Plan (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Upgrade: Current Plan Details */}
            {isUpgrade && (
              <Card className="rounded-xl border-amber-200 bg-amber-50/50">
                <CardContent className="pt-5 pb-5">
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Current Plan Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Current Plan</Label>
                      <Select value={currentPlan} onValueChange={(v) => setCurrentPlan(v as PlanName)}>
                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="silver">Silver</SelectItem>
                          <SelectItem value="diamond">Diamond</SelectItem>
                          <SelectItem value="platinum">Platinum</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Current Billing</Label>
                      <Select value={currentBillingPeriod} onValueChange={(v) => setCurrentBillingPeriod(v as BillingPeriod)}>
                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Plan Start Date</Label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-background" />
                    </div>
                    {!isCurrentMonthly && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Plan Duration</Label>
                        <Select value={currentDuration} onValueChange={(v) => setCurrentDuration(v as Duration)}>
                          <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DURATIONS.map((d) => (
                              <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Custom pricing toggle (sales-sold plans, yearly current only) */}
                  {!isCurrentMonthly && (
                    <div className="mt-4 pt-3 border-t border-amber-200 space-y-2">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCustomPricing}
                          onChange={(e) => setUseCustomPricing(e.target.checked)}
                          className="accent-amber-600"
                        />
                        <Info className="h-3 w-3" />
                        Use custom pricing (sales-sold plan) — overrides credit only
                      </label>
                      {isCustomUpgrade && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Amount Paid (incl. GST)</Label>
                            <Input
                              type="number"
                              min={0}
                              value={customAmountPaid}
                              onChange={(e) => setCustomAmountPaid(e.target.value)}
                              placeholder="e.g. 12000"
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Plan End Date</Label>
                            <Input
                              type="date"
                              value={customEndDate}
                              onChange={(e) => setCustomEndDate(e.target.value)}
                              className="bg-background"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}


                  {/* Purchase type for yearly Platinum/Enterprise.
                      In custom-upgrade mode this drives the NEW plan's pricing tier,
                      so show it whenever the target (or current) plan is Platinum/Enterprise. */}
                  {!isCurrentMonthly && (
                    (isCustomUpgrade && (plan === "platinum" || plan === "enterprise")) ||
                    (!isCustomUpgrade && (currentPlan === "platinum" || currentPlan === "enterprise"))
                  ) && (
                    <div className="mt-4 pt-3 border-t border-amber-200 space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {isCustomUpgrade
                          ? "Customer category (drives new plan pricing tier)"
                          : "How was this plan originally purchased?"}
                      </Label>
                      <div className="flex flex-col gap-1.5">
                        {([
                          { value: "fresh", label: "First-time purchase" },
                          { value: "renewal_after", label: "Renewal (after 16 Feb 2024)" },
                          { value: "renewal_before", label: "Renewal (before 16 Feb 2024)" },
                        ] as { value: UserType; label: string }[]).map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                              type="radio"
                              name="currentPlanPurchaseType"
                              checked={currentPlanPurchaseType === opt.value}
                              onChange={() => setCurrentPlanPurchaseType(opt.value)}
                              className="accent-amber-600"
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Old vs New multi-year discount toggle (yearly only) */}
                  {!isCurrentMonthly && currentDuration !== "1yr" && (
                    <div className="mt-4 pt-3 border-t border-amber-200 space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Multi-year discount slab used at purchase
                      </Label>
                      <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input type="radio" name="multiYearDiscountSlab" checked={!useOldMultiYearDiscount}
                            onChange={() => setUseOldMultiYearDiscount(false)} className="accent-amber-600" />
                          New discount slabs ({MULTI_YEAR_DISCOUNTS[currentDuration]}%)
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input type="radio" name="multiYearDiscountSlab" checked={useOldMultiYearDiscount}
                            onChange={() => setUseOldMultiYearDiscount(true)} className="accent-amber-600" />
                          Old discount slabs ({OLD_MULTI_YEAR_DISCOUNTS[currentDuration]}%)
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Enterprise current config */}
                  {isCurrentEnterprise && (
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-amber-200">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Current Businesses</Label>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={() => setCurrentBusinesses(Math.max(ENTERPRISE_BASE.businesses, currentBusinesses - 1))}
                            disabled={currentBusinesses <= ENTERPRISE_BASE.businesses}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium text-sm">{currentBusinesses}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={() => setCurrentBusinesses(Math.min(ENTERPRISE_MAX_BUSINESSES, currentBusinesses + 1))}
                            disabled={currentBusinesses >= ENTERPRISE_MAX_BUSINESSES}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Current Users</Label>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={() => {
                              const idx = ENTERPRISE_USER_STEPS.indexOf(currentUserSlab);
                              if (idx > 0) setCurrentUserSlab(ENTERPRISE_USER_STEPS[idx - 1]);
                            }}
                            disabled={currentUserSlab <= 3}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center font-medium text-sm">{getEnterpriseUserSlabLabel(currentUserSlab)}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={() => {
                              const idx = ENTERPRISE_USER_STEPS.indexOf(currentUserSlab);
                              if (idx < ENTERPRISE_USER_STEPS.length - 2) setCurrentUserSlab(ENTERPRISE_USER_STEPS[idx + 1]);
                            }}
                            disabled={ENTERPRISE_USER_STEPS.indexOf(currentUserSlab) >= ENTERPRISE_USER_STEPS.length - 2}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-amber-700">
                    <span>
                      Plan ends: <strong>{currentPlanEndDate ? format(currentPlanEndDate, "dd MMM yyyy") : "—"}</strong>
                      {" "}({currentRemainingDays} days remaining)
                    </span>
                    {isCurrentMonthly && monthlyUpgradeCreditResult && (
                      <span>
                        Credit: <strong className="text-emerald-700">{formatINR(monthlyUpgradeCreditResult.credit)}</strong>
                      </span>
                    )}
                    {!isCurrentMonthly && (
                      <span className="flex items-center gap-3">
                        {isCustomUpgrade && standardUpgradeCreditResult && (
                          <span className="text-muted-foreground">
                            Standard: <span className="line-through">{formatINR(standardUpgradeCreditResult.credit)}</span>
                          </span>
                        )}
                        <span>
                          {isCustomUpgrade ? "Custom credit" : "Credit"}: <strong className="text-emerald-700">{formatINR(yearlyUpgradeCredit)}</strong>
                        </span>
                      </span>
                    )}
                  </div>

                  {/* PPD Breakdown for yearly */}
                  {upgradeCreditResult && !isCurrentMonthly && (
                    <Collapsible open={ppdOpen} onOpenChange={setPpdOpen} className="mt-3 border-t border-amber-200 pt-3">
                      <CollapsibleTrigger className="flex items-center gap-1 text-xs font-semibold text-amber-800 w-full">
                        Credit Calculation (PPD Breakdown)
                        {ppdOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1.5 text-xs text-muted-foreground pt-2">
                        {isCustomUpgrade ? (
                          <>
                            <div className="flex justify-between text-amber-700">
                              <span>Pricing Source</span>
                              <span className="font-medium">Custom (sales-sold)</span>
                            </div>
                            <div className="flex justify-between font-medium text-foreground">
                              <span>Total Paid (ex-GST)</span>
                              <span>{formatINR2(upgradeCreditResult.totalPaid)}</span>
                            </div>
                            <div className="border-t border-dashed border-amber-200 my-1" />
                            <div className="flex justify-between">
                              <span>Total Days (Start → End)</span>
                              <span>{upgradeCreditResult.totalDays}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Remaining Days</span>
                              <span>{upgradeCreditResult.remainingDays}</span>
                            </div>
                            <div className="flex justify-between font-medium text-foreground">
                              <span>PPD (Total Paid ÷ Total Days)</span>
                              <span>{formatINR2(upgradeCreditResult.ppd)}</span>
                            </div>
                            <div className="border-t border-dashed border-amber-200 my-1" />
                            <div className="flex justify-between font-semibold text-emerald-700">
                              <span>Credit (PPD × Remaining Days)</span>
                              <span>{formatINR(upgradeCreditResult.credit)}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            {(currentPlan === "platinum" || currentPlan === "enterprise") && (
                              <div className="flex justify-between text-amber-700">
                                <span>Purchase Type</span>
                                <span className="font-medium">
                                  {currentPlanPurchaseType === "fresh" ? "First-time" : currentPlanPurchaseType === "renewal_after" ? "Renewal (after Feb '24)" : "Renewal (before Feb '24)"}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Annual Discounted Price{isCurrentEnterprise && currentEnterpriseAddon > 0 ? " (incl. addons)" : ""}</span>
                              <span>{formatINR(upgradeCreditResult.annualDiscounted)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>× {upgradeCreditResult.years} year{upgradeCreditResult.years > 1 ? "s" : ""}</span>
                              <span>{formatINR(upgradeCreditResult.subtotal)}</span>
                            </div>
                            {upgradeCreditResult.multiYearDiscountPercent > 0 && (
                              <div className="flex justify-between text-emerald-700">
                                <span>Multi-year discount ({upgradeCreditResult.multiYearDiscountPercent}%)</span>
                                <span>- {formatINR(Math.round(upgradeCreditResult.subtotal * upgradeCreditResult.multiYearDiscountPercent / 100))}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-medium text-foreground">
                              <span>Total Paid (ex-GST)</span>
                              <span>{formatINR2(upgradeCreditResult.totalPaid)}</span>
                            </div>
                            <div className="border-t border-dashed border-amber-200 my-1" />
                            <div className="flex justify-between">
                              <span>Total Days</span>
                              <span>{upgradeCreditResult.totalDays}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Remaining Days</span>
                              <span>{upgradeCreditResult.remainingDays}</span>
                            </div>
                            <div className="flex justify-between font-medium text-foreground">
                              <span>PPD (Total Paid ÷ Total Days)</span>
                              <span>{formatINR2(upgradeCreditResult.ppd)}</span>
                            </div>
                            <div className="border-t border-dashed border-amber-200 my-1" />
                            <div className="flex justify-between font-semibold text-emerald-700">
                              <span>Credit (PPD × Remaining Days)</span>
                              <span>{formatINR(upgradeCreditResult.credit)}</span>
                            </div>
                          </>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Monthly credit breakdown */}
                  {isCurrentMonthly && monthlyUpgradeCreditResult && (
                    <Collapsible open={ppdOpen} onOpenChange={setPpdOpen} className="mt-3 border-t border-amber-200 pt-3">
                      <CollapsibleTrigger className="flex items-center gap-1 text-xs font-semibold text-amber-800 w-full">
                        Monthly Credit Calculation
                        {ppdOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1.5 text-xs text-muted-foreground pt-2">
                        <div className="flex justify-between">
                          <span>Current Plan Price</span>
                          <span>{formatINR(monthlyUpgradeCreditResult.currentPlanPrice)}/month</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Remaining Days</span>
                          <span>{monthlyUpgradeCreditResult.remainingDays}</span>
                        </div>
                        <div className="flex justify-between font-medium text-foreground">
                          <span>Formula</span>
                          <span>{formatINR(monthlyUpgradeCreditResult.currentPlanPrice)} × {monthlyUpgradeCreditResult.remainingDays} / {MONTHLY_CREDIT_DAYS}</span>
                        </div>
                        <div className="border-t border-dashed border-amber-200 my-1" />
                        <div className="flex justify-between font-semibold text-emerald-700">
                          <span>Credit</span>
                          <span>{formatINR(monthlyUpgradeCreditResult.credit)}</span>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Selected Plan */}
            <Card className="rounded-xl">
              <CardContent className="py-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="font-semibold">{isUpgrade ? "Upgrading to" : "Selected Plan"}</span>
                <Select value={plan} onValueChange={(v) => setPlan(v as PlanName)}>
                  <SelectTrigger className="w-auto border-0 bg-transparent font-semibold text-indigo-600 gap-1 px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(isUpgrade ? availableNewPlans : platformPlans).map((p) => (
                      <SelectItem key={p.key} value={p.key}>{p.name} Plan</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Inline new-plan price comparison across customer categories (custom upgrade only) */}
            {isCustomUpgrade && yearlyBreakdown && (plan === "platinum" || plan === "enterprise") && (
              <Card className="rounded-xl border-indigo-200 bg-indigo-50/40">
                <CardContent className="pt-4 pb-4 space-y-2">
                  <h4 className="font-semibold text-sm text-indigo-900">
                    New plan price by customer category
                  </h4>
                  <p className="text-xs text-muted-foreground -mt-1">
                    Same plan, duration, and add-ons — only the pricing tier changes. Selected tier is highlighted.
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs">
                    {([
                      { tier: "upgrade" as UserType, label: "First-time / Renewal (after Feb '24)", matches: ["fresh", "renewal_after"] },
                      { tier: "renewal_before" as UserType, label: "Renewal (before Feb '24)", matches: ["renewal_before"] },
                    ]).map(({ tier, label, matches }) => {
                      const b = calculateBreakdown(plan, duration, 0, tier, 0, enterpriseAddon);
                      const isSelected = matches.includes(currentPlanPurchaseType);
                      return (
                        <div
                          key={tier}
                          className={`flex items-center justify-between rounded-md px-3 py-2 border ${
                            isSelected
                              ? "bg-indigo-100 border-indigo-300 font-medium text-indigo-900"
                              : "bg-background border-border text-muted-foreground"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />}
                            {label}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-emerald-700">{b.totalDiscountPercent}% off</span>
                            <span className="line-through opacity-60">{formatINR(b.originalPrice)}</span>
                            <span className="font-semibold text-foreground">{formatINR(b.priceAfterCoupon)}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customise Plan */}
            <Card className="rounded-xl">
              <CardContent className="pt-5 pb-6 space-y-5">
                <h3 className="font-semibold text-base">Customise plan</h3>

                {/* Billing Period Toggle */}
                {(
                  <div className="flex items-center justify-between border-b border-dashed pb-4">
                    <span className="text-sm font-medium">Billing Period</span>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex rounded-md border bg-muted p-0.5">
                        <button
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            isMonthly ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                          }`}
                          onClick={() => setBillingPeriod("monthly")}
                        >
                          Monthly
                        </button>
                        <button
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            !isMonthly ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                          }`}
                          onClick={() => setBillingPeriod("yearly")}
                        >
                          Yearly
                        </button>
                      </div>
                    </div>
                  </div>
                )}

{/* Monthly experiment + first month toggle */}
                {isMonthly && (
                  <div className="flex items-center justify-between border-b border-dashed pb-4">
                    <div>
                      <span className="text-sm font-medium">Experiment Parameter</span>
                      <p className="text-xs text-muted-foreground">Discounted 1st month vs actual price</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select value={monthlyVariant} onValueChange={(v) => setMonthlyVariant(v as MonthlyVariant)}>
                        <SelectTrigger className="w-52 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A" className="text-xs">Discounted 1st month (₹2)</SelectItem>
                          <SelectItem value="B" className="text-xs">Actual price from month 1</SelectItem>
                        </SelectContent>
                      </Select>
                      {monthlyVariant === "A" && !isUpgrade && (
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input type="checkbox" checked={monthlyIsFirstMonth}
                              onChange={(e) => setMonthlyIsFirstMonth(e.target.checked)}
                              className="accent-indigo-600" />
                            1st month
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Duration (yearly only) */}
                {!isMonthly && (
                  <>
                    <div className="flex items-center justify-between border-b border-dashed pb-4">
                      <span className="text-sm font-medium">Plan Duration</span>
                      <Select value={duration} onValueChange={(v) => setDuration(v as Duration)}>
                        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DURATIONS.filter((d) => {
                            if (!isUpgrade || isCurrentMonthly) return true;
                            const remainingDays = upgradeCreditResult?.remainingDays ?? 0;
                            const minUpgradeYears = Math.max(1, Math.ceil(remainingDays / 365));
                            return DURATION_YEARS[d.key] >= minUpgradeYears;
                          }).map((d) => (
                            <SelectItem key={d.key} value={d.key}>
                              {d.label} {d.extraOff && `(${d.extraOff})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {isUpgrade && (
                      <p className="text-xs text-muted-foreground -mt-2">
                        New plan ends: <strong>
                          {monthlyToYearlyResult
                            ? format(addDays(new Date(), monthlyToYearlyResult.validityDays), "dd MMM yyyy")
                            : format(addDays(new Date(), DURATION_YEARS[duration] * 365), "dd MMM yyyy")}
                        </strong>
                        {monthlyToYearlyResult?.isSameTier && (
                          <span className="text-emerald-600 ml-1">(includes {currentRemainingDays} remaining days)</span>
                        )}
                      </p>
                    )}

                    {/* Multi-year banner */}
                    {duration === "1yr" && (
                      <div className="bg-emerald-50 text-emerald-700 text-xs rounded-md px-3 py-2 text-center">
                        💡 Buy a multi-year plan (2–10 years) to get up to 30% extra off
                      </div>
                    )}
                    {duration !== "1yr" && (
                      <div className="bg-emerald-50 text-emerald-700 text-xs rounded-md px-3 py-2 text-center">
                        ✅ {DURATIONS.find(d => d.key === duration)?.extraOff} applied!
                      </div>
                    )}
                  </>
                )}

                {/* Monthly info banner */}
                {isMonthly && !isUpgrade && (
                  <div className="bg-blue-50 text-blue-700 text-xs rounded-md px-3 py-2 text-center">
                    📱 Renews automatically every month. Cancel anytime.
                  </div>
                )}

                {/* Enterprise: Business & User selectors (yearly only) */}
                {isEnterprise && !isMonthly && (
                  <div className="border-t border-dashed pt-4 space-y-4">
                    <span className="text-sm font-medium">Enterprise Configuration</span>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm">Number of Businesses</span>
                        <p className="text-xs text-muted-foreground">Base: {ENTERPRISE_BASE.businesses} businesses</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={decBiz} disabled={!canDecBiz}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-10 text-center font-semibold text-sm">
                          {businesses > ENTERPRISE_MAX_BUSINESSES ? `${ENTERPRISE_MAX_BUSINESSES + 1}+` : businesses}
                        </span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={incBiz} disabled={!canIncBiz}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm">Number of Users</span>
                        <p className="text-xs text-muted-foreground">Base: {ENTERPRISE_BASE.users} users</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={decUsers} disabled={!canDecUsers}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-14 text-center font-semibold text-sm">{getEnterpriseUserSlabLabel(userSlab)}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={incUsers} disabled={!canIncUsers}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {contactSales && (
                      <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 flex items-center gap-3">
                        <Phone className="h-4 w-4 text-amber-600 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Contact Sales for Pricing</p>
                          <p className="text-xs text-amber-700">
                            For {businesses > ENTERPRISE_MAX_BUSINESSES ? `${businesses}+ businesses` : `${getEnterpriseUserSlabLabel(userSlab)} users`}, please contact our sales team.
                          </p>
                        </div>
                      </div>
                    )}
                    {isEnterpriseNoUpgrade && !contactSales && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3 flex items-center gap-3">
                        <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
                        <p className="text-sm text-blue-800">
                          Please select an option that is higher than your current plan.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Coupon (yearly, non-upgrade, non-renewal only) */}
                {!isMonthly && (
                  <div className={`border-t border-dashed pt-4 space-y-2 ${isUpgrade || userType === "renewal_after" || userType === "renewal_before" ? "opacity-50 pointer-events-none" : ""}`}>
                    <span className="text-sm font-medium">Coupon / Discount %</span>
                    {(isUpgrade || userType === "renewal_after" || userType === "renewal_before") && (
                      <p className="text-xs text-muted-foreground">Not applicable for {isUpgrade ? "upgrade" : "renewal"} users</p>
                    )}
                    {isMonthly && (
                      <p className="text-xs text-muted-foreground">Not applicable for monthly plans</p>
                    )}
                    {useCustomCoupon ? (
                      <div className="flex gap-2 items-center">
                        <Input type="number" placeholder="e.g. 12" value={customCoupon}
                          onChange={(e) => setCustomCoupon(e.target.value)} className="w-24" min={0} max={100} />
                        <span className="text-sm text-muted-foreground">%</span>
                        <Button variant="ghost" size="sm" onClick={() => { setUseCustomCoupon(false); setCustomCoupon(""); }}>Presets</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        {COUPON_OPTIONS.map((c) => (
                          <Button key={c} variant={coupon === c ? "default" : "outline"} size="sm" onClick={() => setCoupon(c)}>{c}%</Button>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => setUseCustomCoupon(true)}>Custom</Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Monthly no-coupon notice */}
                {isMonthly && (
                  <div className="border-t border-dashed pt-4">
                    <p className="text-xs text-muted-foreground">
                      ℹ️ Coupons and referral discounts are not applicable for monthly plans.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Price Details (2 cols, sticky) */}
          <div className="lg:col-span-2 lg:sticky lg:top-8 lg:self-start">
            <Card className="rounded-xl">
              <CardContent className="pt-6 pb-6">
                {/* Contact Sales */}
                {contactSales && !isMonthly ? (
                  <div className="text-center py-8 space-y-3">
                    <Phone className="h-10 w-10 text-amber-500 mx-auto" />
                    <h3 className="font-bold text-lg">Contact Sales</h3>
                    <p className="text-sm text-muted-foreground">Custom pricing is available for your enterprise configuration.</p>
                  </div>
                ) : isEnterpriseNoUpgrade ? (
                  <div className="text-center py-8 space-y-3">
                    <AlertCircle className="h-10 w-10 text-blue-500 mx-auto" />
                    <h3 className="font-bold text-lg">No Upgrade Selected</h3>
                    <p className="text-sm text-muted-foreground">Please select a higher configuration to see pricing.</p>
                  </div>
                ) : isMonthlyNoUpgrade ? (
                  <div className="text-center py-8 space-y-3">
                    <AlertCircle className="h-10 w-10 text-blue-500 mx-auto" />
                    <h3 className="font-bold text-lg">No Upgrade Selected</h3>
                    <p className="text-sm text-muted-foreground">Select a higher-tier plan to upgrade.</p>
                  </div>
                ) : isMonthly && !isUpgrade && monthlyBreakdown ? (
                  /* Monthly purchase breakdown */
                  <>
                    <h3 className="font-bold text-lg mb-5">Price Details — Monthly</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{selectedPlan?.name} Monthly Plan</span>
                        <span className="font-medium">{formatINR(monthlyBreakdown.baseAmount)}</span>
                      </div>
                      {monthlyBreakdown.isFirstMonth && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Intro Offer (1st month)</span>
                          <span className="font-medium">
                            <span className="line-through text-muted-foreground mr-1">{formatINR(MONTHLY_PRICES[plan])}</span>
                            {formatINR(MONTHLY_DISCOUNTED_FIRST_MONTH[plan])}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-muted-foreground">
                        <span>GST ({GST_RATE}%)</span>
                        <span>{formatINR(monthlyBreakdown.gstAmount)}</span>
                      </div>
                      <div className="border-t border-dashed border-border" />
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-base font-bold">Total Price</span>
                        <span className="text-xl font-bold text-primary">{formatINR(monthlyBreakdown.totalPrice)}</span>
                      </div>
                      {monthlyVariant === "A" && monthlyBreakdown.isFirstMonth && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          then {formatINR(MONTHLY_PRICES[plan])}/month + GST from 2nd month
                        </p>
                      )}
                    </div>
                  </>
                ) : isMonthly && isUpgrade && monthlyToMonthlyResult ? (
                  /* Monthly→Monthly upgrade breakdown */
                  <>
                    <h3 className="font-bold text-lg mb-5">Upgrade — Monthly → Monthly</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">New Plan ({selectedPlan?.name} Monthly)</span>
                        <span className="font-medium">{formatINR(monthlyToMonthlyResult.newPlanPrice)}</span>
                      </div>
                      <div className="flex justify-between text-amber-700">
                        <span>Credit for {currentPlanName} plan</span>
                        <span className="font-medium">- {formatINR(monthlyToMonthlyResult.credit)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Charge Now (ex-GST)</span>
                        <span>{formatINR(monthlyToMonthlyResult.chargeNow)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>GST ({GST_RATE}%)</span>
                        <span>{formatINR(monthlyToMonthlyResult.gstAmount)}</span>
                      </div>
                      <div className="border-t border-dashed border-border" />
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-base font-bold">Total Price</span>
                        <span className="text-xl font-bold text-primary">{formatINR(monthlyToMonthlyResult.totalPrice)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Next auto-debit: {formatINR(MONTHLY_PRICES[plan])}/month + GST after 30 days
                      </p>
                    </div>
                  </>
                ) : !isMonthly && isCurrentMonthly && monthlyToYearlyResult ? (
                  /* Monthly→Yearly upgrade breakdown */
                  <>
                    <h3 className="font-bold text-lg mb-5">Upgrade — Monthly → Yearly</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{selectedPlan?.name} ({duration.replace("yr", " Year")})</span>
                        <span className="font-medium">{formatINR(monthlyToYearlyResult.annualPrice)}</span>
                      </div>
                      {monthlyToYearlyResult.credit > 0 && (
                        <div className="flex justify-between text-amber-700">
                          <span>Credit for {currentPlanName} monthly</span>
                          <span className="font-medium">- {formatINR(monthlyToYearlyResult.credit)}</span>
                        </div>
                      )}
                      {monthlyToYearlyResult.isSameTier && (
                        <div className="flex justify-between text-blue-600">
                          <span>Same tier — no credit deducted</span>
                          <span className="text-xs">(+{currentRemainingDays} days added)</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold">
                        <span>Charge Now (ex-GST)</span>
                        <span>{formatINR(monthlyToYearlyResult.chargeNow)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>GST ({GST_RATE}%)</span>
                        <span>{formatINR(monthlyToYearlyResult.gstAmount)}</span>
                      </div>
                      <div className="border-t border-dashed border-border" />
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-base font-bold">Total Price</span>
                        <span className="text-xl font-bold text-primary">{formatINR(monthlyToYearlyResult.totalPrice)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Validity: {monthlyToYearlyResult.validityDays} days ({format(addDays(new Date(), monthlyToYearlyResult.validityDays), "dd MMM yyyy")})
                      </p>
                    </div>
                  </>
                ) : yearlyBreakdown && !isMonthly ? (
                  /* Yearly purchase/upgrade breakdown (existing) */
                  <>
                    <h3 className="font-bold text-lg mb-5">Price Details</h3>
                    <div className="space-y-3 text-sm">
                      {isCustomUpgrade && (plan === "platinum" || plan === "enterprise") && (
                        <div className="flex justify-between text-xs bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 -mt-2 mb-1">
                          <span className="text-amber-800">New plan pricing tier</span>
                          <span className="font-medium text-amber-900">
                            {effectiveBreakdownUserType === "renewal_before"
                              ? "Renewal (before Feb '24)"
                              : "Upgrade / Renewal (after Feb '24)"}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Original Price</span>
                        <span className="font-medium">{formatINR(yearlyBreakdown.originalPrice)}</span>
                      </div>
                      <Collapsible open={discountOpen} onOpenChange={setDiscountOpen}>
                        <CollapsibleTrigger className="flex justify-between w-full text-emerald-600">
                          <span className="flex items-center gap-1">
                            Total Discount ({yearlyBreakdown.totalDiscountPercent}%)
                            {discountOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </span>
                          <span className="font-medium">- {formatINR(yearlyBreakdown.totalDiscountAmount)}</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="pl-4 pt-2 space-y-2 text-muted-foreground text-xs">
                            <div className="flex justify-between">
                              <span>{yearlyBreakdown.actualPlanDiscountPercent}% Discount</span>
                              <span>- {formatINR(yearlyBreakdown.planDiscountAmount)}</span>
                            </div>
                            {yearlyBreakdown.multiYearDiscountPercent > 0 && (
                              <div className="flex justify-between">
                                <span>Multi Year Extra Off</span>
                                <span>- {formatINR(yearlyBreakdown.multiYearDiscountAmount)}</span>
                              </div>
                            )}
                            {yearlyBreakdown.couponDiscountPercent > 0 && (
                              <div className="flex justify-between">
                                <span>Coupon Discount ({yearlyBreakdown.couponDiscountPercent}%)</span>
                                <span>- {formatINR(yearlyBreakdown.couponDiscountAmount)}</span>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                      <div className="flex justify-between font-semibold">
                        <span>Price After Discount</span>
                        <span>{formatINR(yearlyBreakdown.priceAfterCoupon)}</span>
                      </div>
                      {isUpgrade && yearlyBreakdown.upgradeCredit > 0 && (
                        <div className="flex justify-between text-amber-700">
                          <span>Credit for current plan</span>
                          <span className="font-medium">- {formatINR(yearlyBreakdown.upgradeCredit)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-muted-foreground">
                        <span>GST (18%)</span>
                        <span>{formatINR(yearlyBreakdown.gstAmount)}</span>
                      </div>
                      <div className="border-t border-dashed border-border" />
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-base font-bold">Total Price</span>
                        <span className="text-xl font-bold text-primary">{formatINR(yearlyBreakdown.totalPrice)}</span>
                      </div>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCalculator;
