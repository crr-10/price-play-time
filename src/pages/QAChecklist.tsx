import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";
import { format, subDays } from "date-fns";
import {
  type PlanName, type UserType, type Duration,
  PLANS_BY_TYPE, DURATIONS, DURATION_YEARS, MULTI_YEAR_DISCOUNTS, OLD_MULTI_YEAR_DISCOUNTS,
  PLAN_DISCOUNTS, ACTUAL_PLAN_DISCOUNTS, MRP_TABLES,
  ANNUAL_DISCOUNTED, USER_TYPE_LABELS,
  ENTERPRISE_BASE, ENTERPRISE_EXTRA_BUSINESS_COST, ENTERPRISE_USER_SLAB_COSTS,
  ENTERPRISE_MAX_BUSINESSES, ENTERPRISE_MAX_USERS,
  getEnterpriseAddon, getEnterpriseMRP,
  calculateBreakdown, calculateUpgradeCredit, formatINR, formatINR2,
} from "@/lib/pricing-data";

const PLAN_NAMES: PlanName[] = ["silver", "diamond", "platinum", "enterprise"];
const USER_TYPES: UserType[] = ["fresh", "renewal_after", "renewal_before", "upgrade"];

const Section = ({ title, id, children }: { title: string; id: string; children: React.ReactNode }) => (
  <section id={id} className="space-y-3">
    <h2 className="text-lg font-bold tracking-tight border-b pb-2">{title}</h2>
    {children}
  </section>
);

const CheckItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2 text-sm">
    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
    <span>{children}</span>
  </li>
);

// --- Section 1: Multi-Year Discounts ---
const MultiYearDiscountTable = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Tenure</TableHead>
        <TableHead>New Discount</TableHead>
        <TableHead>Old Discount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {DURATIONS.map((d) => (
        <TableRow key={d.key}>
          <TableCell className="font-medium">{d.label}</TableCell>
          <TableCell>
            {MULTI_YEAR_DISCOUNTS[d.key] === 0 ? (
              <span className="text-muted-foreground">0% (base)</span>
            ) : (
              <Badge variant="secondary">{MULTI_YEAR_DISCOUNTS[d.key]}% extra off</Badge>
            )}
          </TableCell>
          <TableCell>
            {OLD_MULTI_YEAR_DISCOUNTS[d.key] === 0 ? (
              <span className="text-muted-foreground">0% (base)</span>
            ) : (
              <Badge variant="outline">{OLD_MULTI_YEAR_DISCOUNTS[d.key]}% extra off</Badge>
            )}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

// --- Section 2: MRP & Discount per user type ---
const MRPValidationTable = ({ userType }: { userType: UserType }) => {
  const plans = PLANS_BY_TYPE[userType];
  return (
    <Card className="rounded-xl">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">{USER_TYPE_LABELS[userType]}</h3>
          <Link to={`/?userType=${userType}`}>
            <Button variant="outline" size="sm" className="text-xs gap-1">
              Open in Plan List <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Annual MRP</TableHead>
              <TableHead>Discount %</TableHead>
              <TableHead>Actual %</TableHead>
              <TableHead>Annual Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((p) => (
              <TableRow key={p.key}>
                <TableCell className="font-medium capitalize">{p.name}</TableCell>
                <TableCell className="line-through text-muted-foreground">{formatINR(p.annualMRP)}</TableCell>
                <TableCell>{PLAN_DISCOUNTS[p.key]}%</TableCell>
                <TableCell className="text-xs text-muted-foreground">{ACTUAL_PLAN_DISCOUNTS[p.key]}%</TableCell>
                <TableCell className="font-semibold">{formatINR(p.annualDiscounted)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// --- Section 3: Checkout Scenarios ---
interface CheckoutScenario {
  label: string;
  userType: UserType;
  plan: PlanName;
  duration: Duration;
  coupon: number;
  currentPlan?: PlanName;
  currentDuration?: Duration;
  startDate?: string;
}

const CHECKOUT_SCENARIOS: CheckoutScenario[] = [
  { label: "Fresh + Platinum + 1yr (baseline)", userType: "fresh", plan: "platinum", duration: "1yr", coupon: 0 },
  { label: "Fresh + Diamond + 3yr (multi-year)", userType: "fresh", plan: "diamond", duration: "3yr", coupon: 0 },
  { label: "Renewal After + Platinum + 2yr", userType: "renewal_after", plan: "platinum", duration: "2yr", coupon: 0 },
  { label: "Renewal Before + Enterprise + 5yr", userType: "renewal_before", plan: "enterprise", duration: "5yr", coupon: 0 },
  {
    label: "Upgrade: Diamond → Platinum, 1yr",
    userType: "upgrade", plan: "platinum", duration: "1yr", coupon: 0,
    currentPlan: "diamond", currentDuration: "1yr",
    startDate: format(subDays(new Date(), 100), "yyyy-MM-dd"),
  },
  {
    label: "Upgrade: Silver → Diamond, 3yr",
    userType: "upgrade", plan: "diamond", duration: "3yr", coupon: 0,
    currentPlan: "silver", currentDuration: "1yr",
    startDate: format(subDays(new Date(), 60), "yyyy-MM-dd"),
  },
];

const CheckoutScenarioCard = ({ s }: { s: CheckoutScenario }) => {
  const upgradeCredit = s.currentPlan
    ? calculateUpgradeCredit(s.currentPlan, s.currentDuration!, new Date(s.startDate!)).credit
    : 0;
  const b = calculateBreakdown(s.plan, s.duration, s.coupon, s.userType, upgradeCredit);

  const checkoutUrl = s.currentPlan
    ? `/calculator?plan=${s.plan}&userType=${s.userType}&currentPlan=${s.currentPlan}&startDate=${s.startDate}&currentDuration=${s.currentDuration}`
    : `/calculator?plan=${s.plan}&userType=${s.userType}`;

  return (
    <Card className="rounded-xl">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm">{s.label}</h4>
          <Link to={checkoutUrl}>
            <Button variant="outline" size="sm" className="text-xs gap-1">
              Open Checkout <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <span className="text-muted-foreground">Original Price (MRP)</span>
          <span className="font-medium">{formatINR(b.originalPrice)}</span>

          <span className="text-muted-foreground">Plan Discount ({b.planDiscountPercent}%)</span>
          <span className="text-emerald-600">- {formatINR(b.planDiscountAmount)}</span>

          <span className="text-muted-foreground">After Plan Discount</span>
          <span>{formatINR(b.priceAfterPlanDiscount)}</span>

          {b.multiYearDiscountPercent > 0 && (
            <>
              <span className="text-muted-foreground">Multi-year ({b.multiYearDiscountPercent}%)</span>
              <span className="text-emerald-600">- {formatINR(b.multiYearDiscountAmount)}</span>
            </>
          )}

          {b.couponDiscountPercent > 0 && (
            <>
              <span className="text-muted-foreground">Coupon ({b.couponDiscountPercent}%)</span>
              <span className="text-emerald-600">- {formatINR(b.couponDiscountAmount)}</span>
            </>
          )}

          {b.upgradeCredit > 0 && (
            <>
              <span className="text-muted-foreground">Upgrade Credit</span>
              <span className="text-emerald-600">- {formatINR(b.upgradeCredit)}</span>
            </>
          )}

          <span className="text-muted-foreground">Total Discount</span>
          <span className="font-semibold text-emerald-600">{b.totalDiscountPercent}%</span>

          <span className="text-muted-foreground">GST (18%)</span>
          <span>{formatINR(b.gstAmount)}</span>

          <span className="font-bold border-t pt-1">Total</span>
          <span className="font-bold border-t pt-1">{formatINR(b.totalPrice)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Section 4: PPD Verification ---
interface PPDScenario {
  label: string;
  plan: PlanName;
  duration: Duration;
  daysAgo: number;
  purchaseType?: UserType;
  multiYearDiscountOverride?: number;
  enterpriseAddon?: number;
}

const PPD_SCENARIOS: PPDScenario[] = [
  { label: "Diamond 1yr, started 100 days ago", plan: "diamond", duration: "1yr", daysAgo: 100 },
  { label: "Diamond 2yr (5% multi-year), 200 days ago", plan: "diamond", duration: "2yr", daysAgo: 200 },
  { label: "Platinum 3yr (10% discount), 50 days ago", plan: "platinum", duration: "3yr", daysAgo: 50 },
  { label: "Diamond 3yr, OLD discount (20%), 100 days ago", plan: "diamond", duration: "3yr", daysAgo: 100, multiYearDiscountOverride: OLD_MULTI_YEAR_DISCOUNTS["3yr"] },
  { label: "Platinum 2yr, renewal_after, 150 days ago", plan: "platinum", duration: "2yr", daysAgo: 150, purchaseType: "renewal_after" },
  { label: "Enterprise 1yr + addon (₹2k biz + ₹2k users), 90 days ago", plan: "enterprise", duration: "1yr", daysAgo: 90, enterpriseAddon: 4000 },
];

const PPDCard = ({ s }: { s: PPDScenario }) => {
  const startDate = subDays(new Date(), s.daysAgo);
  const r = calculateUpgradeCredit(s.plan, s.duration, startDate, s.enterpriseAddon ?? 0, s.purchaseType ?? "fresh", s.multiYearDiscountOverride);
  return (
    <Card className="rounded-xl">
      <CardContent className="pt-4 pb-4">
        <h4 className="font-semibold text-sm mb-2">{s.label}</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <span className="text-muted-foreground">Start Date</span>
          <span>{format(startDate, "dd MMM yyyy")}</span>
          <span className="text-muted-foreground">Annual Discounted</span>
          <span>{formatINR(r.annualDiscounted)}</span>
          <span className="text-muted-foreground">Total Paid (ex-GST)</span>
          <span>{formatINR2(r.totalPaid)}</span>
          <span className="text-muted-foreground">Total Days</span>
          <span>{r.totalDays}</span>
          <span className="text-muted-foreground">Remaining Days</span>
          <span>{r.remainingDays}</span>
          <span className="text-muted-foreground">PPD</span>
          <span>{formatINR2(r.ppd)}</span>
          <span className="font-bold border-t pt-1">Credit</span>
          <span className="font-bold border-t pt-1 text-emerald-600">{formatINR(r.credit)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Main Page ---
const QAChecklist = () => {
  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">QA Checklist</h1>
            <p className="text-xs text-muted-foreground">
              Verify pricing, discounts, and checkout logic against expected values
            </p>
          </div>
        </div>

        {/* TOC */}
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-4">
            <h3 className="font-semibold text-sm mb-2">Jump to section</h3>
            <div className="flex flex-wrap gap-2">
              {[
                ["mrp-formula", "MRP Calculation Formula"],
                ["multi-year", "Multi-Year Discounts"],
                ["mrp", "MRP & Discount %"],
                ["checkout", "Checkout Scenarios"],
                ["ppd", "PPD Verification"],
                ["ppd-calc", "PPD Calculator"],
                ["enterprise", "Enterprise Config"],
                ["platform", "Platform Filters"],
                ["coupon", "Coupon Rules"],
                ["edge", "Edge Cases"],
              ].map(([id, label]) => (
                <a key={id} href={`#${id}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent text-xs">{label}</Badge>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 0: MRP Calculation Formula */}
        <Section title="⚙️ How MRP is Calculated (Back-Calculation)" id="mrp-formula">
          <Card className="rounded-xl">
            <CardContent className="pt-4 pb-4 space-y-4">
              <div className="text-sm space-y-2">
                <p>
                  <strong>We do NOT store hardcoded MRP values.</strong> Instead, we store only the <Badge variant="secondary">discounted price</Badge> and 
                  the <Badge variant="secondary">actual discount %</Badge> for each plan, then <strong>back-calculate</strong> the MRP (strike-off price) using:
                </p>
                <div className="bg-muted rounded-lg p-3 font-mono text-xs space-y-1">
                  <p>MRP = Math.round(discounted / (1 - actualDiscountPercent / 100))</p>
                  <p className="text-muted-foreground">// For multi-year:</p>
                  <p>totalDiscounted = annualDiscounted × years</p>
                  <p>originalPrice = Math.round(totalDiscounted / (1 - actualDiscountPercent / 100))</p>
                </div>
                <p className="text-muted-foreground">
                  This matches the backend exactly — the backend also back-calculates MRP from the discounted price, avoiding ₹1 rounding differences that occur when hardcoding MRP and multiplying for multi-year.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Plan Discount Rates</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Display %</TableHead>
                      <TableHead>Actual %</TableHead>
                      <TableHead>Fresh Discounted</TableHead>
                      <TableHead>Back-Calc MRP (1yr)</TableHead>
                      <TableHead>Back-Calc MRP (3yr)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PLAN_NAMES.map((plan) => {
                      const discounted = ANNUAL_DISCOUNTED.fresh[plan];
                      const actual = ACTUAL_PLAN_DISCOUNTS[plan];
                      const mrp1 = Math.round(discounted / (1 - actual / 100));
                      const mrp3 = Math.round((discounted * 3) / (1 - actual / 100));
                      return (
                        <TableRow key={plan}>
                          <TableCell className="font-medium capitalize">{plan}</TableCell>
                          <TableCell>{PLAN_DISCOUNTS[plan]}%</TableCell>
                          <TableCell className="font-mono text-xs">{actual}%</TableCell>
                          <TableCell>{formatINR(discounted)}</TableCell>
                          <TableCell>{formatINR(mrp1)}</TableCell>
                          <TableCell>{formatINR(mrp3)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="text-sm">
                <h4 className="font-semibold mb-1">Example: Diamond, 3yr, Fresh</h4>
                <div className="bg-muted rounded-lg p-3 font-mono text-xs space-y-1">
                  <p>annualDiscounted = ₹2,599</p>
                  <p>totalDiscounted = 2599 × 3 = ₹7,797</p>
                  <p>originalPrice = Math.round(7797 / (1 - 0.2779))</p>
                  <p>             = Math.round(7797 / 0.7221)</p>
                  <p>             = Math.round(10797.67) = <strong>₹10,798</strong></p>
                  <p className="text-emerald-600">✓ Matches backend exactly</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Section 1 */}
        <Section title="1. Multi-Year Discount Verification" id="multi-year">
          <p className="text-sm text-muted-foreground">
            Verify these discounts appear correctly when selecting different tenures on the checkout page.
          </p>
          <Card className="rounded-xl">
            <CardContent className="pt-4 pb-4">
              <MultiYearDiscountTable />
            </CardContent>
          </Card>
        </Section>

        {/* Section 2 */}
        <Section title="2. Label Price (MRP) & Discount % Validation" id="mrp">
          <p className="text-sm text-muted-foreground">
            MRP values below are <strong>back-calculated</strong> from discounted prices (not hardcoded). For each user type, verify the struck-through MRP, discount badge %, and annual price on the plan list page.
          </p>
          <div className="space-y-4">
            {USER_TYPES.map((ut) => (
              <MRPValidationTable key={ut} userType={ut} />
            ))}
          </div>
        </Section>

        {/* Section 3 */}
        <Section title="3. Checkout Price Breakdown Scenarios" id="checkout">
          <p className="text-sm text-muted-foreground">
            Open each scenario in checkout and compare every line item against the expected values below.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CHECKOUT_SCENARIOS.map((s, i) => (
              <CheckoutScenarioCard key={i} s={s} />
            ))}
          </div>
        </Section>

        {/* Section 4 */}
        <Section title="4. Upgrade Credit (PPD) Verification" id="ppd">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Verify the PPD calculation by expanding the "Credit Calculation" section on the checkout page for upgrade users.
            </p>
            <Link to="/ppd-calculator">
              <Button variant="outline" size="sm" className="text-xs gap-1 shrink-0">
                PPD Calculator <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PPD_SCENARIOS.map((s, i) => (
              <PPDCard key={i} s={s} />
            ))}
          </div>
        </Section>

        {/* Section 5: Enterprise Config */}
        <Section title="5. Enterprise Business & User Pricing" id="enterprise">
          <p className="text-sm text-muted-foreground">
            Enterprise plan supports custom businesses ({ENTERPRISE_BASE.businesses}–{ENTERPRISE_MAX_BUSINESSES}) and user slabs. Addon costs are constant across user types; MRP is back-calculated from discounted price using {ACTUAL_PLAN_DISCOUNTS.enterprise}% discount.
          </p>
          <Card className="rounded-xl">
            <CardContent className="pt-4 pb-4">
              <h4 className="font-semibold text-sm mb-2">Business Addon (per additional business, discounted)</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Businesses</TableHead>
                    <TableHead>Addon</TableHead>
                    <TableHead>Fresh Total</TableHead>
                    <TableHead>Fresh MRP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[2, 3, 4, 5].map((biz) => {
                    const addon = Math.max(0, biz - ENTERPRISE_BASE.businesses) * ENTERPRISE_EXTRA_BUSINESS_COST;
                    const total = ANNUAL_DISCOUNTED.fresh.enterprise + addon;
                    return (
                      <TableRow key={biz}>
                        <TableCell>{biz}</TableCell>
                        <TableCell>{addon === 0 ? "Base" : `+${formatINR(addon)}`}</TableCell>
                        <TableCell className="font-medium">{formatINR(total)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatINR(getEnterpriseMRP(total))}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell>6+</TableCell>
                    <TableCell colSpan={3} className="text-amber-600 font-medium">Contact Sales</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="pt-4 pb-4">
              <h4 className="font-semibold text-sm mb-2">User Slab Addon (cumulative from base {ENTERPRISE_BASE.users} users)</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Users</TableHead>
                    <TableHead>Addon</TableHead>
                    <TableHead>Fresh Total (2 biz)</TableHead>
                    <TableHead>Fresh MRP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ENTERPRISE_USER_SLAB_COSTS.map((slab) => {
                    const total = ANNUAL_DISCOUNTED.fresh.enterprise + slab.addon;
                    return (
                      <TableRow key={slab.maxUsers}>
                        <TableCell>{slab.label}</TableCell>
                        <TableCell>{slab.addon === 0 ? "Base" : `+${formatINR(slab.addon)}`}</TableCell>
                        <TableCell className="font-medium">{formatINR(total)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatINR(getEnterpriseMRP(total))}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell>16+</TableCell>
                    <TableCell colSpan={3} className="text-amber-600 font-medium">Contact Sales</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="pt-4 pb-4">
              <h4 className="font-semibold text-sm mb-2">Cross-check Scenarios</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                {[
                  { biz: 5, users: 3 as const, label: "5 biz, 3 users" },
                  { biz: 2, users: 10 as const, label: "2 biz, 6-10 users" },
                  { biz: 2, users: 15 as const, label: "2 biz, 11-15 users" },
                  { biz: 4, users: 4 as const, label: "4 biz, 4 users" },
                  { biz: 4, users: 5 as const, label: "4 biz, 5 users" },
                ].map((sc) => {
                  const r = getEnterpriseAddon(sc.biz, sc.users);
                  const total = ANNUAL_DISCOUNTED.fresh.enterprise + r.addonCost;
                  return (
                    <React.Fragment key={sc.label}>
                      <span className="text-muted-foreground">{sc.label}</span>
                      <span className="font-medium">{formatINR(total)} (MRP: {formatINR(getEnterpriseMRP(total))})</span>
                    </React.Fragment>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="pt-4 pb-4">
              <h4 className="font-semibold text-sm mb-2">Upgrade Rules</h4>
              <ul className="space-y-2">
                <CheckItem>Enterprise-to-Enterprise upgrades are allowed (increase biz/users only)</CheckItem>
                <CheckItem>Cannot downgrade: new biz ≥ current biz, new users ≥ current users</CheckItem>
                <CheckItem>Enterprise current plan credit includes addon costs in PPD calculation</CheckItem>
                <CheckItem>6+ businesses or 16+ users → "Contact Sales" replaces price breakdown</CheckItem>
                <CheckItem>
                  <strong>Old vs New multi-year discount toggle</strong>: Available on both the Checkout page and the standalone PPD Calculator (for durations &gt; 1yr). Old slabs apply to plans purchased before the discount reduction.
                </CheckItem>
                <CheckItem>
                  <strong>PPD purchase type</strong>: For Platinum/Enterprise upgrades, the credit varies based on how the current plan was purchased.
                  Platinum Fresh = {formatINR(ANNUAL_DISCOUNTED.fresh.platinum)}/yr vs Renewal After = {formatINR(ANNUAL_DISCOUNTED.renewal_after.platinum)}/yr.
                  Enterprise Fresh = {formatINR(ANNUAL_DISCOUNTED.fresh.enterprise)}/yr vs Renewal After = {formatINR(ANNUAL_DISCOUNTED.renewal_after.enterprise)}/yr.
                </CheckItem>
              </ul>
            </CardContent>
          </Card>
        </Section>

        {/* Section 6 */}
        <Section title="6. Platform Filter Checks" id="platform">
          <Card className="rounded-xl">
            <CardContent className="pt-4 pb-4">
              <ul className="space-y-2">
                <CheckItem>
                  <strong>Android</strong>: All 4 plans visible (Silver, Diamond, Platinum, Enterprise)
                </CheckItem>
                <CheckItem>
                  <strong>Web</strong>: Only 3 plans visible (Diamond, Platinum, Enterprise) — Silver is hidden
                </CheckItem>
                <CheckItem>
                  Switch from Android → Web while <strong>Silver is selected</strong> → should auto-switch to Diamond
                </CheckItem>
              </ul>
              <div className="flex gap-2 mt-3">
                <Link to="/?platform=android">
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    Test Android <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
                <Link to="/?platform=web">
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    Test Web <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Section 7 */}
        <Section title="7. Coupon / Discount Rules" id="coupon">
          <Card className="rounded-xl">
            <CardContent className="pt-4 pb-4">
              <ul className="space-y-2">
                <CheckItem>
                  <strong>Fresh users</strong>: Coupon section is enabled and interactive
                </CheckItem>
                <CheckItem>
                  <strong>Renewal users</strong>: Coupon section is disabled with "Not applicable for renewal users" message
                </CheckItem>
                <CheckItem>
                  <strong>Upgrade users</strong>: Coupon section is disabled with "Not applicable for upgrade users" message
                </CheckItem>
              </ul>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Link to="/calculator?userType=fresh&plan=platinum">
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    Fresh Checkout <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
                <Link to="/calculator?userType=renewal_after&plan=platinum">
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    Renewal Checkout <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
                <Link to="/calculator?userType=upgrade&plan=platinum">
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    Upgrade Checkout <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Section 8 */}
        <Section title="8. Edge Cases" id="edge">
          <Card className="rounded-xl">
            <CardContent className="pt-4 pb-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>
                    <strong>Credit &gt; price</strong>: When upgrade credit exceeds the new plan price, total before GST should be ₹0 (not negative). GST should also be ₹0.
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>
                    <strong>Expired plan</strong>: If the plan start date + duration is in the past, remaining days = 0 and credit = ₹0.
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>
                    <strong>Same-day start</strong>: If start date is today, remaining days should equal total days (maximum credit).
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>
                    <strong>GST on post-credit amount</strong>: GST (18%) must be computed on the amount after subtracting upgrade credit, not before.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </Section>
      </div>
    </div>
  );
};

export default QAChecklist;
