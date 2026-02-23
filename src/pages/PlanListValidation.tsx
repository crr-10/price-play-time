import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PLANS, formatINR, type UserType } from "@/lib/pricing-data";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

const PlanListValidation = () => {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [userType, setUserType] = useState<UserType>("new");

  const toggle = (key: string) =>
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));

  const validationItems = [
    {
      group: "Monthly Discounted Prices",
      items: PLANS.map((p) => ({
        key: `monthly_${p.key}`,
        label: `${p.name}: ${formatINR(p.monthlyDiscounted)}/mo`,
      })),
    },
    {
      group: "Annual Discounted Prices",
      items: PLANS.map((p) => ({
        key: `annual_${p.key}`,
        label: `${p.name}: ${formatINR(p.annualDiscounted)}/yr`,
      })),
    },
    {
      group: "Crossed-out Monthly MRP",
      items: PLANS.map((p) => ({
        key: `mrp_monthly_${p.key}`,
        label: `${p.name}: ${formatINR(p.monthlyMRP)}/mo`,
      })),
    },
    {
      group: "Crossed-out Annual MRP",
      items: PLANS.map((p) => ({
        key: `mrp_annual_${p.key}`,
        label: `${p.name}: ${formatINR(p.annualMRP)}/yr`,
      })),
    },
    {
      group: "Discount Badges",
      items: PLANS.map((p) => ({
        key: `badge_${p.key}`,
        label: `${p.name}: ${p.discountPercent}% off`,
      })),
    },
    {
      group: "Monthly × 12 vs Annual",
      items: PLANS.map((p) => {
        const calc = p.monthlyDiscounted * 12;
        const match = calc === p.annualDiscounted;
        return {
          key: `m12_${p.key}`,
          label: `${p.name}: ${formatINR(p.monthlyDiscounted)} × 12 = ${formatINR(calc)} vs ${formatINR(p.annualDiscounted)}`,
          match,
        };
      }),
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Plan List Validation
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Verify pricing displayed on the plan list page
            </p>
          </div>
          <Link to="/calculator">
            <Button variant="outline" className="gap-2">
              Checkout Calculator <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* User Type Toggle */}
        <div className="mb-8 flex items-center gap-3">
          <Label>User Type:</Label>
          <span className={`text-sm ${userType === "new" ? "font-semibold" : "text-muted-foreground"}`}>New</span>
          <Switch
            checked={userType === "renewal"}
            onCheckedChange={(checked) => setUserType(checked ? "renewal" : "new")}
          />
          <span className={`text-sm ${userType === "renewal" ? "font-semibold" : "text-muted-foreground"}`}>Renewal</span>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {PLANS.map((plan) => (
            <Card key={plan.key} className="relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <Badge className="bg-emerald-500/90 text-white border-0">
                  {plan.discountPercent}% OFF
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Monthly</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-muted-foreground line-through text-sm">
                      {formatINR(plan.monthlyMRP)}
                    </span>
                    <span className="text-xl font-bold">
                      {formatINR(plan.monthlyDiscounted)}
                    </span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Annual</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-muted-foreground line-through text-sm">
                      {formatINR(plan.annualMRP)}
                    </span>
                    <span className="text-xl font-bold">
                      {formatINR(plan.annualDiscounted)}
                    </span>
                    <span className="text-xs text-muted-foreground">/yr</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Validation Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Validation Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {validationItems.map((group) => (
              <div key={group.group}>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">
                  {group.group}
                </h3>
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const hasMatch = "match" in item;
                    return (
                      <label
                        key={item.key}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <Checkbox
                          checked={!!checks[item.key]}
                          onCheckedChange={() => toggle(item.key)}
                        />
                        <span className="text-sm">{item.label}</span>
                        {hasMatch && (
                          (item as any).match ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlanListValidation;
