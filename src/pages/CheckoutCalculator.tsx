import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Plus, Minus, Phone, Info } from "lucide-react";
import { format, addDays } from "date-fns";
import {
  type PlanName,
  type Duration,
  type UserType,
  type Platform,
  type EnterpriseUserSlab,
  PLANS_BY_TYPE,
  DURATIONS,
  DURATION_YEARS,
  COUPON_OPTIONS,
  USER_TYPE_LABELS,
  PLAN_PLATFORM,
  ENTERPRISE_BASE,
  ENTERPRISE_MAX_BUSINESSES,
  ENTERPRISE_USER_STEPS,
  getEnterpriseAddon,
  getEnterpriseUserSlabLabel,
  calculateBreakdown,
  calculateUpgradeCredit,
  formatINR,
  formatINR2,
} from "@/lib/pricing-data";

const USER_TYPES: UserType[] = ["fresh", "renewal_after", "renewal_before", "upgrade"];
const PLAN_ORDER: PlanName[] = ["silver", "diamond", "platinum", "enterprise"];

const CheckoutCalculator = () => {
  const [searchParams] = useSearchParams();
  const initialPlan = (searchParams.get("plan") as PlanName) || "platinum";
  const rawUserType = searchParams.get("userType");
  const initialUserType: UserType = rawUserType === "renewal_after" || rawUserType === "renewal_before" || rawUserType === "fresh" || rawUserType === "upgrade" ? rawUserType : "fresh";

  const [plan, setPlan] = useState<PlanName>(initialPlan);
  const [duration, setDuration] = useState<Duration>("1yr");
  const [coupon, setCoupon] = useState<number>(0);
  const [customCoupon, setCustomCoupon] = useState<string>("");
  const [useCustomCoupon, setUseCustomCoupon] = useState(false);
  const [userType, setUserType] = useState<UserType>(initialUserType);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [ppdOpen, setPpdOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("android");

  // Enterprise customization
  const [businesses, setBusinesses] = useState<number>(ENTERPRISE_BASE.businesses);
  const [userSlab, setUserSlab] = useState<EnterpriseUserSlab>(3);

  // Upgrade-specific state
  const [currentPlan, setCurrentPlan] = useState<PlanName>(
    (searchParams.get("currentPlan") as PlanName) || "diamond"
  );
  const [startDate, setStartDate] = useState<string>(
    searchParams.get("startDate") || format(new Date(), "yyyy-MM-dd")
  );
  const [currentDuration, setCurrentDuration] = useState<Duration>(
    (searchParams.get("currentDuration") as Duration) || "1yr"
  );
  // Current enterprise config for enterprise-to-enterprise upgrades
  const [currentBusinesses, setCurrentBusinesses] = useState<number>(ENTERPRISE_BASE.businesses);
  const [currentUserSlab, setCurrentUserSlab] = useState<EnterpriseUserSlab>(3);
  // Purchase type of the current plan (for PPD calculation)
  const [currentPlanPurchaseType, setCurrentPlanPurchaseType] = useState<UserType>("fresh");

  const isUpgrade = userType === "upgrade";
  const isEnterprise = plan === "enterprise";
  const isCurrentEnterprise = currentPlan === "enterprise";

  const effectiveCoupon = useCustomCoupon
    ? Math.min(100, Math.max(0, Number(customCoupon) || 0))
    : coupon;

  // Enterprise addon calculation
  const enterpriseResult = isEnterprise ? getEnterpriseAddon(businesses, userSlab) : null;
  const enterpriseAddon = enterpriseResult?.addonCost ?? 0;
  const contactSales = enterpriseResult?.contactSales ?? false;

  // Current enterprise addon for upgrade credit
  const currentEnterpriseResult = isUpgrade && isCurrentEnterprise
    ? getEnterpriseAddon(currentBusinesses, currentUserSlab)
    : null;
  const currentEnterpriseAddon = currentEnterpriseResult?.addonCost ?? 0;

  // Enterprise-to-Enterprise with no actual upgrade (same config)
  const isEnterpriseNoUpgrade = isUpgrade && isEnterprise && isCurrentEnterprise
    && businesses === currentBusinesses && userSlab === currentUserSlab;

  // Calculate upgrade credit
  const upgradeCreditResult = isUpgrade
    ? calculateUpgradeCredit(currentPlan, currentDuration, new Date(startDate), isCurrentEnterprise ? currentEnterpriseAddon : 0, currentPlanPurchaseType)
    : null;
  const upgradeCredit = upgradeCreditResult?.credit ?? 0;

  // Auto-switch plan if not available on current platform
  const allPlans = PLANS_BY_TYPE[userType];
  const platformPlans = allPlans.filter((p) => PLAN_PLATFORM[p.key].includes(platform));
  
  useEffect(() => {
    if (!PLAN_PLATFORM[plan].includes(platform) && platformPlans.length > 0) {
      setPlan(platformPlans[0].key);
    }
  }, [platform, plan]);

  // Enforce upgrade constraints: new plan > current plan (or enterprise-to-enterprise)
  // For enterprise-to-enterprise: new biz/users >= current
  const minBusinesses = isUpgrade && isCurrentEnterprise && isEnterprise ? currentBusinesses : ENTERPRISE_BASE.businesses;
  const minUserSlabIdx = isUpgrade && isCurrentEnterprise && isEnterprise
    ? ENTERPRISE_USER_STEPS.indexOf(currentUserSlab)
    : 0;

  const b = contactSales ? null : calculateBreakdown(plan, duration, effectiveCoupon, userType, upgradeCredit, enterpriseAddon);
  const selectedPlan = platformPlans.find((p) => p.key === plan) || platformPlans[0];

  const planEndDate = isUpgrade
    ? addDays(new Date(startDate), DURATION_YEARS[currentDuration] * 365)
    : null;

  const currentPlanName = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);

  // User slab stepper
  const userSlabIdx = ENTERPRISE_USER_STEPS.indexOf(userSlab);
  const canDecUsers = userSlabIdx > Math.max(0, minUserSlabIdx);
  const canIncUsers = userSlabIdx < ENTERPRISE_USER_STEPS.length - 1;
  const decUsers = () => {
    if (canDecUsers) setUserSlab(ENTERPRISE_USER_STEPS[userSlabIdx - 1]);
  };
  const incUsers = () => {
    if (canIncUsers) setUserSlab(ENTERPRISE_USER_STEPS[userSlabIdx + 1]);
  };

  // Business stepper
  const canDecBiz = businesses > minBusinesses;
  const canIncBiz = businesses <= ENTERPRISE_MAX_BUSINESSES; // allow going to 6 to show contact sales
  const decBiz = () => { if (canDecBiz) setBusinesses(businesses - 1); };
  const incBiz = () => { if (canIncBiz) setBusinesses(businesses + 1); };

  // Filter plans for upgrade: only higher plans or same enterprise
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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs">Platform:</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                <SelectTrigger className="w-28 text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="android" className="text-xs">Android</SelectItem>
                  <SelectItem value="web" className="text-xs">Web</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs">User:</Label>
              <Select value={userType} onValueChange={(v) => setUserType(v as UserType)}>
                <SelectTrigger className="w-56 text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
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
              {userType === "renewal_after"
                ? "First plan purchased after 16 Feb 2024"
                : "First plan purchased before 16 Feb 2024"}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Current Plan</Label>
                      <Select value={currentPlan} onValueChange={(v) => setCurrentPlan(v as PlanName)}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="silver">Silver</SelectItem>
                          <SelectItem value="diamond">Diamond</SelectItem>
                          <SelectItem value="platinum">Platinum</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Plan Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Plan Duration</Label>
                      <Select value={currentDuration} onValueChange={(v) => setCurrentDuration(v as Duration)}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATIONS.map((d) => (
                            <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Purchase type selector for Platinum/Enterprise */}
                  {(currentPlan === "platinum" || currentPlan === "enterprise") && (
                    <div className="mt-4 pt-3 border-t border-amber-200 space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        How was this plan originally purchased?
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
                      Plan ends: <strong>{planEndDate ? format(planEndDate, "dd MMM yyyy") : "—"}</strong>
                    </span>
                    <span>
                      Credit: <strong className="text-emerald-700">{formatINR(upgradeCredit)}</strong>
                    </span>
                  </div>

                  {/* PPD Breakdown - Collapsible */}
                  {upgradeCreditResult && (
                    <Collapsible open={ppdOpen} onOpenChange={setPpdOpen} className="mt-3 border-t border-amber-200 pt-3">
                      <CollapsibleTrigger className="flex items-center gap-1 text-xs font-semibold text-amber-800 w-full">
                        Credit Calculation (PPD Breakdown)
                        {ppdOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1.5 text-xs text-muted-foreground pt-2">
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
                          <span>Remaining Days (as of {format(new Date(), "dd MMM yyyy")})</span>
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

            {/* Customise Plan */}
            <Card className="rounded-xl">
              <CardContent className="pt-5 pb-6 space-y-5">
                <h3 className="font-semibold text-base">Customise plan</h3>

                {/* Duration */}
                <div className="flex items-center justify-between border-b border-dashed pb-4">
                  <span className="text-sm font-medium">Plan Duration</span>
                  <Select value={duration} onValueChange={(v) => setDuration(v as Duration)}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map((d) => (
                        <SelectItem key={d.key} value={d.key}>
                          {d.label} {d.extraOff && `(${d.extraOff})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isUpgrade && (
                  <p className="text-xs text-muted-foreground -mt-2">
                    New plan ends: <strong>{format(addDays(new Date(), DURATION_YEARS[duration] * 365), "dd MMM yyyy")}</strong>
                  </p>
                )}

                {/* Multi-year banner */}
                {duration === "1yr" && (
                  <div className="bg-emerald-50 text-emerald-700 text-xs rounded-md px-3 py-2 text-center">
                    💡 Buy 2, 3, 5 or 10 year plan to get upto 30% extra off
                  </div>
                )}
                {duration !== "1yr" && (
                  <div className="bg-emerald-50 text-emerald-700 text-xs rounded-md px-3 py-2 text-center">
                    ✅ {DURATIONS.find(d => d.key === duration)?.extraOff} applied!
                  </div>
                )}

                {/* Enterprise: Business & User selectors */}
                {isEnterprise && (
                  <div className="border-t border-dashed pt-4 space-y-4">
                    <span className="text-sm font-medium">Enterprise Configuration</span>

                    {/* Businesses */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm">Number of Businesses</span>
                        <p className="text-xs text-muted-foreground">Base: {ENTERPRISE_BASE.businesses} businesses</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8"
                          onClick={decBiz} disabled={!canDecBiz}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-10 text-center font-semibold text-sm">
                          {businesses > ENTERPRISE_MAX_BUSINESSES ? `${ENTERPRISE_MAX_BUSINESSES + 1}+` : businesses}
                        </span>
                        <Button variant="outline" size="icon" className="h-8 w-8"
                          onClick={incBiz} disabled={!canIncBiz}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Users */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm">Number of Users</span>
                        <p className="text-xs text-muted-foreground">Base: {ENTERPRISE_BASE.users} users</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8"
                          onClick={decUsers} disabled={!canDecUsers}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-14 text-center font-semibold text-sm">
                          {getEnterpriseUserSlabLabel(userSlab)}
                        </span>
                        <Button variant="outline" size="icon" className="h-8 w-8"
                          onClick={incUsers} disabled={!canIncUsers}>
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

                {/* Coupon */}
                <div className={`border-t border-dashed pt-4 space-y-2 ${isUpgrade || userType === "renewal_after" || userType === "renewal_before" ? "opacity-50 pointer-events-none" : ""}`}>
                  <span className="text-sm font-medium">Coupon / Discount %</span>
                  {(isUpgrade || userType === "renewal_after" || userType === "renewal_before") && (
                    <p className="text-xs text-muted-foreground">Not applicable for {isUpgrade ? "upgrade" : "renewal"} users</p>
                  )}
                  {useCustomCoupon ? (
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="e.g. 12"
                        value={customCoupon}
                        onChange={(e) => setCustomCoupon(e.target.value)}
                        className="w-24"
                        min={0}
                        max={100}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setUseCustomCoupon(false); setCustomCoupon(""); }}
                      >
                        Presets
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {COUPON_OPTIONS.map((c) => (
                        <Button
                          key={c}
                          variant={coupon === c ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCoupon(c)}
                        >
                          {c}%
                        </Button>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => setUseCustomCoupon(true)}>
                        Custom
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Price Details (2 cols, sticky) */}
          <div className="lg:col-span-2 lg:sticky lg:top-8 lg:self-start">
            <Card className="rounded-xl">
              <CardContent className="pt-6 pb-6">
                {contactSales ? (
                  <div className="text-center py-8 space-y-3">
                    <Phone className="h-10 w-10 text-amber-500 mx-auto" />
                    <h3 className="font-bold text-lg">Contact Sales</h3>
                    <p className="text-sm text-muted-foreground">
                      Custom pricing is available for your enterprise configuration. Please contact our sales team.
                    </p>
                  </div>
                ) : isEnterpriseNoUpgrade ? (
                  <div className="text-center py-8 space-y-3">
                    <AlertCircle className="h-10 w-10 text-blue-500 mx-auto" />
                    <h3 className="font-bold text-lg">No Upgrade Selected</h3>
                    <p className="text-sm text-muted-foreground">
                      Please select a higher configuration to see pricing.
                    </p>
                  </div>
                ) : b && (
                  <>
                    <h3 className="font-bold text-lg mb-5">Price Details</h3>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Original Price</span>
                        <span className="font-medium">{formatINR(b.originalPrice)}</span>
                      </div>

                      <Collapsible open={discountOpen} onOpenChange={setDiscountOpen}>
                        <CollapsibleTrigger className="flex justify-between w-full text-emerald-600">
                          <span className="flex items-center gap-1">
                            Total Discount ({b.totalDiscountPercent}%)
                            {discountOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </span>
                          <span className="font-medium">- {formatINR(b.totalDiscountAmount)}</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="pl-4 pt-2 space-y-2 text-muted-foreground text-xs">
                            <div className="flex justify-between">
                              <span>{b.actualPlanDiscountPercent}% Discount</span>
                              <span>- {formatINR(b.planDiscountAmount)}</span>
                            </div>
                            {b.multiYearDiscountPercent > 0 && (
                              <div className="flex justify-between">
                                <span>Multi Year Extra Off</span>
                                <span>- {formatINR(b.multiYearDiscountAmount)}</span>
                              </div>
                            )}
                            {b.couponDiscountPercent > 0 && (
                              <div className="flex justify-between">
                                <span>Coupon Discount ({b.couponDiscountPercent}%)</span>
                                <span>- {formatINR(b.couponDiscountAmount)}</span>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <div className="flex justify-between font-semibold">
                        <span>Price After Discount</span>
                        <span>{formatINR(b.priceAfterCoupon)}</span>
                      </div>

                      {isUpgrade && b.upgradeCredit > 0 && (
                        <div className="flex justify-between text-amber-700">
                          <span>Credit for current plan</span>
                          <span className="font-medium">- {formatINR(b.upgradeCredit)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-muted-foreground">
                        <span>GST (18%)</span>
                        <span>{formatINR(b.gstAmount)}</span>
                      </div>

                      <div className="border-t border-dashed border-border" />

                      <div className="flex justify-between items-center pt-1">
                        <span className="text-base font-bold">Total Price</span>
                        <span className="text-xl font-bold text-primary">{formatINR(b.totalPrice)}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCalculator;
