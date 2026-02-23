import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import {
  type PlanName,
  type Duration,
  type UserType,
  PLANS,
  DURATIONS,
  COUPON_OPTIONS,
  calculateBreakdown,
  formatINR,
} from "@/lib/pricing-data";

const CheckoutCalculator = () => {
  const [searchParams] = useSearchParams();
  const initialPlan = (searchParams.get("plan") as PlanName) || "platinum";
  const initialUserType = (searchParams.get("userType") as UserType) || "new";

  const [plan, setPlan] = useState<PlanName>(initialPlan);
  const [duration, setDuration] = useState<Duration>("1yr");
  const [coupon, setCoupon] = useState<number>(0);
  const [customCoupon, setCustomCoupon] = useState<string>("");
  const [useCustomCoupon, setUseCustomCoupon] = useState(false);
  const [userType, setUserType] = useState<UserType>(initialUserType);
  const [discountOpen, setDiscountOpen] = useState(false);

  const effectiveCoupon = useCustomCoupon
    ? Math.min(100, Math.max(0, Number(customCoupon) || 0))
    : coupon;

  const b = calculateBreakdown(plan, duration, effectiveCoupon, userType);
  const selectedPlan = PLANS.find((p) => p.key === plan)!;

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
          {/* User Type Toggle */}
          <div className="flex items-center gap-2">
            <Label className="text-xs">User:</Label>
            <span className={`text-xs ${userType === "new" ? "font-semibold" : "text-muted-foreground"}`}>New</span>
            <Switch
              checked={userType === "renewal"}
              onCheckedChange={(checked) => setUserType(checked ? "renewal" : "new")}
            />
            <span className={`text-xs ${userType === "renewal" ? "font-semibold" : "text-muted-foreground"}`}>Renewal</span>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Customise Plan (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Selected Plan */}
            <Card className="rounded-xl">
              <CardContent className="py-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="font-semibold">Selected Plan</span>
                <Select value={plan} onValueChange={(v) => setPlan(v as PlanName)}>
                  <SelectTrigger className="w-auto border-0 bg-transparent font-semibold text-indigo-600 gap-1 px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANS.map((p) => (
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
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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

                {/* Coupon */}
                <div className="border-t border-dashed pt-4 space-y-2">
                  <span className="text-sm font-medium">Coupon / Discount %</span>
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
                <h3 className="font-bold text-lg mb-5">Price Details</h3>

                <div className="space-y-3 text-sm">
                  {/* Original Price */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Price</span>
                    <span className="font-medium">{formatINR(b.originalPrice)}</span>
                  </div>

                  {/* Total Discount - Collapsible */}
                  <Collapsible open={discountOpen} onOpenChange={setDiscountOpen}>
                    <CollapsibleTrigger className="flex justify-between w-full text-emerald-600">
                      <span className="flex items-center gap-1">
                        Total Discount ({b.planDiscountPercent}%)
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

                  {/* Price After Discount */}
                  <div className="flex justify-between font-semibold">
                    <span>Price After Discount</span>
                    <span>{formatINR(b.priceAfterCoupon)}</span>
                  </div>

                  {/* GST */}
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST (18%)</span>
                    <span>{formatINR(b.gstAmount)}</span>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-dashed border-border" />

                  {/* Total Price */}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-base font-bold">Total Price</span>
                    <span className="text-xl font-bold text-primary">{formatINR(b.totalPrice)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCalculator;
