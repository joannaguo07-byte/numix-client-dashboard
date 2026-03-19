"use client";

import { useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    Bank,
    BarChartSquare02,
    Building01,
    Calendar,
    Check,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Clock,
    CoinsStacked01,
    CreditCard01,
    CurrencyDollar,
    DotsVertical,
    File06,
    FilePlus01,
    FilterFunnel01,
    Globe01,
    InfoCircle,
    LineChartUp01,
    Link01,
    Mail01,
    MessageChatCircle,
    MessageSquare01,
    Plus,
    SearchLg,
    Send01,
    Stars01,
    XClose,
} from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { Tabs } from "@/components/application/tabs/tabs";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { cx } from "@/utils/cx";

// ─── Types ───────────────────────────────────────────────────────────────────

export type BookkeepingPage = "ap" | "ar" | "transactions" | "reports";

interface BookkeepingScreenProps {
    page?: BookkeepingPage;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<BookkeepingPage, string> = {
    ap: "Accounts Payable",
    ar: "Accounts Receivable",
    transactions: "Transactions",
    reports: "Reports",
};

const PAGE_ICONS: Record<BookkeepingPage, React.FC<React.SVGProps<SVGSVGElement>>> = {
    ap: CoinsStacked01,
    ar: CurrencyDollar,
    transactions: BarChartSquare02,
    reports: File06,
};

// ─── Transactions Data ──────────────────────────────────────────────────────

const TRANSACTION_CATEGORIES = [
    "Revenue", "Software", "Payroll", "Marketing", "Rent",
    "Travel", "Office Supplies", "Utilities", "Insurance",
    "Professional Services", "Uncategorized",
];

const CATEGORY_OPTIONS = [
    { id: "all", label: "All Categories" },
    ...TRANSACTION_CATEGORIES.map((c) => ({ id: c.toLowerCase().replace(/\s+/g, "-"), label: c })),
];

const CONFIDENCE_OPTIONS = [
    { id: "all", label: "All Confidence" },
    { id: "high", label: "High (90%+)" },
    { id: "medium", label: "Medium (70-89%)" },
    { id: "low", label: "Low (<70%)" },
];

const TRANSACTIONS = [
    { id: "1", date: "Mar 11, 2026", description: "Stripe Payment - Customer Invoice #4521", amount: 2450.00, category: "Revenue", account: "Business Checking", confidence: 98 },
    { id: "2", date: "Mar 10, 2026", description: "AWS Monthly Services", amount: -847.32, category: "Software", account: "Business Checking", confidence: 95 },
    { id: "3", date: "Mar 9, 2026", description: "Gusto Payroll - March", amount: -12500.00, category: "Payroll", account: "Business Checking", confidence: 99 },
    { id: "4", date: "Mar 8, 2026", description: "Google Ads Campaign", amount: -1250.00, category: "Marketing", account: "Business Checking", confidence: 92 },
    { id: "5", date: "Mar 7, 2026", description: "WeWork Office Rent", amount: -3200.00, category: "Rent", account: "Business Checking", confidence: 97 },
    { id: "6", date: "Mar 6, 2026", description: "Client Payment - Acme Corp", amount: 8500.00, category: "Revenue", account: "Business Checking", confidence: 96 },
    { id: "7", date: "Mar 5, 2026", description: "Delta Airlines - SFO to NYC", amount: -584.00, category: "Travel", account: "Business Credit Card", confidence: 88 },
    { id: "8", date: "Mar 4, 2026", description: "Amazon Business - Office Supplies", amount: -234.67, category: "Office Supplies", account: "Business Credit Card", confidence: 75 },
    { id: "9", date: "Mar 3, 2026", description: "Zoom Pro Subscription", amount: -149.90, category: "Software", account: "Business Credit Card", confidence: 94 },
    { id: "10", date: "Mar 2, 2026", description: "Client Payment - Beta Inc", amount: 3200.00, category: "Revenue", account: "Business Checking", confidence: 97 },
];

// ─── Reports Data ───────────────────────────────────────────────────────────

const REVENUE_EXPENSES_CHART = [
    { month: "Oct", revenue: 42000, expenses: 28000 },
    { month: "Nov", revenue: 55000, expenses: 32000 },
    { month: "Dec", revenue: 48000, expenses: 35000 },
    { month: "Jan", revenue: 38000, expenses: 30000 },
    { month: "Feb", revenue: 52000, expenses: 28000 },
    { month: "Mar", revenue: 12000, expenses: 22000 },
];

const EXPENSE_BREAKDOWN = [
    { category: "Payroll", pct: 66, color: "bg-brand-solid" },
    { category: "Rent", pct: 17, color: "bg-error-solid" },
    { category: "Marketing", pct: 7, color: "bg-warning-solid" },
    { category: "Software", pct: 4, color: "bg-success-solid" },
    { category: "Travel", pct: 3, color: "bg-purple-500" },
    { category: "Uncategorized", pct: 2, color: "bg-pink-400" },
    { category: "Office Supplies", pct: 1, color: "bg-gray-400" },
];

// ─── AP Data ─────────────────────────────────────────────────────────────────

const AP_BILLS = [
    { id: "1", vendor: "WeWork", description: "Office Rent - April", amount: 3200.00, dueDate: "Apr 1, 2026", status: "due-soon" as const, source: "email" as const, payVia: "mercury" as const },
    { id: "2", vendor: "AWS", description: "Cloud Services - March", amount: 847.32, dueDate: "Apr 5, 2026", status: "due-soon" as const, source: "auto" as const, payVia: "brex" as const },
    { id: "3", vendor: "Gusto", description: "Payroll Processing - March", amount: 12500.00, dueDate: "Mar 31, 2026", status: "overdue" as const, source: "slack" as const, payVia: "mercury" as const },
    { id: "4", vendor: "Google Ads", description: "Advertising - Q1", amount: 3750.00, dueDate: "Apr 15, 2026", status: "upcoming" as const, source: "email" as const, payVia: "brex" as const },
    { id: "5", vendor: "Zoom", description: "Annual Subscription Renewal", amount: 1799.00, dueDate: "Apr 20, 2026", status: "upcoming" as const, source: "upload" as const, payVia: "chase" as const },
    { id: "6", vendor: "DevShop LLC", description: "Contractor Services - Feb", amount: 4200.00, dueDate: "Mar 25, 2026", status: "paid" as const, source: "slack" as const, payVia: "mercury" as const },
];

const SOURCE_CONFIG = {
    email: { label: "Email", icon: Mail01, color: "text-fg-brand-primary bg-brand-primary_alt" },
    slack: { label: "Slack", icon: MessageChatCircle, color: "text-fg-success-primary bg-success-secondary" },
    auto: { label: "Auto-sync", icon: Link01, color: "text-fg-quaternary bg-secondary" },
    upload: { label: "Uploaded", icon: FilePlus01, color: "text-fg-warning-primary bg-warning-secondary" },
} as const;

const PAY_VIA_CONFIG = {
    brex: { label: "Brex", color: "bg-[#F46036]" },
    mercury: { label: "Mercury", color: "bg-[#4C3EF7]" },
    chase: { label: "Chase", color: "bg-[#117ACA]" },
} as const;

// ─── AR Data ─────────────────────────────────────────────────────────────────

const AR_INVOICES = [
    { id: "INV-1042", client: "Acme Corp", description: "Enterprise License - Q2", amount: 24000.00, issued: "Mar 1, 2026", dueDate: "Mar 31, 2026", status: "outstanding" as const },
    { id: "INV-1041", client: "Beta Inc", description: "Consulting Services - Feb", amount: 8500.00, issued: "Feb 28, 2026", dueDate: "Mar 30, 2026", status: "outstanding" as const },
    { id: "INV-1040", client: "Gamma LLC", description: "Implementation Fee", amount: 15000.00, issued: "Feb 15, 2026", dueDate: "Mar 15, 2026", status: "overdue" as const },
    { id: "INV-1039", client: "Delta Partners", description: "Monthly Retainer - March", amount: 5000.00, issued: "Mar 1, 2026", dueDate: "Apr 1, 2026", status: "outstanding" as const },
    { id: "INV-1038", client: "Epsilon Co", description: "API Integration Package", amount: 12000.00, issued: "Feb 1, 2026", dueDate: "Mar 1, 2026", status: "paid" as const },
    { id: "INV-1037", client: "Acme Corp", description: "Enterprise License - Q1", amount: 24000.00, issued: "Dec 1, 2025", dueDate: "Jan 1, 2026", status: "paid" as const },
];

// ─── Transactions Page ──────────────────────────────────────────────────────

function TransactionsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [confidenceFilter, setConfidenceFilter] = useState("all");

    const totalTxns = TRANSACTIONS.length;
    const verifiedCount = TRANSACTIONS.filter((t) => t.confidence >= 95).length;
    const needsReviewCount = TRANSACTIONS.filter((t) => t.confidence < 90).length;

    const filtered = TRANSACTIONS.filter((t) => {
        if (searchQuery && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (categoryFilter !== "all") {
            const catLabel = CATEGORY_OPTIONS.find((c) => c.id === categoryFilter)?.label;
            if (catLabel && t.category !== catLabel) return false;
        }
        if (confidenceFilter === "high" && t.confidence < 90) return false;
        if (confidenceFilter === "medium" && (t.confidence < 70 || t.confidence >= 90)) return false;
        if (confidenceFilter === "low" && t.confidence >= 70) return false;
        return true;
    });

    return (
        <div className="flex gap-4">
            {/* Main content */}
            <div className="min-w-0 flex-1 space-y-5">
                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl border border-secondary bg-primary p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-semibold tabular-nums tracking-tight text-primary">{totalTxns}</p>
                                <p className="text-xs text-tertiary">Total Transactions</p>
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-full bg-brand-primary_alt">
                                <Stars01 className="size-5 text-fg-brand-primary" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-secondary bg-primary p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-semibold tabular-nums tracking-tight text-primary">{verifiedCount}</p>
                                <p className="text-xs text-tertiary">Verified</p>
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-full bg-success-secondary">
                                <CheckCircle className="size-5 text-fg-success-primary" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-secondary bg-primary p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-semibold tabular-nums tracking-tight text-primary">{needsReviewCount}</p>
                                <p className="text-xs text-tertiary">Needs Review</p>
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-full bg-warning-secondary">
                                <AlertCircle className="size-5 text-fg-warning-primary" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-secondary bg-primary p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <FilterFunnel01 className="size-4 text-fg-quaternary" />
                        <h3 className="text-sm font-semibold text-primary">Filters</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2">
                                <SearchLg className="size-4 text-fg-quaternary" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search transactions..."
                                    className="w-full bg-transparent text-sm text-primary placeholder:text-quaternary focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="w-44">
                            <Select
                                size="sm"
                                placeholder="All Categories"
                                selectedKey={categoryFilter}
                                onSelectionChange={(key) => setCategoryFilter(key as string)}
                                items={CATEGORY_OPTIONS}
                            >
                                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                            </Select>
                        </div>
                        <div className="w-44">
                            <Select
                                size="sm"
                                placeholder="All Confidence"
                                selectedKey={confidenceFilter}
                                onSelectionChange={(key) => setConfidenceFilter(key as string)}
                                items={CONFIDENCE_OPTIONS}
                            >
                                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Transaction table */}
                <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-secondary bg-secondary">
                                <th className="px-4 py-2.5 text-left font-medium text-secondary">Date</th>
                                <th className="px-4 py-2.5 text-left font-medium text-secondary">Description</th>
                                <th className="px-4 py-2.5 text-right font-medium text-secondary">Amount</th>
                                <th className="px-4 py-2.5 text-left font-medium text-secondary">Category</th>
                                <th className="px-4 py-2.5 text-left font-medium text-secondary">Account</th>
                                <th className="px-4 py-2.5 text-left font-medium text-secondary">AI Confidence</th>
                                <th className="w-10 px-4 py-2.5" />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((txn) => (
                                <tr key={txn.id} className="border-b border-secondary last:border-b-0">
                                    <td className="px-4 py-3 text-tertiary">{txn.date}</td>
                                    <td className="px-4 py-3 font-medium text-primary">{txn.description}</td>
                                    <td className={cx("px-4 py-3 text-right font-medium tabular-nums", txn.amount > 0 ? "text-success-primary" : "text-primary")}>
                                        {txn.amount > 0 ? "+" : ""}${Math.abs(txn.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge color={txn.category === "Revenue" ? "success" : "gray"} size="sm" type="pill-color">
                                            {txn.category}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-primary">{txn.account}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                                                <div
                                                    className={cx(
                                                        "h-full rounded-full",
                                                        txn.confidence >= 90 ? "bg-success-solid" :
                                                        txn.confidence >= 70 ? "bg-warning-solid" : "bg-error-solid",
                                                    )}
                                                    style={{ width: `${txn.confidence}%` }}
                                                />
                                            </div>
                                            <span className={cx(
                                                "text-xs tabular-nums font-medium",
                                                txn.confidence >= 90 ? "text-success-primary" :
                                                txn.confidence >= 70 ? "text-warning-primary" : "text-error-primary",
                                            )}>
                                                {txn.confidence}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button type="button" className="text-fg-quaternary hover:text-fg-secondary">
                                            <DotsVertical className="size-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right sidebar */}
            <div className="w-64 shrink-0 space-y-4 self-start">
                <Button color="primary" size="sm" iconLeading={CheckCircle} className="w-full">
                    Bulk Approve High Confidence
                </Button>

                <div className="rounded-xl bg-gradient-to-r from-purple-200/60 via-purple-100/50 to-blue-200/60 p-4">
                    <Stars01 className="mb-2 size-4 text-fg-brand-secondary_alt" />
                    <p className="text-xs text-tertiary">
                        AI has categorized all 10 transactions. 2 need manual review due to lower confidence scores.
                    </p>
                    <button type="button" className="mt-2 text-xs font-semibold text-brand-secondary hover:underline">
                        Review flagged items
                    </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                    <div className="px-4 pt-3 pb-1">
                        <div className="flex items-center gap-2">
                            <Clock className="size-3.5 text-fg-brand-primary" />
                            <h3 className="text-sm font-semibold text-brand-secondary">Coming Soon</h3>
                        </div>
                    </div>
                    <div className="space-y-2 p-3">
                        <div className="rounded-lg border-l-[3px] border-l-purple-500 bg-purple-50 py-2.5 pr-3 pl-3">
                            <p className="text-xs font-medium text-primary">Bank Integrations</p>
                            <p className="mt-0.5 text-[11px] text-secondary">Auto-import transactions</p>
                        </div>
                        <div className="rounded-lg border-l-[3px] border-l-pink-500 bg-pink-50 py-2.5 pr-3 pl-3">
                            <p className="text-xs font-medium text-primary">Receipt Upload</p>
                            <p className="mt-0.5 text-[11px] text-secondary">Match receipts to transactions</p>
                        </div>
                        <div className="rounded-lg border-l-[3px] border-l-blue-500 bg-blue-50 py-2.5 pr-3 pl-3">
                            <p className="text-xs font-medium text-primary">AI Insights</p>
                            <p className="mt-0.5 text-[11px] text-secondary">Spending patterns & anomalies</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Reports Page ───────────────────────────────────────────────────────────

function ReportsPage() {
    const maxVal = Math.max(...REVENUE_EXPENSES_CHART.map((d) => Math.max(d.revenue, d.expenses)));

    return (
        <div>
            <Tabs>
                <Tabs.List
                    size="sm"
                    type="underline"
                    items={[
                        { id: "pnl", label: "Profit & Loss" },
                        { id: "balance", label: "Balance Sheet" },
                        { id: "cashflow", label: "Cash Flow" },
                    ]}
                >
                    {(item) => (
                        <Tabs.Item key={item.id} id={item.id}>
                            {item.label}
                        </Tabs.Item>
                    )}
                </Tabs.List>

                <Tabs.Panel id="pnl" className="pt-5">
                    <div className="space-y-5">
                        {/* Metric cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-xl border border-secondary bg-primary p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-tertiary">Total Revenue</p>
                                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-success-primary">$14,150.00</p>
                                    </div>
                                    <div className="flex size-10 items-center justify-center rounded-full bg-success-secondary">
                                        <LineChartUp01 className="size-5 text-fg-success-primary" />
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-secondary bg-primary p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-tertiary">Total Expenses</p>
                                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-error-primary">$19,065.99</p>
                                    </div>
                                    <div className="flex size-10 items-center justify-center rounded-full bg-error-secondary">
                                        <LineChartUp01 className="size-5 rotate-180 text-fg-error-primary" />
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-secondary bg-primary p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-tertiary">Net Profit</p>
                                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-error-primary">-$4,915.99</p>
                                    </div>
                                    <div className="flex size-10 items-center justify-center rounded-full bg-error-secondary">
                                        <CurrencyDollar className="size-5 text-fg-error-primary" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Charts row */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Revenue vs Expenses bar chart */}
                            <div className="rounded-xl border border-secondary bg-primary p-6">
                                <h3 className="mb-4 text-sm font-semibold text-primary">Revenue vs Expenses (6 Months)</h3>
                                {/* Y-axis labels + bars */}
                                <div className="flex gap-2">
                                    {/* Y-axis */}
                                    <div className="flex w-10 flex-col justify-between text-right text-[10px] tabular-nums text-tertiary" style={{ height: 200 }}>
                                        <span>$60k</span>
                                        <span>$45k</span>
                                        <span>$30k</span>
                                        <span>$15k</span>
                                        <span>$0k</span>
                                    </div>
                                    {/* Bars */}
                                    <div className="flex flex-1 items-end justify-between gap-1" style={{ height: 200 }}>
                                        {REVENUE_EXPENSES_CHART.map((d) => (
                                            <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
                                                <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 180 }}>
                                                    <div
                                                        className="w-3 rounded-t bg-success-solid"
                                                        style={{ height: `${(d.revenue / 60000) * 180}px` }}
                                                    />
                                                    <div
                                                        className="w-3 rounded-t bg-error-solid"
                                                        style={{ height: `${(d.expenses / 60000) * 180}px` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-tertiary">{d.month}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Expense breakdown donut chart (div-based) */}
                            <div className="rounded-xl border border-secondary bg-primary p-6">
                                <h3 className="mb-4 text-sm font-semibold text-primary">Expense Breakdown</h3>
                                <div className="flex items-center gap-6">
                                    {/* Donut ring (CSS conic-gradient) */}
                                    <div className="relative flex size-40 shrink-0 items-center justify-center">
                                        <div
                                            className="absolute inset-0 rounded-full"
                                            style={{
                                                background: `conic-gradient(
                                                    #2B53FE 0% 66%,
                                                    #EF4444 66% 83%,
                                                    #F59E0B 83% 90%,
                                                    #22C55E 90% 94%,
                                                    #A855F7 94% 97%,
                                                    #EC4899 97% 99%,
                                                    #9CA3AF 99% 100%
                                                )`,
                                            }}
                                        />
                                        <div className="relative size-24 rounded-full bg-primary" />
                                    </div>
                                    {/* Legend */}
                                    <div className="space-y-1.5">
                                        {EXPENSE_BREAKDOWN.map((e) => (
                                            <div key={e.category} className="flex items-center gap-2">
                                                <div className={cx("size-2.5 rounded-full", e.color)} />
                                                <span className="text-xs text-primary">{e.category}</span>
                                                <span className="text-xs tabular-nums text-tertiary">{e.pct}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Tabs.Panel>

                <Tabs.Panel id="balance" className="pt-5">
                    <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                        <div className="flex items-center justify-between border-b border-brand/20 bg-brand-primary_alt px-6 py-4">
                            <div>
                                <h3 className="text-sm font-semibold text-primary">Balance Sheet</h3>
                                <p className="text-xs text-tertiary">As of March 13, 2026</p>
                            </div>
                            <BadgeWithDot color="success" size="sm" type="pill-color">Current</BadgeWithDot>
                        </div>
                        <div className="divide-y divide-secondary">
                            <div className="px-6 py-5">
                                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Assets</h3>
                                <div className="divide-y divide-secondary rounded-lg border border-secondary">
                                    {[
                                        { name: "Cash & Equivalents", amount: "$42,350" },
                                        { name: "Accounts Receivable", amount: "$52,500" },
                                        { name: "Prepaid Expenses", amount: "$8,200" },
                                        { name: "Equipment (net)", amount: "$15,400" },
                                    ].map((item) => (
                                        <div key={item.name} className="flex items-center justify-between px-4 py-3">
                                            <p className="text-sm text-primary">{item.name}</p>
                                            <p className="text-sm font-medium tabular-nums text-primary">{item.amount}</p>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between bg-secondary px-4 py-3">
                                        <p className="text-sm font-semibold text-primary">Total Assets</p>
                                        <p className="text-sm font-semibold tabular-nums text-primary">$118,450</p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-5">
                                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Liabilities</h3>
                                <div className="divide-y divide-secondary rounded-lg border border-secondary">
                                    {[
                                        { name: "Accounts Payable", amount: "$22,096" },
                                        { name: "Accrued Expenses", amount: "$6,800" },
                                        { name: "Credit Card Balance", amount: "$3,452" },
                                    ].map((item) => (
                                        <div key={item.name} className="flex items-center justify-between px-4 py-3">
                                            <p className="text-sm text-primary">{item.name}</p>
                                            <p className="text-sm font-medium tabular-nums text-primary">{item.amount}</p>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between bg-secondary px-4 py-3">
                                        <p className="text-sm font-semibold text-primary">Total Liabilities</p>
                                        <p className="text-sm font-semibold tabular-nums text-primary">$32,348</p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-5">
                                <div className="flex items-center justify-between rounded-lg border border-brand bg-brand-primary_alt px-4 py-3">
                                    <p className="text-sm font-semibold text-brand-secondary">Owner&apos;s Equity</p>
                                    <p className="text-sm font-semibold tabular-nums text-brand-secondary">$86,102</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Tabs.Panel>

                <Tabs.Panel id="cashflow" className="pt-5">
                    <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                        <div className="flex items-center justify-between border-b border-brand/20 bg-brand-primary_alt px-6 py-4">
                            <div>
                                <h3 className="text-sm font-semibold text-primary">Cash Flow Statement</h3>
                                <p className="text-xs text-tertiary">March 2026</p>
                            </div>
                            <BadgeWithDot color="warning" size="sm" type="pill-color">Net Negative</BadgeWithDot>
                        </div>
                        <div className="divide-y divide-secondary">
                            <div className="px-6 py-5">
                                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Operating Activities</h3>
                                <div className="divide-y divide-secondary rounded-lg border border-secondary">
                                    {[
                                        { name: "Cash from Sales", amount: "$14,150", positive: true },
                                        { name: "Operating Expenses", amount: "-$19,066", positive: false },
                                        { name: "Changes in Working Capital", amount: "-$2,300", positive: false },
                                    ].map((item) => (
                                        <div key={item.name} className="flex items-center justify-between px-4 py-3">
                                            <p className="text-sm text-primary">{item.name}</p>
                                            <p className={cx("text-sm font-medium tabular-nums", item.positive ? "text-success-primary" : "text-error-primary")}>{item.amount}</p>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between bg-secondary px-4 py-3">
                                        <p className="text-sm font-semibold text-primary">Net Operating Cash Flow</p>
                                        <p className="text-sm font-semibold tabular-nums text-error-primary">-$7,216</p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-5">
                                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Investing & Financing</h3>
                                <div className="divide-y divide-secondary rounded-lg border border-secondary">
                                    {[
                                        { name: "Equipment Purchase", amount: "-$1,200", positive: false },
                                        { name: "Owner Contribution", amount: "$5,000", positive: true },
                                    ].map((item) => (
                                        <div key={item.name} className="flex items-center justify-between px-4 py-3">
                                            <p className="text-sm text-primary">{item.name}</p>
                                            <p className={cx("text-sm font-medium tabular-nums", item.positive ? "text-success-primary" : "text-error-primary")}>{item.amount}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="px-6 py-5">
                                <div className="flex items-center justify-between rounded-lg border border-error bg-error-primary px-4 py-3">
                                    <p className="text-sm font-semibold text-error-primary">Net Change in Cash</p>
                                    <p className="text-sm font-semibold tabular-nums text-error-primary">-$3,416</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Tabs.Panel>
            </Tabs>
        </div>
    );
}

// ─── Accounts Payable Page ──────────────────────────────────────────────────

function AccountsPayablePage() {
    const [breakdownOpen, setBreakdownOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<(typeof AP_BILLS)[number] | null>(null);
    const [payStep, setPayStep] = useState<"confirm" | null>(null);

    const overdueCount = AP_BILLS.filter((b) => b.status === "overdue").length;
    const dueSoonCount = AP_BILLS.filter((b) => b.status === "due-soon").length;
    const totalOwed = AP_BILLS.filter((b) => b.status !== "paid").reduce((s, b) => s + b.amount, 0);
    const dueSoonTotal = AP_BILLS.filter((b) => b.status === "due-soon" || b.status === "overdue").reduce((s, b) => s + b.amount, 0);
    const paidTotal = AP_BILLS.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0);
    const overdueBills = AP_BILLS.filter((b) => b.status === "overdue");
    const dueSoonBills = AP_BILLS.filter((b) => b.status === "due-soon");
    const nextDueBill = AP_BILLS.filter((b) => b.status === "due-soon").sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
    const paidBills = AP_BILLS.filter((b) => b.status === "paid");
    const lastPaidVendor = paidBills.length > 0 ? paidBills[paidBills.length - 1].vendor : "";

    // Build alert description
    const overdueDesc = overdueBills.map((b) => `${b.vendor} ($${b.amount.toLocaleString("en-US")})`).join(", ");
    const dueSoonDesc = dueSoonBills.map((b) => `${b.vendor} ($${b.amount.toLocaleString("en-US")})`).join(" and ");
    const atRiskTotal = dueSoonTotal;

    return (
        <div className="space-y-4">
            {/* Warning banner */}
            <div className="rounded-xl bg-gradient-to-r from-purple-200/60 via-purple-100/50 to-blue-200/60 px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <Stars01 className="size-4 text-fg-brand-secondary_alt" />
                    <p className="text-sm font-semibold text-primary">Action needed this week</p>
                </div>
                <p className="mt-0.5 text-sm text-secondary">
                    {overdueDesc} {overdueBills.length > 0 ? `is overdue as of Mar 31.` : ""}{" "}
                    {dueSoonDesc} {dueSoonBills.length > 0 ? `are due within 9 days.` : ""}{" "}
                    Total at-risk: <span className="font-semibold">${atRiskTotal.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>.
                </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4">
                {/* Total Outstanding — hero card */}
                <div className="rounded-xl border border-brand bg-gradient-to-br from-brand-primary_alt to-primary px-6 py-5 shadow-md ring-1 ring-brand/10">
                    <p className="text-xs font-medium text-brand-secondary">Total outstanding</p>
                    <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-primary">
                        ${totalOwed.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                    </p>
                    <button
                        type="button"
                        onClick={() => setBreakdownOpen(!breakdownOpen)}
                        className="mt-1.5 flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
                    >
                        Breakdown
                        {breakdownOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                    </button>
                    {breakdownOpen && (
                        <div className="mt-3 space-y-1.5 border-t border-brand/20 pt-3">
                            {[
                                { label: "Overdue", amount: AP_BILLS.filter((b) => b.status === "overdue").reduce((s, b) => s + b.amount, 0), color: "text-error-primary" },
                                { label: "Due Soon", amount: AP_BILLS.filter((b) => b.status === "due-soon").reduce((s, b) => s + b.amount, 0), color: "text-warning-primary" },
                                { label: "Upcoming", amount: AP_BILLS.filter((b) => b.status === "upcoming").reduce((s, b) => s + b.amount, 0), color: "text-tertiary" },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <span className="text-xs text-tertiary">{item.label}</span>
                                    <span className={cx("text-xs font-medium tabular-nums", item.color)}>
                                        ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* Due in 7 days */}
                <div className="rounded-xl border border-warning-300 bg-warning-50 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-warning-700">Due in 7 days</p>
                        <AlertCircle className="size-4 text-fg-warning-primary" />
                    </div>
                    <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-warning-700">
                        ${dueSoonTotal.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                    </p>
                    <p className="mt-1 text-xs text-warning-600">Requires action</p>
                </div>
                {/* Paid this month */}
                <div className="rounded-xl border border-success-300 bg-success-primary px-6 py-5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-success-primary">Paid this month</p>
                        <CheckCircle className="size-4 text-fg-success-primary" />
                    </div>
                    <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-success-primary">
                        ${paidTotal.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                    </p>
                    <p className="mt-1 text-xs text-success-secondary">{lastPaidVendor}</p>
                </div>
                {/* Next due */}
                <div className="rounded-xl border border-secondary bg-primary px-6 py-5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-tertiary">Next due</p>
                        <Calendar className="size-4 text-fg-quaternary" />
                    </div>
                    <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-primary">
                        {nextDueBill ? nextDueBill.dueDate.replace(/, \d{4}$/, "") : "—"}
                    </p>
                    <p className="mt-1 text-xs text-tertiary">{nextDueBill ? nextDueBill.vendor : ""}</p>
                </div>
            </div>

            {/* Bills card */}
            <div className="min-w-0 overflow-hidden rounded-xl border border-secondary bg-primary">
                <div className="px-6 py-5">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Bills</h3>
                            {overdueCount > 0 && <Badge color="error" size="sm" type="pill-color">{overdueCount} Overdue</Badge>}
                            {dueSoonCount > 0 && <Badge color="warning" size="sm" type="pill-color">{dueSoonCount} Due Soon</Badge>}
                        </div>
                        <Button color="secondary" size="sm" iconLeading={Plus}>
                            Create Bill
                        </Button>
                    </div>
                    <div className="divide-y divide-secondary rounded-lg border border-secondary">
                        {AP_BILLS.map((bill) => {
                            const src = SOURCE_CONFIG[bill.source];
                            const SrcIcon = src.icon;
                            return (
                                <button
                                    type="button"
                                    key={bill.id}
                                    onClick={() => setSelectedBill(bill)}
                                    className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-secondary"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-medium text-primary">{bill.vendor}</p>
                                        </div>
                                        <p className="text-xs text-tertiary">{bill.description}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className={cx("flex size-5 items-center justify-center rounded", src.color)}>
                                            <SrcIcon className="size-3" />
                                        </div>
                                        <span className="text-xs text-tertiary">{src.label}</span>
                                    </div>
                                    <p className="text-sm font-semibold tabular-nums text-primary">
                                        ${bill.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </p>
                                    <div className="text-right">
                                        <p className="text-sm text-primary">{bill.dueDate}</p>
                                        <p className="text-xs text-tertiary">Due</p>
                                    </div>
                                    <Badge
                                        color={bill.status === "overdue" ? "error" : bill.status === "due-soon" ? "warning" : bill.status === "paid" ? "success" : "gray"}
                                        size="sm"
                                        type="pill-color"
                                    >
                                        {bill.status === "due-soon" ? "Due Soon" : bill.status === "overdue" ? "Overdue" : bill.status === "paid" ? "Paid" : "Upcoming"}
                                    </Badge>
                                    <ChevronRight className="size-4 text-fg-quaternary" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bill detail slide-over */}
            <SlideoutMenu isDismissable isOpen={selectedBill !== null} onOpenChange={(open) => { if (!open) { setSelectedBill(null); setPayStep(null); } }}>
                {({ close }) => {
                    const src = selectedBill ? SOURCE_CONFIG[selectedBill.source] : null;
                    const SrcIcon = src?.icon ?? Mail01;
                    const payConfig = selectedBill ? PAY_VIA_CONFIG[selectedBill.payVia] : null;

                    return (
                        <>
                            <SlideoutMenu.Header onClose={() => { close(); setPayStep(null); }}>
                                <div className="flex items-center gap-3 pr-8">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                                        <File06 className="size-5 text-fg-quaternary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-primary">{selectedBill?.vendor}</h2>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-tertiary">{selectedBill?.description}</p>
                                            {src && (
                                                <div className="flex items-center gap-1">
                                                    <div className={cx("flex size-4 items-center justify-center rounded", src.color)}>
                                                        <SrcIcon className="size-2.5" />
                                                    </div>
                                                    <span className="text-xs text-tertiary">via {src.label}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </SlideoutMenu.Header>
                            <SlideoutMenu.Content>
                                {selectedBill && payStep === null && (
                                    <div className="space-y-6">
                                        {/* Amount & status */}
                                        <div className="rounded-xl border border-secondary bg-secondary p-5">
                                            <p className="text-xs text-tertiary">Amount Due</p>
                                            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-primary">
                                                ${selectedBill.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                            </p>
                                            <div className="mt-3 flex items-center gap-2">
                                                <Badge
                                                    color={selectedBill.status === "overdue" ? "error" : selectedBill.status === "due-soon" ? "warning" : selectedBill.status === "paid" ? "success" : "gray"}
                                                    size="sm"
                                                    type="pill-color"
                                                >
                                                    {selectedBill.status === "due-soon" ? "Due Soon" : selectedBill.status === "overdue" ? "Overdue" : selectedBill.status === "paid" ? "Paid" : "Upcoming"}
                                                </Badge>
                                                <span className="text-sm text-tertiary">Due {selectedBill.dueDate}</span>
                                            </div>
                                        </div>

                                        {/* Invoice PDF preview */}
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Invoice</h3>
                                            <div className="overflow-hidden rounded-lg border border-secondary">
                                                <div className="flex items-center justify-between border-b border-secondary bg-secondary px-4 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <File06 className="size-4 text-fg-quaternary" />
                                                        <span className="text-xs font-medium text-primary">INV-{selectedBill.vendor.replace(/\s+/g, "").slice(0, 4).toUpperCase()}-{selectedBill.id.padStart(4, "0")}.pdf</span>
                                                    </div>
                                                    <button type="button" className="text-xs font-medium text-brand-primary hover:underline">Download</button>
                                                </div>
                                                {/* Mock PDF content */}
                                                <div className="bg-white p-5 text-left">
                                                    <div className="mb-4 flex items-start justify-between">
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">{selectedBill.vendor}</p>
                                                            <p className="text-xs text-gray-500">Invoice #{selectedBill.id.padStart(4, "0")}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-500">Date: Mar 1, 2026</p>
                                                            <p className="text-xs text-gray-500">Due: {selectedBill.dueDate}</p>
                                                        </div>
                                                    </div>
                                                    <div className="border-t border-gray-200 pt-3">
                                                        <div className="flex items-center justify-between py-1.5">
                                                            <span className="text-xs text-gray-600">{selectedBill.description}</span>
                                                            <span className="text-xs font-medium text-gray-900">${selectedBill.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
                                                        <span className="text-xs font-bold text-gray-900">Total Due</span>
                                                        <span className="text-sm font-bold text-gray-900">${selectedBill.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Details</h3>
                                            <div className="divide-y divide-secondary rounded-lg border border-secondary">
                                                <div className="flex items-center justify-between px-4 py-3">
                                                    <span className="text-sm text-tertiary">Vendor</span>
                                                    <span className="text-sm font-medium text-primary">{selectedBill.vendor}</span>
                                                </div>
                                                <div className="flex items-center justify-between px-4 py-3">
                                                    <span className="text-sm text-tertiary">Bill ID</span>
                                                    <span className="text-sm font-medium text-primary">BILL-{selectedBill.id.padStart(4, "0")}</span>
                                                </div>
                                                <div className="flex items-center justify-between px-4 py-3">
                                                    <span className="text-sm text-tertiary">Source</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={cx("flex size-5 items-center justify-center rounded", src?.color)}>
                                                            <SrcIcon className="size-3" />
                                                        </div>
                                                        <span className="text-sm font-medium text-primary">{src?.label}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between px-4 py-3">
                                                    <span className="text-sm text-tertiary">Pay via</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={cx("size-2 rounded-full", payConfig?.color)} />
                                                        <span className="text-sm font-medium text-primary">{payConfig?.label}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between px-4 py-3">
                                                    <span className="text-sm text-tertiary">Due Date</span>
                                                    <span className="text-sm font-medium text-primary">{selectedBill.dueDate}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment history */}
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Payment History</h3>
                                            {selectedBill.status === "paid" ? (
                                                <div className="flex items-center gap-3 rounded-lg border border-success bg-success-primary px-4 py-3">
                                                    <CheckCircle className="size-4 text-fg-success-primary" />
                                                    <div>
                                                        <p className="text-sm font-medium text-success-primary">Paid in full</p>
                                                        <p className="text-xs text-success-secondary">{selectedBill.dueDate} via {payConfig?.label}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 rounded-lg border border-secondary px-4 py-3">
                                                    <Clock className="size-4 text-fg-quaternary" />
                                                    <p className="text-sm text-tertiary">No payments recorded yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Pay Now confirmation step */}
                                {selectedBill && payStep === "confirm" && payConfig && (
                                    <div className="space-y-6">
                                        <div className="flex flex-col items-center rounded-xl border border-secondary bg-secondary p-6 text-center">
                                            <div className={cx("flex size-12 items-center justify-center rounded-full text-white", payConfig.color)}>
                                                <Bank className="size-6" />
                                            </div>
                                            <p className="mt-3 text-sm font-medium text-primary">Pay via {payConfig.label}</p>
                                            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-primary">
                                                ${selectedBill.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                            </p>
                                            <p className="mt-1 text-xs text-tertiary">to {selectedBill.vendor}</p>
                                        </div>

                                        <div className="divide-y divide-secondary rounded-lg border border-secondary">
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <span className="text-sm text-tertiary">From</span>
                                                <span className="text-sm font-medium text-primary">{payConfig.label} Business Checking ****4821</span>
                                            </div>
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <span className="text-sm text-tertiary">To</span>
                                                <span className="text-sm font-medium text-primary">{selectedBill.vendor}</span>
                                            </div>
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <span className="text-sm text-tertiary">Method</span>
                                                <span className="text-sm font-medium text-primary">ACH Transfer</span>
                                            </div>
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <span className="text-sm text-tertiary">Send date</span>
                                                <span className="text-sm font-medium text-primary">Today, Mar 17</span>
                                            </div>
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <span className="text-sm text-tertiary">Est. delivery</span>
                                                <span className="text-sm font-medium text-primary">Mar 19, 2026</span>
                                            </div>
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <span className="text-sm text-tertiary">Invoice</span>
                                                <span className="text-sm font-medium text-primary">BILL-{selectedBill.id.padStart(4, "0")}</span>
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-gradient-to-r from-purple-200/60 via-purple-100/50 to-blue-200/60 px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <Stars01 className="size-3.5 text-fg-brand-secondary_alt" />
                                                <p className="text-xs text-secondary">
                                                    Approving will initiate payment through {payConfig.label}. You&apos;ll receive a confirmation email once processed.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </SlideoutMenu.Content>
                            <SlideoutMenu.Footer>
                                {payStep === null ? (
                                    <div className="flex items-center gap-3">
                                        {selectedBill?.status !== "paid" && (
                                            <Button color="primary" size="sm" iconLeading={CreditCard01} className="flex-1" onClick={() => setPayStep("confirm")}>
                                                Pay via {payConfig?.label}
                                            </Button>
                                        )}
                                        <Button color="secondary" size="sm" iconLeading={Calendar} className="flex-1">
                                            {selectedBill?.status === "paid" ? "View Receipt" : "Schedule"}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Button color="secondary" size="sm" className="flex-1" onClick={() => setPayStep(null)}>
                                            Back
                                        </Button>
                                        <Button color="primary" size="sm" iconLeading={Check} className="flex-1">
                                            Approve &amp; Pay
                                        </Button>
                                    </div>
                                )}
                            </SlideoutMenu.Footer>
                        </>
                    );
                }}
            </SlideoutMenu>
        </div>
    );
}

// ─── Accounts Receivable Page ───────────────────────────────────────────────

function AccountsReceivablePage() {
    const overdueCount = AR_INVOICES.filter((i) => i.status === "overdue").length;
    const totalOutstanding = AR_INVOICES.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
    const totalPaid = AR_INVOICES.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);

    return (
        <div className="flex gap-4">
            <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-secondary bg-primary">
                {/* Blue banner */}
                <div className="flex items-center justify-between border-b border-brand/20 bg-brand-primary_alt px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-primary">Accounts Receivable</h3>
                            <p className="text-xs text-tertiary">Outstanding invoices &amp; payments received</p>
                        </div>
                        {overdueCount > 0 && (
                            <BadgeWithDot color="error" size="sm" type="pill-color">{overdueCount} Overdue</BadgeWithDot>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-tertiary">
                        <Clock className="size-3.5" />
                        Updated 1 hr ago
                    </div>
                </div>

                <div className="divide-y divide-secondary">
                    {/* Total outstanding */}
                    <div className="flex items-center justify-between px-6 py-5">
                        <div>
                            <p className="text-xs text-tertiary">Total Outstanding</p>
                            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-success-primary">
                                ${totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </p>
                            <button type="button" className="mt-1 text-xs font-medium text-brand-primary hover:underline">
                                View aging report
                            </button>
                        </div>
                        <Button color="primary" size="sm">Create Invoice</Button>
                    </div>

                    {/* Invoices table */}
                    <div className="px-6 py-5">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Invoices</h3>
                        <div className="overflow-hidden rounded-lg border border-secondary">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-secondary bg-secondary">
                                        <th className="px-4 py-2.5 text-left font-medium text-secondary">Invoice</th>
                                        <th className="px-4 py-2.5 text-left font-medium text-secondary">Client</th>
                                        <th className="px-4 py-2.5 text-left font-medium text-secondary">Description</th>
                                        <th className="px-4 py-2.5 text-right font-medium text-secondary">Amount</th>
                                        <th className="px-4 py-2.5 text-left font-medium text-secondary">Due</th>
                                        <th className="px-4 py-2.5 text-left font-medium text-secondary">Status</th>
                                        <th className="w-10 px-4 py-2.5" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {AR_INVOICES.map((inv) => (
                                        <tr key={inv.id} className="border-b border-secondary last:border-b-0">
                                            <td className="px-4 py-2.5">
                                                <button type="button" className="text-sm font-medium text-brand-primary hover:underline">{inv.id}</button>
                                            </td>
                                            <td className="px-4 py-2.5 font-medium text-primary">{inv.client}</td>
                                            <td className="px-4 py-2.5 text-tertiary">{inv.description}</td>
                                            <td className="px-4 py-2.5 text-right font-medium tabular-nums text-primary">
                                                ${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-2.5 text-primary">{inv.dueDate}</td>
                                            <td className="px-4 py-2.5">
                                                <Badge
                                                    color={inv.status === "overdue" ? "error" : inv.status === "paid" ? "success" : "warning"}
                                                    size="sm"
                                                    type="pill-color"
                                                >
                                                    {inv.status === "outstanding" ? "Outstanding" : inv.status === "overdue" ? "Overdue" : "Paid"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <ChevronRight className="size-4 text-fg-quaternary" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right sidebar */}
            <div className="w-64 shrink-0 space-y-4 self-start">
                <div className="rounded-xl bg-gradient-to-r from-purple-200/60 via-purple-100/50 to-blue-200/60 p-4">
                    <Stars01 className="mb-2 size-4 text-fg-brand-secondary_alt" />
                    <p className="text-xs text-tertiary">
                        {overdueCount > 0
                            ? `${overdueCount} invoice${overdueCount > 1 ? "s are" : " is"} past due. Consider sending payment reminders to maintain cash flow.`
                            : "All invoices are current. Great job maintaining timely collections!"}
                    </p>
                    <button type="button" className="mt-2 text-xs font-semibold text-brand-secondary hover:underline">
                        Send reminders
                    </button>
                </div>
                <div className="rounded-xl border border-secondary bg-primary p-5">
                    <div className="flex items-center gap-2">
                        <CurrencyDollar className="size-4 text-fg-quaternary" />
                        <p className="text-xs text-tertiary">Collected This Month</p>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-primary">
                        ${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="rounded-xl border border-secondary bg-primary p-5">
                    <div className="flex items-center gap-2">
                        <Clock className="size-4 text-fg-quaternary" />
                        <p className="text-xs text-tertiary">Avg. Days to Pay</p>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-primary">28 days</p>
                </div>
            </div>
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function BookkeepingScreen({ page = "transactions" }: BookkeepingScreenProps) {
    return (
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-secondary">
            {/* Header */}
            <div className="shrink-0 px-10 pt-8 pb-6">
                <div className="flex items-center gap-4">
                    <div
                        className="flex size-11 items-center justify-center rounded-xl shadow-sm"
                        style={{ background: "linear-gradient(135deg, #7C5CFC, #2B53FE)" }}
                    >
                        {(() => { const Icon = PAGE_ICONS[page]; return <Icon className="size-5 text-white" />; })()}
                    </div>
                    <h1 className="text-display-xs font-semibold text-primary">{PAGE_TITLES[page]}</h1>
                </div>
            </div>

            {/* Page content */}
            <div className="min-h-0 flex-1 overflow-y-auto px-10 pb-8">
                {page === "transactions" && <TransactionsPage />}
                {page === "reports" && <ReportsPage />}
                {page === "ap" && <AccountsPayablePage />}
                {page === "ar" && <AccountsReceivablePage />}
            </div>
        </div>
    );
}
