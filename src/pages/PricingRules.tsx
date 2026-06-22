import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PLANS_BY_TYPE, ANNUAL_DISCOUNTED, MULTI_YEAR_DISCOUNTS, OLD_MULTI_YEAR_DISCOUNTS,
  MONTHLY_PRICES, MONTHLY_DISCOUNTED_FIRST_MONTH, MONTHLY_PRICES_V2, QUARTERLY_PRICES_V2, V2_SALES_TOUCH_PLANS, GST_RATE, COUPON_OPTIONS,
  ENTERPRISE_BASE, ENTERPRISE_EXTRA_BUSINESS_COST, ENTERPRISE_USER_SLAB_COSTS,
  ENTERPRISE_MAX_BUSINESSES, ENTERPRISE_MAX_USERS, PLAN_PLATFORM,
  ACTUAL_PLAN_DISCOUNTS, PLAN_DISPLAY_NAMES_V2, NEW_CATALOG_CUTOFF, formatINR,
} from "@/lib/pricing-data";

const SectionCard = ({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) => (
  <Card className="mb-6">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-xl">{title}</CardTitle>
      {badge && <Badge variant="outline">{badge}</Badge>}
    </CardHeader>
    <CardContent className="space-y-3 text-sm">{children}</CardContent>
  </Card>
);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between border-b border-dashed py-1.5">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const PLAN_ORDER = ["silver", "diamond", "platinum", "enterprise"] as const;

const PricingRules = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pricing Conditions — Summary</h1>
            <p className="text-sm text-muted-foreground">All rules powering plan, renewal, upgrade & monthly pricing</p>
          </div>
          <div className="flex gap-2">
            <Link to="/"><Button variant="outline" size="sm">Plan List</Button></Link>
            <Link to="/calculator"><Button variant="outline" size="sm">Calculator</Button></Link>
            <Link to="/qa"><Button variant="outline" size="sm">QA</Button></Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Decision callout */}
        <Card className="mb-6 border-amber-300 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-900">Open question for discussion</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900 space-y-2">
            <p>
              Today we maintain <strong>three pricing cohorts</strong> for Platinum &amp; Enterprise:
              <em> Fresh</em>, <em>Renewal After 16 Feb 2024</em>, and <em>Renewal Before 16 Feb 2024</em>.
            </p>
            <p>
              The <strong>Renewal Before / After</strong> split exists only for legacy users and adds significant
              backend complexity (cohort detection by first-purchase date, separate MRP tables, branching in
              upgrade-credit calc). Silver &amp; Diamond have the same price across all cohorts.
            </p>
            <p>
              <strong>New from {NEW_CATALOG_CUTOFF}:</strong> a 4th cohort — <em>Fresh — After 22 Jun 2026</em> —
              with a renamed catalog (Starter / Standard / Growth / Advanced) and significantly higher
              prices. This further fragments backend pricing tables, so the renewal-tier decision below
              is now more pressing.
            </p>
            <p className="font-medium">
              Decision needed: keep both renewal tiers, collapse into a single renewal price, or sunset
              "Renewal Before" entirely?
            </p>
          </CardContent>
        </Card>

        {/* 1. User Cohorts */}
        <SectionCard title="1. User Cohorts" badge="Who pays what">
          <Row label="Fresh — Before 22 Jun 2026" value="First purchase before 22 Jun 2026 (legacy catalog)" />
          <Row label="Fresh — After 22 Jun 2026" value="First purchase on/after 22 Jun 2026 (new catalog: Starter/Standard/Growth/Advanced)" />
          <Row label="Renewal — After 16 Feb 2024" value="First purchase on/after 16 Feb 2024, renewing" />
          <Row label="Renewal — Before 16 Feb 2024" value="First purchase before 16 Feb 2024, renewing" />
          <Row label="Upgrade" value="Existing active plan, upgrading tier/duration (uses Renewal-After prices)" />
        </SectionCard>

        {/* 2. Annual base prices */}
        <SectionCard title="2. Annual Base Prices (Ex-GST, ₹)" badge="Per cohort">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-2">Plan (legacy → new name)</th>
                  <th className="text-right p-2">Fresh (legacy)</th>
                  <th className="text-right p-2">Fresh — After 22 Jun 2026</th>
                  <th className="text-right p-2">Renewal After</th>
                  <th className="text-right p-2">Renewal Before</th>
                </tr>
              </thead>
              <tbody>
                {PLAN_ORDER.map((p) => (
                  <tr key={p} className="border-b">
                    <td className="p-2 capitalize font-medium">
                      {p} <span className="text-muted-foreground">→ {PLAN_DISPLAY_NAMES_V2[p]}</span>
                    </td>
                    <td className="p-2 text-right">{formatINR(ANNUAL_DISCOUNTED.fresh[p])}</td>
                    <td className="p-2 text-right text-emerald-700 font-medium">
                      {p === "enterprise" ? `${formatINR(ANNUAL_DISCOUNTED.fresh_v2_2026[p])}+` : formatINR(ANNUAL_DISCOUNTED.fresh_v2_2026[p])}
                    </td>
                    <td className="p-2 text-right">{formatINR(ANNUAL_DISCOUNTED.renewal_after[p])}</td>
                    <td className="p-2 text-right">{formatINR(ANNUAL_DISCOUNTED.renewal_before[p])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            From 22 Jun 2026 the catalog is renamed: Silver→Starter, Diamond→Standard, Platinum→Growth, Enterprise→Advanced.
            Advanced is sales-touch only; ₹6,840 is the starting price before customization.
          </p>
        </SectionCard>


        {/* 3. Plan discount */}
        <SectionCard title="3. Plan-Level Discount (vs MRP)">
          {PLAN_ORDER.map((p) => (
            <Row
              key={p}
              label={p.charAt(0).toUpperCase() + p.slice(1)}
              value={`${ACTUAL_PLAN_DISCOUNTS[p]}% (shown as ${PLANS_BY_TYPE.fresh.find((x) => x.key === p)?.discountPercent}%)`}
            />
          ))}
          <p className="text-xs text-muted-foreground pt-2">
            MRP is back-calculated from the discounted price using the actual % to keep totals exact.
          </p>
        </SectionCard>

        {/* 4. Multi-year */}
        <SectionCard title="4. Multi-Year Discount Slabs" badge="Stacked on plan price">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-2">Duration</th>
                  <th className="text-right p-2">New slab</th>
                  <th className="text-right p-2">Legacy slab</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(MULTI_YEAR_DISCOUNTS).map((d) => (
                  <tr key={d} className="border-b">
                    <td className="p-2">{d.replace("yr", " yr")}</td>
                    <td className="p-2 text-right">{MULTI_YEAR_DISCOUNTS[d as keyof typeof MULTI_YEAR_DISCOUNTS]}%</td>
                    <td className="p-2 text-right text-muted-foreground">
                      {OLD_MULTI_YEAR_DISCOUNTS[d as keyof typeof OLD_MULTI_YEAR_DISCOUNTS]}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* 5. Discount sequence */}
        <SectionCard title="5. Discount Application Sequence">
          <ol className="list-decimal ml-5 space-y-1">
            <li>Start with MRP × years</li>
            <li>Apply plan-level discount → discounted annual price × years</li>
            <li>Apply multi-year slab discount</li>
            <li>Apply coupon (if any)</li>
            <li>Subtract upgrade credit (upgrades only)</li>
            <li>Add 18% GST</li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Total % off = 1 − (1 − plan%) × (1 − multiYear%) × (1 − coupon%)
          </p>
        </SectionCard>

        {/* 6. Coupons */}
        <SectionCard title="6. Coupons">
          <Row label="Available coupons" value={COUPON_OPTIONS.map((c) => `${c}%`).join(", ")} />
          <Row label="Disabled for" value="Upgrade & Renewal cohorts" />
          <Row label="Disabled for" value="Monthly plans" />
        </SectionCard>

        {/* 7. Monthly */}
        <SectionCard title="7. Monthly Plans (legacy)">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-2">Plan</th>
                  <th className="text-right p-2">Monthly price</th>
                  <th className="text-right p-2">1st month (Exp A)</th>
                </tr>
              </thead>
              <tbody>
                {PLAN_ORDER.map((p) => (
                  <tr key={p} className="border-b">
                    <td className="p-2 capitalize">{p}</td>
                    <td className="p-2 text-right">{formatINR(MONTHLY_PRICES[p])}</td>
                    <td className="p-2 text-right">{formatINR(MONTHLY_DISCOUNTED_FIRST_MONTH[p])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Row label="Duration" value="31 days; credit calc uses 30-day basis" />
          <Row label="Coupons" value="Not applicable" />
        </SectionCard>

        {/* 7b. New catalog billing cycles */}
        <SectionCard title="7b. New Catalog — Monthly / Quarterly / Yearly" badge="Post 22 Jun 2026">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-2">Plan (legacy → new)</th>
                  <th className="text-right p-2">Monthly</th>
                  <th className="text-right p-2">Quarterly</th>
                  <th className="text-right p-2">Yearly</th>
                </tr>
              </thead>
              <tbody>
                {PLAN_ORDER.map((p) => {
                  const salesTouch = V2_SALES_TOUCH_PLANS.includes(p);
                  return (
                    <tr key={p} className="border-b">
                      <td className="p-2 capitalize font-medium">
                        {p} <span className="text-muted-foreground">→ {PLAN_DISPLAY_NAMES_V2[p]}</span>
                      </td>
                      <td className="p-2 text-right">
                        {salesTouch && <span className="text-xs text-amber-700 mr-1">Talk to sales</span>}
                        {formatINR(MONTHLY_PRICES_V2[p])}/mo
                      </td>
                      <td className="p-2 text-right">
                        {salesTouch && <span className="text-xs text-amber-700 mr-1">Talk to sales</span>}
                        {formatINR(QUARTERLY_PRICES_V2[p])}/qtr
                      </td>
                      <td className="p-2 text-right">
                        {salesTouch && <span className="text-xs text-amber-700 mr-1">Talk to sales</span>}
                        {formatINR(ANNUAL_DISCOUNTED.fresh_v2_2026[p])}/yr
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Quarterly is a brand-new billing cycle introduced with the post-22-Jun-2026 catalog
            (legacy cohorts have only monthly &amp; yearly). Advanced (Enterprise) prices are shown
            for reference but the plan is sales-touch only.
          </p>
        </SectionCard>

        {/* 8. Upgrade rules */}
        <SectionCard title="8. Upgrade Rules">
          <Row label="Credit formula" value="(total paid ÷ total days) × remaining days" />
          <Row label="Yearly upgrade — current plan price" value="Based on cohort of first purchase (Fresh / R-After / R-Before)" />
          <Row label="Monthly → Yearly (same tier)" value="No credit; validity = 365×yrs + remaining days" />
          <Row label="Monthly → Yearly (higher tier)" value="Pro-rata credit applied; validity = 365×yrs" />
          <Row label="Restrictions" value="No downgrades, no identical plan re-purchase, tenure caps apply" />
        </SectionCard>

        {/* 9. Enterprise */}
        <SectionCard title="9. Enterprise Customization">
          <Row label="Base" value={`${ENTERPRISE_BASE.businesses} businesses, ${ENTERPRISE_BASE.users} users`} />
          <Row label="Extra business" value={`${formatINR(ENTERPRISE_EXTRA_BUSINESS_COST)} / business`} />
          <Row label="Max before contact-sales" value={`${ENTERPRISE_MAX_BUSINESSES} businesses, ${ENTERPRISE_MAX_USERS} users`} />
          <div className="pt-2">
            <p className="font-medium mb-1">User slab add-ons:</p>
            <table className="w-full text-sm">
              <tbody>
                {ENTERPRISE_USER_SLAB_COSTS.map((s) => (
                  <tr key={s.maxUsers} className="border-b">
                    <td className="p-1.5">{s.label} users</td>
                    <td className="p-1.5 text-right">+{formatINR(s.addon)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* 10. Platform & GST */}
        <SectionCard title="10. Platform & GST">
          {PLAN_ORDER.map((p) => (
            <Row key={p} label={p.charAt(0).toUpperCase() + p.slice(1)} value={PLAN_PLATFORM[p].join(", ")} />
          ))}
          <Row label="GST" value={`${GST_RATE}% added on final amount`} />
          <p className="text-xs text-muted-foreground pt-2">
            Silver is Android-only — web users auto-fallback to next available plan.
          </p>
        </SectionCard>

        <div className="text-center text-xs text-muted-foreground py-6">
          Internal QA reference · All prices in INR · Ex-GST unless noted
        </div>
      </div>
    </div>
  );
};

export default PricingRules;
