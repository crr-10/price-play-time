import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
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

  const effectiveCoupon = useCustomCoupon
    ? Math.min(100, Math.max(0, Number(customCoupon) || 0))
    : coupon;

  const b = calculateBreakdown(plan, duration, effectiveCoupon, userType);

  const planLabel = PLANS.find((p) => p.key === plan)?.name ?? "";
  const durationInfo = DURATIONS.find((d) => d.key === duration);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
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

        {/* Selectors */}
        <Card className="mb-6">
          <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Price Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-3">
              Price Breakdown
              <Badge variant="outline">{planLabel}</Badge>
              <Badge variant="outline">{durationInfo?.label}</Badge>
              <Badge variant="secondary">{userType === "new" ? "New User" : "Renewal"}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <Row label="Original Price (MRP ex-GST)" value={formatINR(b.originalPrice)} />
              <Row
                label={`Plan Discount (${b.planDiscountPercent}%)`}
                value={`- ${formatINR(b.planDiscountAmount)}`}
                sub
              />
              <Row label="After Plan Discount" value={formatINR(b.priceAfterPlanDiscount)} bold />

              {b.multiYearDiscountPercent > 0 && (
                <>
                  <Row
                    label={`Multi-Year Extra Off (${b.multiYearDiscountPercent}%)`}
                    value={`- ${formatINR(b.multiYearDiscountAmount)}`}
                    sub
                  />
                  <Row label="After Multi-Year Discount" value={formatINR(b.priceAfterMultiYear)} bold />
                </>
              )}

              {b.couponDiscountPercent > 0 && (
                <>
                  <Row
                    label={`Coupon Discount (${b.couponDiscountPercent}%)`}
                    value={`- ${formatINR(b.couponDiscountAmount)}`}
                    sub
                  />
                  <Row label="After Coupon" value={formatINR(b.priceAfterCoupon)} bold />
                </>
              )}

              <Separator />

              <Row
                label={`Total Discount (${b.totalDiscountPercent}%)`}
                value={`- ${formatINR(b.totalDiscountAmount)}`}
                highlight
              />
              <Row label="Price After All Discounts" value={formatINR(b.priceAfterCoupon)} bold />
              <Row label={`GST (${18}%)`} value={`+ ${formatINR(b.gstAmount)}`} sub />

              <Separator />

              <div className="flex justify-between items-center pt-1">
                <span className="text-base font-bold">Total Price (incl. GST)</span>
                <span className="text-xl font-bold text-primary">{formatINR(b.totalPrice)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function Row({
  label,
  value,
  bold,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  sub?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`flex justify-between ${sub ? "pl-4 text-muted-foreground" : ""} ${bold ? "font-semibold" : ""} ${highlight ? "text-emerald-600 font-medium" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default CheckoutCalculator;
