import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PLANS, formatINR, type UserType, type PlanName } from "@/lib/pricing-data";
import { Crown } from "lucide-react";

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

const PlanListValidation = () => {
  const [userType, setUserType] = useState<UserType>("new");
  const navigate = useNavigate();

  const goToCheckout = (planKey: PlanName) => {
    navigate(`/calculator?plan=${planKey}&userType=${userType}`);
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

        {/* User Type Toggle */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <Label className="text-sm font-medium">User Type:</Label>
          <span className={`text-sm ${userType === "new" ? "font-semibold" : "text-muted-foreground"}`}>New</span>
          <Switch
            checked={userType === "renewal"}
            onCheckedChange={(checked) => setUserType(checked ? "renewal" : "new")}
          />
          <span className={`text-sm ${userType === "renewal" ? "font-semibold" : "text-muted-foreground"}`}>Renewal</span>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.key}
              className={`relative overflow-visible rounded-xl shadow-sm ${PLAN_BORDERS[plan.key]}`}
            >
              {/* Most Popular badge for Platinum */}
              {plan.key === "platinum" && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-indigo-900 text-white border-0 gap-1 px-3 py-1 text-xs">
                    <Crown className="h-3 w-3" /> Most Popular
                  </Badge>
                </div>
              )}

              <CardContent className="pt-6 pb-6 space-y-4">
                {/* Plan Name */}
                <div>
                  <h2 className="text-xl font-bold">{plan.name} Plan</h2>
                  <p className="text-sm text-emerald-600 mt-0.5">{PLAN_DESCRIPTIONS[plan.key]}</p>
                </div>

                {/* Monthly Price */}
                <div className="pt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-muted-foreground line-through text-base">
                      {formatINR(plan.monthlyMRP)}
                    </span>
                    <span className="text-3xl font-bold">{formatINR(plan.monthlyDiscounted)}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                </div>

                {/* Annual Price + Badge */}
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

                {/* Buy Button */}
                <Button
                  variant="outline"
                  className={`w-full mt-2 font-semibold ${PLAN_BUTTON_STYLES[plan.key]}`}
                  onClick={() => goToCheckout(plan.key)}
                >
                  Buy {plan.name} Plan
                </Button>

                {/* Sales CTA for Platinum & Enterprise */}
                {(plan.key === "platinum" || plan.key === "enterprise") && (
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
