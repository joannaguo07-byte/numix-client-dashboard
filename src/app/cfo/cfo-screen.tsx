"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
    AlertCircle,
    BarChart01,
    BarChartSquare02,
    Calendar,
    ChevronDown,
    ChevronRight,
    Clock,
    CoinsStacked01,
    InfoCircle,
    LineChartUp01,
    Stars01,
} from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { Tabs } from "@/components/application/tabs/tabs";
import { cx } from "@/utils/cx";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CFOPage = "forecast" | "save-money" | "make-money";

interface CFOScreenProps {
    page?: CFOPage;
    onAskAccountant?: (prompt: string) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const YEAR_OPTIONS = [
    { id: "2025", label: "Fiscal Year 2025" },
    { id: "2024", label: "Fiscal Year 2024" },
    { id: "2023", label: "Fiscal Year 2023" },
];

const PAGE_TITLES: Record<CFOPage, string> = {
    forecast: "Financial Forecast",
    "save-money": "How to Save Money",
    "make-money": "How to Make Money",
};

const PAGE_ICONS: Record<CFOPage, React.FC<React.SVGProps<SVGSVGElement>>> = {
    forecast: LineChartUp01,
    "save-money": CoinsStacked01,
    "make-money": Stars01,
};

// ─── Forecast Data ───────────────────────────────────────────────────────────

const FORECAST_METRICS = [
    { label: "Revenue", value: "$1,235,000", change: "+12.3%", positive: true },
    { label: "Expenses", value: "$828,000", change: "+8.1%", positive: false },
    { label: "Net Income", value: "$407,000", change: "+18.7%", positive: true },
    { label: "Cash Flow", value: "$453,000", change: "+15.2%", positive: true },
];

const QUARTERLY_DATA = [
    { quarter: "Q1", revenue: 285000, expenses: 195000, netIncome: 90000, cashFlow: 102000 },
    { quarter: "Q2", revenue: 310000, expenses: 208000, netIncome: 102000, cashFlow: 115000 },
    { quarter: "Q3", revenue: 320000, expenses: 212000, netIncome: 108000, cashFlow: 118000 },
    { quarter: "Q4", revenue: 320000, expenses: 213000, netIncome: 107000, cashFlow: 118000 },
];

const YOY_DATA = [
    { metric: "Revenue", projected: "$1,235,000", actual: "$1,098,000", change: "+12.5%" },
    { metric: "Expenses", projected: "$828,000", actual: "$765,000", change: "+8.2%" },
    { metric: "Net Income", projected: "$407,000", actual: "$333,000", change: "+22.2%" },
    { metric: "Cash Flow", projected: "$453,000", actual: "$389,000", change: "+16.5%" },
];

const FORECAST_MILESTONES = [
    { date: "Apr 30, 2025", description: "Q1 actuals finalized", type: "Review" as const },
    { date: "Jul 15, 2025", description: "Mid-year forecast revision", type: "Forecast" as const },
    { date: "Oct 1, 2025", description: "Q4 budget lock", type: "Budget" as const },
];

// ─── Save Money Data ─────────────────────────────────────────────────────────

const SAVING_OPPORTUNITIES = [
    { name: "Renegotiate SaaS Vendor Contracts", category: "Vendor Management", saving: "$42,000", deadline: "Q2 2025", confidence: 92 },
    { name: "Consolidate Cloud Infrastructure", category: "IT Optimization", saving: "$28,500", deadline: "Q3 2025", confidence: 88 },
    { name: "Switch to Group Health Plan", category: "Benefits", saving: "$18,200", deadline: "Jan 1, 2026", confidence: 76 },
    { name: "Automate AP/AR Processing", category: "Operations", saving: "$15,600", deadline: "Q2 2025", confidence: 85 },
    { name: "Reduce Office Footprint", category: "Real Estate", saving: "$36,000", deadline: "Jul 2025", confidence: 71 },
    { name: "Tax Credit Optimization (R&D + WOTC)", category: "Tax Strategy", saving: "$69,000", deadline: "Dec 31, 2025", confidence: 91 },
];

const BUDGET_CATEGORIES = [
    { name: "Engineering", budgeted: 180000, actual: 165600, utilization: 92 },
    { name: "Marketing", budgeted: 85000, actual: 91800, utilization: 108 },
    { name: "Operations", budgeted: 120000, actual: 105600, utilization: 88 },
    { name: "Sales", budgeted: 95000, actual: 77900, utilization: 82 },
    { name: "G&A", budgeted: 60000, actual: 67800, utilization: 113 },
    { name: "R&D", budgeted: 150000, actual: 111000, utilization: 74 },
];

// ─── Make Money Data ─────────────────────────────────────────────────────────

const COMPANY_OPTIONS = [
    { id: "all", label: "All Companies" },
    { id: "acme-tech", label: "Acme Technologies" },
    { id: "acme-east", label: "Acme East LLC" },
    { id: "acme-staffing", label: "Acme Staffing Co." },
];

const CATEGORY_FILTERS = ["All", "Expansion", "Partnerships", "New Products", "Pricing"];

const REVENUE_STRATEGIES = [
    {
        id: "1",
        title: "Expand into Northeast Market",
        category: "Expansion",
        impact: "$270K",
        confidence: 85,
        companies: ["Acme Technologies", "Acme East LLC"],
        deadline: "Q3 2025",
        description: "Open satellite offices in Boston and NYC to capture enterprise clients. Revenue projections show a 22% increase in the Northeast corridor within 18 months.",
    },
    {
        id: "2",
        title: "Strategic SaaS Vendor Partnership",
        category: "Partnerships",
        impact: "$95K/yr",
        confidence: 72,
        companies: ["Acme Technologies"],
        deadline: "Q2 2025",
        description: "Partner with a leading SaaS vendor for co-marketing and bundled offerings. Projected incremental ARR of $95K through shared pipeline and bundled pricing.",
    },
    {
        id: "3",
        title: "Launch Premium Enterprise Tier",
        category: "New Products",
        impact: "$180K",
        confidence: 82,
        companies: ["Acme Technologies"],
        deadline: "Q3 2025",
        description: "Introduce a premium tier with SLA guarantees, dedicated support, and advanced analytics. Target top 20% of existing customers for upsell — estimated 30% conversion rate.",
    },
    {
        id: "4",
        title: "Annual Pricing Optimization",
        category: "Pricing",
        impact: "$120K",
        confidence: 78,
        companies: ["Acme Technologies", "Acme East LLC"],
        deadline: "Q2 2025",
        description: "Implement value-based pricing adjustments across product lines. Benchmark analysis shows current pricing is 15-20% below market for comparable features.",
    },
    {
        id: "5",
        title: "Staffing Revenue Expansion",
        category: "Expansion",
        impact: "$340K",
        confidence: 74,
        companies: ["Acme Staffing Co."],
        deadline: "Q4 2025",
        description: "Expand staffing services into healthcare and fintech verticals. Industry demand forecasts show 28% growth in contract staffing for these sectors in 2025.",
    },
];

// ─── Forecast Page ───────────────────────────────────────────────────────────

function ForecastPage() {
    const maxRevenue = Math.max(...QUARTERLY_DATA.map((q) => q.revenue));

    return (
        <div className="flex gap-4">
            {/* Left — main card */}
            <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-secondary bg-primary">
                {/* Blue banner header */}
                <div className="flex items-center justify-between border-b border-brand/20 bg-brand-primary_alt px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-primary">Acme Technologies Inc.</h3>
                            <p className="text-xs text-tertiary">S-Corporation &middot; FY 2025 Forecast</p>
                        </div>
                        <BadgeWithDot color="success" size="sm" type="pill-color">On Track</BadgeWithDot>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-tertiary">
                        <Clock className="size-3.5" />
                        Updated 2 hrs ago
                    </div>
                </div>

                <div className="divide-y divide-secondary">
                    {/* Key Metrics */}
                    <div className="px-6 py-5">
                        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-tertiary">Key Metrics</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
                            {FORECAST_METRICS.map((m) => (
                                <div key={m.label}>
                                    <p className="text-xs text-tertiary">{m.label}</p>
                                    <p className="text-sm font-medium tabular-nums text-primary">{m.value}</p>
                                    <Badge
                                        color={m.positive ? "success" : "error"}
                                        type="pill-color"
                                        size="sm"
                                        className="mt-1"
                                    >
                                        {m.change} YoY
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Revenue vs Expenses bar chart */}
                    <div className="px-6 py-5">
                        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-tertiary">Revenue vs Expenses by Quarter</h3>
                        <div className="space-y-4">
                            {QUARTERLY_DATA.map((q) => (
                                <div key={q.quarter} className="space-y-1.5">
                                    <p className="text-xs font-medium text-secondary">{q.quarter}</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 text-right text-xs tabular-nums text-tertiary">Revenue</div>
                                        <div className="h-5 flex-1 rounded-full bg-secondary">
                                            <div
                                                className="h-full rounded-full bg-brand-solid"
                                                style={{ width: `${(q.revenue / maxRevenue) * 100}%` }}
                                            />
                                        </div>
                                        <span className="w-20 text-right text-xs tabular-nums text-primary">${(q.revenue / 1000).toFixed(0)}K</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 text-right text-xs tabular-nums text-tertiary">Expenses</div>
                                        <div className="h-5 flex-1 rounded-full bg-secondary">
                                            <div
                                                className="h-full rounded-full bg-error-secondary"
                                                style={{ width: `${(q.expenses / maxRevenue) * 100}%` }}
                                            />
                                        </div>
                                        <span className="w-20 text-right text-xs tabular-nums text-primary">${(q.expenses / 1000).toFixed(0)}K</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quarterly Breakdown */}
                    <div className="px-6 py-5">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Quarterly Breakdown</h3>
                        <div className="overflow-hidden rounded-lg border border-secondary">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-secondary bg-secondary">
                                        <th className="px-4 py-2.5 text-left font-medium text-secondary">Metric</th>
                                        {QUARTERLY_DATA.map((q) => (
                                            <th key={q.quarter} className="px-4 py-2.5 text-right font-medium text-secondary">{q.quarter}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(["revenue", "expenses", "netIncome", "cashFlow"] as const).map((key) => (
                                        <tr key={key} className="border-b border-secondary last:border-b-0">
                                            <td className="px-4 py-2.5 font-medium text-primary">
                                                {key === "netIncome" ? "Net Income" : key === "cashFlow" ? "Cash Flow" : key.charAt(0).toUpperCase() + key.slice(1)}
                                            </td>
                                            {QUARTERLY_DATA.map((q) => (
                                                <td key={q.quarter} className="px-4 py-2.5 text-right tabular-nums text-primary">
                                                    ${(q[key] / 1000).toFixed(0)}K
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Year-over-Year Comparison */}
                    <div className="px-6 py-5">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Year-over-Year Comparison</h3>
                        <div className="overflow-hidden rounded-lg border border-secondary">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-secondary bg-secondary">
                                        <th className="px-4 py-2.5 text-left font-medium text-secondary">Metric</th>
                                        <th className="px-4 py-2.5 text-right font-medium text-secondary">2025 Projected</th>
                                        <th className="px-4 py-2.5 text-right font-medium text-secondary">2024 Actual</th>
                                        <th className="px-4 py-2.5 text-right font-medium text-secondary">Change</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {YOY_DATA.map((row) => (
                                        <tr key={row.metric} className="border-b border-secondary last:border-b-0">
                                            <td className="px-4 py-2.5 font-medium text-primary">{row.metric}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-primary">{row.projected}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-tertiary">{row.actual}</td>
                                            <td className="px-4 py-2.5 text-right">
                                                <Badge color="success" type="pill-color" size="sm">{row.change}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right column — sidebar */}
            <div className="w-64 shrink-0 space-y-4 self-start">
                {/* AI insight card — gradient like Tax Overview */}
                <div className="rounded-xl bg-gradient-to-r from-purple-200/60 via-purple-100/50 to-blue-200/60 p-4">
                    <Stars01 className="mb-2 size-4 text-fg-brand-secondary_alt" />
                    <p className="text-xs text-tertiary">
                        Based on current growth, consider adjusting Q3-Q4 revenue projections upward by 5-8%.
                        Seasonal patterns suggest stronger Q4 performance.
                    </p>
                    <button type="button" className="mt-2 text-xs font-semibold text-brand-secondary hover:underline">
                        View full analysis
                    </button>
                </div>

                {/* Milestones card — matches Deadlines card */}
                <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                    <div className="px-4 pt-3 pb-1">
                        <div className="flex items-center gap-2">
                            <Calendar className="size-3.5 text-fg-brand-primary" />
                            <h3 className="text-sm font-semibold text-brand-secondary">Milestones</h3>
                        </div>
                    </div>
                    <div className="space-y-2 p-3">
                        {FORECAST_MILESTONES.map((milestone, i) => (
                            <div
                                key={i}
                                className={cx(
                                    "rounded-lg border-l-[3px] py-2.5 pr-3 pl-3",
                                    milestone.type === "Forecast"
                                        ? "border-l-purple-500 bg-purple-50"
                                        : milestone.type === "Budget"
                                            ? "border-l-blue-500 bg-blue-50"
                                            : "border-l-pink-500 bg-pink-50",
                                )}
                            >
                                <p className="text-xs font-medium text-primary">{milestone.description}</p>
                                <div className="mt-1.5 flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <Clock className="size-3 text-fg-quaternary" />
                                        <span className="text-[11px] font-medium text-secondary">{milestone.date}</span>
                                    </div>
                                    <Badge color={milestone.type === "Forecast" ? "purple" : milestone.type === "Budget" ? "blue" : "pink"} size="sm" type="pill-color">
                                        {milestone.type}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Save Money Page ─────────────────────────────────────────────────────────

function SaveMoneyPage({ onAskAccountant }: { onAskAccountant?: (prompt: string) => void }) {
    const totalSavings = SAVING_OPPORTUNITIES.reduce((s, o) => s + parseInt(o.saving.replace(/[$,]/g, "")), 0);
    const overBudgetCount = BUDGET_CATEGORIES.filter((c) => c.utilization > 100).length;

    return (
        <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
            {/* Blue banner header */}
            <div className="flex items-center justify-between border-b border-brand/20 bg-brand-primary_alt px-6 py-4">
                <div>
                    <h3 className="text-sm font-semibold text-primary">How to Save Money</h3>
                    <p className="text-xs text-tertiary">AI-Identified Cost Reduction Opportunities &middot; FY 2025</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-tertiary">Generated by</p>
                        <p className="text-sm font-medium text-primary">Numix AI</p>
                    </div>
                    <Button color="secondary" size="sm">Export report</Button>
                </div>
            </div>

            <div className="divide-y divide-secondary">
                {/* Hero savings */}
                <div className="flex items-center justify-between px-6 py-5">
                    <div>
                        <p className="text-xs text-tertiary">Total Potential Annual Savings</p>
                        <p className="mt-1 text-3xl font-semibold tracking-tight text-success-primary">
                            ${totalSavings.toLocaleString()}
                        </p>
                        <button type="button" className="mt-1 text-xs font-medium text-brand-primary hover:underline">
                            How is this number calculated?
                        </button>
                    </div>
                    <Button color="secondary" size="sm">View expense projections</Button>
                </div>

                {/* Budget overview */}
                <div className="px-6 py-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Current Spend by Category</h3>
                        {overBudgetCount > 0 && (
                            <div className="flex items-center gap-1.5">
                                <AlertCircle className="size-3.5 text-fg-warning-primary" />
                                <span className="text-xs text-warning-primary">{overBudgetCount} over budget</span>
                            </div>
                        )}
                    </div>
                    <div className="divide-y divide-secondary rounded-lg border border-secondary">
                        {BUDGET_CATEGORIES.map((cat) => {
                            const over = cat.utilization > 100;
                            return (
                                <div key={cat.name} className="flex items-center gap-4 px-4 py-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-medium text-primary">{cat.name}</p>
                                            <InfoCircle className="size-3.5 text-fg-quaternary" />
                                        </div>
                                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                                            <div
                                                className={cx("h-full rounded-full", over ? "bg-error-solid" : "bg-success-solid")}
                                                style={{ width: `${Math.min(cat.utilization, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold tabular-nums text-primary">
                                        ${(cat.actual / 1000).toFixed(0)}K / ${(cat.budgeted / 1000).toFixed(0)}K
                                    </p>
                                    <Badge color={over ? "error" : "success"} type="pill-color" size="sm">{cat.utilization}%</Badge>
                                    <ChevronRight className="size-4 text-fg-quaternary" />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Saving opportunities */}
                <div className="px-6 py-5">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Saving Opportunities</h3>
                    <div className="divide-y divide-secondary rounded-lg border border-secondary">
                        {SAVING_OPPORTUNITIES.map((opp) => (
                            <div key={opp.name} className="flex items-center gap-4 px-4 py-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-medium text-primary">{opp.name}</p>
                                        <InfoCircle className="size-3.5 text-fg-quaternary" />
                                    </div>
                                    <p className="text-xs text-tertiary">{opp.category}</p>
                                </div>
                                <p className="text-sm font-semibold tabular-nums text-success-primary">{opp.saving}</p>
                                <div className="text-right">
                                    <p className="text-sm text-primary">{opp.deadline}</p>
                                    <p className="text-xs text-tertiary">Deadline</p>
                                </div>
                                <div className="flex w-20 items-center gap-1.5">
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                                        <div className="h-full rounded-full bg-brand-solid" style={{ width: `${opp.confidence}%` }} />
                                    </div>
                                    <span className="text-xs tabular-nums text-tertiary">{opp.confidence}%</span>
                                </div>
                                <button
                                    type="button"
                                    className="flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
                                    onClick={() => onAskAccountant?.(`How can I save money by implementing "${opp.name}"?`)}
                                >
                                    <Stars01 className="size-3.5" />
                                    how?
                                </button>
                                <ChevronRight className="size-4 text-fg-quaternary" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI footer */}
                <div className="px-6 py-5">
                    <div className="rounded-xl bg-gradient-to-r from-purple-200/60 via-purple-100/50 to-blue-200/60 p-4">
                        <Stars01 className="mb-2 size-4 text-fg-brand-secondary_alt" />
                        <p className="text-xs text-tertiary">
                            These savings opportunities are identified from your spending patterns, vendor benchmarks, and industry data.
                            Confidence scores reflect feasibility and historical success rates.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Make Money Page ─────────────────────────────────────────────────────────

function MakeMoneyPage({ onAskAccountant }: { onAskAccountant?: (prompt: string) => void }) {
    const [selectedCompany, setSelectedCompany] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filtered = REVENUE_STRATEGIES.filter((s) => {
        if (selectedCategory !== "All" && s.category !== selectedCategory) return false;
        if (selectedCompany !== "all") {
            const companyLabel = COMPANY_OPTIONS.find((c) => c.id === selectedCompany)?.label;
            if (companyLabel && !s.companies.includes(companyLabel)) return false;
        }
        return true;
    });

    const totalImpact = "$496K";

    return (
        <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
            {/* Blue banner header — matches Tax Planning */}
            <div className="flex items-center justify-between border-b border-brand/20 bg-brand-primary_alt px-6 py-4">
                <div>
                    <h3 className="text-sm font-semibold text-primary">Strategic Planning</h3>
                    <p className="text-xs text-tertiary">AI-Generated Strategies &middot; FY 2025</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-tertiary">Generated by</p>
                        <p className="text-sm font-medium text-primary">Numix AI</p>
                    </div>
                    <Button color="secondary" size="sm">Export report</Button>
                </div>
            </div>

            <div className="divide-y divide-secondary">
                {/* Hero impact row — matches Tax Planning savings */}
                <div className="flex items-center justify-between px-6 py-5">
                    <div>
                        <p className="text-xs text-tertiary">Estimated Total Impact Across All Strategies</p>
                        <p className="mt-1 text-3xl font-semibold tracking-tight text-success-primary">{totalImpact}</p>
                        <button type="button" className="mt-1 text-xs font-medium text-brand-primary hover:underline">
                            How is this number calculated?
                        </button>
                    </div>
                    <Button color="secondary" size="sm">View financial projections</Button>
                </div>

                {/* Filters — company + category */}
                <div className="px-6 py-5">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Filters</h3>
                    <div className="flex items-center gap-4">
                        <div className="w-56">
                            <Select
                                size="sm"
                                placeholder="Filter by company"
                                selectedKey={selectedCompany}
                                onSelectionChange={(key) => setSelectedCompany(key as string)}
                                items={COMPANY_OPTIONS}
                            >
                                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                            </Select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORY_FILTERS.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cx(
                                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                                        selectedCategory === cat
                                            ? "border-brand-solid bg-brand-primary_alt text-brand-secondary"
                                            : "border-secondary bg-primary text-secondary hover:bg-secondary",
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Strategy rows — matches Saving Strategies pattern */}
                <div className="px-6 py-5">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Recommended Strategies</h3>
                    <div className="divide-y divide-secondary rounded-lg border border-secondary">
                        {filtered.map((strategy) => {
                            const isExpanded = expandedId === strategy.id;
                            return (
                                <div key={strategy.id}>
                                    <button
                                        type="button"
                                        onClick={() => setExpandedId(isExpanded ? null : strategy.id)}
                                        className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-medium text-primary">{strategy.title}</p>
                                                <InfoCircle className="size-3.5 text-fg-quaternary" />
                                            </div>
                                            <p className="text-xs text-tertiary">{strategy.category}</p>
                                        </div>
                                        <p className="text-sm font-semibold tabular-nums text-primary">{strategy.impact}</p>
                                        <div className="text-right">
                                            <p className="text-sm text-primary">{strategy.deadline}</p>
                                            <p className="text-xs text-tertiary">Deadline</p>
                                        </div>
                                        {/* Confidence */}
                                        <div className="flex w-28 items-center gap-2">
                                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                                                <div
                                                    className="h-full rounded-full bg-brand-solid"
                                                    style={{ width: `${strategy.confidence}%` }}
                                                />
                                            </div>
                                            <span className="text-xs tabular-nums text-tertiary">{strategy.confidence}%</span>
                                        </div>
                                        <ChevronDown
                                            className={cx("size-4 text-fg-quaternary transition-transform", isExpanded && "rotate-180")}
                                        />
                                    </button>

                                    {/* Expanded content */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="border-t border-secondary bg-brand-primary_alt px-4 py-4">
                                                    <p className="text-sm text-secondary">{strategy.description}</p>

                                                    {/* Affected companies */}
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <span className="text-xs text-tertiary">Affected:</span>
                                                        {strategy.companies.map((c) => (
                                                            <Badge key={c} color="gray" type="pill-color" size="sm">{c}</Badge>
                                                        ))}
                                                    </div>

                                                    {/* Confidence bar (larger) */}
                                                    <div className="mt-3 flex items-center gap-3">
                                                        <span className="text-xs text-tertiary">Confidence</span>
                                                        <div className="h-2 w-40 overflow-hidden rounded-full bg-secondary">
                                                            <div
                                                                className="h-full rounded-full bg-brand-solid"
                                                                style={{ width: `${strategy.confidence}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-medium tabular-nums text-primary">{strategy.confidence}%</span>
                                                    </div>

                                                    {/* Explore with AI */}
                                                    <div className="mt-4">
                                                        <Button
                                                            color="primary"
                                                            size="sm"
                                                            iconLeading={Stars01}
                                                            onClick={(e: React.MouseEvent) => {
                                                                e.stopPropagation();
                                                                onAskAccountant?.(`Tell me more about the "${strategy.title}" strategy and how to implement it.`);
                                                            }}
                                                        >
                                                            Explore with AI
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* AI footer — matches gradient card pattern */}
                <div className="px-6 py-5">
                    <div className="rounded-xl bg-gradient-to-r from-purple-200/60 via-purple-100/50 to-blue-200/60 p-4">
                        <Stars01 className="mb-2 size-4 text-fg-brand-secondary_alt" />
                        <p className="text-xs text-tertiary">
                            These strategies are generated from your financial data, industry benchmarks, and current tax code.
                            Confidence scores reflect data completeness and historical accuracy of similar recommendations.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function CFOScreen({ page = "forecast", onAskAccountant }: CFOScreenProps) {
    const [selectedYear, setSelectedYear] = useState("2025");

    return (
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-secondary">
            {/* Header — matches TaxScreen header */}
            <div className="shrink-0 px-10 pt-8 pb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="flex size-11 items-center justify-center rounded-xl shadow-sm"
                            style={{ background: "linear-gradient(135deg, #7C5CFC, #2B53FE)" }}
                        >
                            {(() => { const Icon = PAGE_ICONS[page]; return <Icon className="size-5 text-white" />; })()}
                        </div>
                        <h1 className="text-display-xs font-semibold text-primary">{PAGE_TITLES[page]}</h1>
                    </div>
                    <div className="w-64">
                        <Select
                            size="sm"
                            placeholder="Fiscal Year"
                            selectedKey={selectedYear}
                            onSelectionChange={(key) => setSelectedYear(key as string)}
                            placeholderIcon={Calendar}
                            items={YEAR_OPTIONS}
                            className="[&_button]:!ring-brand [&_button_svg]:!text-fg-brand-primary [&_button_p]:!text-brand-secondary"
                        >
                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>
                    </div>
                </div>
            </div>

            {/* Page content */}
            <div className="min-h-0 flex-1 overflow-y-auto px-10 pb-8">
                {page === "forecast" && <ForecastPage />}
                {page === "save-money" && <SaveMoneyPage onAskAccountant={onAskAccountant} />}
                {page === "make-money" && <MakeMoneyPage onAskAccountant={onAskAccountant} />}
            </div>
        </div>
    );
}
