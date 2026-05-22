"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/providers/auth-provider";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Bank,
    BarChartSquare02,
    Building07,
    Calendar,
    Check,
    CheckCircle,
    CheckSquare,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Clock,
    CoinsStacked01,
    Copy01,
    CurrencyDollar,
    DotsVertical,
    Edit05,
    File06,
    FileCheck02,
    Flag04,
    Globe01,
    Hash01,
    InfoCircle,
    LineChartUp01,
    Mail01,
    MarkerPin01,
    Percent03,
    Phone,
    Plus,
    Receipt,
    SearchLg,
    Stars01,
    Trash01,
    Upload01,
    User01,
    X,
    XClose,
} from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Tabs, TabList, Tab, TabPanel } from "@/components/application/tabs/tabs";
import {
    TaxFilingScreen,
    STEPS as WIZARD_STEPS,
    STEP_FIELD_COUNTS,
    CompanyProfileStep,
    ActivityStep,
    SignerStep,
    OwnersStep,
    ComplianceStep,
    DocumentsStep,
    AccessStep,
    ReviewStep,
} from "@/app/tax-filing/tax-filing-screen";
import { ModalOverlay, Modal, Dialog } from "@/components/application/modals/modal";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TaxPage = "filing" | "planning";

export type TaxPlanningIntent = { tab?: "expenses" | "credits"; credit?: string } | null;

interface TaxScreenProps {
    page?: TaxPage;
    intent?: TaxPlanningIntent;
    clearIntent?: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const YEAR_OPTIONS = [
    { id: "2024", label: "Tax Income Year 2024" },
    { id: "2023", label: "Tax Income Year 2023" },
    { id: "2022", label: "Tax Income Year 2022" },
];

const ESTIMATED_PAYMENTS = [
    { quarter: "Q1", due: "Apr 15, 2024", amount: "$4,200", status: "paid" as const },
    { quarter: "Q2", due: "Jun 15, 2024", amount: "$4,200", status: "paid" as const },
    { quarter: "Q3", due: "Sep 15, 2024", amount: "$4,200", status: "upcoming" as const },
    { quarter: "Q4", due: "Jan 15, 2025", amount: "$4,200", status: "upcoming" as const },
];

type CreditStatus = "claimed" | "eligible" | "in-progress";

const CREDIT_STATUS_CONFIG = {
    "claimed": { label: "Claimed", color: "text-success-primary", dot: "bg-fg-success-primary" },
    "eligible": { label: "Not started", color: "text-tertiary", dot: "bg-fg-tertiary" },
    "in-progress": { label: "CPA reviewing", color: "text-warning-primary", dot: "bg-fg-warning-primary" },
};

const CREDIT_CATEGORY_ORDER = ["Innovation & R&D", "Employee Benefits", "Accessibility & Facilities"] as const;

const CREDIT_CATEGORIES = {
    "Innovation & R&D": { border: "border-l-purple-500", dot: "bg-purple-500" },
    "Employee Benefits": { border: "border-l-emerald-500", dot: "bg-emerald-500" },
    "Accessibility & Facilities": { border: "border-l-blue-500", dot: "bg-blue-500" },
};

const TAX_CREDITS = [
    { id: "rd", name: "R&D Tax Credits", code: "IRC §41", creditStatus: "eligible" as CreditStatus, amount: "$448,183.82", description: "Credit for increasing research activities", category: "Innovation & R&D" as const, cta: "Start claim", ctaIcon: "arrow" as const },
    { id: "manufacturing", name: "Advanced Manufacturing Production Credit", code: "IRC §45X", creditStatus: "in-progress" as CreditStatus, amount: "$2,400", description: "Credit for production of clean energy components", category: "Innovation & R&D" as const, cta: "Learn more", ctaIcon: "arrow" as const },
    { id: "family-leave", name: "Employer Credit for Paid Family and Medical Leave", code: "§45S", creditStatus: "eligible" as CreditStatus, amount: "$1,800", description: "Credit for employers providing paid family & medical leave", category: "Employee Benefits" as const, cta: "Upload policy", ctaIcon: "upload" as const },
    { id: "retirement-startup", name: "Small Employer Retirement Plan Startup Cost Credit", code: "SECURE 2.0", creditStatus: "eligible" as CreditStatus, amount: "$1,500", description: "Credit for starting a qualified retirement plan", category: "Employee Benefits" as const, cta: "Approve filing", ctaIcon: "check" as const },
    { id: "auto-enrollment", name: "Auto-Enrollment Credit", code: "SECURE 2.0", creditStatus: "eligible" as CreditStatus, amount: "$500", description: "Credit for auto-enrollment feature in retirement plans", category: "Employee Benefits" as const, cta: "Approve filing", ctaIcon: "check" as const },
    { id: "employer-contribution", name: "Employer Contribution Credit", code: "SECURE 2.0", creditStatus: "in-progress" as CreditStatus, amount: "$2,100", description: "Credit for employer contributions to employee retirement plans", category: "Employee Benefits" as const, cta: "Share access", ctaIcon: "arrow" as const },
    { id: "disabled-access", name: "Disabled Access Credit", code: "IRC §44", creditStatus: "eligible" as CreditStatus, amount: "$750", description: "Credit for small businesses making accessibility improvements", category: "Accessibility & Facilities" as const, cta: "Approve filing", ctaIcon: "check" as const },
    { id: "child-care", name: "Employer-Provided Child Care Credit", code: "IRC §45F", creditStatus: "in-progress" as CreditStatus, amount: "$3,200", description: "Credit for employer-provided child care facilities & services", category: "Accessibility & Facilities" as const, cta: "Get estimate", ctaIcon: "stars" as const },
];

const RD_BREAKDOWN = [
    { category: "Software & cloud", amount: "$2,100" },
    { category: "Engineering payroll", amount: "$1,450" },
    { category: "Contractor R&D", amount: "$300" },
];

const RD_EMPLOYEES = [
    { id: "e1", name: "Sarah Chen", title: "Senior Software Engineer", country: "US", qualified: 78300, contractAmount: 145000, rdPercent: 54 },
    { id: "e2", name: "Marcus Johnson", title: "ML Engineer", country: "US", qualified: 112000, contractAmount: 160000, rdPercent: 70 },
    { id: "e3", name: "Emily Rodriguez", title: "Data Scientist", country: "US", qualified: 52500, contractAmount: 125000, rdPercent: 42 },
    { id: "e4", name: "David Kim", title: "Backend Engineer", country: "US", qualified: 91000, contractAmount: 130000, rdPercent: 70 },
    { id: "e5", name: "Lisa Wang", title: "Product Engineer", country: "US", qualified: 33600, contractAmount: 120000, rdPercent: 28 },
];

const RD_CONTRACTORS = [
    { id: "c1", name: "Acme Labs LLC", title: "Research Consultant", country: "US", qualified: 24000, contractAmount: 40000, rdPercent: 60 },
    { id: "c2", name: "ByteForge Inc", title: "Software Development", country: "CA", qualified: 18750, contractAmount: 75000, rdPercent: 25 },
    { id: "c3", name: "Neural Solutions", title: "AI/ML Research", country: "US", qualified: 35000, contractAmount: 50000, rdPercent: 70 },
];

type RdExpenseStatus = "qualified" | "partial" | "not-qualified" | "pending";

// ─── Chart of Accounts (shared with bookkeeping) ─────────────────────────
const RD_CHART_OF_ACCOUNTS = [
    { code: "40000", name: "Net Sales", parent: "Income" },
    { code: "44400", name: "Sales of Product", parent: "Income" },
    { code: "45500", name: "Other Sales / Income", parent: "Income" },
    { code: "47900", name: "Sales of Services", parent: "Income" },
    { code: "50000", name: "Cost of Goods Sold", parent: "COGS" },
    { code: "55000", name: "Subcontractors", parent: "COGS" },
    { code: "60000", name: "Advertising and Promotion", parent: "Expense" },
    { code: "62100", name: "Insurance", parent: "Expense" },
    { code: "64900", name: "Office Expenses", parent: "Expense" },
    { code: "66000", name: "Payroll Expenses", parent: "Expense" },
    { code: "68100", name: "Rent or Lease", parent: "Expense" },
    { code: "68300", name: "Travel", parent: "Expense" },
    { code: "68600", name: "Utilities", parent: "Expense" },
    { code: "69000", name: "Software & Cloud Services", parent: "Expense" },
    { code: "11001", name: "Banks", parent: "Current Assets" },
    { code: "12100", name: "Inventory Asset", parent: "Current Assets" },
    { code: "15000", name: "Furniture and Equipment", parent: "Fixed Assets" },
    { code: "22000", name: "Credit Cards", parent: "Current Liabilities" },
    { code: "24000", name: "Payroll Liabilities", parent: "Current Liabilities" },
];

type RdLabelDef = { id: string; label: string; color: string };
const RD_LABELS: RdLabelDef[] = [
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

const RD_EXPENSE_ITEMS = [
    { id: "1", date: "Mar 11, 2026", description: "Stripe Payment - Customer Invoice #4521", amount: 2450.00, coaCode: "44400", account: "Checking ···4821", confidence: 98, labels: [] as string[], aiReasoning: "Stripe recurring invoice payment matched to customer #4521 in AR ledger", rdStatus: "not-qualified" as RdExpenseStatus },
    { id: "2", date: "Mar 10, 2026", description: "AWS Monthly Services", amount: -847.32, coaCode: "69000", account: "Checking ···4821", confidence: 95, labels: ["rd"], aiReasoning: "AWS cloud compute is used primarily for ML model training, qualifies as R&D supply expense under IRC §41", rdStatus: "qualified" as RdExpenseStatus },
    { id: "3", date: "Mar 9, 2026", description: "Gusto Payroll - March", amount: -12500.00, coaCode: "66000", account: "Checking ···4821", confidence: 99, labels: ["rd", "family-leave", "retirement-startup", "employer-contribution"], aiReasoning: "Payroll includes 3 engineers (60%+ R&D time), PFML-eligible employees, and 401(k) employer match contributions", rdStatus: "partial" as RdExpenseStatus },
    { id: "4", date: "Mar 8, 2026", description: "Google Ads Campaign", amount: -1250.00, coaCode: "60000", account: "Checking ···4821", confidence: 92, labels: [] as string[], aiReasoning: "Advertising spend is a general business expense, not eligible for any tax credits", rdStatus: "not-qualified" as RdExpenseStatus },
    { id: "5", date: "Mar 7, 2026", description: "WeWork Office Rent", amount: -3200.00, coaCode: "68100", account: "Checking ···4821", confidence: 97, labels: ["disabled-access"], aiReasoning: "Office rent for ADA-compliant space, accessibility improvements may qualify under IRC §44 Disabled Access Credit", rdStatus: "not-qualified" as RdExpenseStatus },
    { id: "6", date: "Mar 6, 2026", description: "Client Payment - Acme Corp", amount: 8500.00, coaCode: "47900", account: "Checking ···4821", confidence: 96, labels: [] as string[], aiReasoning: "Client payment matched to Invoice #3892, Acme Corp consulting engagement", rdStatus: "not-qualified" as RdExpenseStatus },
    { id: "7", date: "Mar 5, 2026", description: "Delta Airlines - SFO to NYC", amount: -584.00, coaCode: "68300", account: "Credit Card ···7392", confidence: 88, labels: ["rd"], aiReasoning: "Travel to NYC R&D partner site for prototype testing, qualifies as R&D-related travel expense", rdStatus: "qualified" as RdExpenseStatus },
    { id: "8", date: "Mar 4, 2026", description: "Amazon Business - Office Supplies", amount: -234.67, coaCode: "64900", account: "Credit Card ···7392", confidence: 75, labels: [] as string[], aiReasoning: "General office supplies purchase, no qualifying credit indicators found", rdStatus: "not-qualified" as RdExpenseStatus },
    { id: "9", date: "Mar 3, 2026", description: "Zoom Pro Subscription", amount: -149.90, coaCode: "69000", account: "Credit Card ···7392", confidence: 94, labels: ["rd"], aiReasoning: "Zoom used for R&D team standups and technical design reviews, partially qualifies under IRC §41", rdStatus: "partial" as RdExpenseStatus },
    { id: "10", date: "Mar 2, 2026", description: "Client Payment - Beta Inc", amount: 3200.00, coaCode: "44400", account: "Checking ···4821", confidence: 97, labels: [] as string[], aiReasoning: "Client payment matched to Invoice #4102, Beta Inc monthly retainer", rdStatus: "not-qualified" as RdExpenseStatus },
    { id: "26", date: "Mar 1, 2026", description: "Uber - Team Transportation", amount: -187.50, coaCode: "68300", account: "Credit Card ···7392", confidence: 65, labels: [] as string[], aiReasoning: "Ride-sharing expense, unclear if business or personal use, needs manual verification", rdStatus: "pending" as RdExpenseStatus },
    { id: "11", date: "Feb 27, 2026", description: "Stripe Payment - Customer Invoice #4480", amount: 3800.00, coaCode: "44400", account: "Checking ···4821", confidence: 97, labels: [] as string[], aiReasoning: "Stripe recurring invoice payment matched to customer #4480 in AR ledger", rdStatus: "not-qualified" as RdExpenseStatus },
    { id: "12", date: "Feb 20, 2026", description: "AWS Monthly Services", amount: -812.50, coaCode: "69000", account: "Checking ···4821", confidence: 96, labels: ["rd"], aiReasoning: "AWS cloud compute for ML model training, qualifies as R&D supply expense under IRC §41", rdStatus: "qualified" as RdExpenseStatus },
    { id: "13", date: "Feb 15, 2026", description: "Gusto Payroll - February", amount: -12500.00, coaCode: "66000", account: "Checking ···4821", confidence: 99, labels: ["rd", "family-leave", "retirement-startup"], aiReasoning: "Payroll includes 3 engineers (60%+ R&D time) and PFML-eligible employees", rdStatus: "partial" as RdExpenseStatus },
    { id: "14", date: "Feb 10, 2026", description: "WeWork Office Rent", amount: -3200.00, coaCode: "68100", account: "Checking ···4821", confidence: 98, labels: ["disabled-access"], aiReasoning: "Office rent for ADA-compliant space, may qualify under IRC §44", rdStatus: "not-qualified" as RdExpenseStatus },
    { id: "15", date: "Feb 5, 2026", description: "Figma Enterprise", amount: -450.00, coaCode: "69000", account: "Credit Card ···7392", confidence: 91, labels: ["rd"], aiReasoning: "Design tooling used for R&D prototyping, partially qualifies under IRC §41", rdStatus: "partial" as RdExpenseStatus },
    { id: "16", date: "Feb 3, 2026", description: "Client Payment - Gamma LLC", amount: 15000.00, coaCode: "47900", account: "Checking ···4821", confidence: 98, labels: [] as string[], aiReasoning: "Client payment matched to Invoice #4310, Gamma LLC implementation fee", rdStatus: "not-qualified" as RdExpenseStatus },
    { id: "17", date: "Jan 28, 2026", description: "Gusto Payroll - January", amount: -12500.00, coaCode: "66000", account: "Checking ···4821", confidence: 99, labels: ["rd", "family-leave", "retirement-startup"], aiReasoning: "Payroll includes 3 engineers (60%+ R&D time) and PFML-eligible employees", rdStatus: "partial" as RdExpenseStatus },
    { id: "18", date: "Jan 22, 2026", description: "AWS Monthly Services", amount: -790.00, coaCode: "69000", account: "Checking ···4821", confidence: 95, labels: ["rd"], aiReasoning: "AWS cloud compute for ML training, qualifies as R&D supply expense", rdStatus: "qualified" as RdExpenseStatus },
    { id: "19", date: "Jan 15, 2026", description: "WeWork Office Rent", amount: -3200.00, coaCode: "68100", account: "Checking ···4821", confidence: 98, labels: ["disabled-access"], aiReasoning: "Office rent for ADA-compliant space", rdStatus: "not-qualified" as RdExpenseStatus },
    { id: "20", date: "Jan 10, 2026", description: "Client Payment - Delta Partners", amount: 5000.00, coaCode: "47900", account: "Checking ···4821", confidence: 97, labels: [] as string[], aiReasoning: "Monthly retainer payment from Delta Partners", rdStatus: "not-qualified" as RdExpenseStatus },
    { id: "21", date: "Jan 5, 2026", description: "Datadog Monitoring", amount: -320.00, coaCode: "69000", account: "Credit Card ···7392", confidence: 82, labels: ["rd"], aiReasoning: "Infrastructure monitoring, partially qualifies as R&D tooling", rdStatus: "partial" as RdExpenseStatus },
    { id: "22", date: "Dec 28, 2025", description: "Gusto Payroll - December", amount: -12500.00, coaCode: "66000", account: "Checking ···4821", confidence: 99, labels: ["rd", "family-leave"], aiReasoning: "Payroll includes 3 engineers (60%+ R&D time)", rdStatus: "partial" as RdExpenseStatus },
    { id: "23", date: "Dec 20, 2025", description: "Year-end Client Payment - Acme Corp", amount: 18000.00, coaCode: "44400", account: "Checking ···4821", confidence: 96, labels: [] as string[], aiReasoning: "Year-end settlement payment from Acme Corp", rdStatus: "not-qualified" as RdExpenseStatus },
    { id: "24", date: "Dec 15, 2025", description: "Holiday Team Dinner", amount: -1200.00, coaCode: "60000", account: "Credit Card ···7392", confidence: 72, labels: [] as string[], aiReasoning: "Team event expense, not eligible for tax credits", rdStatus: "not-qualified" as RdExpenseStatus },
    { id: "25", date: "Dec 10, 2025", description: "WeWork Office Rent", amount: -3200.00, coaCode: "68100", account: "Checking ···4821", confidence: 98, labels: ["disabled-access"], aiReasoning: "Office rent for ADA-compliant space", rdStatus: "not-qualified" as RdExpenseStatus },
];

const RD_EXPENSE_STATUS_CONFIG: Record<RdExpenseStatus, { label: string; color: string; bg: string }> = {
    "qualified": { label: "Qualified", color: "text-success-primary", bg: "bg-success-secondary" },
    "partial": { label: "Partial", color: "text-warning-primary", bg: "bg-warning-secondary" },
    "not-qualified": { label: "Not qualified", color: "text-error-primary", bg: "bg-error-secondary" },
    "pending": { label: "Pending", color: "text-tertiary", bg: "bg-secondary" },
};

const RD_PERSON_DETAILS: Record<string, { email: string; phone: string; address: string; department: string; startDate: string; ein?: string; aiReasoning: string; projects: string[] }> = {
    e1: { email: "sarah.chen@company.com", phone: "(415) 555-0142", address: "San Francisco, CA", department: "Engineering", startDate: "Mar 2021", aiReasoning: "Primary contributor to core ML pipeline R&D, majority of work qualifies under IRC §41 for developing new algorithms and architectures.", projects: ["ML Pipeline v2", "Model Optimization Framework"] },
    e2: { email: "marcus.j@company.com", phone: "(415) 555-0198", address: "San Francisco, CA", department: "Engineering", startDate: "Jan 2022", aiReasoning: "Focused on novel machine learning research, high R&D qualification due to experimental nature of work.", projects: ["NLP Research", "AutoML Platform", "Model Serving Infrastructure"] },
    e3: { email: "emily.r@company.com", phone: "(510) 555-0256", address: "Oakland, CA", department: "Data Science", startDate: "Jun 2022", aiReasoning: "Partially qualifies, data analysis work supports R&D but includes routine reporting tasks.", projects: ["Customer Segmentation Research"] },
    e4: { email: "david.kim@company.com", phone: "(415) 555-0311", address: "San Francisco, CA", department: "Engineering", startDate: "Sep 2020", aiReasoning: "Backend systems work qualifies where it involves developing new infrastructure for R&D-related features.", projects: ["API Platform v3", "Real-time Processing Engine"] },
    e5: { email: "lisa.w@company.com", phone: "(650) 555-0188", address: "Palo Alto, CA", department: "Product Engineering", startDate: "Feb 2023", aiReasoning: "Lower R&D percentage, primarily product work with some qualifying prototyping and experimentation.", projects: ["Dashboard Redesign"] },
    c1: { email: "contracts@acmelabs.com", phone: "(212) 555-0444", address: "New York, NY", department: "External", startDate: "Apr 2024", ein: "82-1234567", aiReasoning: "Research consulting directly supports qualifying R&D activities, experimental testing and analysis.", projects: ["Material Testing Research"] },
    c2: { email: "info@byteforge.io", phone: "(604) 555-0322", address: "Vancouver, BC", department: "External", startDate: "Jul 2024", ein: "98-7654321", aiReasoning: "Only a portion of contracted development qualifies, much of the work is routine software development.", projects: ["API Integration Module"] },
    c3: { email: "hello@neuralsolutions.ai", phone: "(415) 555-0577", address: "San Francisco, CA", department: "External", startDate: "Jun 2024", ein: "77-9876543", aiReasoning: "AI/ML research is highly qualifying, experimental work developing novel neural network architectures.", projects: ["Computer Vision R&D", "Model Distillation Research"] },
};

const RD_EXPENSE_DETAILS: Record<string, { vendor: string; invoiceNo: string; paymentMethod: string; category: string; receiptDate: string }> = {
    x1: { vendor: "Amazon Web Services", invoiceNo: "INV-2024-8847", paymentMethod: "Corporate Card ****7800", category: "Cloud Infrastructure", receiptDate: "Nov 15, 2024" },
    x2: { vendor: "GitHub Inc.", invoiceNo: "GH-ENT-90124", paymentMethod: "ACH Transfer", category: "Software Licenses", receiptDate: "Oct 22, 2024" },
    x3: { vendor: "Office Depot", invoiceNo: "OD-441289", paymentMethod: "Corporate Card ****7800", category: "Office Supplies", receiptDate: "Oct 8, 2024" },
    x4: { vendor: "Microsoft Azure", invoiceNo: "AZ-DEV-55012", paymentMethod: "Corporate Card ****7800", category: "Cloud Infrastructure", receiptDate: "Sep 30, 2024" },
    x5: { vendor: "AI Summit 2024", invoiceNo: "AIS-REG-2024-0887", paymentMethod: "Corporate Card ****7800", category: "Conferences", receiptDate: "Sep 15, 2024" },
    x6: { vendor: "DigiKey Electronics", invoiceNo: "DK-78234501", paymentMethod: "Purchase Order", category: "Hardware", receiptDate: "Aug 20, 2024" },
    x7: { vendor: "Morrison & Foerster LLP", invoiceNo: "MF-PAT-2024-112", paymentMethod: "ACH Transfer", category: "Legal Fees", receiptDate: "Aug 5, 2024" },
    x8: { vendor: "Scale AI", invoiceNo: "SCALE-2024-4419", paymentMethod: "ACH Transfer", category: "Data Services", receiptDate: "Jul 18, 2024" },
};

const FILING_STEPS = [
    { label: "Company Profile", stepId: "company", done: true },
    { label: "Business Activity", stepId: "activity", done: true },
    { label: "Authorized Signer", stepId: "signer", done: true },
    { label: "Shareholders & Owners", stepId: "owners", done: false },
    { label: "Compliance", stepId: "compliance", done: false },
    { label: "Documents", stepId: "documents", done: false },
    { label: "Accountant Access", stepId: "access", done: false },
    { label: "Review & Submit", stepId: "review", done: false },
];

const COMPLETED_STEP_DATA: Record<string, { label: string; fields: { name: string; value: string }[] }> = {
    company: {
        label: "Company Profile",
        fields: [
            { name: "EIN", value: "82-1234567" },
            { name: "Legal Name", value: "Acme Technologies Inc." },
            { name: "DBA", value: "Acme Tech" },
            { name: "Formation Date", value: "03/15/2019" },
            { name: "State of Formation", value: "Delaware" },
            { name: "Email", value: "finance@acmetech.com" },
            { name: "Phone", value: "(555) 012-3456" },
        ],
    },
    activity: {
        label: "Business Activity",
        fields: [
            { name: "Business Activity Type", value: "Software Development" },
            { name: "NAICS Code", value: "541511" },
            { name: "Fiscal Year End", value: "12/31" },
            { name: "Gross Revenue Range", value: "$1M – $5M" },
        ],
    },
    signer: {
        label: "Authorized Signer",
        fields: [
            { name: "Full Name", value: "Jordan Rivera" },
            { name: "Title / Role", value: "CEO" },
            { name: "SSN (last 4)", value: "***-**-4521" },
            { name: "Signature Date", value: "02/28/2025" },
        ],
    },
};

function CompletedStepSummary({ stepId, stepNumber, editContent }: { stepId: string; stepNumber: number; editContent: React.ReactNode }) {
    const [editing, setEditing] = useState(false);
    const data = COMPLETED_STEP_DATA[stepId];
    if (!data) return null;

    if (editing) {
        return (
            <div className="space-y-4">
                {editContent}
                <div className="flex justify-end">
                    <Button color="secondary" size="sm" onClick={() => setEditing(false)}>
                        Done editing
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="flex size-7 items-center justify-center rounded-full bg-success-secondary">
                    <Check className="size-4 text-fg-success-primary" />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-tertiary">Step {stepNumber}</p>
                    <h3 className="text-lg font-semibold text-primary">{data.label}</h3>
                </div>
                <BadgeWithDot color="success" size="sm" type="pill-color">Complete</BadgeWithDot>
                <Button color="secondary" size="sm" iconLeading={Edit05} onClick={() => setEditing(true)}>
                    Edit
                </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-secondary bg-secondary/50 p-4">
                {data.fields.map((f) => (
                    <div key={f.name}>
                        <p className="text-xs text-tertiary">{f.name}</p>
                        <p className="text-sm font-medium text-primary">{f.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

const PAGE_TITLES: Record<TaxPage, string> = {
    filing: "Tax Filing",
    planning: "Tax Planning",
};

const PAGE_ICONS: Record<TaxPage, React.FC<React.SVGProps<SVGSVGElement>>> = {
    filing: FileCheck02,
    planning: LineChartUp01,
};

// ─── Page content components ─────────────────────────────────────────────────



const CHECKLIST_ITEMS = [
    {
        category: "Personal Information",
        items: [
            { label: "Last year tax return", due: "Apr 2, 2024", description: "Please upload tax return from last year.", done: false, file: null },
            { label: "Last year tax return", due: "Apr 2, 2024", description: null, done: true, file: { name: "DL_Emily Grace. pdf", size: "16 MB" } },
        ],
    },
    {
        category: "Dependent Information",
        items: [
            { label: "Children tax documents", due: "Apr 2, 2024", description: "Please upload any children tax documents.", done: false, file: null },
            { label: "Seniors tax documents", due: "Apr 2, 2024", description: "Please upload any children tax documents.", done: false, file: null },
        ],
    },
    {
        category: "Income Information",
        items: [],
    },
    {
        category: "Deductions Information",
        items: [],
    },
    {
        category: "Other Information",
        items: [],
    },
    {
        category: "IRS and States",
        items: [],
    },
];

const FILING_DOCUMENTS = [
    { name: "Tax return_Emily Grace_2023", uploaded: "March 23, 2024", status: "verified" as const, category: "Personal Information" },
    { name: "DL_Emily Grace_2023", uploaded: "March 23, 2024", status: "error" as const, category: "Personal Information" },
    { name: "DL_John Grace_2023", uploaded: "March 23, 2024", status: "verified" as const, category: "Personal Information" },
    { name: "xx_Emma Grace_2023", uploaded: "March 23, 2024", status: "verified" as const, category: "Dependent Information" },
    { name: "xx_Jimmy Grace_2023", uploaded: "March 23, 2024", status: "verified" as const, category: "Dependent Information" },
];

const DOC_CATEGORIES = ["Personal Information", "Dependent Information", "Income Information", "Deductions Information", "Other Information", "IRS and States"];

function TaxFilingPage({ onOpenWizard }: { onOpenWizard: () => void }) {
    const { session } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
    const completedStepIds = new Set(FILING_STEPS.filter((s) => s.done).map((s) => s.stepId));
    const firstIncompleteIndex = FILING_STEPS.findIndex((s) => !s.done);
    const [activeStepIndex, setActiveStepIndex] = useState<number>(
        firstIncompleteIndex >= 0 ? firstIncompleteIndex : FILING_STEPS.length - 1,
    );
    const completedCount = FILING_STEPS.filter((s) => s.done).length;
    const progressPct = Math.round((completedCount / FILING_STEPS.length) * 100);

    const checklistTotal = CHECKLIST_ITEMS.reduce((a, c) => a + c.items.length, 0);
    const checklistDone = CHECKLIST_ITEMS.reduce((a, c) => a + c.items.filter((i) => i.done).length, 0);

    function handleUploadClick(category: string) {
        setUploadingCategory(category);
        fileInputRef.current?.click();
    }

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !session || !uploadingCategory) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", uploadingCategory);

        await fetch("/api/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: formData,
        });

        setUploadingCategory(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    return (
        <div>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            />
            {/* Sub-tabs outside the white card */}
            <Tabs>
                <Tabs.List
                    size="sm"
                    type="underline"
                    items={[
                        { id: "overview", label: "Overview" },
                        { id: "checklist", label: "Checklist", badge: `${checklistDone}/${checklistTotal}` },
                        { id: "documents", label: "Documents", badge: String(FILING_DOCUMENTS.length) },
                    ]}
                >
                    {(item) => {
                        const icons: Record<string, typeof BarChartSquare02> = {
                            overview: BarChartSquare02,
                            checklist: CheckSquare,
                            documents: File06,
                        };
                        const Icon = icons[item.id as string];
                        return (
                            <Tabs.Item key={item.id} id={item.id} badge={item.badge}>
                                <Icon className="size-4" />
                                {item.label}
                            </Tabs.Item>
                        );
                    }}
                </Tabs.List>

                {/* Overview tab */}
                <Tabs.Panel id="overview" className="pt-5">
                    <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                        {/* 2024 Tax Filing title row, light blue banner */}
                        <div className="flex items-center justify-between border-b border-brand/20 bg-brand-primary_alt px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-primary">2024 Tax Filing</h3>
                                    <p className="text-xs text-tertiary">S-Corporation (Form 1120-S)</p>
                                </div>
                                <BadgeWithDot color="success" size="sm" type="pill-color">On Track</BadgeWithDot>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-xs text-tertiary">
                                    <Clock className="size-3.5" />
                                    Updated 2 hrs ago
                                </div>
                                <div className="flex items-center gap-1.5 rounded-md bg-warning-secondary px-2 py-1 text-xs font-semibold text-warning-primary">
                                    <Calendar className="size-3.5" />
                                    Due Mar 15, 2025
                                </div>
                            </div>
                        </div>

                        {/* Horizontal step progress bar with % overlay */}
                        <div className="border-b border-secondary px-6 py-4">
                            {/* Bar segments */}
                            <div className="relative flex">
                                {FILING_STEPS.map((step, i) => {
                                    const isActive = activeStepIndex === i;
                                    return (
                                        <button
                                            key={step.stepId}
                                            type="button"
                                            onClick={() => setActiveStepIndex(i)}
                                            className="group flex min-w-0 flex-1 flex-col items-center gap-2"
                                        >
                                            {/* Segment bar */}
                                            <div className="flex w-full px-0.5">
                                                <div className={cx(
                                                    "h-2.5 w-full rounded-full transition-all duration-200",
                                                    step.done
                                                        ? "bg-success-solid"
                                                        : i === firstIncompleteIndex
                                                            ? "bg-success-solid/30"
                                                            : "bg-secondary",
                                                )} />
                                            </div>
                                            {/* Step number + label + check */}
                                            <span className={cx(
                                                "flex items-center gap-1 text-[11px] leading-tight transition duration-100 ease-linear",
                                                isActive && step.done
                                                    ? "font-semibold text-success-primary"
                                                    : isActive
                                                        ? "font-semibold text-success-primary"
                                                        : i === firstIncompleteIndex
                                                            ? "font-medium text-success-primary"
                                                            : step.done
                                                                ? "font-medium text-quaternary group-hover:text-tertiary"
                                                                : "text-quaternary group-hover:text-tertiary",
                                            )}>
                                                {step.done && <Check className="size-3 shrink-0" />}
                                                <span className="line-clamp-1">{i + 1}. {step.label}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                                {/* Percentage overlay centered on the bar */}
                                <div className="pointer-events-none absolute inset-x-0 top-0 flex h-2.5 items-center justify-center">
                                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold tabular-nums text-success-primary shadow-sm ring-1 ring-secondary">
                                        {progressPct}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Inline step content */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeStepIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <div className="p-6">
                                    {FILING_STEPS[activeStepIndex].done ? (
                                        <CompletedStepSummary
                                            stepId={FILING_STEPS[activeStepIndex].stepId}
                                            stepNumber={activeStepIndex + 1}
                                            editContent={
                                                <>
                                                    {FILING_STEPS[activeStepIndex].stepId === "company" && <CompanyProfileStep />}
                                                    {FILING_STEPS[activeStepIndex].stepId === "activity" && <ActivityStep />}
                                                    {FILING_STEPS[activeStepIndex].stepId === "signer" && <SignerStep />}
                                                </>
                                            }
                                        />
                                    ) : (
                                        <>
                                            {FILING_STEPS[activeStepIndex].stepId === "owners" && <OwnersStep />}
                                            {FILING_STEPS[activeStepIndex].stepId === "compliance" && <ComplianceStep />}
                                            {FILING_STEPS[activeStepIndex].stepId === "documents" && <DocumentsStep />}
                                            {FILING_STEPS[activeStepIndex].stepId === "access" && <AccessStep />}
                                            {FILING_STEPS[activeStepIndex].stepId === "review" && <ReviewStep completedSteps={completedStepIds} />}
                                        </>
                                    )}

                                    {/* Back / Next navigation */}
                                    <div className="mt-6 flex items-center justify-between border-t border-secondary pt-4">
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            iconLeading={ArrowLeft}
                                            isDisabled={activeStepIndex === 0}
                                            onClick={() => setActiveStepIndex(activeStepIndex - 1)}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            color="primary"
                                            size="sm"
                                            iconTrailing={activeStepIndex === FILING_STEPS.length - 1 ? CheckCircle : ArrowRight}
                                            onClick={() => {
                                                if (activeStepIndex < FILING_STEPS.length - 1) {
                                                    setActiveStepIndex(activeStepIndex + 1);
                                                }
                                            }}
                                        >
                                            {activeStepIndex === FILING_STEPS.length - 1 ? "Submit Filing" : "Next"}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </Tabs.Panel>

                {/* Checklist tab */}
                <Tabs.Panel id="checklist" className="pt-5">
                    <div className="flex gap-6">
                        {/* Left 2/3, white card */}
                        <div className="w-2/3 rounded-xl border border-secondary bg-primary p-6">
                            {/* Header */}
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-primary">Tax Preparation Checklist</h2>
                                <Button color="secondary" size="sm" onClick={() => handleUploadClick("Bulk")}>Bulk Upload</Button>
                            </div>

                            {/* Category sections */}
                            <div className="space-y-8">
                                {CHECKLIST_ITEMS.map((group) => (
                                    <div key={group.category}>
                                        {/* Category label with dashed line */}
                                        <div className="mb-4 flex items-center gap-3">
                                            <p className="shrink-0 text-xs font-medium text-tertiary">{group.category}</p>
                                            <div className="h-px flex-1 border-t border-dashed border-secondary" />
                                        </div>

                                        {group.items.length > 0 ? (
                                            <div className="space-y-4">
                                                {group.items.map((item, i) => (
                                                    <div
                                                        key={`${group.category}-${i}`}
                                                        className={cx(
                                                            "rounded-xl p-5",
                                                            item.done
                                                                ? "bg-brand-primary_alt"
                                                                : "border border-brand",
                                                        )}
                                                    >
                                                        {/* Top row: title + due + upload + dots */}
                                                        <div className="flex items-center gap-3">
                                                            {item.done && (
                                                                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success-solid">
                                                                    <Check className="size-3.5 text-white" />
                                                                </div>
                                                            )}
                                                            <p className={cx(
                                                                "text-sm font-bold",
                                                                item.done ? "text-brand-secondary line-through" : "text-primary",
                                                            )}>
                                                                {item.label}
                                                            </p>
                                                            <span className="rounded-md border border-secondary px-2 py-0.5 text-xs text-tertiary">
                                                                Due: {item.due}
                                                            </span>
                                                            <div className="ml-auto flex items-center gap-2">
                                                                <Button color="secondary" size="sm" onClick={() => handleUploadClick(group.category)}>Upload</Button>
                                                                <button type="button" className="text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary">
                                                                    <DotsVertical className="size-5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Description with warning icon */}
                                                        {item.description && (
                                                            <div className="mt-3 flex items-center gap-2">
                                                                <AlertCircle className="size-4 shrink-0 text-fg-warning-primary" />
                                                                <p className="text-sm text-tertiary">{item.description}</p>
                                                            </div>
                                                        )}

                                                        {/* File attachment, inside the card */}
                                                        {item.file && (
                                                            <div className="mt-3 flex items-center gap-3 rounded-lg border border-secondary bg-primary px-4 py-3">
                                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                                                    <File06 className="size-5 text-fg-quaternary" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-medium text-primary">{item.file.name}</p>
                                                                    <p className="text-xs text-tertiary">{item.file.size}</p>
                                                                </div>
                                                                <button type="button" className="text-fg-error-secondary transition duration-100 ease-linear hover:text-fg-error-primary">
                                                                    <Trash01 className="size-5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <p className="shrink-0 text-sm text-quaternary">{group.category}</p>
                                                <div className="h-px flex-1 border-t border-dashed border-secondary" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right 1/3, Key details */}
                        <div className="w-1/3 self-start space-y-4">
                            <div className="rounded-xl border border-secondary bg-primary p-5">
                                <div className="flex items-center gap-2">
                                    <Calendar className="size-4 text-fg-quaternary" />
                                    <p className="text-xs text-tertiary">Due Date</p>
                                </div>
                                <p className="mt-1 text-sm font-semibold text-primary">Mar 15, 2025</p>
                            </div>
                            <div className="rounded-xl border border-secondary bg-primary p-5">
                                <div className="flex items-center gap-2">
                                    <File06 className="size-4 text-fg-quaternary" />
                                    <p className="text-xs text-tertiary">Form Type</p>
                                </div>
                                <p className="mt-1 text-sm font-semibold text-primary">1120-S</p>
                            </div>
                            <div className="rounded-xl border border-secondary bg-primary p-5">
                                <div className="flex items-center gap-2">
                                    <Clock className="size-4 text-fg-quaternary" />
                                    <p className="text-xs text-tertiary">Last Updated</p>
                                </div>
                                <p className="mt-1 text-sm font-semibold text-primary">2 hours ago</p>
                            </div>
                        </div>
                    </div>
                </Tabs.Panel>

                {/* Documents tab */}
                <Tabs.Panel id="documents" className="pt-5">
                    <div className="flex gap-6">
                        {/* Left 2/3, white card */}
                        <div className="w-2/3 rounded-xl border border-secondary bg-primary p-6">
                            {/* Header */}
                            <div className="mb-5 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-primary">Tax Documents</h2>
                                <div className="flex items-center gap-2">
                                    <Button color="secondary" size="sm">Download All</Button>
                                    <Button color="primary" size="sm" iconLeading={Upload01} onClick={() => handleUploadClick("Documents")}>Bulk Upload</Button>
                                </div>
                            </div>

                            {/* Documents grouped by category */}
                            <div className="space-y-6">
                                {DOC_CATEGORIES.map((category) => {
                                    const docs = FILING_DOCUMENTS.filter((d) => d.category === category);
                                    return (
                                        <div key={category}>
                                            <p className="mb-3 text-xs font-medium text-tertiary">{category}</p>
                                            {docs.length > 0 ? (
                                                <div className="space-y-2">
                                                    {docs.map((doc, i) => (
                                                        <div key={`${doc.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-secondary px-4 py-3">
                                                            <div className={cx(
                                                                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                                                                doc.status === "verified" ? "bg-brand-primary_alt" : "bg-error-secondary",
                                                            )}>
                                                                <File06 className={cx(
                                                                    "size-4",
                                                                    doc.status === "verified" ? "text-fg-brand-primary" : "text-fg-error-primary",
                                                                )} />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-primary">{doc.name}</p>
                                                                <p className="text-xs text-tertiary">Uploaded on {doc.uploaded}</p>
                                                            </div>
                                                            {doc.status === "verified" ? (
                                                                <Badge color="success" size="sm" type="pill-color">Verified</Badge>
                                                            ) : (
                                                                <Badge color="error" size="sm" type="pill-color">Incorrect File Uploaded</Badge>
                                                            )}
                                                            <button type="button" className="shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary">
                                                                <DotsVertical className="size-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-quaternary">{category}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right 1/3, Key details */}
                        <div className="w-1/3 self-start space-y-4">
                            <div className="rounded-xl border border-secondary bg-primary p-5">
                                <div className="flex items-center gap-2">
                                    <Calendar className="size-4 text-fg-quaternary" />
                                    <p className="text-xs text-tertiary">Due Date</p>
                                </div>
                                <p className="mt-1 text-sm font-semibold text-primary">Mar 15, 2025</p>
                            </div>
                            <div className="rounded-xl border border-secondary bg-primary p-5">
                                <div className="flex items-center gap-2">
                                    <File06 className="size-4 text-fg-quaternary" />
                                    <p className="text-xs text-tertiary">Form Type</p>
                                </div>
                                <p className="mt-1 text-sm font-semibold text-primary">1120-S</p>
                            </div>
                            <div className="rounded-xl border border-secondary bg-primary p-5">
                                <div className="flex items-center gap-2">
                                    <Clock className="size-4 text-fg-quaternary" />
                                    <p className="text-xs text-tertiary">Last Updated</p>
                                </div>
                                <p className="mt-1 text-sm font-semibold text-primary">2 hours ago</p>
                            </div>
                        </div>
                    </div>
                </Tabs.Panel>
            </Tabs>
        </div>
    );
}

type StrategyStatus = "not-started" | "in-progress" | "done";

const SAVING_STRATEGIES = [
    { id: "s4", name: "Write off bad debt", description: "Recover value from invoices your customers haven't paid", impact: "$3,100", deadline: "Before Dec 31", category: "Cash & Expense Timing" as const, status: "in-progress" as StrategyStatus, cta: "Upload proof", ctaIcon: "upload" as const },
    { id: "s5", name: "Purchase equipment (Section 179)", description: "Buy qualifying equipment before year-end and deduct the full cost this year", impact: "$45,000", deadline: "Before Dec 31", category: "Investments & Assets" as const, status: "not-started" as StrategyStatus, cta: "Explore options", ctaIcon: "stars" as const },
    { id: "s7", name: "Capitalize vs expense optimization", description: "Your CPA can reclassify some assets to increase this year's deductions", impact: "$6,400", deadline: "Before Dec 31", category: "Investments & Assets" as const, status: "not-started" as StrategyStatus, cta: "Learn more", ctaIcon: "arrow" as const },
    { id: "s10", name: "Adjust payroll structure", description: "Restructure how you pay yourself and your team to lower your tax bill", impact: "$5,600", deadline: "Before Dec 31", category: "Entity & Compensation" as const, status: "not-started" as StrategyStatus, cta: "Review proposal", ctaIcon: "stars" as const },
    { id: "s8", name: "Optimize owner compensation", description: "Adjusted your salary and distributions to minimize self-employment tax", impact: "$9,200", deadline: "Before Dec 31", category: "Entity & Compensation" as const, status: "done" as StrategyStatus, cta: "View savings", ctaIcon: "check" as const },
    { id: "s9", name: "Evaluate S-Corp election", description: "Elected S-Corp status to reduce taxes on your business income", impact: "$14,300", deadline: "Mar 15, 2025", category: "Entity & Compensation" as const, status: "done" as StrategyStatus, cta: "View filing", ctaIcon: "check" as const },
    { id: "s1", name: "Pay bonuses before year-end", description: "Paid employee bonuses before Dec 31 to reduce this year's taxable income", impact: "$12,500", deadline: "Before Dec 31", category: "Cash & Expense Timing" as const, status: "done" as StrategyStatus, cta: "View receipt", ctaIcon: "check" as const },
    { id: "s2", name: "Accelerate business expenses", description: "Prepaid deductible expenses to shift deductions into this tax year", impact: "$8,200", deadline: "Before Dec 31", category: "Cash & Expense Timing" as const, status: "done" as StrategyStatus, cta: "View receipt", ctaIcon: "check" as const },
    { id: "s3", name: "Prepay vendors or software", description: "Paid upcoming vendor invoices and annual software licenses early", impact: "$4,800", deadline: "Before Dec 31", category: "Cash & Expense Timing" as const, status: "done" as StrategyStatus, cta: "View receipt", ctaIcon: "check" as const },
];

const STRATEGY_CATEGORY_ORDER = ["Cash & Expense Timing", "Investments & Assets", "Entity & Compensation"] as const;

const STRATEGY_CATEGORIES = {
    "Cash & Expense Timing": { color: "success" as const, border: "border-l-emerald-500", dot: "bg-emerald-500", tagBg: "bg-emerald-50", tagText: "text-emerald-700", tagRing: "ring-emerald-200" },
    "Investments & Assets": { color: "purple" as const, border: "border-l-purple-500", dot: "bg-purple-500", tagBg: "bg-purple-50", tagText: "text-purple-700", tagRing: "ring-purple-200" },
    "Entity & Compensation": { color: "brand" as const, border: "border-l-blue-500", dot: "bg-blue-500", tagBg: "bg-blue-50", tagText: "text-blue-700", tagRing: "ring-blue-200" },
};

const STATUS_CONFIG = {
    "not-started": { label: "Not started", color: "text-quaternary", bg: "bg-quaternary", dot: "bg-fg-quaternary" },
    "in-progress": { label: "In progress", color: "text-warning-primary", bg: "bg-warning-secondary", dot: "bg-fg-warning-primary" },
    "done": { label: "Done", color: "text-success-primary", bg: "bg-success-secondary", dot: "bg-fg-success-primary" },
};


const PAST_PLANS = [
    { year: "2023", name: "2023 Business Tax Savings Plan", strategies: 6, completed: 6, saving: "$89,400" },
    { year: "2022", name: "2022 Business Tax Savings Plan", strategies: 4, completed: 4, saving: "$52,300" },
    { year: "2021", name: "2021 Business Tax Savings Plan", strategies: 3, completed: 3, saving: "$31,750" },
];

// ─── Strategy Detail Data ────────────────────────────────────────────────────

const STRATEGY_DETAILS: Record<string, {
    aiTip: string;
    deadline: string;
    checklist?: { label: string; done: boolean }[];
    documents?: { name: string; status: "uploaded" | "pending" }[];
    expenses?: { category: string; items: { name: string; amount: string }[] }[];
    recommendations?: { category: string; examples: string[] }[];
    comparison?: { label: string; before: string; after: string }[];
    steps?: { label: string; description: string; done: boolean }[];
    payments?: { recipient: string; date: string; amount: string }[];
    summary?: { label: string; value: string }[];
}> = {
    s4: {
        aiTip: "Bad debt deductions require documentation of collection efforts. Ensure you have invoices, correspondence, and proof of attempts to collect before writing off.",
        deadline: "Dec 31, 2024",
        checklist: [
            { label: "Identify all uncollectible accounts receivable", done: true },
            { label: "Gather original invoices for each account", done: true },
            { label: "Document collection attempts (emails, calls, letters)", done: false },
            { label: "Verify accounts meet IRS worthlessness criteria", done: false },
            { label: "Get CPA review and sign-off", done: false },
        ],
        documents: [
            { name: "Invoice_#1042_Meridian_Corp.pdf", status: "uploaded" },
            { name: "Invoice_#1089_Apex_Solutions.pdf", status: "uploaded" },
            { name: "Collection_correspondence_Meridian.pdf", status: "pending" },
            { name: "Collection_correspondence_Apex.pdf", status: "pending" },
        ],
    },
    s6: {
        aiTip: "Your R&D spending qualifies for both federal and state credits. Link this strategy with your Capture Incentives R&D credit for maximum benefit.",
        deadline: "Ongoing",
        expenses: [
            { category: "Employee Time", items: [
                { name: "Sarah Chen, Sr. Engineer (40 hrs)", amount: "$4,800" },
                { name: "Mike Torres, Dev Lead (32 hrs)", amount: "$3,840" },
                { name: "Alex Rivera, QA Engineer (20 hrs)", amount: "$1,900" },
            ]},
            { category: "Supplies & Cloud", items: [
                { name: "AWS R&D Infrastructure", amount: "$2,100" },
                { name: "Testing hardware & equipment", amount: "$850" },
            ]},
            { category: "Contractors", items: [
                { name: "DevShop LLC, Prototype development", amount: "$3,200" },
                { name: "Jane Kim, Research consulting", amount: "$2,060" },
            ]},
        ],
    },
    s5: {
        aiTip: "Section 179 allows you to deduct the full purchase price of qualifying equipment in the year of purchase instead of depreciating over time. The 2024 limit is $1,220,000.",
        deadline: "Dec 31, 2024",
        recommendations: [
            { category: "Computer Equipment", examples: ["Servers & workstations", "Laptops & monitors", "Networking equipment"] },
            { category: "Office Furniture", examples: ["Desks & ergonomic chairs", "Conference room furniture", "Standing desk converters"] },
            { category: "Software", examples: ["Off-the-shelf business software", "Enterprise licenses", "Development tools"] },
            { category: "Vehicles", examples: ["Business-use vehicles (over 6,000 lbs GVW)", "Delivery vans", "Company trucks"] },
            { category: "Machinery", examples: ["Manufacturing equipment", "3D printers", "Specialized tools"] },
        ],
    },
    s7: {
        aiTip: "Switching some capitalized assets to immediate expensing could save you $6,400 this year. Focus on items under the de minimis safe harbor threshold ($2,500 per item).",
        deadline: "Dec 31, 2024",
        comparison: [
            { label: "Office renovation costs", before: "Capitalized (39 yr)", after: "Expensed (Year 1)" },
            { label: "Computer equipment < $2,500", before: "Capitalized (5 yr)", after: "De minimis expense" },
            { label: "Software licenses", before: "Capitalized (3 yr)", after: "Expensed (Year 1)" },
            { label: "Website development", before: "Capitalized (3 yr)", after: "Expensed (Year 1)" },
        ],
    },
    s10: {
        aiTip: "Restructuring payroll between salary, bonuses, and benefits can optimize both employer and employee tax obligations. Consider health insurance premiums and retirement contributions.",
        deadline: "Dec 31, 2024",
        steps: [
            { label: "Review current payroll structure", description: "Analyze current salary, bonus, and benefits allocation for all employees", done: false },
            { label: "Model alternative structures", description: "Run scenarios comparing different salary/bonus/benefit splits", done: false },
            { label: "Evaluate retirement contribution limits", description: "Maximize 401(k) employer match and profit-sharing contributions", done: false },
            { label: "Review health insurance optimization", description: "Consider HSA/HRA options and premium allocations", done: false },
            { label: "Implement changes with payroll provider", description: "Update payroll settings and employee elections before year-end", done: false },
            { label: "Consult CPA for final review", description: "Have your CPA verify the restructured payroll meets compliance requirements", done: false },
        ],
        comparison: [
            { label: "Base salary allocation", before: "$180,000", after: "$150,000" },
            { label: "Performance bonuses", before: "$20,000", after: "$30,000" },
            { label: "Retirement contributions", before: "$6,000", after: "$22,500" },
            { label: "Health insurance (pre-tax)", before: "$8,400", after: "$14,400" },
        ],
    },
    s8: {
        aiTip: "Your optimized compensation split saved $9,200 in self-employment taxes. Review this annually as income levels change.",
        deadline: "Completed",
        summary: [
            { label: "Previous salary", value: "$120,000" },
            { label: "Previous distributions", value: "$80,000" },
            { label: "Optimized salary", value: "$95,000" },
            { label: "Optimized distributions", value: "$105,000" },
            { label: "SE tax savings", value: "$9,200" },
            { label: "Effective date", value: "Jan 1, 2024" },
        ],
    },
    s9: {
        aiTip: "Your S-Corp election is saving you significantly on self-employment taxes. Ensure your officer compensation remains 'reasonable' per IRS guidelines.",
        deadline: "Completed",
        summary: [
            { label: "Election type", value: "S-Corporation (Form 2553)" },
            { label: "Filing date", value: "Feb 15, 2024" },
            { label: "Effective date", value: "Jan 1, 2024" },
            { label: "IRS confirmation", value: "Accepted, CP261 received" },
            { label: "State confirmation", value: "Delaware, Approved" },
            { label: "Annual tax savings", value: "$14,300" },
        ],
    },
    s1: {
        aiTip: "Year-end bonuses are fully deductible when paid before December 31st. Ensure W-2s reflect these payments accurately.",
        deadline: "Completed",
        payments: [
            { recipient: "Sarah Chen, Sr. Engineer", date: "Dec 15, 2024", amount: "$4,500" },
            { recipient: "Mike Torres, Dev Lead", date: "Dec 15, 2024", amount: "$4,000" },
            { recipient: "Alex Rivera, QA Engineer", date: "Dec 20, 2024", amount: "$2,500" },
            { recipient: "Lisa Park, Designer", date: "Dec 20, 2024", amount: "$1,500" },
        ],
    },
    s2: {
        aiTip: "Accelerating expenses into the current year is most effective when you expect lower revenue next year. Review timing strategy annually.",
        deadline: "Completed",
        payments: [
            { recipient: "Q1 2025 Office lease prepayment", date: "Dec 10, 2024", amount: "$3,600" },
            { recipient: "Annual insurance premium", date: "Dec 12, 2024", amount: "$2,400" },
            { recipient: "Professional development courses", date: "Dec 18, 2024", amount: "$1,200" },
            { recipient: "Marketing campaign deposit", date: "Dec 22, 2024", amount: "$1,000" },
        ],
    },
    s3: {
        aiTip: "Prepaying annual software subscriptions and vendor invoices before year-end shifts deductions into the current tax year.",
        deadline: "Completed",
        payments: [
            { recipient: "AWS, Annual reserved instances", date: "Dec 8, 2024", amount: "$1,800" },
            { recipient: "Figma, Team annual license", date: "Dec 10, 2024", amount: "$900" },
            { recipient: "Slack, Business+ annual", date: "Dec 12, 2024", amount: "$720" },
            { recipient: "GitHub, Enterprise annual", date: "Dec 15, 2024", amount: "$600" },
            { recipient: "Notion, Team annual", date: "Dec 18, 2024", amount: "$480" },
            { recipient: "Vercel, Pro annual", date: "Dec 20, 2024", amount: "$300" },
        ],
    },
};

const RD_EXPENSES = [
    { category: "Employees", items: [
        { id: "emp-1", name: "Sarah Chen, Sr. Engineer", amount: "$850" },
        { id: "emp-2", name: "Mike Torres, Dev Lead", amount: "$600" },
    ]},
    { category: "Contractors", items: [
        { id: "con-1", name: "DevShop LLC", amount: "$200" },
        { id: "con-2", name: "Jane Kim, Consultant", amount: "$100" },
    ]},
    { category: "Supplies & Cloud", items: [
        { id: "sup-1", name: "AWS Infrastructure", amount: "$150" },
        { id: "sup-2", name: "Hardware & Equipment", amount: "$50" },
    ]},
];

const TOTAL_EXPENSE_ITEMS = RD_EXPENSES.reduce((sum, g) => sum + g.items.length, 0);

function TaxPlanningPage({ intent, clearIntent }: { intent?: TaxPlanningIntent; clearIntent?: () => void } = {}) {
    const [selectedCredit, setSelectedCredit] = useState<string | null>(intent?.credit ?? null);
    const [activeTab, setActiveTab] = useState<"expenses" | "credits">(intent?.tab ?? "expenses");
    useEffect(() => {
        if (intent && clearIntent) clearIntent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
    const [confirmedExpenses, setConfirmedExpenses] = useState<Set<string>>(new Set());
    const [showLiabilityModal, setShowLiabilityModal] = useState(false);
    const [signature, setSignature] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [strategyCategoryFilter, setStrategyCategoryFilter] = useState<string>("all");
    const [creditCategoryFilter, setCreditCategoryFilter] = useState<string>("all");
    const [creditSortBy, setCreditSortBy] = useState<"status" | "amount" | "category">("status");
    const [rdClaimTab, setRdClaimTab] = useState<"employees" | "contractors" | "expenses">("employees");
    const [rdEmployees, setRdEmployees] = useState(RD_EMPLOYEES.map((e) => ({ ...e })));
    const [rdContractors, setRdContractors] = useState(RD_CONTRACTORS.map((c) => ({ ...c })));
    const [rdExpenses, setRdExpenses] = useState(RD_EXPENSE_ITEMS.map((e) => ({ ...e })));
    const [rdLabelFilter, setRdLabelFilter] = useState("all");
    const [rdStatusFilter, setRdStatusFilter] = useState("all");
    const [rdSearchQuery, setRdSearchQuery] = useState("");
    const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
    const [editingRdPercent, setEditingRdPercent] = useState<string | null>(null);
    const [editingRdValue, setEditingRdValue] = useState("");
    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
    const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
    const [editingPerson, setEditingPerson] = useState<Record<string, string> | null>(null);
    const [openLabelDropdown, setOpenLabelDropdown] = useState<string | null>(null);

    function toggleRdLabel(expenseId: string, labelId: string) {
        setRdExpenses((prev) =>
            prev.map((e) =>
                e.id === expenseId
                    ? { ...e, labels: e.labels.includes(labelId) ? e.labels.filter((l) => l !== labelId) : [...e.labels, labelId] }
                    : e,
            ),
        );
    }

    const [strategyPage, setStrategyPage] = useState(0);
    const [strategySortBy, setStrategySortBy] = useState<"status" | "impact" | "category">("status");
    const STRATEGIES_PER_PAGE = 8;

    function toggleExpense(id: string) {
        setConfirmedExpenses((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    const hasConfirmed = confirmedExpenses.size > 0;
    const canSubmit = signature.trim().length > 0 && agreed;
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    return (
        <div>
            {/* Sub-tabs, Expenses & R&D Credits */}
            <Tabs selectedKey={activeTab} onSelectionChange={(k) => setActiveTab(k as "expenses" | "credits")}>
                <Tabs.List
                    size="sm"
                    type="underline"
                    items={[
                        { id: "expenses", label: "Create Savings" },
                        { id: "credits", label: "Capture Incentives" },
                    ]}
                >
                    {(item) => (
                        <Tabs.Item key={item.id} id={item.id}>
                            {item.label}
                        </Tabs.Item>
                    )}
                </Tabs.List>

                {/* Create Savings tab */}
                <Tabs.Panel id="expenses" className="pt-5">
                    {selectedStrategy !== null ? (() => {
                        const strategy = SAVING_STRATEGIES.find((s) => s.id === selectedStrategy)!;
                        const detail = STRATEGY_DETAILS[selectedStrategy];
                        const statusCfg = STATUS_CONFIG[strategy.status];
                        const isDone = strategy.status === "done";
                        return (<>
                            <button type="button" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline" onClick={() => setSelectedStrategy(null)}><ArrowLeft className="size-4" />Back to Strategies</button>
                            <div className="flex gap-4">
                                <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-secondary bg-primary">
                                    <div className="flex items-center justify-between border-b border-brand/20 bg-brand-primary_alt px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div><h3 className="text-sm font-semibold text-primary">{strategy.name}</h3><p className="text-xs text-tertiary">Acme Technologies Inc. &middot; 2024</p></div>
                                            <BadgeWithDot color={isDone ? "success" : strategy.status === "in-progress" ? "warning" : "gray"} size="sm" type="pill-color">{statusCfg.label}</BadgeWithDot>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-tertiary"><Clock className="size-3.5" />Updated 2 hrs ago</div>
                                    </div>
                                    <div className="divide-y divide-secondary">
                                        <div className="flex items-center justify-between px-6 py-5">
                                            <div>
                                                <p className="text-xs text-tertiary">{isDone ? "Tax Savings Achieved" : "Potential Tax Savings"}</p>
                                                <p className={cx("mt-1 text-3xl font-semibold tracking-tight", isDone ? "text-success-primary" : "text-primary")}>{strategy.impact}</p>
                                                <p className="mt-1 text-xs text-tertiary">{strategy.description}</p>
                                            </div>
                                            {!isDone && <Button color="primary" size="sm" iconTrailing={ChevronRight}>{strategy.cta}</Button>}
                                        </div>
                                        {/* s4: Bad debt */}
                                        {selectedStrategy === "s4" && (<>
                                            <div className="px-6 py-5">
                                                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Document Checklist</h3>
                                                <div className="space-y-2">{detail.checklist!.map((item, i) => (<div key={i} className="flex items-center gap-3 rounded-lg border border-secondary px-4 py-3"><div className={cx("flex size-6 shrink-0 items-center justify-center rounded-full", item.done ? "bg-success-solid" : "border-2 border-secondary")}>{item.done && <Check className="size-3.5 text-white" />}</div><p className={cx("text-sm", item.done ? "text-tertiary line-through" : "text-primary")}>{item.label}</p></div>))}</div>
                                            </div>
                                            <div className="px-6 py-5">
                                                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Supporting Documents</h3>
                                                <div className="space-y-2">{detail.documents!.map((doc, i) => (<div key={i} className="flex items-center gap-3 rounded-lg border border-secondary px-4 py-3"><div className={cx("flex size-9 shrink-0 items-center justify-center rounded-lg", doc.status === "uploaded" ? "bg-brand-primary_alt" : "bg-secondary")}><File06 className={cx("size-4", doc.status === "uploaded" ? "text-fg-brand-primary" : "text-fg-quaternary")} /></div><p className="min-w-0 flex-1 truncate text-sm font-medium text-primary">{doc.name}</p>{doc.status === "uploaded" ? <Badge color="success" size="sm" type="pill-color">Uploaded</Badge> : <Badge color="gray" size="sm" type="pill-color">Pending</Badge>}</div>))}</div>
                                                <div className="mt-4 flex items-center justify-center rounded-lg border-2 border-dashed border-secondary py-6"><Button color="secondary" size="sm" iconLeading={Upload01}>Upload documents</Button></div>
                                            </div>
                                        </>)}
                                        {/* s6: R&D expenses */}
                                        {selectedStrategy === "s6" && (
                                            <div className="px-6 py-5">
                                                <div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Tracked R&D Expenses</h3><Button color="secondary" size="sm" iconLeading={Plus}>Add expense</Button></div>
                                                <div className="divide-y divide-secondary rounded-lg border border-secondary">
                                                    {detail.expenses!.map((group) => (<div key={group.category} className="px-4 py-3"><p className="mb-2 text-xs font-medium text-tertiary">{group.category}</p><div className="space-y-2">{group.items.map((item, i) => (<div key={i} className="flex items-center justify-between"><span className="text-sm text-primary">{item.name}</span><span className="text-sm font-medium tabular-nums text-primary">{item.amount}</span></div>))}</div></div>))}
                                                    <div className="flex items-center justify-between bg-secondary px-4 py-3"><p className="text-sm font-semibold text-primary">Total tracked</p><p className="text-sm font-semibold tabular-nums text-primary">$18,750</p></div>
                                                </div>
                                                <button type="button" className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline" onClick={() => { setSelectedStrategy(null); setSelectedCredit("rd"); }}><ArrowRight className="size-3.5" />View R&D Credit details in Capture Incentives</button>
                                            </div>
                                        )}
                                        {/* s5: Section 179 */}
                                        {selectedStrategy === "s5" && (
                                            <div className="px-6 py-5">
                                                <div className="mb-3 flex items-center gap-2"><Stars01 className="size-4 text-fg-brand-primary" /><h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">AI-Recommended Qualifying Equipment</h3></div>
                                                <div className="space-y-4">{detail.recommendations!.map((rec) => (<div key={rec.category} className="rounded-lg border border-secondary p-4"><p className="mb-2 text-sm font-semibold text-primary">{rec.category}</p><div className="flex flex-wrap gap-2">{rec.examples.map((ex) => (<span key={ex} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary">{ex}</span>))}</div></div>))}</div>
                                            </div>
                                        )}
                                        {/* s7: Capitalize vs expense */}
                                        {selectedStrategy === "s7" && (
                                            <div className="px-6 py-5">
                                                <div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Before / After Comparison</h3><Button color="primary" size="sm" iconLeading={Stars01}>Run AI analysis</Button></div>
                                                <div className="overflow-hidden rounded-lg border border-secondary">
                                                    <div className="grid grid-cols-3 bg-secondary px-4 py-2"><p className="text-xs font-medium text-tertiary">Asset</p><p className="text-xs font-medium text-tertiary">Current Treatment</p><p className="text-xs font-medium text-tertiary">Recommended</p></div>
                                                    {detail.comparison!.map((row, i) => (<div key={i} className={cx("grid grid-cols-3 px-4 py-3", i < detail.comparison!.length - 1 && "border-b border-secondary")}><p className="text-sm font-medium text-primary">{row.label}</p><p className="text-sm text-tertiary">{row.before}</p><p className="text-sm font-medium text-success-primary">{row.after}</p></div>))}
                                                </div>
                                            </div>
                                        )}
                                        {/* s10: Payroll */}
                                        {selectedStrategy === "s10" && (<>
                                            <div className="px-6 py-5">
                                                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Step-by-Step Guide</h3>
                                                <div className="space-y-2">{detail.steps!.map((step, i) => (<div key={i} className="rounded-lg border border-secondary p-4"><div className="flex items-center gap-3"><div className={cx("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", step.done ? "bg-success-solid text-white" : "bg-secondary text-tertiary")}>{step.done ? <Check className="size-3.5" /> : i + 1}</div><div><p className={cx("text-sm font-medium", step.done ? "text-tertiary line-through" : "text-primary")}>{step.label}</p><p className="text-xs text-tertiary">{step.description}</p></div></div></div>))}</div>
                                            </div>
                                            <div className="px-6 py-5">
                                                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Current vs Recommended Structure</h3>
                                                <div className="overflow-hidden rounded-lg border border-secondary">
                                                    <div className="grid grid-cols-3 bg-secondary px-4 py-2"><p className="text-xs font-medium text-tertiary">Component</p><p className="text-xs font-medium text-tertiary">Current</p><p className="text-xs font-medium text-tertiary">Recommended</p></div>
                                                    {detail.comparison!.map((row, i) => (<div key={i} className={cx("grid grid-cols-3 px-4 py-3", i < detail.comparison!.length - 1 && "border-b border-secondary")}><p className="text-sm font-medium text-primary">{row.label}</p><p className="text-sm tabular-nums text-tertiary">{row.before}</p><p className="text-sm font-medium tabular-nums text-success-primary">{row.after}</p></div>))}
                                                </div>
                                                <div className="mt-4 flex items-center gap-3 rounded-lg border border-brand/30 bg-brand-primary_alt/50 p-4"><InfoCircle className="size-5 shrink-0 text-fg-brand-primary" /><p className="text-sm text-secondary">We recommend consulting with your CPA before implementing payroll changes.</p></div>
                                            </div>
                                        </>)}
                                        {/* s8: Owner compensation */}
                                        {selectedStrategy === "s8" && detail.summary && (
                                            <div className="px-6 py-5">
                                                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Compensation Breakdown</h3>
                                                <div className="divide-y divide-secondary rounded-lg border border-secondary">{detail.summary.map((item, i) => (<div key={i} className="flex items-center justify-between px-4 py-3"><p className="text-sm text-primary">{item.label}</p><p className={cx("text-sm font-medium tabular-nums", item.label === "SE tax savings" ? "text-success-primary" : "text-primary")}>{item.value}</p></div>))}</div>
                                            </div>
                                        )}
                                        {/* s9: S-Corp election */}
                                        {selectedStrategy === "s9" && detail.summary && (
                                            <div className="px-6 py-5">
                                                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Filing Details</h3>
                                                <div className="divide-y divide-secondary rounded-lg border border-secondary">{detail.summary.map((item, i) => (<div key={i} className="flex items-center justify-between px-4 py-3"><p className="text-sm text-primary">{item.label}</p><p className={cx("text-sm font-medium tabular-nums", item.label === "Annual tax savings" ? "text-success-primary" : "text-primary")}>{item.value}</p></div>))}</div>
                                            </div>
                                        )}
                                        {/* s1/s2/s3: Payments */}
                                        {(selectedStrategy === "s1" || selectedStrategy === "s2" || selectedStrategy === "s3") && detail.payments && (
                                            <div className="px-6 py-5">
                                                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">{selectedStrategy === "s1" ? "Bonus Payments" : selectedStrategy === "s2" ? "Prepaid Expenses" : "Vendor & Software Payments"}</h3>
                                                <div className="overflow-hidden rounded-lg border border-secondary">
                                                    <div className="grid grid-cols-3 bg-secondary px-4 py-2"><p className="text-xs font-medium text-tertiary">{selectedStrategy === "s1" ? "Recipient" : "Item"}</p><p className="text-xs font-medium text-tertiary">Date</p><p className="text-right text-xs font-medium text-tertiary">Amount</p></div>
                                                    {detail.payments.map((p, i) => (<div key={i} className={cx("grid grid-cols-3 px-4 py-3", i < detail.payments!.length - 1 && "border-b border-secondary")}><p className="text-sm text-primary">{p.recipient}</p><p className="text-sm text-tertiary">{p.date}</p><p className="text-right text-sm font-medium tabular-nums text-primary">{p.amount}</p></div>))}
                                                    <div className="grid grid-cols-3 bg-secondary px-4 py-3"><p className="text-sm font-semibold text-primary">Total</p><p /><p className="text-right text-sm font-semibold tabular-nums text-primary">{strategy.impact}</p></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="w-64 shrink-0 space-y-4 self-start">
                                    <div className="rounded-xl bg-gradient-to-r from-purple-200/60 via-purple-100/50 to-blue-200/60 p-4"><Stars01 className="mb-2 size-4 text-fg-brand-secondary_alt" /><p className="text-xs text-tertiary">{detail.aiTip}</p></div>
                                    <div className="rounded-xl border border-secondary bg-primary p-5"><div className="flex items-center gap-2"><Calendar className="size-4 text-fg-quaternary" /><p className="text-xs text-tertiary">Deadline</p></div><p className="mt-1 text-sm font-semibold text-primary">{detail.deadline}</p></div>
                                </div>
                            </div>
                        </>);
                    })() : (<>
                    <p className="mb-4 text-sm text-tertiary">Actions you take during the year to reduce your future tax bill.</p>
                    <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                        {/* Blue banner header */}
                        <div className="flex items-center justify-between border-b border-brand/20 bg-brand-primary_alt px-6 py-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-primary">2024 Business Tax Savings Plan</h3>
                                <div className="flex items-center gap-1.5 rounded-full bg-error-secondary px-3 py-1 text-xs font-semibold text-error-primary">
                                    <Calendar className="size-3.5" />
                                    Due Dec 31, 2024
                                </div>
                            </div>
                            {(() => {
                                const parseImpact = (s: string) => Number(s.replace(/[$,]/g, ""));
                                const totalPotential = SAVING_STRATEGIES.reduce((sum, s) => sum + parseImpact(s.impact), 0);
                                const totalSaved = SAVING_STRATEGIES.filter(s => s.status === "done").reduce((sum, s) => sum + parseImpact(s.impact), 0);
                                return (
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xs text-tertiary">Potential Savings</p>
                                            <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-primary">${totalPotential.toLocaleString()}</p>
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <div className="flex h-1.5 w-36 overflow-hidden rounded-full bg-secondary">
                                                    <div className="rounded-full bg-success-solid" style={{ width: `${(totalSaved / totalPotential) * 100}%` }} />
                                                </div>
                                                <span className="text-xs font-semibold text-success-primary">${totalSaved.toLocaleString()} saved</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="divide-y divide-secondary">

                            {/* Saving Strategies */}
                            <div className="px-6 py-5">
                                {/* Header with filter */}
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-base font-semibold text-primary">Your Saving Strategies</h3>
                                        <Select
                                            size="sm"
                                            selectedKey={strategySortBy}
                                            onSelectionChange={(key) => { setStrategySortBy(key as "status" | "impact" | "category"); setStrategyPage(0); }}
                                            items={[
                                                { id: "status", label: "Sort by: Status" },
                                                { id: "impact", label: "Sort by: Impact" },
                                                { id: "category", label: "Sort by: Category" },
                                            ]}
                                            className="w-44 [&_p]:!text-xs [&_[slot=label]]:!text-xs" popoverClassName="w-44 [&_[slot=label]]:!text-xs"
                                        >
                                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-1 rounded-lg bg-secondary_alt ring-1 ring-secondary ring-inset">
                                        {[{ id: "all", label: "All Strategies" }, ...STRATEGY_CATEGORY_ORDER.map((c) => ({ id: c, label: c }))].map((filter) => (
                                            <button
                                                key={filter.id}
                                                type="button"
                                                className={cx(
                                                    "flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition",
                                                    strategyCategoryFilter === filter.id
                                                        ? "bg-brand-primary_alt text-brand-secondary"
                                                        : "text-quaternary hover:text-secondary",
                                                )}
                                                onClick={() => { setStrategyCategoryFilter(filter.id); setStrategyPage(0); }}
                                            >
                                                {filter.id !== "all" && (
                                                    <div className={cx("size-2 rounded-full", STRATEGY_CATEGORIES[filter.id as keyof typeof STRATEGY_CATEGORIES]?.dot)} />
                                                )}
                                                {filter.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Single table */}
                                {(() => {
                                    const STATUS_SORT_ORDER: Record<StrategyStatus, number> = { "in-progress": 0, "not-started": 1, "done": 2 };
                                    const filteredUnsorted = strategyCategoryFilter === "all"
                                        ? SAVING_STRATEGIES
                                        : SAVING_STRATEGIES.filter((s) => s.category === strategyCategoryFilter);
                                    const filtered = [...filteredUnsorted].sort((a, b) => {
                                        // Always push done to bottom
                                        if (a.status === "done" && b.status !== "done") return 1;
                                        if (a.status !== "done" && b.status === "done") return -1;
                                        if (strategySortBy === "status") return STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
                                        if (strategySortBy === "impact") {
                                            const aVal = parseInt(a.impact.replace(/[$,]/g, ""));
                                            const bVal = parseInt(b.impact.replace(/[$,]/g, ""));
                                            return bVal - aVal;
                                        }
                                        return a.category.localeCompare(b.category);
                                    });
                                    const totalPages = Math.ceil(filtered.length / STRATEGIES_PER_PAGE);
                                    const pageItems = filtered.slice(strategyPage * STRATEGIES_PER_PAGE, (strategyPage + 1) * STRATEGIES_PER_PAGE);

                                    return (
                                        <>
                                            <div className="overflow-hidden rounded-lg border border-secondary">
                                                {pageItems.map((strategy, i) => {
                                                    const statusCfg = STATUS_CONFIG[strategy.status];
                                                    const catConfig = STRATEGY_CATEGORIES[strategy.category];
                                                    return (
                                                        <div
                                                            key={strategy.id}
                                                            className={cx(
                                                                "flex items-center gap-4 px-4 py-3.5",
                                                                i < pageItems.length - 1 && "border-b border-secondary",
                                                                strategy.status === "done" && "opacity-60",
                                                            )}
                                                        >
                                                            {/* Category dot */}
                                                            <div className={cx("size-2 shrink-0 rounded-full", catConfig.dot)} />

                                                            {/* Title & description */}
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-primary">{strategy.name}</p>
                                                                <p className="mt-0.5 text-xs text-tertiary">{strategy.description}</p>
                                                            </div>

                                                            {/* Status + Impact combined pill */}
                                                            <div className={cx(
                                                                "w-28 shrink-0 rounded-lg px-3 py-1.5 text-center",
                                                                strategy.status === "done" ? "bg-success-secondary" :
                                                                strategy.status === "in-progress" ? "bg-warning-secondary" : "bg-secondary",
                                                            )}>
                                                                <div>
                                                                    <p className={cx(
                                                                        "text-sm font-bold tabular-nums",
                                                                        strategy.status === "done" ? "text-success-primary" :
                                                                        strategy.status === "in-progress" ? "text-warning-primary" : "text-quaternary",
                                                                    )}>{strategy.impact}</p>
                                                                    <p className={cx(
                                                                        "text-[10px] font-medium leading-none",
                                                                        strategy.status === "done" ? "text-success-primary/70" :
                                                                        strategy.status === "in-progress" ? "text-warning-primary/70" : "text-quaternary",
                                                                    )}>{statusCfg.label}</p>
                                                                </div>
                                                            </div>

                                                            {/* CTA */}
                                                            <Button
                                                                color="secondary"
                                                                size="sm"
                                                                iconLeading={
                                                                    strategy.ctaIcon === "upload" ? Upload01 :
                                                                    strategy.ctaIcon === "stars" ? Stars01 :
                                                                    strategy.ctaIcon === "arrow" ? ArrowRight :
                                                                    CheckCircle
                                                                }
                                                                className="w-40 shrink-0 justify-center"
                                                                onClick={() => setSelectedStrategy(strategy.id)}
                                                            >
                                                                {strategy.cta}
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Pagination */}
                                            {totalPages > 1 && (
                                                <div className="mt-3 flex items-center justify-between">
                                                    <p className="text-xs text-tertiary">
                                                        Showing {strategyPage * STRATEGIES_PER_PAGE + 1}–{Math.min((strategyPage + 1) * STRATEGIES_PER_PAGE, filtered.length)} of {filtered.length}
                                                    </p>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            disabled={strategyPage === 0}
                                                            className="flex size-8 items-center justify-center rounded-lg border border-secondary text-tertiary transition hover:bg-secondary disabled:opacity-40"
                                                            onClick={() => setStrategyPage((p) => p - 1)}
                                                        >
                                                            <ArrowLeft className="size-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={strategyPage >= totalPages - 1}
                                                            className="flex size-8 items-center justify-center rounded-lg border border-secondary text-tertiary transition hover:bg-secondary disabled:opacity-40"
                                                            onClick={() => setStrategyPage((p) => p + 1)}
                                                        >
                                                            <ArrowRight className="size-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Past Plans */}
                            <div className="px-6 py-5">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Past Plans</h3>
                                    <p className="text-xs text-tertiary">Total saved: <span className="font-semibold text-success-primary">$173,450</span></p>
                                </div>
                                <div className="space-y-2">
                                    {PAST_PLANS.map((plan) => (
                                        <button
                                            key={plan.name}
                                            type="button"
                                            className="flex w-full items-center gap-4 rounded-lg border border-secondary px-4 py-3 text-left transition hover:border-brand/40 hover:bg-brand-primary_alt/30"
                                        >
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                                <span className="text-xs font-bold text-tertiary">{plan.year}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-primary">{plan.name}</p>
                                                <p className="mt-0.5 text-xs text-tertiary">{plan.completed}/{plan.strategies} strategies completed</p>
                                            </div>
                                            <div className="shrink-0 rounded-lg bg-success-secondary px-2.5 py-1 text-center">
                                                <p className="text-sm font-bold tabular-nums text-success-primary">{plan.saving}</p>
                                                <p className="text-[10px] font-medium text-success-primary/70">saved</p>
                                            </div>
                                            <ChevronRight className="size-4 shrink-0 text-fg-quaternary" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    </>)}
                </Tabs.Panel>

                {/* Capture Incentives tab */}
                <Tabs.Panel id="credits" className="pt-5">
                    <p className="mb-4 text-sm text-tertiary">Existing tax credits and incentives you qualify for and claim.</p>
                    {selectedCredit === null ? (
                        /* ── Credits list view ── */
                        <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                            {/* Banner header */}
                            <div className="flex items-center justify-between border-b border-brand/20 bg-brand-primary_alt px-6 py-4">
                                <h3 className="text-lg font-semibold text-primary">2024 Tax Credits</h3>
                                {(() => {
                                    const parseAmount = (s: string) => Number(s.replace(/[$,]/g, "")) || 0;
                                    const rdTotal = rdEmployees.reduce((s, r) => s + r.qualified, 0) + rdContractors.reduce((s, r) => s + r.qualified, 0) + rdExpenses.filter((e) => e.rdStatus === "qualified").reduce((s, e) => s + Math.abs(e.amount), 0);
                                    const totalCredits = TAX_CREDITS.reduce((sum, c) => sum + (c.id === "rd" ? rdTotal : parseAmount(c.amount)), 0);
                                    const claimedCredits = TAX_CREDITS.filter(c => c.creditStatus === "claimed").reduce((sum, c) => sum + (c.id === "rd" ? rdTotal : parseAmount(c.amount)), 0);
                                    return (
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-xs text-tertiary">Potential Credits</p>
                                                <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-primary">${totalCredits.toLocaleString()}</p>
                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <div className="flex h-1.5 w-36 overflow-hidden rounded-full bg-secondary">
                                                        <div className="rounded-full bg-success-solid" style={{ width: `${(claimedCredits / totalCredits) * 100}%` }} />
                                                    </div>
                                                    <span className="text-xs font-semibold text-success-primary">${claimedCredits.toLocaleString()} claimed</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="divide-y divide-secondary">
                                {/* Credits grouped by category */}
                                <div className="px-6 py-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-base font-semibold text-primary">Available Credits</h3>
                                            <Select
                                                size="sm"
                                                selectedKey={creditSortBy}
                                                onSelectionChange={(key) => setCreditSortBy(key as "status" | "amount" | "category")}
                                                items={[
                                                    { id: "status", label: "Sort by: Status" },
                                                    { id: "amount", label: "Sort by: Amount" },
                                                    { id: "category", label: "Sort by: Category" },
                                                ]}
                                                className="w-44 [&_p]:!text-xs [&_[slot=label]]:!text-xs" popoverClassName="w-44 [&_[slot=label]]:!text-xs"
                                            >
                                                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-1 rounded-lg bg-secondary_alt ring-1 ring-secondary ring-inset">
                                            {[{ id: "all", label: "All Credits" }, ...CREDIT_CATEGORY_ORDER.map((c) => ({ id: c, label: c }))].map((filter) => (
                                                <button
                                                    key={filter.id}
                                                    type="button"
                                                    className={cx(
                                                        "flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition",
                                                        creditCategoryFilter === filter.id
                                                            ? "bg-brand-primary_alt text-brand-secondary"
                                                            : "text-quaternary hover:text-secondary",
                                                    )}
                                                    onClick={() => setCreditCategoryFilter(filter.id)}
                                                >
                                                    {filter.id !== "all" && (
                                                        <div className={cx("size-2 rounded-full", CREDIT_CATEGORIES[filter.id as keyof typeof CREDIT_CATEGORIES]?.dot)} />
                                                    )}
                                                    {filter.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {(() => {
                                        const CREDIT_STATUS_SORT: Record<string, number> = { "in-progress": 0, "eligible": 1, "claimed": 2 };
                                        const filteredCredits = [...(creditCategoryFilter === "all"
                                            ? TAX_CREDITS
                                            : TAX_CREDITS.filter((c) => c.category === creditCategoryFilter))
                                        ].sort((a, b) => {
                                            if (creditSortBy === "status") return CREDIT_STATUS_SORT[a.creditStatus] - CREDIT_STATUS_SORT[b.creditStatus];
                                            if (creditSortBy === "amount") {
                                                const aVal = parseInt(a.amount.replace(/[$,]/g, "")) || 0;
                                                const bVal = parseInt(b.amount.replace(/[$,]/g, "")) || 0;
                                                return bVal - aVal;
                                            }
                                            return a.category.localeCompare(b.category);
                                        });
                                        return (
                                    <div className="overflow-hidden rounded-lg border border-secondary">
                                        {filteredCredits.map((credit, i) => {
                                            const statusCfg = CREDIT_STATUS_CONFIG[credit.creditStatus];
                                            const catConfig = CREDIT_CATEGORIES[credit.category];
                                            return (
                                                <div
                                                    key={credit.id}
                                                    className={cx(
                                                        "flex w-full items-center gap-4 px-4 py-3.5 text-left",
                                                        i < filteredCredits.length - 1 && "border-b border-secondary",
                                                        credit.creditStatus === "claimed" && "opacity-60",
                                                    )}
                                                >
                                                    {/* Category dot */}
                                                    <div className={cx("size-2 shrink-0 rounded-full", catConfig.dot)} />

                                                    {/* Name & description */}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-primary">{credit.name}</p>
                                                        <p className="mt-0.5 text-xs text-tertiary">{credit.description}</p>
                                                    </div>

                                                    {/* Amount pill */}
                                                    <div className={cx(
                                                        "w-28 shrink-0 rounded-lg px-3 py-1.5 text-center",
                                                        credit.creditStatus === "claimed" ? "bg-success-secondary" :
                                                        credit.creditStatus === "in-progress" ? "bg-warning-secondary" : "bg-secondary",
                                                    )}>
                                                        <p className={cx(
                                                            "text-sm font-bold tabular-nums",
                                                            credit.creditStatus === "claimed" ? "text-success-primary" :
                                                            credit.creditStatus === "in-progress" ? "text-warning-primary" : "text-quaternary",
                                                        )}>{credit.id === "rd"
                                                            ? `$${(rdEmployees.reduce((s, r) => s + r.qualified, 0) + rdContractors.reduce((s, r) => s + r.qualified, 0) + rdExpenses.filter((e) => e.rdStatus === "qualified").reduce((s, e) => s + Math.abs(e.amount), 0)).toLocaleString()}`
                                                            : credit.amount}</p>
                                                        <p className={cx(
                                                            "text-[10px] font-medium leading-none",
                                                            credit.creditStatus === "claimed" ? "text-success-primary/70" :
                                                            credit.creditStatus === "in-progress" ? "text-warning-primary/70" : "text-quaternary",
                                                        )}>{statusCfg.label}</p>
                                                    </div>

                                                    {/* CTA */}
                                                    <Button
                                                        color="secondary"
                                                        size="sm"
                                                        iconLeading={
                                                            credit.ctaIcon === "upload" ? Upload01 :
                                                            credit.ctaIcon === "stars" ? Stars01 :
                                                            credit.ctaIcon === "arrow" ? ArrowRight :
                                                            CheckCircle
                                                        }
                                                        className="w-40 shrink-0 justify-center"
                                                        onClick={() => credit.id === "rd" ? setSelectedCredit("rd") : undefined}
                                                    >
                                                        {credit.cta}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ── R&D Start Claim page ── */
                        <>
                            <button
                                type="button"
                                className="mb-4 flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
                                onClick={() => setSelectedCredit(null)}
                            >
                                <ArrowLeft className="size-4" />
                                Back to Credits
                            </button>

                            <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-primary">R&D Tax Credit Claim</h3>
                                        <p className="mt-0.5 text-xs text-tertiary">Acme Technologies Inc. &middot; 2024</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-tertiary">Total Qualified</p>
                                        <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-success-primary">
                                            ${(rdEmployees.reduce((s, r) => s + r.qualified, 0)
                                                + rdContractors.reduce((s, r) => s + r.qualified, 0)
                                                + rdExpenses.filter((e) => e.rdStatus === "qualified").reduce((s, e) => s + Math.abs(e.amount), 0)
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Tab cards */}
                                <div className="grid grid-cols-3 gap-3 border-b border-secondary px-6 pb-4">
                                    {([
                                        { id: "employees" as const, label: "Employees", count: rdEmployees.length, amount: rdEmployees.reduce((s, r) => s + r.qualified, 0) },
                                        { id: "contractors" as const, label: "Contractors", count: rdContractors.length, amount: rdContractors.reduce((s, r) => s + r.qualified, 0) },
                                        { id: "expenses" as const, label: "Expenses", count: rdExpenses.filter((e) => e.rdStatus === "qualified").length, amount: rdExpenses.filter((e) => e.rdStatus === "qualified").reduce((s, e) => s + Math.abs(e.amount), 0) },
                                    ]).map((tab) => {
                                        const isActive = rdClaimTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setRdClaimTab(tab.id)}
                                                className={cx(
                                                    "rounded-xl border px-4 py-3 text-left transition",
                                                    isActive ? "border-brand bg-brand-primary_alt" : "border-secondary bg-secondary hover:border-brand/50",
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={cx("flex items-center gap-1.5 text-base font-semibold", isActive ? "text-brand-secondary" : "text-primary")}>
                                                        {tab.label}
                                                        <span className={cx("inline-flex size-5 items-center justify-center rounded-full text-xs font-medium", isActive ? "bg-primary text-brand-secondary" : "bg-primary text-tertiary")}>{tab.count}</span>
                                                    </span>
                                                    <div className="text-right">
                                                        <p className={cx("text-[10px]", isActive ? "text-brand-secondary/60" : "text-quaternary")}>Total qualified</p>
                                                        <p className={cx("text-sm font-bold tabular-nums", isActive ? "text-brand-secondary" : "text-primary")}>
                                                            ${tab.amount.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Tab content */}
                                <div className="px-6 py-5">
                                    {(rdClaimTab === "employees" || rdClaimTab === "contractors") && (() => {
                                        const data = rdClaimTab === "employees" ? rdEmployees : rdContractors;
                                        const setData = rdClaimTab === "employees" ? setRdEmployees : setRdContractors;
                                        const totalQualified = data.reduce((s, r) => s + r.qualified, 0);
                                        const totalContract = data.reduce((s, r) => s + r.contractAmount, 0);
                                        return (
                                            <div className="overflow-hidden rounded-lg border border-secondary">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b border-secondary bg-secondary">
                                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-tertiary">Name</th>
                                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-tertiary">Title</th>
                                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-tertiary">Country</th>
                                                            <th className="px-4 py-2.5 text-right text-xs font-medium text-tertiary">Qualified $</th>
                                                            <th className="px-4 py-2.5 text-right text-xs font-medium text-tertiary">Contract Amount</th>
                                                            <th className="pl-4 pr-10 py-2.5 text-right text-xs font-medium text-tertiary">Total R&D</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-secondary">
                                                        {data.map((row) => (
                                                            <tr key={row.id} className="cursor-pointer transition hover:bg-secondary/50" onClick={() => setSelectedPersonId(row.id)}>
                                                                <td className="px-4 py-3 text-sm font-medium text-primary">{row.name}</td>
                                                                <td className="px-4 py-3 text-sm text-tertiary">{row.title}</td>
                                                                <td className="px-4 py-3 text-sm text-tertiary">{row.country}</td>
                                                                <td className="px-4 py-3 text-right text-sm tabular-nums font-medium text-primary">${row.qualified.toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-right text-sm tabular-nums text-tertiary">${row.contractAmount.toLocaleString()}</td>
                                                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        {editingRdPercent === row.id ? (
                                                                            <div className="flex items-center gap-1">
                                                                                <input
                                                                                    type="number"
                                                                                    min={0}
                                                                                    max={100}
                                                                                    autoFocus
                                                                                    value={editingRdValue}
                                                                                    onChange={(e) => setEditingRdValue(e.target.value)}
                                                                                    onBlur={() => {
                                                                                        const v = Math.max(0, Math.min(100, Math.round(Number(editingRdValue) || 0)));
                                                                                        setData((prev) => prev.map((r) => r.id === row.id ? { ...r, rdPercent: v, qualified: Math.round(r.contractAmount * v / 100) } : r));
                                                                                        setEditingRdPercent(null);
                                                                                    }}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                                                                        if (e.key === "Escape") setEditingRdPercent(null);
                                                                                    }}
                                                                                    className="w-14 rounded border border-brand bg-primary px-1.5 py-0.5 text-right text-sm tabular-nums font-medium text-brand-secondary outline-none focus:ring-1 focus:ring-brand"
                                                                                />
                                                                                <span className="text-sm font-medium text-brand-secondary">%</span>
                                                                            </div>
                                                                        ) : (
                                                                            <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-brand px-2.5 py-1 text-brand-secondary transition hover:bg-brand-primary_alt hover:text-brand-primary" onClick={() => { setEditingRdPercent(row.id); setEditingRdValue(String(row.rdPercent)); }}>
                                                                                <span className="text-sm tabular-nums font-medium">{row.rdPercent}%</span>
                                                                                <Edit05 className="size-3.5" />
                                                                            </button>
                                                                        )}
                                                                        <button type="button" className="text-error-primary hover:text-error-primary"><Trash01 className="size-4" /></button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className="border-t border-secondary bg-secondary">
                                                            <td className="px-4 py-2.5 text-sm font-semibold text-primary" colSpan={3}>Total</td>
                                                            <td className="px-4 py-2.5 text-right text-sm tabular-nums font-semibold text-primary">${totalQualified.toLocaleString()}</td>
                                                            <td className="px-4 py-2.5 text-right text-sm tabular-nums font-semibold text-tertiary">${totalContract.toLocaleString()}</td>
                                                            <td className="px-4 py-2.5" />
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        );
                                    })()}

                                    {rdClaimTab === "expenses" && (() => {
                                        const filteredExpenses = rdExpenses.filter((item) => {
                                            if (rdLabelFilter !== "all" && !item.labels.includes(rdLabelFilter)) return false;
                                            if (rdStatusFilter !== "all" && item.rdStatus !== rdStatusFilter) return false;
                                            if (rdSearchQuery && !item.description.toLowerCase().includes(rdSearchQuery.toLowerCase())) return false;
                                            return true;
                                        });
                                        return (
                                        <div className="space-y-3">
                                            {/* Filters */}
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="relative flex-1">
                                                    <SearchLg className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
                                                    <input
                                                        type="text"
                                                        value={rdSearchQuery}
                                                        onChange={(e) => setRdSearchQuery(e.target.value)}
                                                        placeholder="Search transactions..."
                                                        className="w-full rounded-lg border border-secondary bg-primary py-2 pl-9 pr-3 text-sm text-primary placeholder:text-quaternary focus:border-brand focus:outline-none"
                                                    />
                                                </div>
                                                <select
                                                    value={rdLabelFilter}
                                                    onChange={(e) => setRdLabelFilter(e.target.value)}
                                                    className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand focus:outline-none"
                                                >
                                                    <option value="all">All Labels</option>
                                                    {RD_LABELS.map((lbl) => (
                                                        <option key={lbl.id} value={lbl.id}>{lbl.label}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={rdStatusFilter}
                                                    onChange={(e) => setRdStatusFilter(e.target.value)}
                                                    className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand focus:outline-none"
                                                >
                                                    <option value="all">All R&D Status</option>
                                                    {Object.entries(RD_EXPENSE_STATUS_CONFIG).map(([key, cfg]) => (
                                                        <option key={key} value={key}>{cfg.label}</option>
                                                    ))}
                                                </select>
                                                <span className="text-xs text-tertiary">{filteredExpenses.length} of {rdExpenses.length} transactions</span>
                                            </div>

                                            {/* Table */}
                                            <div className="overflow-x-auto rounded-lg border border-secondary">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-secondary bg-secondary">
                                                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-tertiary">Date</th>
                                                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-tertiary">Description</th>
                                                        <th className="w-[100px] whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-tertiary">Amount</th>
                                                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-tertiary">Chart of Account</th>
                                                        <th className="w-[140px] whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-tertiary">Labels</th>
                                                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-tertiary">Account</th>
                                                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-tertiary">R&D Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredExpenses.map((item) => {
                                                        const statusCfg = RD_EXPENSE_STATUS_CONFIG[item.rdStatus];
                                                        const isOpen = openStatusDropdown === item.id;
                                                        const coa = RD_CHART_OF_ACCOUNTS.find((a) => a.code === item.coaCode);
                                                        const needsReview = item.confidence < 90;
                                                        return (
                                                            <tr key={item.id} className={cx("cursor-pointer border-b border-secondary last:border-b-0 transition hover:bg-primary_hover", needsReview && "border-l-2 border-l-orange-dark-500 bg-orange-dark-50")} onClick={() => setSelectedExpenseId(item.id)}>
                                                                <td className="whitespace-nowrap px-3 py-2.5 text-sm text-tertiary">
                                                                    <div className="flex items-center gap-2">
                                                                        {needsReview && <Flag04 className="size-3.5 text-orange-dark-500" />}
                                                                        {item.date}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2.5 text-sm font-medium text-primary">
                                                                    <div className="group/ai relative inline-flex items-center gap-1.5">
                                                                        {item.description}
                                                                        <Stars01 className="size-3.5 shrink-0 cursor-help text-fg-brand-secondary_alt" />
                                                                        <div className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 hidden w-72 rounded-lg bg-primary-solid px-3 py-2.5 shadow-lg group-hover/ai:block">
                                                                            <p className="text-xs font-semibold text-white">AI Insight</p>
                                                                            <p className="mt-1 text-xs font-medium text-tooltip-supporting-text">{item.aiReasoning}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className={cx("whitespace-nowrap px-3 py-2.5 text-right text-sm font-medium tabular-nums", item.amount > 0 ? "text-success-primary" : "text-primary")}>
                                                                    {item.amount > 0 ? "+" : ""}${Math.abs(item.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                                                </td>
                                                                <td className="whitespace-nowrap px-3 py-2.5">
                                                                    {coa ? (
                                                                        <div>
                                                                            <p className="text-xs tabular-nums text-tertiary">{coa.code}</p>
                                                                            <p className="text-sm text-primary">{coa.name}</p>
                                                                        </div>
                                                                    ) : <span className="text-sm text-tertiary">Uncategorized</span>}
                                                                </td>
                                                                <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                                                                    {(() => {
                                                                        const isLabelOpen = openLabelDropdown === item.id;
                                                                        return (
                                                                            <div className="flex min-w-[120px] flex-wrap items-center gap-1">
                                                                                {item.labels.map((labelId) => {
                                                                                    const lbl = RD_LABELS.find((l) => l.id === labelId);
                                                                                    return lbl ? (
                                                                                        <Badge key={labelId} color={lbl.color as any} size="sm" type="pill-color">
                                                                                            {lbl.label}
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => toggleRdLabel(item.id, labelId)}
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
                                                                                        onClick={() => setOpenLabelDropdown(isLabelOpen ? null : item.id)}
                                                                                        className="flex size-5 items-center justify-center rounded-full border border-dashed border-tertiary text-tertiary transition hover:border-secondary hover:bg-secondary hover:text-secondary"
                                                                                    >
                                                                                        <Plus className="size-3" />
                                                                                    </button>
                                                                                    {isLabelOpen && (
                                                                                        <>
                                                                                            <div className="fixed inset-0 z-10" onClick={() => setOpenLabelDropdown(null)} />
                                                                                            <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-lg border border-secondary bg-primary py-1 shadow-lg">
                                                                                                {RD_LABELS.map((lbl) => {
                                                                                                    const isActive = item.labels.includes(lbl.id);
                                                                                                    return (
                                                                                                        <button
                                                                                                            key={lbl.id}
                                                                                                            type="button"
                                                                                                            onClick={() => toggleRdLabel(item.id, lbl.id)}
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
                                                                        );
                                                                    })()}
                                                                </td>
                                                                <td className="whitespace-nowrap px-3 py-2.5 text-sm text-primary">{item.account}</td>
                                                                <td className="relative px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setOpenStatusDropdown(isOpen ? null : item.id)}
                                                                        className={cx("flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition", statusCfg.bg, statusCfg.color)}
                                                                    >
                                                                        {statusCfg.label}
                                                                        <ChevronDown className={cx("size-3 transition", isOpen && "rotate-180")} />
                                                                    </button>
                                                                    {isOpen && (
                                                                        <>
                                                                            <div className="fixed inset-0 z-10" onClick={() => setOpenStatusDropdown(null)} />
                                                                            <div className="absolute left-4 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-secondary bg-primary shadow-lg">
                                                                                {(Object.entries(RD_EXPENSE_STATUS_CONFIG) as [RdExpenseStatus, (typeof RD_EXPENSE_STATUS_CONFIG)[RdExpenseStatus]][]).map(([key, cfg]) => (
                                                                                    <button
                                                                                        key={key}
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setRdExpenses((prev) => prev.map((e) => (e.id === item.id ? { ...e, rdStatus: key } : e)));
                                                                                            setOpenStatusDropdown(null);
                                                                                        }}
                                                                                        className={cx(
                                                                                            "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition hover:bg-primary_hover",
                                                                                            item.rdStatus === key && "bg-active",
                                                                                        )}
                                                                                    >
                                                                                        <span className={cx("size-2 rounded-full", cfg.bg)} />
                                                                                        <span className={cfg.color}>{cfg.label}</span>
                                                                                        {item.rdStatus === key && <Check className="ml-auto size-3 text-fg-brand-primary" />}
                                                                                    </button>
                                                                                ))}
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
                                        </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </>
                    )}
                </Tabs.Panel>
            </Tabs>

            {/* ── Employee / Contractor Detail Slideout ── */}
            <SlideoutMenu isDismissable isOpen={selectedPersonId !== null} onOpenChange={(open) => { if (!open) { setSelectedPersonId(null); setEditingPerson(null); } }} modalClassName="max-w-[560px]">
                {({ close }) => {
                    const allPeople = [...rdEmployees, ...rdContractors];
                    const person = allPeople.find((p) => p.id === selectedPersonId);
                    if (!person) return null;
                    const details = RD_PERSON_DETAILS[person.id];
                    const isContractor = person.id.startsWith("c");
                    const isEditing = editingPerson !== null;

                    const personId = person.id;

                    function startEditing() {
                        if (!person) return;
                        setEditingPerson({
                            name: person.name,
                            title: person.title,
                            country: person.country,
                            contractAmount: String(person.contractAmount),
                            rdPercent: String(person.rdPercent),
                            email: details?.email ?? "",
                            phone: details?.phone ?? "",
                            address: details?.address ?? "",
                            department: details?.department ?? "",
                            startDate: details?.startDate ?? "",
                            ein: details?.ein ?? "",
                        });
                    }

                    function saveEditing() {
                        if (!editingPerson) return;
                        const newPercent = Math.max(0, Math.min(100, Math.round(Number(editingPerson.rdPercent) || 0)));
                        const newContract = Math.max(0, Number(editingPerson.contractAmount) || 0);
                        const updater = (prev: typeof rdEmployees) => prev.map((r) =>
                            r.id === personId ? {
                                ...r,
                                name: editingPerson.name,
                                title: editingPerson.title,
                                country: editingPerson.country,
                                contractAmount: newContract,
                                rdPercent: newPercent,
                                qualified: Math.round(newContract * newPercent / 100),
                            } : r,
                        );
                        if (isContractor) setRdContractors(updater);
                        else setRdEmployees(updater);

                        if (details) {
                            Object.assign(details, {
                                email: editingPerson.email,
                                phone: editingPerson.phone,
                                address: editingPerson.address,
                                department: editingPerson.department,
                                startDate: editingPerson.startDate,
                                ...(isContractor ? { ein: editingPerson.ein } : {}),
                            });
                        }
                        setEditingPerson(null);
                    }

                    function updateField(field: string, value: string) {
                        setEditingPerson((prev) => prev ? { ...prev, [field]: value } : prev);
                    }

                    return (
                        <div className="flex size-full flex-col">
                            {/* Header */}
                            <header className="relative w-full px-6 pt-6 pb-4">
                                {isEditing && (
                                    <button type="button" className="mb-3 flex items-center gap-1 text-sm font-medium text-tertiary transition hover:text-primary" onClick={() => setEditingPerson(null)}>
                                        <ArrowLeft className="size-4" />
                                        Back
                                    </button>
                                )}
                                <div className="flex items-center gap-3 pr-8">
                                    <div className={cx("flex size-10 items-center justify-center rounded-lg", isContractor ? "bg-warning-secondary" : "bg-brand-secondary")}>
                                        {isContractor ? <Building07 className="size-5 text-fg-warning-primary" /> : <User01 className="size-5 text-fg-brand-primary" />}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-primary">{isEditing ? `Edit ${isContractor ? "Contractor" : "Employee"}` : person.name}</h2>
                                        <p className="text-sm text-tertiary">{isEditing ? person.name : person.title}</p>
                                    </div>
                                </div>
                                {!isEditing && (
                                    <CloseButton size="md" className="absolute top-3 right-3 shrink-0" onClick={close} />
                                )}
                            </header>

                            {/* Scrollable content */}
                            <div className="flex-1 overflow-y-auto px-6 pb-5">
                                {isEditing ? (
                                    <div className="space-y-5">
                                        {/* Personal Info */}
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Personal Information</h3>
                                            <div className="space-y-3">
                                                <Input label="Full Name" value={editingPerson.name} onChange={(v: string) => updateField("name", v)} icon={User01} />
                                                <Input label="Title" value={editingPerson.title} onChange={(v: string) => updateField("title", v)} />
                                                <Input label="Email" value={editingPerson.email} onChange={(v: string) => updateField("email", v)} icon={Mail01} />
                                                <Input label="Phone" value={editingPerson.phone} onChange={(v: string) => updateField("phone", v)} icon={Phone} />
                                                <Input label="Location" value={editingPerson.address} onChange={(v: string) => updateField("address", v)} icon={MarkerPin01} />
                                                <Input label="Department" value={editingPerson.department} onChange={(v: string) => updateField("department", v)} icon={Building07} />
                                                <Input label="Start Date" value={editingPerson.startDate} onChange={(v: string) => updateField("startDate", v)} icon={Calendar} />
                                                <Input label="Country" value={editingPerson.country} onChange={(v: string) => updateField("country", v)} icon={Globe01} />
                                                {isContractor && (
                                                    <Input label="EIN" value={editingPerson.ein} onChange={(v: string) => updateField("ein", v)} icon={Hash01} />
                                                )}
                                            </div>
                                        </div>

                                        {/* Compensation & R&D */}
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Compensation & R&D</h3>
                                            <div className="space-y-3">
                                                <Input label="Contract Amount ($)" value={editingPerson.contractAmount} onChange={(v: string) => updateField("contractAmount", v)} icon={CurrencyDollar} />
                                                <Input label="R&D Allocation (%)" value={editingPerson.rdPercent} onChange={(v: string) => updateField("rdPercent", v)} icon={Percent03} hint={`Qualified amount: $${Math.round((Number(editingPerson.contractAmount) || 0) * (Number(editingPerson.rdPercent) || 0) / 100).toLocaleString()}`} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {/* R&D Summary */}
                                        <div className="flex items-center justify-between rounded-xl border border-secondary bg-secondary px-4 py-3">
                                            <div>
                                                <p className="text-xs text-tertiary">Qualified R&D Amount</p>
                                                <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-primary">${person.qualified.toLocaleString()}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <Badge color="brand" size="sm" type="pill-color">{person.rdPercent}% R&D</Badge>
                                                <Badge color={isContractor ? "warning" : "blue"} size="sm" type="pill-color">{isContractor ? "Contractor" : "Employee"}</Badge>
                                            </div>
                                        </div>

                                        {/* Details grid */}
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Details</h3>
                                            <div className="divide-y divide-secondary rounded-xl border border-secondary">
                                                {details && (
                                                    <>
                                                        <div className="flex items-center justify-between px-3 py-2.5">
                                                            <span className="flex items-center gap-2 text-sm text-tertiary"><Mail01 className="size-3.5 text-fg-quaternary" />Email</span>
                                                            <span className="text-sm font-medium text-primary">{details.email}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between px-3 py-2.5">
                                                            <span className="flex items-center gap-2 text-sm text-tertiary"><Phone className="size-3.5 text-fg-quaternary" />Phone</span>
                                                            <span className="text-sm font-medium text-primary">{details.phone}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between px-3 py-2.5">
                                                            <span className="flex items-center gap-2 text-sm text-tertiary"><MarkerPin01 className="size-3.5 text-fg-quaternary" />Location</span>
                                                            <span className="text-sm font-medium text-primary">{details.address}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between px-3 py-2.5">
                                                            <span className="flex items-center gap-2 text-sm text-tertiary"><Building07 className="size-3.5 text-fg-quaternary" />Department</span>
                                                            <span className="text-sm font-medium text-primary">{details.department}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between px-3 py-2.5">
                                                            <span className="flex items-center gap-2 text-sm text-tertiary"><Calendar className="size-3.5 text-fg-quaternary" />Start Date</span>
                                                            <span className="text-sm font-medium text-primary">{details.startDate}</span>
                                                        </div>
                                                        {details.ein && (
                                                            <div className="flex items-center justify-between px-3 py-2.5">
                                                                <span className="flex items-center gap-2 text-sm text-tertiary"><Hash01 className="size-3.5 text-fg-quaternary" />EIN</span>
                                                                <span className="text-sm font-medium text-primary">{details.ein}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                <div className="flex items-center justify-between px-3 py-2.5">
                                                    <span className="flex items-center gap-2 text-sm text-tertiary"><Globe01 className="size-3.5 text-fg-quaternary" />Country</span>
                                                    <span className="text-sm font-medium text-primary">{person.country}</span>
                                                </div>
                                                <div className="flex items-center justify-between px-3 py-2.5">
                                                    <span className="flex items-center gap-2 text-sm text-tertiary"><CurrencyDollar className="size-3.5 text-fg-quaternary" />Contract Amount</span>
                                                    <span className="text-sm font-medium text-primary">${person.contractAmount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between px-3 py-2.5">
                                                    <span className="flex items-center gap-2 text-sm text-tertiary"><Percent03 className="size-3.5 text-fg-quaternary" />R&D Allocation</span>
                                                    <span className="text-sm font-medium text-brand-secondary">{person.rdPercent}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* R&D Projects */}
                                        {details && details.projects.length > 0 && (
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">R&D Projects</h3>
                                                <div className="divide-y divide-secondary rounded-xl border border-secondary">
                                                    {details.projects.map((project) => (
                                                        <div key={project} className="flex items-center gap-2 px-3 py-2.5">
                                                            <CheckCircle className="size-3.5 text-fg-success-primary" />
                                                            <span className="text-sm text-primary">{project}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* AI Insight */}
                                        {details && (
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">AI Insight</h3>
                                                <div className="rounded-xl bg-gradient-to-r from-purple-100/60 to-blue-100/60 px-3 py-2.5">
                                                    <div className="flex items-start gap-2">
                                                        <Stars01 className="mt-0.5 size-3.5 shrink-0 text-fg-brand-secondary_alt" />
                                                        <p className="text-xs leading-relaxed text-tertiary">{details.aiReasoning}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <footer className="w-full p-4 shadow-[inset_0px_1px_0px_0px] shadow-border-secondary md:px-6">
                                {isEditing ? (
                                    <div className="flex items-center gap-3">
                                        <Button color="primary" size="sm" iconLeading={CheckCircle} className="flex-1" onClick={saveEditing}>Save Changes</Button>
                                        <Button color="secondary" size="sm" onClick={() => setEditingPerson(null)}>Cancel</Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Button color="primary" size="sm" iconLeading={Edit05} className="flex-1" onClick={startEditing}>Edit {isContractor ? "Contractor" : "Employee"}</Button>
                                        <Button color="tertiary-destructive" size="sm" iconLeading={Trash01} />
                                    </div>
                                )}
                            </footer>
                        </div>
                    );
                }}
            </SlideoutMenu>

            {/* ── Expense Detail Slideout ── */}
            <SlideoutMenu isDismissable isOpen={selectedExpenseId !== null} onOpenChange={(open) => { if (!open) setSelectedExpenseId(null); }} modalClassName="max-w-[960px]" dialogClassName="overflow-hidden">
                {({ close }) => {
                    const expense = rdExpenses.find((e) => e.id === selectedExpenseId);
                    if (!expense) return null;
                    const details = RD_EXPENSE_DETAILS[expense.id];
                    const statusCfg = RD_EXPENSE_STATUS_CONFIG[expense.rdStatus];
                    return (
                        <div className="flex size-full">
                            {/* Left panel – Expense Details */}
                            <div className="flex w-[400px] shrink-0 flex-col border-r border-secondary">
                                {/* Header */}
                                <header className="relative w-full px-6 pt-6 pb-4">
                                    <div className="flex items-center gap-3 pr-8">
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                                            <Receipt className="size-5 text-fg-quaternary" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-primary">{expense.description}</h2>
                                            <p className="text-sm text-tertiary">{expense.date}</p>
                                        </div>
                                    </div>
                                    <CloseButton size="md" className="absolute top-3 right-3 shrink-0" onClick={close} />
                                </header>

                                {/* Scrollable content */}
                                <div className="flex-1 overflow-y-auto px-6 pb-5">
                                    <div className="space-y-5">
                                        {/* Amount & Status */}
                                        <div className="flex items-center justify-between rounded-xl border border-secondary bg-secondary px-4 py-3">
                                            <div>
                                                <p className="text-xs text-tertiary">Amount</p>
                                                <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-primary">${expense.amount.toLocaleString()}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <Badge color={expense.rdStatus === "qualified" ? "success" : expense.rdStatus === "partial" ? "warning" : expense.rdStatus === "not-qualified" ? "error" : "gray"} size="sm" type="pill-color">
                                                    {statusCfg.label}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Details grid */}
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Details</h3>
                                            <div className="divide-y divide-secondary rounded-xl border border-secondary">
                                                {details && (
                                                    <>
                                                        <div className="flex items-center justify-between px-3 py-2.5">
                                                            <span className="flex items-center gap-2 text-sm text-tertiary"><Building07 className="size-3.5 text-fg-quaternary" />Vendor</span>
                                                            <span className="text-sm font-medium text-primary">{details.vendor}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between px-3 py-2.5">
                                                            <span className="flex items-center gap-2 text-sm text-tertiary"><Hash01 className="size-3.5 text-fg-quaternary" />Invoice No.</span>
                                                            <span className="text-sm font-medium text-primary">{details.invoiceNo}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between px-3 py-2.5">
                                                            <span className="flex items-center gap-2 text-sm text-tertiary"><CurrencyDollar className="size-3.5 text-fg-quaternary" />Payment</span>
                                                            <span className="text-sm font-medium text-primary">{details.paymentMethod}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between px-3 py-2.5">
                                                            <span className="flex items-center gap-2 text-sm text-tertiary"><BarChartSquare02 className="size-3.5 text-fg-quaternary" />Category</span>
                                                            <span className="text-sm font-medium text-primary">{details.category}</span>
                                                        </div>
                                                    </>
                                                )}
                                                <div className="flex items-center justify-between px-3 py-2.5">
                                                    <span className="flex items-center gap-2 text-sm text-tertiary"><Calendar className="size-3.5 text-fg-quaternary" />Date</span>
                                                    <span className="text-sm font-medium text-primary">{expense.date}</span>
                                                </div>
                                                <div className="flex items-center justify-between px-3 py-2.5">
                                                    <span className="flex items-center gap-2 text-sm text-tertiary"><CurrencyDollar className="size-3.5 text-fg-quaternary" />Amount</span>
                                                    <span className="text-sm font-medium text-primary">${expense.amount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* AI Insight */}
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">AI Insight</h3>
                                            <div className="rounded-xl bg-gradient-to-r from-purple-100/60 to-blue-100/60 px-3 py-2.5">
                                                <div className="flex items-start gap-2">
                                                    <Stars01 className="mt-0.5 size-3.5 shrink-0 text-fg-brand-secondary_alt" />
                                                    <p className="text-xs leading-relaxed text-tertiary">{expense.aiReasoning}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <footer className="w-full p-4 shadow-[inset_0px_1px_0px_0px] shadow-border-secondary md:px-6">
                                    <div className="flex items-center gap-3">
                                        <Button color="primary" size="sm" iconLeading={Edit05} className="flex-1">Edit Expense</Button>
                                        <Button color="tertiary-destructive" size="sm" iconLeading={Trash01} />
                                    </div>
                                </footer>
                            </div>

                            {/* Right panel – Receipt Preview */}
                            <div className="flex flex-1 flex-col bg-secondary">
                                {/* Document toolbar */}
                                <div className="flex items-center justify-between border-b border-secondary px-5 py-3">
                                    <h3 className="text-sm font-semibold text-primary">Receipt</h3>
                                    <span className="text-xs text-tertiary">Page 1 of 1</span>
                                </div>

                                {/* Receipt document */}
                                <div className="flex flex-1 items-start justify-center overflow-y-auto p-6">
                                    <div className="w-full rounded-lg bg-primary shadow-lg ring-1 ring-secondary">
                                        <div className="space-y-6 p-8">
                                            {/* Vendor header */}
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Receipt className="size-5 text-fg-primary" />
                                                        <p className="text-base font-bold text-primary">{details?.vendor ?? "Vendor"}</p>
                                                    </div>
                                                    <p className="mt-0.5 text-[11px] text-quaternary">Tax Receipt / Invoice</p>
                                                </div>
                                                <div className="text-right text-[11px] leading-relaxed text-tertiary">
                                                    <p className="font-medium text-primary">{details?.invoiceNo ?? ""}</p>
                                                    <p>{details?.receiptDate ?? expense.date}</p>
                                                </div>
                                            </div>

                                            {/* Bill To */}
                                            <div className="border-t-2 border-brand-solid pt-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="text-xs font-semibold text-primary">Bill To</p>
                                                        <div className="mt-1.5 text-[11px] leading-relaxed text-tertiary">
                                                            <p className="font-medium text-primary">Numix Inc.</p>
                                                            <p>123 Business Ave</p>
                                                            <p>San Francisco, CA 94105</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-primary">Invoice</p>
                                                        <p className="mt-0.5 text-[11px] text-tertiary">Date: {details?.receiptDate ?? expense.date}</p>
                                                        <div className="mt-3 space-y-1 text-[11px]">
                                                            <div className="flex justify-between gap-8">
                                                                <span className="text-tertiary">Payment Method:</span>
                                                                <span className="font-medium text-primary">{details?.paymentMethod ?? ", "}</span>
                                                            </div>
                                                            <div className="flex justify-between gap-8">
                                                                <span className="text-tertiary">Terms:</span>
                                                                <span className="font-medium text-primary">Net 30</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Line Items */}
                                            <div>
                                                <div className="border-b-2 border-brand-solid pb-1">
                                                    <p className="text-xs font-bold text-primary">LINE ITEMS</p>
                                                </div>
                                                <table className="mt-2 w-full text-[11px]">
                                                    <thead>
                                                        <tr className="border-b border-secondary">
                                                            <th className="pb-1.5 text-left font-semibold text-primary">Description</th>
                                                            <th className="pb-1.5 text-right font-semibold text-primary">Qty</th>
                                                            <th className="pb-1.5 text-right font-semibold text-primary">Rate</th>
                                                            <th className="pb-1.5 text-right font-semibold text-primary">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="border-b border-dotted border-tertiary">
                                                            <td className="py-2 text-primary">{expense.description}</td>
                                                            <td className="py-2 text-right tabular-nums text-tertiary">1</td>
                                                            <td className="py-2 text-right tabular-nums text-tertiary">${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                                                            <td className="py-2 text-right tabular-nums text-primary">${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Totals */}
                                            <div className="ml-auto w-56">
                                                <div className="space-y-1 text-[11px]">
                                                    <div className="flex justify-between border-b border-dotted border-tertiary pb-1">
                                                        <span className="text-tertiary">Subtotal</span>
                                                        <span className="tabular-nums text-primary">${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-dotted border-tertiary pb-1">
                                                        <span className="text-tertiary">Tax (0%)</span>
                                                        <span className="tabular-nums text-primary">$0.00</span>
                                                    </div>
                                                    <div className="flex justify-between border-t border-secondary pt-1">
                                                        <span className="font-semibold text-primary">Total</span>
                                                        <span className="font-semibold tabular-nums text-primary">${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* R&D Status stamp */}
                                            <div className="flex items-center justify-center pt-2">
                                                <div className={cx("rounded-lg border-2 px-6 py-2 text-center", expense.rdStatus === "qualified" ? "border-success-primary" : expense.rdStatus === "partial" ? "border-warning-primary" : expense.rdStatus === "not-qualified" ? "border-error-primary" : "border-tertiary")}>
                                                    <p className={cx("text-xs font-bold uppercase tracking-widest", statusCfg.color)}>{statusCfg.label} for R&D</p>
                                                    <p className="mt-0.5 text-[10px] text-tertiary">IRC §41 Classification</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }}
            </SlideoutMenu>
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function TaxScreen({ page = "filing", intent, clearIntent }: TaxScreenProps) {
    const [selectedYear, setSelectedYear] = useState("2024");
    const [filingWizardOpen, setFilingWizardOpen] = useState(false);

    return (
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-secondary">
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="shrink-0 px-10 pt-8 pb-6">
                <div className="flex items-center justify-between">
                    {/* Title */}
                    <div className="flex items-center gap-4">
                        <div
                            className="flex size-11 items-center justify-center rounded-xl shadow-sm"
                            style={{ background: "linear-gradient(135deg, #7C5CFC, #2B53FE)" }}
                        >
                            {(() => { const Icon = PAGE_ICONS[page]; return <Icon className="size-5 text-white" />; })()}
                        </div>
                        <h1 className="text-display-xs font-semibold text-primary">{PAGE_TITLES[page]}</h1>
                    </div>

                    {/* Year filter, width matches deadline card */}
                    <div className="w-64">
                        <Select
                            size="sm"
                            placeholder="Tax Income Year"
                            selectedKey={selectedYear}
                            onSelectionChange={(key) => setSelectedYear(key as string)}
                            placeholderIcon={Calendar}
                            items={YEAR_OPTIONS}
                            className="[&_button]:!ring-brand [&_button_svg]:!text-fg-brand-primary [&_button_p]:!text-brand-secondary"
                        >
                            {(item) => (
                                <Select.Item id={item.id}>{item.label}</Select.Item>
                            )}
                        </Select>
                    </div>
                </div>
            </div>

            {/* ── Page content ─────────────────────────────────────────── */}
            <div className="min-h-0 flex-1 overflow-y-auto px-10 pb-8">
                {page === "filing" && <TaxFilingPage onOpenWizard={() => setFilingWizardOpen(true)} />}
                {page === "planning" && <TaxPlanningPage intent={intent} clearIntent={clearIntent} />}
            </div>

            {/* ── Filing wizard overlay ────────────────────────────────── */}
            <AnimatePresence>
                {filingWizardOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex flex-col bg-primary"
                    >
                        <div className="flex shrink-0 items-center justify-end border-b border-secondary px-4 py-2">
                            <Button
                                color="tertiary"
                                size="sm"
                                iconLeading={X}
                                onClick={() => setFilingWizardOpen(false)}
                            >
                                Close
                            </Button>
                        </div>
                        <div className="flex min-h-0 flex-1">
                            <TaxFilingScreen />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
