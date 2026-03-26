"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/providers/auth-provider";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    BarChartSquare02,
    Calendar,
    Check,
    CheckCircle,
    CheckSquare,
    ChevronRight,
    Clock,
    CoinsStacked01,
    DotsVertical,
    Edit05,
    File06,
    FileCheck02,
    InfoCircle,
    LineChartUp01,
    Plus,
    Stars01,
    Trash01,
    Upload01,
    X,
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
import { cx } from "@/utils/cx";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TaxPage = "filing" | "planning";

interface TaxScreenProps {
    page?: TaxPage;
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

type CreditStatus = "claimed" | "eligible" | "exploring" | "not-eligible";

const CREDIT_STATUS_CONFIG = {
    "claimed": { label: "Claimed", color: "text-success-primary", dot: "bg-fg-success-primary" },
    "eligible": { label: "Eligible", color: "text-brand-primary", dot: "bg-fg-brand-primary" },
    "exploring": { label: "Exploring", color: "text-warning-primary", dot: "bg-fg-warning-primary" },
    "not-eligible": { label: "Not eligible", color: "text-quaternary", dot: "bg-fg-quaternary" },
};

const CREDIT_CATEGORY_ORDER = ["Innovation & R&D", "Employee Benefits", "Accessibility & Facilities"] as const;

const CREDIT_CATEGORIES = {
    "Innovation & R&D": { border: "border-l-purple-500", dot: "bg-purple-500" },
    "Employee Benefits": { border: "border-l-emerald-500", dot: "bg-emerald-500" },
    "Accessibility & Facilities": { border: "border-l-blue-500", dot: "bg-blue-500" },
};

const TAX_CREDITS = [
    { id: "rd", name: "R&D Tax Credits", code: "IRC §41", creditStatus: "claimed" as CreditStatus, amount: "$3,850", description: "Credit for increasing research activities", category: "Innovation & R&D" as const },
    { id: "manufacturing", name: "Advanced Manufacturing Production Credit", code: "IRC §45X", creditStatus: "exploring" as CreditStatus, amount: "$2,400", description: "Credit for production of clean energy components", category: "Innovation & R&D" as const },
    { id: "family-leave", name: "Employer Credit for Paid Family and Medical Leave", code: "§45S", creditStatus: "eligible" as CreditStatus, amount: "$1,800", description: "Credit for employers providing paid family & medical leave", category: "Employee Benefits" as const },
    { id: "retirement-startup", name: "Small Employer Retirement Plan Startup Cost Credit", code: "SECURE 2.0", creditStatus: "eligible" as CreditStatus, amount: "$1,500", description: "Credit for starting a qualified retirement plan", category: "Employee Benefits" as const },
    { id: "auto-enrollment", name: "Auto-Enrollment Credit", code: "SECURE 2.0", creditStatus: "eligible" as CreditStatus, amount: "$500", description: "Credit for auto-enrollment feature in retirement plans", category: "Employee Benefits" as const },
    { id: "employer-contribution", name: "Employer Contribution Credit", code: "SECURE 2.0", creditStatus: "exploring" as CreditStatus, amount: "$2,100", description: "Credit for employer contributions to employee retirement plans", category: "Employee Benefits" as const },
    { id: "healthcare", name: "Small Business Health Care Tax Credit", code: "", creditStatus: "not-eligible" as CreditStatus, amount: "—", description: "Credit for small employers providing health insurance", category: "Employee Benefits" as const },
    { id: "disabled-access", name: "Disabled Access Credit", code: "IRC §44", creditStatus: "eligible" as CreditStatus, amount: "$750", description: "Credit for small businesses making accessibility improvements", category: "Accessibility & Facilities" as const },
    { id: "child-care", name: "Employer-Provided Child Care Credit", code: "IRC §45F", creditStatus: "exploring" as CreditStatus, amount: "$3,200", description: "Credit for employer-provided child care facilities & services", category: "Accessibility & Facilities" as const },
];

const RD_BREAKDOWN = [
    { category: "Software & cloud", amount: "$2,100" },
    { category: "Engineering payroll", amount: "$1,450" },
    { category: "Contractor R&D", amount: "$300" },
];

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
                        {/* 2024 Tax Filing title row — light blue banner */}
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
                        {/* Left 2/3 — white card */}
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

                                                        {/* File attachment — inside the card */}
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

                        {/* Right 1/3 — Key details */}
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
                        {/* Left 2/3 — white card */}
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

                        {/* Right 1/3 — Key details */}
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
    { id: "s1", name: "Pay bonuses before year-end", description: "Deduct bonus payments to reduce taxable income for the current year", impact: "$12,500", deadline: "Before Dec 31", category: "Cash & Expense Timing" as const, status: "not-started" as StrategyStatus },
    { id: "s2", name: "Accelerate business expenses", description: "Prepay deductible expenses to shift deductions into the current tax year", impact: "$8,200", deadline: "Before Dec 31", category: "Cash & Expense Timing" as const, status: "in-progress" as StrategyStatus },
    { id: "s3", name: "Prepay vendors or software", description: "Pay upcoming vendor invoices or annual software licenses early", impact: "$4,800", deadline: "Before Dec 31", category: "Cash & Expense Timing" as const, status: "not-started" as StrategyStatus },
    { id: "s4", name: "Write off bad debt", description: "Deduct uncollectible accounts receivable as a business loss", impact: "$3,100", deadline: "Before Dec 31", category: "Cash & Expense Timing" as const, status: "done" as StrategyStatus },
    { id: "s5", name: "Purchase equipment (Section 179)", description: "Deduct the full cost of qualifying equipment to reduce taxable income", impact: "$45,000", deadline: "Before Dec 31", category: "Investments & Assets" as const, status: "not-started" as StrategyStatus },
    { id: "s6", name: "Invest in R&D projects", description: "Qualify for R&D tax credits by funding research and development activities", impact: "$18,750", deadline: "Ongoing", category: "Investments & Assets" as const, status: "in-progress" as StrategyStatus },
    { id: "s7", name: "Capitalize vs expense optimization", description: "Review asset classifications to maximize current-year deductions", impact: "$6,400", deadline: "Before Dec 31", category: "Investments & Assets" as const, status: "not-started" as StrategyStatus },
    { id: "s8", name: "Optimize owner compensation", description: "Balance salary and distributions to minimize self-employment tax", impact: "$9,200", deadline: "Before Dec 31", category: "Entity & Compensation" as const, status: "in-progress" as StrategyStatus },
    { id: "s9", name: "Evaluate S-Corp election", description: "Elect S-Corp status to reduce self-employment taxes on business income", impact: "$14,300", deadline: "Mar 15, 2025", category: "Entity & Compensation" as const, status: "not-started" as StrategyStatus },
    { id: "s10", name: "Adjust payroll structure", description: "Restructure payroll to optimize tax withholding and employer deductions", impact: "$5,600", deadline: "Before Dec 31", category: "Entity & Compensation" as const, status: "not-started" as StrategyStatus },
];

const STRATEGY_CATEGORY_ORDER = ["Cash & Expense Timing", "Investments & Assets", "Entity & Compensation"] as const;

const STRATEGY_CATEGORIES = {
    "Cash & Expense Timing": { color: "success" as const, border: "border-l-emerald-500", dot: "bg-emerald-500" },
    "Investments & Assets": { color: "purple" as const, border: "border-l-purple-500", dot: "bg-purple-500" },
    "Entity & Compensation": { color: "brand" as const, border: "border-l-blue-500", dot: "bg-blue-500" },
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

const RD_EXPENSES = [
    { category: "Employees", items: [
        { id: "emp-1", name: "Sarah Chen — Sr. Engineer", amount: "$850" },
        { id: "emp-2", name: "Mike Torres — Dev Lead", amount: "$600" },
    ]},
    { category: "Contractors", items: [
        { id: "con-1", name: "DevShop LLC", amount: "$200" },
        { id: "con-2", name: "Jane Kim — Consultant", amount: "$100" },
    ]},
    { category: "Supplies & Cloud", items: [
        { id: "sup-1", name: "AWS Infrastructure", amount: "$150" },
        { id: "sup-2", name: "Hardware & Equipment", amount: "$50" },
    ]},
];

const TOTAL_EXPENSE_ITEMS = RD_EXPENSES.reduce((sum, g) => sum + g.items.length, 0);

function TaxPlanningPage() {
    const [selectedCredit, setSelectedCredit] = useState<string | null>(null);
    const [confirmedExpenses, setConfirmedExpenses] = useState<Set<string>>(new Set());
    const [showLiabilityModal, setShowLiabilityModal] = useState(false);
    const [signature, setSignature] = useState("");
    const [agreed, setAgreed] = useState(false);

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
            {/* Sub-tabs — Expenses & R&D Credits */}
            <Tabs>
                <Tabs.List
                    size="sm"
                    type="underline"
                    items={[
                        { id: "expenses", label: "Create Savings" },
                        { id: "credits", label: "Capture Savings" },
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
                    <p className="mb-4 text-sm text-tertiary">Actions you take during the year to reduce your future tax bill.</p>
                    <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                        {/* Blue banner header */}
                        <div className="flex items-center justify-between border-b border-brand/20 bg-brand-primary_alt px-6 py-4">
                            <h3 className="text-lg font-semibold text-primary">2024 Business Tax Savings Plan</h3>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-xs text-tertiary">Tax Savings</p>
                                    <div className="mt-0.5 flex items-baseline gap-2">
                                        <span className="text-2xl font-bold tabular-nums tracking-tight text-success-primary">$3,100</span>
                                        <span className="text-sm text-tertiary">/ $127,850</span>
                                    </div>
                                    <div className="mt-1.5 flex h-1.5 w-48 overflow-hidden rounded-full bg-secondary">
                                        <div className="rounded-full bg-success-solid" style={{ width: `${(3100 / 127850) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-secondary">

                            {/* Saving Strategies */}
                            <div className="px-6 py-5">
                                {/* Summary bar */}
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Your Saving Strategies</h3>
                                    <div className="flex items-center gap-3 text-xs text-tertiary">
                                        <span>{SAVING_STRATEGIES.length} strategies</span>
                                        <span className="text-quaternary">&middot;</span>
                                        <span>{STRATEGY_CATEGORY_ORDER.length} categories</span>
                                    </div>
                                </div>

                                {/* Grouped strategies */}
                                <div className="space-y-5">
                                    {STRATEGY_CATEGORY_ORDER.map((category) => {
                                        const catConfig = STRATEGY_CATEGORIES[category];
                                        const strategies = SAVING_STRATEGIES.filter((s) => s.category === category);
                                        return (
                                            <div key={category}>
                                                {/* Category header */}
                                                <div className="mb-3 flex items-center gap-2.5">
                                                    <div className={cx("size-2.5 rounded-full", catConfig.dot)} />
                                                    <h4 className="text-lg font-semibold text-primary">{category}</h4>
                                                    <span className="text-xs text-tertiary">{strategies.length} strategies</span>
                                                </div>
                                                {/* Strategy rows */}
                                                <div className="overflow-hidden rounded-lg border border-secondary">
                                                    {strategies.map((strategy, i) => {
                                                        const statusCfg = STATUS_CONFIG[strategy.status];
                                                        return (
                                                            <div
                                                                key={strategy.id}
                                                                className={cx(
                                                                    "flex items-center gap-4 border-l-[3px] px-4 py-3.5",
                                                                    catConfig.border,
                                                                    i < strategies.length - 1 && "border-b border-secondary",
                                                                )}
                                                            >
                                                                {/* Status dot */}
                                                                <div className="flex w-16 shrink-0 flex-col items-center gap-1">
                                                                    <div className={cx("size-2.5 rounded-full", statusCfg.dot)} />
                                                                    <span className={cx("text-[10px] font-medium leading-none", statusCfg.color)}>{statusCfg.label}</span>
                                                                </div>

                                                                {/* Title & description */}
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-medium text-primary">{strategy.name}</p>
                                                                    <p className="mt-0.5 text-xs text-tertiary">{strategy.description}</p>
                                                                </div>

                                                                {/* Impact pill */}
                                                                <div className={cx(
                                                                    "shrink-0 rounded-lg px-3 py-1.5 text-center",
                                                                    strategy.status === "not-started"
                                                                        ? "bg-secondary"
                                                                        : "bg-success-secondary",
                                                                )}>
                                                                    <p className={cx(
                                                                        "text-sm font-bold tabular-nums",
                                                                        strategy.status === "not-started" ? "text-quaternary" : "text-success-primary",
                                                                    )}>{strategy.impact}</p>
                                                                    <p className={cx(
                                                                        "text-[10px] font-medium",
                                                                        strategy.status === "not-started" ? "text-quaternary" : "text-success-primary/70",
                                                                    )}>tax savings</p>
                                                                </div>

                                                                {/* Deadline */}
                                                                <div className="shrink-0 text-right">
                                                                    <p className="text-sm text-primary">{strategy.deadline}</p>
                                                                    <p className="text-[11px] text-tertiary">Deadline</p>
                                                                </div>

                                                                {/* CTA */}
                                                                <Button color="secondary" size="sm" iconLeading={Stars01} className="shrink-0">
                                                                    How to do this
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
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
                </Tabs.Panel>

                {/* Capture Savings tab */}
                <Tabs.Panel id="credits" className="pt-5">
                    <p className="mb-4 text-sm text-tertiary">Existing tax credits and incentives you qualify for and claim.</p>
                    {selectedCredit === null ? (
                        /* ── Credits list view ── */
                        <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                            {/* Banner header */}
                            <div className="flex items-center justify-between border-b border-brand/20 bg-brand-primary_alt px-6 py-4">
                                <h3 className="text-lg font-semibold text-primary">2024 Tax Credits</h3>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-xs text-tertiary">Credits Captured</p>
                                        <div className="mt-0.5 flex items-baseline gap-2">
                                            <span className="text-2xl font-bold tabular-nums tracking-tight text-success-primary">$3,850</span>
                                            <span className="text-sm text-tertiary">/ $16,100</span>
                                        </div>
                                        <div className="mt-1.5 flex h-1.5 w-48 overflow-hidden rounded-full bg-secondary">
                                            <div className="rounded-full bg-success-solid" style={{ width: `${(3850 / 16100) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="divide-y divide-secondary">
                                {/* Credits grouped by category */}
                                <div className="px-6 py-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Available Credits</h3>
                                        <div className="flex items-center gap-3 text-xs text-tertiary">
                                            <span>{TAX_CREDITS.length} credits</span>
                                            <span className="text-quaternary">&middot;</span>
                                            <span>{TAX_CREDITS.filter((c) => c.creditStatus === "claimed").length} claimed</span>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        {CREDIT_CATEGORY_ORDER.map((category) => {
                                            const catConfig = CREDIT_CATEGORIES[category];
                                            const credits = TAX_CREDITS.filter((c) => c.category === category);
                                            return (
                                                <div key={category}>
                                                    <div className="mb-3 flex items-center gap-2.5">
                                                        <div className={cx("size-2.5 rounded-full", catConfig.dot)} />
                                                        <h4 className="text-lg font-semibold text-primary">{category}</h4>
                                                        <span className="text-xs text-tertiary">{credits.length} credits</span>
                                                    </div>
                                                    <div className="overflow-hidden rounded-lg border border-secondary">
                                                        {credits.map((credit, i) => {
                                                            const statusCfg = CREDIT_STATUS_CONFIG[credit.creditStatus];
                                                            return (
                                                                <button
                                                                    key={credit.id}
                                                                    type="button"
                                                                    className={cx(
                                                                        "flex w-full items-center gap-4 border-l-[3px] px-4 py-3.5 text-left transition hover:bg-secondary/50",
                                                                        catConfig.border,
                                                                        i < credits.length - 1 && "border-b border-secondary",
                                                                    )}
                                                                    onClick={() => credit.id === "rd" ? setSelectedCredit("rd") : undefined}
                                                                >
                                                                    {/* Status */}
                                                                    <div className="flex w-20 shrink-0 flex-col items-center gap-1">
                                                                        <div className={cx("size-2.5 rounded-full", statusCfg.dot)} />
                                                                        <span className={cx("text-[10px] font-medium leading-none", statusCfg.color)}>{statusCfg.label}</span>
                                                                    </div>

                                                                    {/* Name & description */}
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-sm font-medium text-primary">{credit.name}</p>
                                                                            {credit.code && (
                                                                                <span className="shrink-0 rounded-md border border-secondary px-1.5 py-0.5 text-[11px] text-tertiary">{credit.code}</span>
                                                                            )}
                                                                        </div>
                                                                        <p className="mt-0.5 text-xs text-tertiary">{credit.description}</p>
                                                                    </div>

                                                                    {/* Amount pill */}
                                                                    {credit.amount !== "—" ? (
                                                                        <div className={cx(
                                                                            "shrink-0 rounded-lg px-3 py-1.5 text-center",
                                                                            credit.creditStatus === "claimed" ? "bg-success-secondary" :
                                                                            credit.creditStatus === "not-eligible" ? "bg-secondary" : "bg-brand-primary_alt",
                                                                        )}>
                                                                            <p className={cx(
                                                                                "text-sm font-bold tabular-nums",
                                                                                credit.creditStatus === "claimed" ? "text-success-primary" :
                                                                                credit.creditStatus === "not-eligible" ? "text-quaternary" : "text-brand-primary",
                                                                            )}>{credit.amount}</p>
                                                                            <p className={cx(
                                                                                "text-[10px] font-medium",
                                                                                credit.creditStatus === "claimed" ? "text-success-primary/70" :
                                                                                credit.creditStatus === "not-eligible" ? "text-quaternary" : "text-brand-primary/70",
                                                                            )}>{credit.creditStatus === "claimed" ? "claimed" : "potential"}</p>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="shrink-0 rounded-lg bg-secondary px-3 py-1.5 text-center">
                                                                            <p className="text-sm font-bold text-quaternary">—</p>
                                                                            <p className="text-[10px] font-medium text-quaternary">N/A</p>
                                                                        </div>
                                                                    )}

                                                                    {/* CTA */}
                                                                    <Button color="secondary" size="sm" iconLeading={credit.creditStatus === "claimed" ? CheckCircle : Stars01} className="shrink-0">
                                                                        {credit.creditStatus === "claimed" ? "View details" : credit.creditStatus === "not-eligible" ? "Learn more" : "Start claim"}
                                                                    </Button>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ── R&D Credit detail view ── */
                        <>
                            <button
                                type="button"
                                className="mb-4 flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
                                onClick={() => setSelectedCredit(null)}
                            >
                                <ArrowLeft className="size-4" />
                                Back to Credits
                            </button>
                            <div className="flex gap-4">
                                {/* Main content */}
                                <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-secondary bg-primary">
                                    {/* Blue banner */}
                                    <div className="flex items-center justify-between border-b border-brand/20 bg-brand-primary_alt px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <h3 className="text-sm font-semibold text-primary">R&D Tax Credits</h3>
                                                <p className="text-xs text-tertiary">Acme Technologies Inc. &middot; 2024</p>
                                            </div>
                                            <BadgeWithDot color="brand" size="sm" type="pill-color">In Progress</BadgeWithDot>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-tertiary">
                                            <Clock className="size-3.5" />
                                            Updated 2 hrs ago
                                        </div>
                                    </div>

                                    <div className="divide-y divide-secondary">
                                        {/* Credit amount hero */}
                                        <div className="flex items-center justify-between px-6 py-5">
                                            <div>
                                                <p className="text-xs text-tertiary">Potential R&D Tax Credit</p>
                                                <p className="mt-1 text-3xl font-semibold tracking-tight text-success-primary">$3,850</p>
                                                <button type="button" className="mt-1 text-xs font-medium text-brand-primary hover:underline">
                                                    How is this calculated?
                                                </button>
                                            </div>
                                            <Button color="primary" size="sm" iconTrailing={ChevronRight}>Start claim</Button>
                                        </div>

                                        {/* Breakdown */}
                                        <div className="px-6 py-5">
                                            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">Credit Breakdown</h3>
                                            <div className="divide-y divide-secondary rounded-lg border border-secondary">
                                                {RD_BREAKDOWN.map((item) => (
                                                    <div key={item.category} className="flex items-center justify-between px-4 py-3">
                                                        <p className="text-sm text-primary">{item.category}</p>
                                                        <p className="text-sm font-medium tabular-nums text-primary">{item.amount}</p>
                                                    </div>
                                                ))}
                                                <div className="flex items-center justify-between bg-secondary px-4 py-3">
                                                    <p className="text-sm font-semibold text-primary">Total</p>
                                                    <p className="text-sm font-semibold tabular-nums text-primary">$3,850</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Confirm Qualifying Expenses */}
                                        <div className="px-6 py-5">
                                            <div className="mb-3 flex items-center justify-between">
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Confirm Qualifying Expenses</h3>
                                                <span className="text-xs text-tertiary">{confirmedExpenses.size} of {TOTAL_EXPENSE_ITEMS} confirmed</span>
                                            </div>
                                            <div className="divide-y divide-secondary rounded-lg border border-secondary">
                                                {RD_EXPENSES.map((group) => (
                                                    <div key={group.category} className="px-4 py-3">
                                                        <p className="mb-2 text-xs font-medium text-tertiary">{group.category}</p>
                                                        <div className="space-y-2">
                                                            {group.items.map((item) => (
                                                                <label key={item.id} className="flex cursor-pointer items-center gap-3">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={confirmedExpenses.has(item.id)}
                                                                        onChange={() => toggleExpense(item.id)}
                                                                        className="size-4 rounded border-secondary text-brand-solid focus:ring-brand-solid"
                                                                    />
                                                                    <span className="flex-1 text-sm text-primary">{item.name}</span>
                                                                    <span className="text-sm tabular-nums font-medium text-primary">{item.amount}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* AI Help button */}
                                            <div className="mt-4">
                                                <Button
                                                    color="secondary"
                                                    size="sm"
                                                    iconLeading={Stars01}
                                                    isDisabled={!hasConfirmed}
                                                    onClick={() => setShowLiabilityModal(true)}
                                                >
                                                    Numix AI Help
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right sidebar */}
                                <div className="w-64 shrink-0 space-y-4 self-start">
                                    <div className="rounded-xl bg-gradient-to-r from-purple-200/60 via-purple-100/50 to-blue-200/60 p-4">
                                        <Stars01 className="mb-2 size-4 text-fg-brand-secondary_alt" />
                                        <p className="text-xs text-tertiary">
                                            Based on your qualifying expenses, you may be eligible for additional state-level R&D credits worth up to $1,200.
                                        </p>
                                        <button type="button" className="mt-2 text-xs font-semibold text-brand-secondary hover:underline">
                                            Explore state credits
                                        </button>
                                    </div>
                                    <div className="rounded-xl border border-secondary bg-primary p-5">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="size-4 text-fg-quaternary" />
                                            <p className="text-xs text-tertiary">Filing Deadline</p>
                                        </div>
                                        <p className="mt-1 text-sm font-semibold text-primary">Mar 15, 2025</p>
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

                            {/* Liability Form Modal */}
                            <ModalOverlay isOpen={showLiabilityModal} onOpenChange={setShowLiabilityModal}>
                                <Modal>
                                    <Dialog>
                                        <div className="space-y-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-10 items-center justify-center rounded-full bg-warning-secondary">
                                                    <AlertCircle className="size-5 text-fg-warning-primary" />
                                                </div>
                                                <h2 className="text-lg font-semibold text-primary">Liability Agreement</h2>
                                            </div>
                                            <div className="max-h-[240px] overflow-y-auto rounded-lg border border-secondary bg-secondary/50 p-4 text-sm leading-relaxed text-secondary">
                                                <p className="mb-3">
                                                    By signing this agreement, you acknowledge that the AI-assisted R&D tax credit analysis
                                                    provided by Numix is for informational purposes and does not constitute tax advice.
                                                </p>
                                                <p className="mb-3">
                                                    You understand that: (1) The AI analysis is based on the expense data you have confirmed
                                                    and may not capture all qualifying activities; (2) Final determination of R&D credit
                                                    eligibility rests with the IRS and applicable state authorities; (3) Numix and its AI
                                                    systems are not liable for any discrepancies, penalties, or adjustments resulting from
                                                    the use of this analysis; (4) You are responsible for reviewing all AI-generated
                                                    recommendations with a qualified tax professional before filing.
                                                </p>
                                                <p>
                                                    This agreement is governed by the terms of your Numix service agreement. By signing below,
                                                    you confirm that you have read, understood, and agree to these terms.
                                                </p>
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-primary">Signature (type your full name)</label>
                                                <input
                                                    type="text"
                                                    value={signature}
                                                    onChange={(e) => setSignature(e.target.value)}
                                                    placeholder="e.g. Olivia Rhye"
                                                    className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary placeholder:text-quaternary focus:border-brand-solid focus:outline-none focus:ring-1 focus:ring-brand-solid"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-primary">Date</label>
                                                <input type="text" value={today} readOnly className="w-full rounded-lg border border-secondary bg-secondary/50 px-3 py-2 text-sm text-tertiary" />
                                            </div>
                                            <label className="flex cursor-pointer items-start gap-3">
                                                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 size-4 rounded border-secondary text-brand-solid focus:ring-brand-solid" />
                                                <span className="text-sm text-secondary">I have read and agree to the terms outlined above.</span>
                                            </label>
                                            <div className="flex justify-end gap-3">
                                                <Button color="secondary" size="md" onClick={() => { setShowLiabilityModal(false); setSignature(""); setAgreed(false); }}>Cancel</Button>
                                                <Button color="primary" size="md" isDisabled={!canSubmit} onClick={() => { setShowLiabilityModal(false); setSignature(""); setAgreed(false); }}>Sign & Submit</Button>
                                            </div>
                                        </div>
                                    </Dialog>
                                </Modal>
                            </ModalOverlay>
                        </>
                    )}
                </Tabs.Panel>
            </Tabs>
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function TaxScreen({ page = "filing" }: TaxScreenProps) {
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

                    {/* Year filter — width matches deadline card */}
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
                {page === "planning" && <TaxPlanningPage />}
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
