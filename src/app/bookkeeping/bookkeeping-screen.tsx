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
    Copy01,
    DotsVertical,
    Edit05,
    File06,
    FileAttachment02,
    FilePlus01,
    FilterFunnel01,
    Flag04,
    Hash01,
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
    Divide03,
    Stars01,
    Trash01,
    Upload01,
    XClose,
    ZoomIn,
    ZoomOut,
} from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { Tabs } from "@/components/application/tabs/tabs";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { ModalOverlay, Modal, Dialog } from "@/components/application/modals/modal";
import { CloseButton } from "@/components/base/buttons/close-button";
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

// ─── Chart of Accounts ─────────────────────────────────────────────────────

const CHART_OF_ACCOUNTS = [
    // Income
    { code: "40000", name: "Net Sales", parent: "Income" },
    { code: "44400", name: "Sales of Product", parent: "Income" },
    { code: "45500", name: "Other Sales / Income", parent: "Income" },
    { code: "47900", name: "Sales of Services", parent: "Income" },
    // COGS
    { code: "50000", name: "Cost of Goods Sold", parent: "COGS" },
    { code: "55000", name: "Subcontractors", parent: "COGS" },
    // Expense
    { code: "60000", name: "Advertising and Promotion", parent: "Expense" },
    { code: "62100", name: "Insurance", parent: "Expense" },
    { code: "64900", name: "Office Supplies", parent: "Expense" },
    { code: "66000", name: "Payroll Expenses", parent: "Expense" },
    { code: "66500", name: "Professional Fees", parent: "Expense" },
    { code: "68100", name: "Rent or Lease", parent: "Expense" },
    { code: "68300", name: "Travel Expense", parent: "Expense" },
    { code: "68600", name: "Utilities", parent: "Expense" },
    { code: "69000", name: "Software & Cloud Services", parent: "Expense" },
    // Assets
    { code: "11001", name: "Banks", parent: "Current Assets" },
    { code: "12100", name: "Inventory Asset", parent: "Current Assets" },
    { code: "15000", name: "Furniture and Equipment", parent: "Fixed Assets" },
    // Liabilities
    { code: "22000", name: "Credit Cards", parent: "Current Liabilities" },
    { code: "24000", name: "Payroll Liabilities", parent: "Current Liabilities" },
];

const COA_OPTIONS = [
    { id: "all", label: "All Chart of Account" },
    ...CHART_OF_ACCOUNTS.map((a) => ({ id: a.code, label: a.name })),
];

const CONFIDENCE_OPTIONS = [
    { id: "all", label: "All Confidence" },
    { id: "high", label: "High (90%+)" },
    { id: "medium", label: "Medium (70-89%)" },
    { id: "low", label: "Low (<70%)" },
];

// ─── Labels (Tax Credit Tags) ─────────────────────────────────────────────

type LabelDef = { id: string; label: string; color: string };

const DEFAULT_LABELS: LabelDef[] = [
    { id: "rd", label: "R&D §41", color: "purple" },
    { id: "manufacturing", label: "Mfg §45X", color: "indigo" },
    { id: "family-leave", label: "PFML §45S", color: "blue" },
    { id: "retirement-startup", label: "Retirement", color: "success" },
    { id: "auto-enrollment", label: "Auto-Enroll", color: "orange" },
    { id: "employer-contribution", label: "Emp. Contrib", color: "brand" },
    { id: "health-care", label: "Health Care", color: "warning" },
    { id: "disabled-access", label: "Access §44", color: "blue-light" },
    { id: "child-care", label: "Child Care §45F", color: "pink" },
];

const MONTH_OPTIONS = [
    { id: "2026-03", label: "March 2026" },
    { id: "2026-02", label: "February 2026" },
    { id: "2026-01", label: "January 2026" },
    { id: "2025-12", label: "December 2025" },
];

// ─── Bank Accounts ───────────────────────────────────────────────────────────

type BankAccountType = "checking" | "savings" | "credit-card";

interface BankAccount {
    id: string;
    name: string;           // e.g. "Checking ···4821"
    institution: string;    // e.g. "Mercury"
    type: BankAccountType;
    balance: number;
    currency: string;
}

const BANK_ACCOUNTS_INIT: BankAccount[] = [
    { id: "checking-4821", name: "Checking ···4821", institution: "Mercury", type: "checking", balance: 84521.33, currency: "USD" },
    { id: "credit-7392", name: "Credit Card ···7392", institution: "Brex", type: "credit-card", balance: -3421.50, currency: "USD" },
];

// Available banks to connect via Plaid-style flow
const AVAILABLE_BANKS = [
    { id: "mercury", name: "Mercury", description: "Banking built for startups" },
    { id: "chase", name: "Chase Business", description: "Business checking & credit" },
    { id: "brex", name: "Brex", description: "Corporate cards & cash management" },
    { id: "svb", name: "Silicon Valley Bank", description: "Banking for innovators" },
    { id: "boa", name: "Bank of America", description: "Business accounts" },
    { id: "wells-fargo", name: "Wells Fargo", description: "Small business banking" },
    { id: "amex", name: "American Express", description: "Business credit cards" },
    { id: "other", name: "Other Bank", description: "Connect manually via routing number" },
];

const TRANSACTIONS_INIT = [
    // March 2026
    { id: "1", date: "Mar 11, 2026", month: "2026-03", description: "Stripe Payment - Customer Invoice #4521", amount: 2450.00, coaCode: "44400", account: "Checking ···4821", confidence: 98, labels: [] as string[], aiReasoning: "Stripe recurring invoice payment matched to customer #4521 in AR ledger" },
    { id: "2", date: "Mar 10, 2026", month: "2026-03", description: "AWS Monthly Services", amount: -847.32, coaCode: "69000", account: "Checking ···4821", confidence: 95, labels: ["rd"], aiReasoning: "AWS cloud compute is used primarily for ML model training — qualifies as R&D supply expense under IRC §41" },
    { id: "3", date: "Mar 9, 2026", month: "2026-03", description: "Gusto Payroll - March", amount: -12500.00, coaCode: "66000", account: "Checking ···4821", confidence: 99, labels: ["rd", "family-leave", "retirement-startup", "employer-contribution"], aiReasoning: "Payroll includes 3 engineers (60%+ R&D time), PFML-eligible employees, and 401(k) employer match contributions" },
    { id: "4", date: "Mar 8, 2026", month: "2026-03", description: "Google Ads Campaign", amount: -1250.00, coaCode: "60000", account: "Checking ···4821", confidence: 92, labels: [] as string[], aiReasoning: "Advertising spend is a general business expense — not eligible for any tax credits" },
    { id: "5", date: "Mar 7, 2026", month: "2026-03", description: "WeWork Office Rent", amount: -3200.00, coaCode: "68100", account: "Checking ···4821", confidence: 97, labels: ["disabled-access"], aiReasoning: "Office rent for ADA-compliant space — accessibility improvements may qualify under IRC §44 Disabled Access Credit" },
    { id: "6", date: "Mar 6, 2026", month: "2026-03", description: "Client Payment - Acme Corp", amount: 8500.00, coaCode: "47900", account: "Checking ···4821", confidence: 96, labels: [] as string[], aiReasoning: "Client payment matched to Invoice #3892 — Acme Corp consulting engagement" },
    { id: "7", date: "Mar 5, 2026", month: "2026-03", description: "Delta Airlines - SFO to NYC", amount: -584.00, coaCode: "68300", account: "Credit Card ···7392", confidence: 88, labels: ["rd"], aiReasoning: "Travel to NYC R&D partner site for prototype testing — qualifies as R&D-related travel expense" },
    { id: "8", date: "Mar 4, 2026", month: "2026-03", description: "Amazon Business - Office Supplies", amount: -234.67, coaCode: "64900", account: "Credit Card ···7392", confidence: 75, labels: [] as string[], aiReasoning: "General office supplies purchase — no qualifying credit indicators found" },
    { id: "9", date: "Mar 3, 2026", month: "2026-03", description: "Zoom Pro Subscription", amount: -149.90, coaCode: "69000", account: "Credit Card ···7392", confidence: 94, labels: ["rd"], aiReasoning: "Zoom used for R&D team standups and technical design reviews — partially qualifies under IRC §41" },
    { id: "10", date: "Mar 2, 2026", month: "2026-03", description: "Client Payment - Beta Inc", amount: 3200.00, coaCode: "44400", account: "Checking ···4821", confidence: 97, labels: [] as string[], aiReasoning: "Client payment matched to Invoice #4102 — Beta Inc monthly retainer" },
    { id: "26", date: "Mar 1, 2026", month: "2026-03", description: "Uber - Team Transportation", amount: -187.50, coaCode: "68300", account: "Credit Card ···7392", confidence: 65, labels: [] as string[], aiReasoning: "Ride-sharing expense — unclear if business or personal use, needs manual verification" },
    // February 2026
    { id: "11", date: "Feb 27, 2026", month: "2026-02", description: "Stripe Payment - Customer Invoice #4480", amount: 3800.00, coaCode: "44400", account: "Checking ···4821", confidence: 97, labels: [] as string[], aiReasoning: "Stripe recurring invoice payment matched to customer #4480 in AR ledger" },
    { id: "12", date: "Feb 20, 2026", month: "2026-02", description: "AWS Monthly Services", amount: -812.50, coaCode: "69000", account: "Checking ···4821", confidence: 96, labels: ["rd"], aiReasoning: "AWS cloud compute for ML model training — qualifies as R&D supply expense under IRC §41" },
    { id: "13", date: "Feb 15, 2026", month: "2026-02", description: "Gusto Payroll - February", amount: -12500.00, coaCode: "66000", account: "Checking ···4821", confidence: 99, labels: ["rd", "family-leave", "retirement-startup"], aiReasoning: "Payroll includes 3 engineers (60%+ R&D time) and PFML-eligible employees" },
    { id: "14", date: "Feb 10, 2026", month: "2026-02", description: "WeWork Office Rent", amount: -3200.00, coaCode: "68100", account: "Checking ···4821", confidence: 98, labels: ["disabled-access"], aiReasoning: "Office rent for ADA-compliant space — may qualify under IRC §44" },
    { id: "15", date: "Feb 5, 2026", month: "2026-02", description: "Figma Enterprise", amount: -450.00, coaCode: "69000", account: "Credit Card ···7392", confidence: 91, labels: ["rd"], aiReasoning: "Design tooling used for R&D prototyping — partially qualifies under IRC §41" },
    { id: "16", date: "Feb 3, 2026", month: "2026-02", description: "Client Payment - Gamma LLC", amount: 15000.00, coaCode: "47900", account: "Checking ···4821", confidence: 98, labels: [] as string[], aiReasoning: "Client payment matched to Invoice #4310 — Gamma LLC implementation fee" },
    // January 2026
    { id: "17", date: "Jan 28, 2026", month: "2026-01", description: "Gusto Payroll - January", amount: -12500.00, coaCode: "66000", account: "Checking ···4821", confidence: 99, labels: ["rd", "family-leave", "retirement-startup"], aiReasoning: "Payroll includes 3 engineers (60%+ R&D time) and PFML-eligible employees" },
    { id: "18", date: "Jan 22, 2026", month: "2026-01", description: "AWS Monthly Services", amount: -790.00, coaCode: "69000", account: "Checking ···4821", confidence: 95, labels: ["rd"], aiReasoning: "AWS cloud compute for ML training — qualifies as R&D supply expense" },
    { id: "19", date: "Jan 15, 2026", month: "2026-01", description: "WeWork Office Rent", amount: -3200.00, coaCode: "68100", account: "Checking ···4821", confidence: 98, labels: ["disabled-access"], aiReasoning: "Office rent for ADA-compliant space" },
    { id: "20", date: "Jan 10, 2026", month: "2026-01", description: "Client Payment - Delta Partners", amount: 5000.00, coaCode: "47900", account: "Checking ···4821", confidence: 97, labels: [] as string[], aiReasoning: "Monthly retainer payment from Delta Partners" },
    { id: "21", date: "Jan 5, 2026", month: "2026-01", description: "Datadog Monitoring", amount: -320.00, coaCode: "69000", account: "Credit Card ···7392", confidence: 82, labels: ["rd"], aiReasoning: "Infrastructure monitoring — partially qualifies as R&D tooling" },
    // December 2025
    { id: "22", date: "Dec 28, 2025", month: "2025-12", description: "Gusto Payroll - December", amount: -12500.00, coaCode: "66000", account: "Checking ···4821", confidence: 99, labels: ["rd", "family-leave"], aiReasoning: "Payroll includes 3 engineers (60%+ R&D time)" },
    { id: "23", date: "Dec 20, 2025", month: "2025-12", description: "Year-end Client Payment - Acme Corp", amount: 18000.00, coaCode: "44400", account: "Checking ···4821", confidence: 96, labels: [] as string[], aiReasoning: "Year-end settlement payment from Acme Corp" },
    { id: "24", date: "Dec 15, 2025", month: "2025-12", description: "Holiday Team Dinner", amount: -1200.00, coaCode: "60000", account: "Credit Card ···7392", confidence: 72, labels: [] as string[], aiReasoning: "Team event expense — not eligible for tax credits" },
    { id: "25", date: "Dec 10, 2025", month: "2025-12", description: "WeWork Office Rent", amount: -3200.00, coaCode: "68100", account: "Checking ···4821", confidence: 98, labels: ["disabled-access"], aiReasoning: "Office rent for ADA-compliant space" },
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
    const [coaFilter, setCoaFilter] = useState("all");
    const [monthFilter, setMonthFilter] = useState("2026-03");
    const [transactions, setTransactions] = useState(TRANSACTIONS_INIT.map((t) => ({ ...t })));
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(BANK_ACCOUNTS_INIT);
    const [accountFilter, setAccountFilter] = useState<string>("all");
    const [addBankOpen, setAddBankOpen] = useState(false);
    const [connectingBankId, setConnectingBankId] = useState<string | null>(null);
    const [availableLabels, setAvailableLabels] = useState<LabelDef[]>([...DEFAULT_LABELS]);
    const [labelDropdownOpen, setLabelDropdownOpen] = useState<string | null>(null);
    const [actionsOpen, setActionsOpen] = useState<string | null>(null);
    const [dateSortDir, setDateSortDir] = useState<"asc" | "desc">("desc");
    const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);
    const selectedTxn = selectedTxnId ? transactions.find((t) => t.id === selectedTxnId) ?? null : null;
    const [memo, setMemo] = useState("");
    const [slideoutLabelOpen, setSlideoutLabelOpen] = useState(false);
    const [docZoom, setDocZoom] = useState(100);

    const monthTxns = transactions.filter((t) => t.month === monthFilter);
    const totalTxns = monthTxns.length;
    const verifiedCount = monthTxns.filter((t) => t.confidence >= 95).length;
    const needsReviewCount = monthTxns.filter((t) => t.confidence < 90).length;
    const monthLabel = MONTH_OPTIONS.find((m) => m.id === monthFilter)?.label ?? monthFilter;

    const selectedAccount = accountFilter === "all" ? null : bankAccounts.find((a) => a.name === accountFilter);

    function connectBank(bank: typeof AVAILABLE_BANKS[number]) {
        setConnectingBankId(bank.id);
        // Simulate async connection
        setTimeout(() => {
            const last4 = String(Math.floor(1000 + Math.random() * 9000));
            const isCredit = bank.id === "amex" || bank.id === "brex";
            const newAccount: BankAccount = {
                id: `${bank.id}-${last4}`,
                name: isCredit ? `Credit Card ···${last4}` : `Checking ···${last4}`,
                institution: bank.name,
                type: isCredit ? "credit-card" : "checking",
                balance: isCredit ? -Math.round(Math.random() * 5000 * 100) / 100 : Math.round(Math.random() * 100000 * 100) / 100,
                currency: "USD",
            };
            setBankAccounts((prev) => [...prev, newAccount]);
            setConnectingBankId(null);
            setAddBankOpen(false);
            setAccountFilter(newAccount.name);
        }, 1200);
    }

    const filtered = monthTxns
        .filter((t) => {
            if (searchQuery && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (coaFilter !== "all" && t.coaCode !== coaFilter) return false;
            if (accountFilter !== "all" && t.account !== accountFilter) return false;
            return true;
        })
        .sort((a, b) => {
            const da = new Date(a.date).getTime();
            const db = new Date(b.date).getTime();
            return dateSortDir === "desc" ? db - da : da - db;
        });

    const toggleLabel = (txnId: string, labelId: string) => {
        setTransactions((prev) =>
            prev.map((t) =>
                t.id === txnId
                    ? { ...t, labels: t.labels.includes(labelId) ? t.labels.filter((l) => l !== labelId) : [...t.labels, labelId] }
                    : t,
            ),
        );
    };


    return (
        <div className="space-y-5">
                {needsReviewCount > 0 && (
                    <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-purple-200/80 via-purple-100/70 to-blue-200/80 px-4 py-3.5">
                        <Flag04 className="size-4 shrink-0 text-orange-dark-500" />
                        <p className="text-sm text-tertiary">
                            AI flagged <span className="font-semibold text-primary">{needsReviewCount} transaction{needsReviewCount > 1 ? "s" : ""}</span> for review this month
                        </p>
                    </div>
                )}

                {/* Combined: Bank Tabs + Filters + Table */}
                <div className="overflow-x-auto rounded-xl border border-secondary bg-primary">
                    {/* Bank Tabs + Filters — single row */}
                    {/* Bank Account Tabs */}
                    <div className="flex items-center gap-2 border-b border-secondary p-2">
                        {(() => {
                            const allCount = monthTxns.length;
                            const isAllActive = accountFilter === "all";
                            return (
                                <button
                                    type="button"
                                    onClick={() => setAccountFilter("all")}
                                    className={cx(
                                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                                        isAllActive ? "bg-brand-primary_alt text-brand-secondary" : "text-tertiary hover:bg-secondary hover:text-primary",
                                    )}
                                >
                                    <Bank className="size-4" />
                                    All Banking Accounts
                                    <span className={cx("rounded-full px-1.5 py-0.5 text-xs font-medium", isAllActive ? "bg-primary text-brand-secondary" : "bg-secondary text-tertiary")}>{allCount}</span>
                                </button>
                            );
                        })()}
                        {bankAccounts.map((acct) => {
                            const acctTxns = monthTxns.filter((t) => t.account === acct.name);
                            const isActive = accountFilter === acct.name;
                            const Icon = acct.type === "credit-card" ? CreditCard01 : Bank;
                            return (
                                <button
                                    key={acct.id}
                                    type="button"
                                    onClick={() => setAccountFilter(acct.name)}
                                    className={cx(
                                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                                        isActive ? "bg-brand-primary_alt text-brand-secondary" : "text-tertiary hover:bg-secondary hover:text-primary",
                                    )}
                                >
                                    <Icon className="size-4" />
                                    <span>
                                        <span className="font-semibold">{acct.institution}</span>
                                        <span className="mx-1.5 text-quaternary">·</span>
                                        <span className="font-normal text-tertiary">{acct.name}</span>
                                    </span>
                                    <span className={cx("rounded-full px-1.5 py-0.5 text-xs font-medium", isActive ? "bg-primary text-brand-secondary" : "bg-secondary text-tertiary")}>{acctTxns.length}</span>
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => setAddBankOpen(true)}
                            className="flex items-center gap-1.5 rounded-lg border border-dashed border-secondary px-3 py-2 text-sm font-medium text-tertiary transition hover:border-brand hover:bg-brand-primary_alt hover:text-brand-secondary"
                        >
                            <Plus className="size-4" />
                            Add Bank
                        </button>
                    </div>

                    {/* Filters row */}
                    <div className="flex items-center gap-2 border-b border-secondary px-4 py-2.5">
                        {selectedAccount && (
                            <span className={cx("text-sm font-semibold tabular-nums", selectedAccount.balance < 0 ? "text-error-primary" : "text-success-primary")}>
                                {selectedAccount.balance < 0 ? "-" : ""}${Math.abs(selectedAccount.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                        )}
                        <div className="relative flex-1">
                            <select
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                                className="w-full appearance-none rounded-md border border-secondary bg-primary py-1.5 pl-2.5 pr-7 text-xs font-medium text-primary focus:border-brand focus:outline-none"
                            >
                                {MONTH_OPTIONS.map((m) => (
                                    <option key={m.id} value={m.id}>{m.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-fg-quaternary" />
                        </div>
                        <div className="relative flex-1">
                            <select
                                value={coaFilter}
                                onChange={(e) => setCoaFilter(e.target.value)}
                                className="w-full appearance-none rounded-md border border-secondary bg-primary py-1.5 pl-2.5 pr-7 text-xs font-medium text-primary focus:border-brand focus:outline-none"
                            >
                                {COA_OPTIONS.map((o) => (
                                    <option key={o.id} value={o.id}>{o.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-fg-quaternary" />
                        </div>
                        <div className="flex flex-1 items-center gap-1.5 rounded-md border border-secondary bg-primary px-2.5 py-1.5">
                            <SearchLg className="size-3.5 text-fg-quaternary" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-full bg-transparent text-xs text-primary placeholder:text-quaternary focus:outline-none"
                            />
                        </div>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-secondary bg-secondary">
                                <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium text-secondary">
                                    <button
                                        type="button"
                                        onClick={() => setDateSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                                        className="inline-flex items-center gap-1 transition hover:text-primary"
                                    >
                                        Date
                                        <span className="inline-flex flex-col -space-y-1">
                                            <ChevronUp className={cx("size-3", dateSortDir === "asc" ? "text-fg-primary" : "text-fg-quaternary")} />
                                            <ChevronDown className={cx("size-3", dateSortDir === "desc" ? "text-fg-primary" : "text-fg-quaternary")} />
                                        </span>
                                    </button>
                                </th>
                                <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium text-secondary">Description</th>
                                <th className="w-[110px] whitespace-nowrap px-4 py-2.5 text-right font-medium text-secondary">Amount</th>
                                <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium text-secondary">Chart of Account</th>
                                <th className="w-[150px] whitespace-nowrap px-4 py-2.5 text-right font-medium text-secondary">Labels</th>
                                {accountFilter === "all" && <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium text-secondary">Account</th>}
                                <th className="w-10 px-4 py-2.5" />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((txn) => {
                                const coa = CHART_OF_ACCOUNTS.find((a) => a.code === txn.coaCode);
                                const isLabelOpen = labelDropdownOpen === txn.id;
                                const needsReview = txn.confidence < 90;
                                return (
                                    <tr key={txn.id} onClick={() => setSelectedTxnId(txn.id)} className={cx("cursor-pointer border-b border-secondary last:border-b-0 transition hover:bg-primary_hover", needsReview && "border-l-2 border-l-orange-dark-500 bg-orange-dark-50")}>
                                        <td className="whitespace-nowrap px-4 py-3 text-tertiary">
                                            <div className="flex items-center gap-2">
                                                {needsReview && <Flag04 className="size-3.5 text-orange-dark-500" />}
                                                {txn.date}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-primary">
                                            <div className="group/ai relative inline-flex items-center gap-1.5">
                                                {txn.description}
                                                <Stars01 className="size-3.5 shrink-0 cursor-help text-fg-brand-secondary_alt" />
                                                <div className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 hidden w-72 rounded-lg bg-primary-solid px-3 py-2.5 shadow-lg group-hover/ai:block">
                                                    <p className="text-xs font-semibold text-white">AI Insight</p>
                                                    <p className="mt-1 text-xs font-medium text-tooltip-supporting-text">{txn.aiReasoning}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={cx("whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums", txn.amount > 0 ? "text-success-primary" : "text-primary")}>
                                            {txn.amount > 0 ? "+" : ""}${Math.abs(txn.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {coa ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-primary">{coa.name}</span>
                                                    <span className="text-xs text-tertiary">{coa.code}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-tertiary">Uncategorized</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex min-w-[120px] flex-wrap items-center justify-end gap-1">
                                                {txn.labels.map((labelId) => {
                                                    const lbl = availableLabels.find((l) => l.id === labelId);
                                                    return lbl ? (
                                                        <Badge key={labelId} color={lbl.color as any} size="sm" type="pill-color">
                                                            {lbl.label}
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleLabel(txn.id, labelId)}
                                                                className="ml-1 -mr-0.5 inline-flex items-center justify-center rounded-full opacity-60 transition hover:opacity-100"
                                                            >
                                                                <XClose className="size-3" />
                                                            </button>
                                                        </Badge>
                                                    ) : null;
                                                })}
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setLabelDropdownOpen(isLabelOpen ? null : txn.id)}
                                                        className="flex size-5 items-center justify-center rounded-full border border-dashed border-tertiary text-tertiary transition hover:border-secondary hover:bg-secondary hover:text-secondary"
                                                    >
                                                        <Plus className="size-3" />
                                                    </button>
                                                    {isLabelOpen && (
                                                        <>
                                                            <div className="fixed inset-0 z-10" onClick={() => setLabelDropdownOpen(null)} />
                                                            <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-lg border border-secondary bg-primary py-1 shadow-lg">
                                                        {availableLabels.map((lbl) => {
                                                            const isActive = txn.labels.includes(lbl.id);
                                                            return (
                                                                <button
                                                                    key={lbl.id}
                                                                    type="button"
                                                                    onClick={() => toggleLabel(txn.id, lbl.id)}
                                                                    className={cx(
                                                                        "flex w-full items-center gap-1.5 px-2.5 py-1 text-left text-xs transition hover:bg-primary_hover",
                                                                        isActive && "bg-active",
                                                                    )}
                                                                >
                                                                    <Badge color={lbl.color as any} size="sm" type="pill-color">{lbl.label}</Badge>
                                                                    {isActive && <Check className="ml-auto size-3.5 text-fg-brand-primary" />}
                                                                </button>
                                                            );
                                                        })}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        {accountFilter === "all" && <td className="whitespace-nowrap px-4 py-3 text-primary">{txn.account}</td>}
                                        <td className="relative px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => setActionsOpen(actionsOpen === txn.id ? null : txn.id)}
                                                className="flex size-7 items-center justify-center rounded-md text-fg-quaternary transition hover:bg-secondary hover:text-fg-secondary"
                                            >
                                                <DotsVertical className="size-4" />
                                            </button>
                                            {actionsOpen === txn.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setActionsOpen(null)} />
                                                    <div className="absolute right-4 top-full z-20 mt-1 w-48 overflow-hidden rounded-lg border border-secondary bg-primary py-1 shadow-lg">
                                                        {[
                                                            { icon: Edit05, label: "Edit transaction" },
                                                            { icon: Upload01, label: "Attach receipt" },
                                                            { icon: Divide03, label: "Split transaction" },
                                                            { icon: MessageSquare01, label: "Add memo" },
                                                            { icon: CheckCircle, label: "Mark as reviewed" },
                                                        ].map((action) => (
                                                            <button
                                                                key={action.label}
                                                                type="button"
                                                                onClick={() => setActionsOpen(null)}
                                                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-secondary transition hover:bg-primary_hover"
                                                            >
                                                                <action.icon className="size-4 text-fg-quaternary" />
                                                                {action.label}
                                                            </button>
                                                        ))}
                                                        <div className="my-1 border-t border-secondary" />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setTransactions((prev) => prev.filter((t) => t.id !== txn.id));
                                                                setActionsOpen(null);
                                                            }}
                                                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-error-primary transition hover:bg-primary_hover"
                                                        >
                                                            <Trash01 className="size-4" />
                                                            Delete transaction
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Transaction detail slideout */}
                <SlideoutMenu isDismissable isOpen={selectedTxn !== null} onOpenChange={(open) => { if (!open) { setSelectedTxnId(null); setMemo(""); setSlideoutLabelOpen(false); setDocZoom(100); } }} modalClassName="w-[960px] max-w-none" dialogClassName="overflow-hidden">
                    {({ close }) => {
                        if (!selectedTxn) return null;
                        const coa = CHART_OF_ACCOUNTS.find((a) => a.code === selectedTxn.coaCode);
                        const needsReview = selectedTxn.confidence < 90;
                        return (
                            <div className="flex size-full">
                                {/* Left panel – Transaction Details */}
                                <div className="flex w-[400px] shrink-0 flex-col border-r border-secondary">
                                    {/* Header */}
                                    <header className="relative w-full px-6 pt-6 pb-4">
                                        <CloseButton size="md" className="absolute top-3 left-3 shrink-0" onClick={() => { close(); setMemo(""); }} />
                                        <div className="flex items-center gap-3 pl-8">
                                            <div className={cx("flex size-10 items-center justify-center rounded-lg", selectedTxn.amount > 0 ? "bg-success-secondary" : "bg-secondary")}>
                                                {selectedTxn.amount > 0 ? <LineChartUp01 className="size-5 text-fg-success-primary" /> : <CurrencyDollar className="size-5 text-fg-quaternary" />}
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold text-primary">{selectedTxn.description}</h2>
                                                <p className="text-sm text-tertiary">{selectedTxn.date}</p>
                                            </div>
                                        </div>
                                    </header>

                                    {/* Scrollable content */}
                                    <div className="flex-1 overflow-y-auto px-6 pb-5">
                                        <div className="space-y-5">
                                            {/* Amount & status */}
                                            <div className="flex items-center justify-between rounded-xl border border-secondary bg-secondary px-4 py-3">
                                                <div>
                                                    <p className="text-xs text-tertiary">Amount</p>
                                                    <p className={cx("mt-0.5 text-2xl font-semibold tabular-nums tracking-tight", selectedTxn.amount > 0 ? "text-success-primary" : "text-primary")}>
                                                        {selectedTxn.amount > 0 ? "+" : ""}${Math.abs(selectedTxn.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    {needsReview ? (
                                                        <Badge color="warning" size="sm" type="pill-color">Needs Review</Badge>
                                                    ) : (
                                                        <Badge color="success" size="sm" type="pill-color">Verified</Badge>
                                                    )}
                                                    <Badge color={selectedTxn.amount > 0 ? "success" : "gray"} size="sm" type="pill-color">
                                                        {selectedTxn.amount > 0 ? "Income" : "Expense"}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Details grid */}
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Details</h3>
                                                <div className="divide-y divide-secondary rounded-xl border border-secondary">
                                                    <div className="flex items-center justify-between px-3 py-2.5">
                                                        <span className="flex items-center gap-2 text-sm text-tertiary">
                                                            <Calendar className="size-3.5 text-fg-quaternary" />
                                                            Date
                                                        </span>
                                                        <span className="text-sm font-medium text-primary">{selectedTxn.date}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between px-3 py-2.5">
                                                        <span className="flex items-center gap-2 text-sm text-tertiary">
                                                            <Hash01 className="size-3.5 text-fg-quaternary" />
                                                            Transaction ID
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
                                                            TXN-{selectedTxn.id.padStart(6, "0")}
                                                            <button type="button" className="text-fg-quaternary hover:text-fg-secondary"><Copy01 className="size-3.5" /></button>
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between px-3 py-2.5">
                                                        <span className="flex items-center gap-2 text-sm text-tertiary">
                                                            <Bank className="size-3.5 text-fg-quaternary" />
                                                            Account
                                                        </span>
                                                        <span className="text-sm font-medium text-primary">{selectedTxn.account}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between px-3 py-2.5">
                                                        <span className="flex items-center gap-2 text-sm text-tertiary">
                                                            <BarChartSquare02 className="size-3.5 text-fg-quaternary" />
                                                            Chart of Account
                                                        </span>
                                                        <span className="text-sm font-medium text-primary">
                                                            {coa ? (
                                                                <span>{coa.name} <span className="text-xs text-tertiary">({coa.code})</span></span>
                                                            ) : "Uncategorized"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Labels */}
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Labels</h3>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {selectedTxn.labels.map((labelId) => {
                                                        const lbl = availableLabels.find((l) => l.id === labelId);
                                                        return lbl ? (
                                                            <Badge key={labelId} color={lbl.color as any} size="sm" type="pill-color">
                                                                {lbl.label}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleLabel(selectedTxn.id, labelId)}
                                                                    className="ml-1 -mr-0.5 inline-flex items-center justify-center rounded-full opacity-60 transition hover:opacity-100"
                                                                >
                                                                    <XClose className="size-3" />
                                                                </button>
                                                            </Badge>
                                                        ) : null;
                                                    })}
                                                    <div className="relative">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSlideoutLabelOpen(!slideoutLabelOpen)}
                                                            className="flex size-5 items-center justify-center rounded-full border border-dashed border-tertiary text-tertiary transition hover:border-secondary hover:bg-secondary hover:text-secondary"
                                                        >
                                                            <Plus className="size-3" />
                                                        </button>
                                                        {slideoutLabelOpen && (
                                                            <>
                                                                <div className="fixed inset-0 z-10" onClick={() => setSlideoutLabelOpen(false)} />
                                                                <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-lg border border-secondary bg-primary py-1 shadow-lg">
                                                                    {availableLabels.map((lbl) => {
                                                                        const isActive = selectedTxn.labels.includes(lbl.id);
                                                                        return (
                                                                            <button
                                                                                key={lbl.id}
                                                                                type="button"
                                                                                onClick={() => toggleLabel(selectedTxn.id, lbl.id)}
                                                                                className={cx(
                                                                                    "flex w-full items-center gap-1.5 px-2.5 py-1 text-left text-xs transition hover:bg-primary_hover",
                                                                                    isActive && "bg-active",
                                                                                )}
                                                                            >
                                                                                <Badge color={lbl.color as any} size="sm" type="pill-color">{lbl.label}</Badge>
                                                                                {isActive && <Check className="ml-auto size-3.5 text-fg-brand-primary" />}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* AI Insight */}
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">AI Insight</h3>
                                                <div className="rounded-xl bg-gradient-to-r from-purple-100/60 to-blue-100/60 px-3 py-2.5">
                                                    <div className="flex items-start gap-2">
                                                        <Stars01 className="mt-0.5 size-3.5 shrink-0 text-fg-brand-secondary_alt" />
                                                        <p className="text-xs leading-relaxed text-tertiary">{selectedTxn.aiReasoning}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <footer className="w-full p-4 shadow-[inset_0px_1px_0px_0px] shadow-border-secondary md:px-6">
                                        <Button color="primary" size="sm" iconLeading={CheckCircle} className="w-full">
                                            {needsReview ? "Approve Transaction" : "Verified"}
                                        </Button>
                                    </footer>
                                </div>

                                {/* Right panel – Document Preview */}
                                <div className="flex flex-1 flex-col bg-secondary">
                                    {/* Document toolbar */}
                                    <div className="flex items-center justify-between border-b border-secondary px-5 py-3">
                                        <h3 className="text-sm font-semibold text-primary">Transaction document</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setDocZoom((z) => Math.max(50, z - 10))}
                                                className="flex size-7 items-center justify-center rounded-md text-fg-quaternary transition hover:bg-primary hover:text-fg-secondary"
                                            >
                                                <ZoomOut className="size-4" />
                                            </button>
                                            <span className="min-w-[40px] text-center text-xs tabular-nums text-secondary">{docZoom}%</span>
                                            <button
                                                type="button"
                                                onClick={() => setDocZoom((z) => Math.min(200, z + 10))}
                                                className="flex size-7 items-center justify-center rounded-md text-fg-quaternary transition hover:bg-primary hover:text-fg-secondary"
                                            >
                                                <ZoomIn className="size-4" />
                                            </button>
                                            <div className="mx-1 h-4 w-px bg-tertiary" />
                                            <span className="text-xs text-tertiary">Page 1 of 1</span>
                                        </div>
                                    </div>

                                    {/* Document area */}
                                    <div className="flex flex-1 items-start justify-center overflow-auto p-6">
                                        <div className="w-full origin-top rounded-lg bg-primary shadow-lg ring-1 ring-secondary transition-transform duration-150" style={{ transform: `scale(${docZoom / 100})` }}>
                                            {/* Bank statement style document */}
                                            <div className="space-y-6 p-8">
                                                {/* Bank header */}
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <Bank className="size-5 text-fg-primary" />
                                                            <p className="text-base font-bold text-primary">{selectedTxn.account}</p>
                                                        </div>
                                                        <p className="mt-0.5 text-[11px] text-quaternary">A Division of First Citizens Bank</p>
                                                    </div>
                                                    <div className="text-right text-[11px] leading-relaxed text-tertiary">
                                                        <p>P.O. Box 2360</p>
                                                        <p>Omaha NE 68103</p>
                                                    </div>
                                                </div>

                                                {/* Statement title row */}
                                                <div className="flex items-start justify-between border-t-2 border-brand-solid pt-4">
                                                    <div>
                                                        <p className="text-xs font-semibold text-primary">Return Service Requested</p>
                                                        <div className="mt-1.5 text-[11px] leading-relaxed text-tertiary">
                                                            <p className="font-medium text-primary">{selectedTxn.description}</p>
                                                            <p>123 BUSINESS AVE</p>
                                                            <p>SAN FRANCISCO CA 94105</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-primary">Monthly Statement</p>
                                                        <p className="mt-0.5 text-[11px] text-tertiary">Statement Period: {selectedTxn.date}</p>
                                                        <div className="mt-3 space-y-1 text-[11px]">
                                                            <div className="flex justify-between gap-8">
                                                                <span className="text-tertiary">Account Number:</span>
                                                                <span className="font-medium text-primary">Ending in 7800</span>
                                                            </div>
                                                            <div className="flex justify-between gap-8">
                                                                <span className="text-tertiary">New Balance:</span>
                                                                <span className="font-medium text-primary">${Math.abs(selectedTxn.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                                            </div>
                                                            <div className="flex justify-between gap-8">
                                                                <span className="text-tertiary">Payment Due Date:</span>
                                                                <span className="font-medium text-primary">05-26-25</span>
                                                            </div>
                                                            <div className="flex justify-between gap-8">
                                                                <span className="text-tertiary">Payment Amount:</span>
                                                                <span className="font-medium text-primary">${Math.abs(selectedTxn.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Account Summary */}
                                                <div>
                                                    <div className="border-b-2 border-brand-solid pb-1">
                                                        <p className="text-xs font-bold text-primary">ACCOUNT SUMMARY</p>
                                                    </div>
                                                    <div className="mt-3 grid grid-cols-2 gap-x-10 gap-y-1 text-[11px]">
                                                        <div className="flex justify-between border-b border-dotted border-tertiary pb-1">
                                                            <span className="text-tertiary">Previous Balance</span>
                                                            <span className="tabular-nums text-primary">$5,124.33</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-dotted border-tertiary pb-1">
                                                            <span className="text-tertiary">Statement Closing Date</span>
                                                            <span className="tabular-nums text-primary">04-30-25</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-dotted border-tertiary pb-1">
                                                            <span className="text-tertiary">Payments</span>
                                                            <span className="tabular-nums text-primary">-$5,124.33</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-dotted border-tertiary pb-1">
                                                            <span className="text-tertiary">Credit Limit</span>
                                                            <span className="tabular-nums text-primary">$100,000.00</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-dotted border-tertiary pb-1">
                                                            <span className="text-tertiary">Credits</span>
                                                            <span className="tabular-nums text-primary">-$0.00</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-dotted border-tertiary pb-1">
                                                            <span className="text-tertiary">Available Credit</span>
                                                            <span className="tabular-nums text-primary">$85,884.00</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-dotted border-tertiary pb-1">
                                                            <span className="text-tertiary">Purchases and Other Charges</span>
                                                            <span className="tabular-nums text-primary">+${Math.abs(selectedTxn.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-dotted border-tertiary pb-1">
                                                            <span className="text-tertiary">Days in billing cycle</span>
                                                            <span className="tabular-nums text-primary">30</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-dotted border-tertiary pb-1">
                                                            <span className="text-tertiary">Cash Advances</span>
                                                            <span className="tabular-nums text-primary">+$0.00</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-dotted border-tertiary pb-1">
                                                            <span className="text-tertiary">Payment Due Date</span>
                                                            <span className="tabular-nums text-primary">05-26-25</span>
                                                        </div>
                                                        <div className="flex justify-between border-t border-secondary pt-1">
                                                            <span className="font-semibold text-primary">New Balance</span>
                                                            <span className="font-semibold tabular-nums text-primary">=${Math.abs(selectedTxn.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t border-secondary pt-1">
                                                            <span className="text-tertiary">Past Due</span>
                                                            <span className="tabular-nums text-primary">$0.00</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Transactions */}
                                                <div>
                                                    <div className="border-b-2 border-brand-solid pb-1">
                                                        <p className="text-xs font-bold text-primary">TRANSACTIONS</p>
                                                    </div>
                                                    <table className="mt-2 w-full text-[11px]">
                                                        <thead>
                                                            <tr className="border-b border-secondary">
                                                                <th className="pb-1.5 text-left font-semibold text-primary">Date</th>
                                                                <th className="pb-1.5 text-left font-semibold text-primary">Description</th>
                                                                <th className="pb-1.5 text-right font-semibold text-primary">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr className="border-b border-dotted border-tertiary">
                                                                <td className="py-2 align-top text-tertiary">{selectedTxn.date}</td>
                                                                <td className="py-2 pr-4 text-primary">
                                                                    {selectedTxn.description}
                                                                    <br />
                                                                    <span className="text-[10px] text-tertiary">MCC: 4121 &nbsp; MERCHANT ZIP: 94105</span>
                                                                </td>
                                                                <td className="py-2 text-right tabular-nums text-primary">${Math.abs(selectedTxn.amount).toFixed(2)}</td>
                                                            </tr>
                                                            <tr>
                                                                <td colSpan={2} className="pt-2.5 text-right text-[10px] font-semibold uppercase text-primary">Total for account ending in 7800</td>
                                                                <td className="pt-2.5 text-right text-[11px] font-semibold tabular-nums text-primary">${Math.abs(selectedTxn.amount).toFixed(2)}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }}
                </SlideoutMenu>

                {/* Add Bank Modal */}
                <ModalOverlay isOpen={addBankOpen} onOpenChange={setAddBankOpen} isDismissable>
                    <Modal className="max-w-2xl">
                        <Dialog className="!items-stretch !p-0 rounded-2xl bg-primary shadow-xl ring-1 ring-secondary">
                            <div className="flex max-h-[85vh] w-full flex-col">
                                <header className="relative border-b border-secondary px-6 pt-6 pb-4">
                                    <div className="flex items-center gap-3 pr-8">
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-brand-secondary">
                                            <Bank className="size-5 text-fg-brand-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-primary">Connect a Bank Account</h2>
                                            <p className="text-sm text-tertiary">Choose your bank to securely link via Plaid</p>
                                        </div>
                                    </div>
                                    <CloseButton size="md" className="absolute top-3 right-3" onClick={() => setAddBankOpen(false)} />
                                </header>

                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="relative mb-4">
                                        <SearchLg className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
                                        <input
                                            type="text"
                                            placeholder="Search banks..."
                                            className="w-full rounded-lg border border-secondary bg-primary py-2 pl-9 pr-3 text-sm text-primary placeholder:text-quaternary focus:border-brand focus:outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {AVAILABLE_BANKS.map((bank) => {
                                            const isConnecting = connectingBankId === bank.id;
                                            const alreadyConnected = bankAccounts.some((a) => a.institution === bank.name);
                                            return (
                                                <button
                                                    key={bank.id}
                                                    type="button"
                                                    disabled={isConnecting || connectingBankId !== null}
                                                    onClick={() => connectBank(bank)}
                                                    className={cx(
                                                        "flex items-center gap-3 rounded-xl border p-4 text-left transition",
                                                        isConnecting ? "border-brand bg-brand-primary_alt" : "border-secondary bg-primary hover:border-brand hover:bg-brand-primary_alt/30",
                                                        connectingBankId !== null && !isConnecting && "opacity-50",
                                                    )}
                                                >
                                                    <div className={cx("flex size-10 shrink-0 items-center justify-center rounded-lg", isConnecting ? "bg-brand-solid" : "bg-secondary")}>
                                                        <Building01 className={cx("size-5", isConnecting ? "text-white" : "text-fg-primary")} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="truncate text-sm font-semibold text-primary">{bank.name}</p>
                                                            {alreadyConnected && <Check className="size-3.5 text-fg-success-primary" />}
                                                        </div>
                                                        <p className="truncate text-xs text-tertiary">{bank.description}</p>
                                                    </div>
                                                    {isConnecting ? (
                                                        <span className="text-xs font-medium text-brand-secondary">Connecting…</span>
                                                    ) : alreadyConnected ? (
                                                        <span className="text-xs font-medium text-success-primary">Connected</span>
                                                    ) : (
                                                        <ChevronRight className="size-4 text-fg-quaternary" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-6 rounded-xl bg-secondary p-4">
                                        <div className="flex items-start gap-2">
                                            <InfoCircle className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />
                                            <div>
                                                <p className="text-xs font-semibold text-primary">Secure connection via Plaid</p>
                                                <p className="mt-0.5 text-xs text-tertiary">Your credentials are never stored. Numix uses bank-level encryption and read-only access.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <footer className="border-t border-secondary px-6 py-4">
                                    <div className="flex items-center justify-end gap-3">
                                        <Button color="secondary" size="sm" onClick={() => setAddBankOpen(false)}>Cancel</Button>
                                    </div>
                                </footer>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
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
