import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown } from "lucide-react";
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
  const [plan, setPlan] = useState<PlanName>("platinum");
  const [duration, setDuration] = useState<Duration>("1yr");
  const [coupon, setCoupon] = useState<number>(0);
  const [customCoupon, setCustomCoupon] = useState<string>("");
  const [useCustomCoupon, setUseCustomCoupon] = useState(false);
  const [userType, setUserType] = useState<UserType>("new");
  const [discountOpen, setDiscountOpen] = useState(false);

  const effectiveCoupon = useCustomCoupon
    ? Math.min(100, Math.max(0, Number(customCoupon) || 0))
    : coupon;

  const b = calculateBreakdown(plan, duration, effectiveCoupon, userType);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Checkout Price Calculator
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Validate checkout pricing for any plan + duration + coupon combo
            </p>
          </div>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Plan List
            </Button>
          </Link>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Selectors */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Plan */}
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={plan} onValueChange={(v) => setPlan(v as PlanName)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLANS.map((p) => (
                        <SelectItem key={p.key} value={p.key}>
                          {p.name} ({p.discountPercent}% off)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={duration} onValueChange={(v) => setDuration(v as Duration)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map((d) => (
                        <SelectItem key={d.key} value={d.key}>
                          {d.label} {d.extraOff && `(${d.extraOff})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Coupon */}
                <div className="space-y-2">
                  <Label>Coupon Discount</Label>
                  {useCustomCoupon ? (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="e.g. 12"
                        value={customCoupon}
                        onChange={(e) => setCustomCoupon(e.target.value)}
                        className="w-24"
                        min={0}
                        max={100}
                      />
                      <span className="self-center text-sm text-muted-foreground">%</span>
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

                {/* User Type */}
                <div className="space-y-2">
                  <Label>User Type</Label>
                  <div className="flex items-center gap-3 pt-1">
                    <span className={`text-sm ${userType === "new" ? "font-semibold" : "text-muted-foreground"}`}>
                      New
                    </span>
                    <Switch
                      checked={userType === "renewal"}
                      onCheckedChange={(checked) => setUserType(checked ? "renewal" : "new")}
                    />
                    <span className={`text-sm ${userType === "renewal" ? "font-semibold" : "text-muted-foreground"}`}>
                      Renewal
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Price Details (sticky) */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <PriceDetailsCard breakdown={b} discountOpen={discountOpen} setDiscountOpen={setDiscountOpen} />
          </div>
        </div>
      </div>
    </div>
  );
};

function PriceDetailsCard({
  breakdown: b,
  discountOpen,
  setDiscountOpen,
}: {
  breakdown: ReturnType<typeof calculateBreakdown>;
  discountOpen: boolean;
  setDiscountOpen: (open: boolean) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold text-base mb-4">Price Details</h3>

        <div className="space-y-3 text-sm">
          {/* Original Price */}
          <div className="flex justify-between">
            <span>Original Price</span>
            <span>{formatINR(b.originalPrice)}</span>
          </div>

          {/* Total Discount - Collapsible */}
          <Collapsible open={discountOpen} onOpenChange={setDiscountOpen}>
            <CollapsibleTrigger className="flex justify-between w-full text-emerald-600">
              <span className="flex items-center gap-1">
                Total Discount ({b.totalDiscountPercent}%)
                <ChevronDown className={`h-4 w-4 transition-transform ${discountOpen ? "rotate-180" : ""}`} />
              </span>
              <span>- {formatINR(b.totalDiscountAmount)}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-4 pt-2 space-y-2 text-muted-foreground">
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
            <span>+ {formatINR(b.gstAmount)}</span>
          </div>

          {/* Dashed separator */}
          <div className="border-t border-dashed border-border" />

          {/* Total Price */}
          <div className="flex justify-between items-center pt-1">
            <span className="text-base font-bold">Total Price</span>
            <span className="text-xl font-bold text-primary">{formatINR(b.totalPrice)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CheckoutCalculator;
