import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown, ChevronUp, AlertCircle, Plus, Minus, Info, Link2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import {
  type PlanName,
  type Duration,
  type UserType,
  type EnterpriseUserSlab,
  DURATIONS,
  DURATION_YEARS,
  MULTI_YEAR_DISCOUNTS,
  OLD_MULTI_YEAR_DISCOUNTS,
  ENTERPRISE_BASE,
  ENTERPRISE_MAX_BUSINESSES,
  ENTERPRISE_USER_STEPS,
  getEnterpriseAddon,
  getEnterpriseUserSlabLabel,
  calculateUpgradeCredit,
  formatINR,
  formatINR2,
} from "@/lib/pricing-data";

const PPDCalculator = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentPlan, setCurrentPlan] = useState<PlanName>(
    (["silver", "diamond", "platinum", "enterprise"].includes(searchParams.get("plan") || "")
      ? searchParams.get("plan") as PlanName : "diamond")
  );
  const [startDate, setStartDate] = useState<string>(
    searchParams.get("startDate") || format(new Date(), "yyyy-MM-dd")
  );
  const [currentDuration, setCurrentDuration] = useState<Duration>(
    (searchParams.get("duration") as Duration) || "1yr"
  );
  const [currentPlanPurchaseType, setCurrentPlanPurchaseType] = useState<UserType>(
    (["fresh", "renewal_after", "renewal_before"].includes(searchParams.get("purchaseType") || "")
      ? searchParams.get("purchaseType") as UserType : "fresh")
  );
  const [useOldMultiYearDiscount, setUseOldMultiYearDiscount] = useState(
    searchParams.get("oldDiscount") === "1"
  );
  const [currentBusinesses, setCurrentBusinesses] = useState<number>(
    Number(searchParams.get("biz")) || ENTERPRISE_BASE.businesses
  );
  const [currentUserSlab, setCurrentUserSlab] = useState<EnterpriseUserSlab>(
    (Number(searchParams.get("users")) || 3) as EnterpriseUserSlab
  );

  // Sync state to URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (currentPlan !== "diamond") params.plan = currentPlan;
    if (startDate !== format(new Date(), "yyyy-MM-dd")) params.startDate = startDate;
    if (currentDuration !== "1yr") params.duration = currentDuration;
    if (currentPlanPurchaseType !== "fresh") params.purchaseType = currentPlanPurchaseType;
    if (useOldMultiYearDiscount) params.oldDiscount = "1";
    if (currentPlan === "enterprise") {
      if (currentBusinesses !== ENTERPRISE_BASE.businesses) params.biz = String(currentBusinesses);
      if (currentUserSlab !== 3) params.users = String(currentUserSlab);
    }
    setSearchParams(params, { replace: true });
  }, [currentPlan, startDate, currentDuration, currentPlanPurchaseType, useOldMultiYearDiscount, currentBusinesses, currentUserSlab]);

  const isCurrentEnterprise = currentPlan === "enterprise";

  const currentEnterpriseResult = isCurrentEnterprise
    ? getEnterpriseAddon(currentBusinesses, currentUserSlab)
    : null;
  const currentEnterpriseAddon = currentEnterpriseResult?.addonCost ?? 0;

  const multiYearOverride = currentDuration !== "1yr" && useOldMultiYearDiscount
    ? OLD_MULTI_YEAR_DISCOUNTS[currentDuration]
    : undefined;

  const upgradeCreditResult = calculateUpgradeCredit(
    currentPlan,
    currentDuration,
    new Date(startDate),
    isCurrentEnterprise ? currentEnterpriseAddon : 0,
    currentPlanPurchaseType,
    multiYearOverride
  );

  const planEndDate = addDays(new Date(startDate), DURATION_YEARS[currentDuration] * 365);

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">PPD Credit Calculator</h1>
            <p className="text-xs text-muted-foreground">Calculate upgrade credit based on remaining plan days</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast("Scenario link copied!");
          }}>
            <Link2 className="h-3.5 w-3.5" /> Copy Scenario
          </Button>
        </div>

        {/* Main Card */}
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

            {/* Old vs New multi-year discount toggle */}
            {currentDuration !== "1yr" && (
              <div className="mt-4 pt-3 border-t border-amber-200 space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Multi-year discount slab used at purchase
                </Label>
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="multiYearDiscountSlab"
                      checked={!useOldMultiYearDiscount}
                      onChange={() => setUseOldMultiYearDiscount(false)}
                      className="accent-amber-600"
                    />
                    New discount slabs ({MULTI_YEAR_DISCOUNTS[currentDuration]}%)
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="multiYearDiscountSlab"
                      checked={useOldMultiYearDiscount}
                      onChange={() => setUseOldMultiYearDiscount(true)}
                      className="accent-amber-600"
                    />
                    Old discount slabs ({OLD_MULTI_YEAR_DISCOUNTS[currentDuration]}%)
                  </label>
                </div>
              </div>
            )}

            {/* Enterprise config */}
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

            {/* Plan end date and credit summary */}
            <div className="mt-3 flex items-center justify-between text-xs text-amber-700">
              <span>
                Plan ends: <strong>{format(planEndDate, "dd MMM yyyy")}</strong>
              </span>
              <span>
                Credit: <strong className="text-emerald-700">{formatINR(upgradeCreditResult.credit)}</strong>
              </span>
            </div>

            {/* PPD Breakdown - Open by default */}
            <Collapsible defaultOpen className="mt-3 border-t border-amber-200 pt-3">
              <CollapsibleTrigger className="flex items-center gap-1 text-xs font-semibold text-amber-800 w-full">
                Credit Calculation (PPD Breakdown)
                <ChevronUp className="h-3.5 w-3.5 group-data-[state=closed]:hidden" />
                <ChevronDown className="h-3.5 w-3.5 group-data-[state=open]:hidden" />
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PPDCalculator;
