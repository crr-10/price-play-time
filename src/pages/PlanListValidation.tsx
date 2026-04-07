import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  PLANS_BY_TYPE, USER_TYPE_LABELS, DURATIONS, DURATION_YEARS, calculateUpgradeCredit, formatINR,
  PLAN_PLATFORM, ENTERPRISE_BASE, ENTERPRISE_MAX_BUSINESSES, ENTERPRISE_USER_STEPS,
  getEnterpriseUserSlabLabel, MONTHLY_PRICES, MONTHLY_DISCOUNTED_FIRST_MONTH, GST_RATE,
  type UserType, type PlanName, type Duration, type Platform, type EnterpriseUserSlab,
  type BillingPeriod, type MonthlyVariant,
} from "@/lib/pricing-data";
import { Crown, AlertCircle, Plus, Minus, Link2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";

const PLAN_BORDERS: Record<PlanName, string> = {
  silver: "border-t-4 border-t-amber-400",
  diamond: "border-t-4 border-t-orange-400",
  platinum: "border-t-4 border-t-indigo-600",
  enterprise: "border-t-4 border-t-emerald-500",
};

const PLAN_BUTTON_STYLES: Record<PlanName, string> = {
  silver: "border-amber-400 text-amber-500 hover:bg-amber-50",
  diamond: "border-orange-400 text-orange-500 hover:bg-orange-50",
  platinum: "border-indigo-600 text-indigo-600 hover:bg-indigo-50",
  enterprise: "border-emerald-500 text-emerald-600 hover:bg-emerald-50",
};

const PLAN_DESCRIPTIONS: Record<PlanName, string> = {
  silver: "Starter plan for individuals (Android only)",
  diamond: "Essential plan for small business owners",
  platinum: "More users, more flexibility, and a Desktop app",
  enterprise: "Fully customizable for bigger businesses",
};

const PLAN_ORDER: PlanName[] = ["silver", "diamond", "platinum", "enterprise"];
const USER_TYPES: UserType[] = ["fresh", "renewal_after", "renewal_before", "upgrade"];

const PlanListValidation = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [userType, setUserType] = useState<UserType>(
    (["fresh", "renewal_after", "renewal_before", "upgrade"].includes(searchParams.get("userType") || "")
      ? searchParams.get("userType") as UserType : "fresh")
  );
  const [platform, setPlatform] = useState<Platform>(
    searchParams.get("platform") === "web" ? "web" : "android"
  );
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(
    searchParams.get("billing") === "yearly" ? "yearly" : "monthly"
  );
  const [monthlyVariant, setMonthlyVariant] = useState<MonthlyVariant>(
    searchParams.get("variant") === "B" ? "B" : "A"
  );
  const [currentPlan, setCurrentPlan] = useState<PlanName>(
    (["silver", "diamond", "platinum", "enterprise"].includes(searchParams.get("currentPlan") || "")
      ? searchParams.get("currentPlan") as PlanName : "diamond")
  );
  const [currentDuration, setCurrentDuration] = useState<Duration>(
    (searchParams.get("currentDuration") as Duration) || "1yr"
  );
  const [currentBillingPeriod, setCurrentBillingPeriod] = useState<BillingPeriod>(
    searchParams.get("currentBilling") === "monthly" ? "monthly" : "yearly"
  );
  const [startDate, setStartDate] = useState<string>(
    searchParams.get("startDate") || format(new Date(), "yyyy-MM-dd")
  );
  const [currentBusinesses, setCurrentBusinesses] = useState<number>(
    Number(searchParams.get("currentBiz")) || ENTERPRISE_BASE.businesses
  );
  const [currentUserSlab, setCurrentUserSlab] = useState<EnterpriseUserSlab>(
    (Number(searchParams.get("currentUsers")) || 3) as EnterpriseUserSlab
  );

  // Sync state to URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (platform !== "android") params.platform = platform;
    if (billingPeriod !== "monthly") params.billing = billingPeriod;
    if (billingPeriod === "monthly" && monthlyVariant !== "A") params.variant = monthlyVariant;
    if (userType !== "fresh") params.userType = userType;
    if (userType === "upgrade") {
      if (currentPlan !== "diamond") params.currentPlan = currentPlan;
      if (currentBillingPeriod === "monthly") {
        params.currentBilling = "monthly";
      } else {
        if (currentDuration !== "1yr") params.currentDuration = currentDuration;
      }
      if (startDate !== format(new Date(), "yyyy-MM-dd")) params.startDate = startDate;
      if (currentPlan === "enterprise") {
        if (currentBusinesses !== ENTERPRISE_BASE.businesses) params.currentBiz = String(currentBusinesses);
        if (currentUserSlab !== 3) params.currentUsers = String(currentUserSlab);
      }
    }
    setSearchParams(params, { replace: true });
  }, [platform, billingPeriod, monthlyVariant, userType, currentPlan, currentDuration, currentBillingPeriod, startDate, currentBusinesses, currentUserSlab]);

  const isMonthly = billingPeriod === "monthly";

  const isUpgrade = userType === "upgrade";
  const isCurrentEnterprise = currentPlan === "enterprise";
  const plans = PLANS_BY_TYPE[userType];

  const platformPlans = plans.filter((p) => PLAN_PLATFORM[p.key].includes(platform));
  const visiblePlans = isUpgrade
    ? platformPlans.filter((p) => {
        const newIdx = PLAN_ORDER.indexOf(p.key);
        const curIdx = PLAN_ORDER.indexOf(currentPlan);
        if (p.key === "enterprise" && currentPlan === "enterprise") return true;
        return newIdx > curIdx;
      })
    : platformPlans;

  const currentPlanInfo = isUpgrade ? plans.find((p) => p.key === currentPlan) : null;

  // Calculate end date for yearly upgrades
  const planEndDate = isUpgrade && currentBillingPeriod === "yearly"
    ? addDays(new Date(startDate), DURATION_YEARS[currentDuration] * 365)
    : isUpgrade && currentBillingPeriod === "monthly"
    ? addDays(new Date(startDate), 31)
    : null;

  const goToCheckout = (planKey: PlanName) => {
    if (isUpgrade) {
      let url = `/calculator?plan=${planKey}&userType=upgrade&currentPlan=${currentPlan}&startDate=${startDate}&platform=${platform}&billing=${billingPeriod}`;
      if (currentBillingPeriod === "monthly") {
        url += `&currentBilling=monthly`;
      } else {
        url += `&currentDuration=${currentDuration}`;
      }
      if (isCurrentEnterprise) {
        url += `&currentBiz=${currentBusinesses}&currentUsers=${currentUserSlab}`;
      }
      if (isMonthly && monthlyVariant !== "A") url += `&variant=${monthlyVariant}`;
      navigate(url);
    } else {
      let url = `/calculator?plan=${planKey}&userType=${userType}&platform=${platform}&billing=${billingPeriod}`;
      if (isMonthly && monthlyVariant !== "A") url += `&variant=${monthlyVariant}`;
      navigate(url);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">Choose Your Plan</h1>
            <Button variant="outline" size="sm" className="ml-2" onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast("Scenario link copied!");
            }}>
              <Link2 className="h-3.5 w-3.5" /> Copy Scenario
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Pricing validation tool — verify plan list prices
            <span className="mx-2">·</span>
            <Link to="/ppd-calculator" className="text-primary underline underline-offset-2 hover:text-primary/80">PPD Calculator</Link>
            <span className="mx-2">·</span>
            <Link to="/qa" className="text-primary underline underline-offset-2 hover:text-primary/80">QA Checklist</Link>
          </p>
        </div>

        {/* Selectors */}
        <div className="mb-8 flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Platform:</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="android">Android</SelectItem>
                <SelectItem value="web">Web</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">User Type:</Label>
            <Select value={userType} onValueChange={(v) => setUserType(v as UserType)}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                {USER_TYPES.map((ut) => (
                  <SelectItem key={ut} value={ut}>{USER_TYPE_LABELS[ut]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {userType !== "fresh" && userType !== "upgrade" && (
          <p className="text-xs text-muted-foreground text-center -mt-4 mb-2">
            {userType === "renewal_after"
              ? "First plan was purchased after 16 Feb 2024"
              : "First plan was purchased before 16 Feb 2024"}
          </p>
        )}

        {/* Monthly / Yearly Tab */}
        {platform === "android" && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="inline-flex rounded-lg border bg-muted p-1">
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isMonthly ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setBillingPeriod("monthly")}
              >
                Monthly
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  !isMonthly ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setBillingPeriod("yearly")}
              >
                Yearly
                <Badge variant="outline" className="absolute -top-2 -right-6 text-[10px] px-1.5 py-0 border-emerald-500 text-emerald-600">
                  upto 20% off
                </Badge>
              </button>
            </div>

{isMonthly && (
              <div className="flex items-center gap-2 ml-4">
                <Label className="text-xs text-muted-foreground">Experiment:</Label>
                <Select value={monthlyVariant} onValueChange={(v) => setMonthlyVariant(v as MonthlyVariant)}>
                  <SelectTrigger className="w-56 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A" className="text-xs">Discounted 1st month (₹2)</SelectItem>
                    <SelectItem value="B" className="text-xs">Actual price from month 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Upgrade-specific inputs */}
        {isUpgrade && (
          <Card className="mb-6 rounded-xl border-amber-200 bg-amber-50/50">
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
                {currentBillingPeriod === "yearly" && (
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
              {/* Enterprise current plan config */}
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
              {planEndDate && (
                <p className="text-xs text-amber-700 mt-3">
                  Your <strong>{currentPlanInfo?.name}</strong> plan expires on <strong>{format(planEndDate, "dd MMM yyyy")}</strong>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Expiry Banner for Upgrade */}
        {isUpgrade && planEndDate && currentPlanInfo && (
          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-center">
            <p className="text-sm text-amber-800">
              Your <strong>{currentPlanInfo.name}</strong> plan ({currentBillingPeriod === "monthly" ? "Monthly" : currentDuration.replace("yr", " Year")}) expires on <strong>{format(planEndDate, "dd MMM yyyy")}</strong>
            </p>
          </div>
        )}

        {/* Plan Cards */}
        <div className={`grid grid-cols-1 gap-6 ${
          visiblePlans.length + (isUpgrade && currentPlanInfo ? 1 : 0) >= 4 ? "md:grid-cols-4" :
          visiblePlans.length + (isUpgrade && currentPlanInfo ? 1 : 0) === 3 ? "md:grid-cols-3" :
          visiblePlans.length + (isUpgrade && currentPlanInfo ? 1 : 0) === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" :
          "max-w-md mx-auto"
        }`}>
          {/* Show current plan card for upgrade */}
          {isUpgrade && currentPlanInfo && (
            <Card className={`relative overflow-visible rounded-xl shadow-sm opacity-75 ${PLAN_BORDERS[currentPlan]}`}>
              <div className="absolute -top-3 right-4">
                <Badge className="bg-amber-600 text-white border-0 px-3 py-1 text-xs">
                  Current Plan
                </Badge>
              </div>
              <CardContent className="pt-6 pb-6 space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{currentPlanInfo.name} Plan</h2>
                  <p className="text-sm text-emerald-600 mt-0.5">{PLAN_DESCRIPTIONS[currentPlan]}</p>
                </div>
                <div className="pt-2">
                  {currentBillingPeriod === "monthly" ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{formatINR(MONTHLY_PRICES[currentPlan])}</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{formatINR(currentPlanInfo.monthlyDiscounted)}</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full mt-2 font-semibold" disabled>
                  {currentBillingPeriod === "monthly" ? "Manage Auto Renewal" : "Current Plan"}
                </Button>
              </CardContent>
            </Card>
          )}

          {visiblePlans.map((plan) => (
            <Card
              key={plan.key}
              className={`relative overflow-visible rounded-xl shadow-sm ${PLAN_BORDERS[plan.key]}`}
            >
              {plan.key === "diamond" && isMonthly && !isUpgrade && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-orange-600 text-white border-0 gap-1 px-3 py-1 text-xs">
                    <Crown className="h-3 w-3" /> Recommended
                  </Badge>
                </div>
              )}
              {plan.key === "platinum" && !isMonthly && !isUpgrade && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-indigo-900 text-white border-0 gap-1 px-3 py-1 text-xs">
                    <Crown className="h-3 w-3" /> Most Popular
                  </Badge>
                </div>
              )}

              <CardContent className="pt-6 pb-6 space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{plan.name} Plan</h2>
                  <p className="text-sm text-emerald-600 mt-0.5">{PLAN_DESCRIPTIONS[plan.key]}</p>
                </div>

                {isMonthly ? (
                  /* Monthly pricing */
                  <div className="pt-2">
                    {monthlyVariant === "A" ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-muted-foreground line-through text-base">
                            {formatINR(MONTHLY_PRICES[plan.key])}
                          </span>
                          <span className="text-3xl font-bold">{formatINR(MONTHLY_DISCOUNTED_FIRST_MONTH[plan.key])}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">for 1st month</p>
                        <p className="text-xs text-muted-foreground">then {formatINR(MONTHLY_PRICES[plan.key])}/month</p>
                      </>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{formatINR(MONTHLY_PRICES[plan.key])}</span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Renews automatically every month. Cancel anytime
                    </p>
                  </div>
                ) : (
                  /* Yearly pricing */
                  <>
                    <div className="pt-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-muted-foreground line-through text-base">
                          {formatINR(plan.monthlyMRP)}
                        </span>
                        <span className="text-3xl font-bold">{formatINR(plan.monthlyDiscounted)}</span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">Billed Annually</span>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatINR(plan.annualMRP)}
                      </span>
                      <span className="text-sm font-semibold">
                        {formatINR(plan.annualDiscounted)}/year
                      </span>
                      <Badge variant="outline" className="border-emerald-500 text-emerald-600 text-xs px-2 py-0">
                        {plan.discountPercent}% Off
                      </Badge>
                    </div>
                  </>
                )}

                <Button
                  variant="outline"
                  className={`w-full mt-2 font-semibold ${PLAN_BUTTON_STYLES[plan.key]}`}
                  onClick={() => goToCheckout(plan.key)}
                >
                  {isUpgrade ? `Upgrade to ${plan.name}` : `Buy ${plan.name} Plan`}
                </Button>

                {!isUpgrade && !isMonthly && (plan.key === "platinum" || plan.key === "enterprise") && (
                  <p className="text-xs text-emerald-600 text-center flex items-center justify-center gap-1">
                    <span>✓</span> Up to 65% off - Talk to Sales
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlanListValidation;
