import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PLANS_BY_TYPE, USER_TYPE_LABELS, DURATIONS, DURATION_YEARS, calculateUpgradeCredit, formatINR, type UserType, type PlanName, type Duration } from "@/lib/pricing-data";
import { Crown, AlertCircle } from "lucide-react";
import { format, addDays } from "date-fns";

const PLAN_BORDERS: Record<PlanName, string> = {
  diamond: "border-t-4 border-t-orange-400",
  platinum: "border-t-4 border-t-indigo-600",
  enterprise: "border-t-4 border-t-emerald-500",
};

const PLAN_BUTTON_STYLES: Record<PlanName, string> = {
  diamond: "border-orange-400 text-orange-500 hover:bg-orange-50",
  platinum: "border-indigo-600 text-indigo-600 hover:bg-indigo-50",
  enterprise: "border-emerald-500 text-emerald-600 hover:bg-emerald-50",
};

const PLAN_DESCRIPTIONS: Record<PlanName, string> = {
  diamond: "Essential plan for small business owners",
  platinum: "More users, more flexibility, and a Desktop app",
  enterprise: "Fully customizable for bigger businesses",
};

const PLAN_ORDER: PlanName[] = ["diamond", "platinum", "enterprise"];

const USER_TYPES: UserType[] = ["fresh", "renewal_after", "renewal_before", "upgrade"];

const PlanListValidation = () => {
  const [userType, setUserType] = useState<UserType>("fresh");
  const [currentPlan, setCurrentPlan] = useState<PlanName>("diamond");
  const [currentDuration, setCurrentDuration] = useState<Duration>("1yr");
  const [startDate, setStartDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const navigate = useNavigate();

  const isUpgrade = userType === "upgrade";
  const plans = PLANS_BY_TYPE[userType];

  // For upgrade, only show plans higher than current plan
  const visiblePlans = isUpgrade
    ? plans.filter((p) => PLAN_ORDER.indexOf(p.key) > PLAN_ORDER.indexOf(currentPlan))
    : plans;

  const currentPlanInfo = isUpgrade ? plans.find((p) => p.key === currentPlan) : null;

  // Calculate end date and credit for display
  const planEndDate = isUpgrade
    ? addDays(new Date(startDate), DURATION_YEARS[currentDuration] * 365)
    : null;

  const goToCheckout = (planKey: PlanName) => {
    if (isUpgrade) {
      navigate(`/calculator?plan=${planKey}&userType=upgrade&currentPlan=${currentPlan}&startDate=${startDate}&currentDuration=${currentDuration}`);
    } else {
      navigate(`/calculator?plan=${planKey}&userType=${userType}`);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Choose Your Plan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pricing validation tool — verify plan list prices
          </p>
        </div>

        {/* User Type Selector */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <Label className="text-sm font-medium">User Type:</Label>
          <Select value={userType} onValueChange={(v) => setUserType(v as UserType)}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_TYPES.map((ut) => (
                <SelectItem key={ut} value={ut}>{USER_TYPE_LABELS[ut]}</SelectItem>
              ))}
            </SelectContent>
        </Select>
        </div>

        {userType !== "fresh" && userType !== "upgrade" && (
          <p className="text-xs text-muted-foreground text-center -mt-4 mb-2">
            {userType === "renewal_after"
              ? "First plan was purchased after 16 Feb 2024"
              : "First plan was purchased before 16 Feb 2024"}
          </p>
        )}

        {/* Upgrade-specific inputs */}
        {isUpgrade && (
          <Card className="mb-6 rounded-xl border-amber-200 bg-amber-50/50">
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
                      <SelectItem value="diamond">Diamond</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
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
              {planEndDate && (
                <p className="text-xs text-amber-700 mt-3">
                  Your {currentPlanInfo?.name} plan will auto renew on <strong>{format(planEndDate, "dd MMM yyyy")}</strong>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Plan Cards */}
        <div className={`grid grid-cols-1 gap-6 ${visiblePlans.length === 3 ? "md:grid-cols-3" : visiblePlans.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "max-w-md mx-auto"}`}>
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
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{formatINR(currentPlanInfo.monthlyDiscounted)}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-2 font-semibold" disabled>
                  Manage Auto Renewal
                </Button>
              </CardContent>
            </Card>
          )}

          {visiblePlans.map((plan) => (
            <Card
              key={plan.key}
              className={`relative overflow-visible rounded-xl shadow-sm ${PLAN_BORDERS[plan.key]}`}
            >
              {plan.key === "platinum" && !isUpgrade && (
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

                <Button
                  variant="outline"
                  className={`w-full mt-2 font-semibold ${PLAN_BUTTON_STYLES[plan.key]}`}
                  onClick={() => goToCheckout(plan.key)}
                >
                  {isUpgrade ? `Upgrade to ${plan.name}` : `Buy ${plan.name} Plan`}
                </Button>

                {!isUpgrade && (plan.key === "platinum" || plan.key === "enterprise") && (
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
