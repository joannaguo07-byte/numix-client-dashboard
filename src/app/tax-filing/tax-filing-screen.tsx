"use client";

import { useState, type FC, type SVGProps } from "react";
import {
    ArrowLeft,
    ArrowRight,
    AlertCircle,
    BarChart01,
    Building07,
    Calendar,
    Check,
    CheckCircle,
    Clock,
    Edit05,
    File06,
    InfoCircle,
    Key01,
    Mail01,
    Phone01,
    ReceiptCheck,
    RefreshCw05,
    Shield01,
    Upload01,
    Users01,
} from "@untitledui/icons";
import { Badge, BadgeWithDot, BadgeWithIcon } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step {
    id: string;
    label: string;
    icon: FC<SVGProps<SVGSVGElement>>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const STEPS: Step[] = [
    { id: "company", label: "Company", icon: Building07 },
    { id: "activity", label: "Activity", icon: BarChart01 },
    { id: "signer", label: "Signer", icon: Edit05 },
    { id: "owners", label: "Owners", icon: Users01 },
    { id: "compliance", label: "Compliance", icon: Shield01 },
    { id: "documents", label: "Documents", icon: File06 },
    { id: "access", label: "Access", icon: Key01 },
    { id: "review", label: "Review", icon: CheckCircle },
];

// Track which fields are "filled" per step for progress calculation
export const STEP_FIELD_COUNTS: Record<string, number> = {
    company: 7,
    activity: 4,
    signer: 4,
    owners: 3,
    compliance: 3,
    documents: 4,
    access: 2,
    review: 0,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MissingBadge() {
    return (
        <BadgeWithIcon iconLeading={AlertCircle} color="error" size="sm" type="pill-color">
            Missing
        </BadgeWithIcon>
    );
}

function InfoBanner({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-brand bg-brand-primary_alt p-4">
            <FeaturedIcon icon={InfoCircle} color="brand" theme="light" size="sm" />
            <p className="text-sm text-secondary">{children}</p>
        </div>
    );
}

function SectionHeader({ stepNumber, title }: { stepNumber: number; title: string }) {
    return (
        <div className="mb-6 space-y-1">
            <div className="flex items-center gap-3">
                <Badge color="brand" size="sm" type="pill-color">
                    Step {stepNumber}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-tertiary">
                    <Check className="size-3 text-fg-success-secondary" />
                    Auto-saved
                </div>
            </div>
            <h2 className="text-display-xs font-semibold text-primary">{title}</h2>
        </div>
    );
}

// ─── Step Content Components ──────────────────────────────────────────────────

export function CompanyProfileStep() {
    return (
        <div className="space-y-6">
            <SectionHeader stepNumber={1} title="Company Profile" />
            <InfoBanner>
                Provide basic information about the entity filing this return. The EIN and legal name must match IRS records exactly.
            </InfoBanner>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <Input
                    label="EIN (Employer Identification Number)"
                    placeholder="XX-XXXXXXX"
                    isRequired
                    isInvalid
                    hint={<MissingBadge />}
                />
                <Input
                    label="Legal Name"
                    placeholder="Full legal entity name"
                    isRequired
                    isInvalid
                    hint={<MissingBadge />}
                />
                <Input
                    label="Doing Business As (DBA)"
                    placeholder="Trade name, if different"
                    hint="Leave blank if same as legal name"
                />
                <Input
                    label="Formation Date"
                    placeholder="MM/DD/YYYY"
                    icon={Calendar}
                />
                <Input
                    label="State of Formation"
                    placeholder="Select state"
                    isRequired
                    isInvalid
                    hint={<MissingBadge />}
                />
                <Input
                    label="Email Address"
                    placeholder="company@example.com"
                    icon={Mail01}
                    isRequired
                />
                <Input
                    label="Phone Number"
                    placeholder="(555) 000-0000"
                    icon={Phone01}
                />
            </div>
        </div>
    );
}

export function ActivityStep() {
    return (
        <div className="space-y-6">
            <SectionHeader stepNumber={2} title="Business Activity" />
            <InfoBanner>
                Describe the principal business activity and product or service. This information is used to classify the return with the IRS.
            </InfoBanner>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <Input
                    label="Business Activity Type"
                    placeholder="e.g. Software Development"
                    isRequired
                />
                <Input
                    label="NAICS Code"
                    placeholder="6-digit code"
                    hint="Find your code at census.gov/naics"
                />
                <Input
                    label="Fiscal Year End"
                    placeholder="MM/DD"
                    icon={Calendar}
                    isRequired
                />
                <Input
                    label="Gross Revenue Range"
                    placeholder="Select range"
                />
            </div>
        </div>
    );
}

export function SignerStep() {
    return (
        <div className="space-y-6">
            <SectionHeader stepNumber={3} title="Authorized Signer" />
            <InfoBanner>
                The authorized signer is the individual legally permitted to sign the tax return on behalf of the entity. Typically this is the CEO, President, or managing member.
            </InfoBanner>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <Input
                    label="Full Name"
                    placeholder="First and last name"
                    isRequired
                />
                <Input
                    label="Title / Role"
                    placeholder="e.g. CEO, President"
                    isRequired
                />
                <Input
                    label="SSN (last 4 digits)"
                    placeholder="XXX-XX-____"
                    isRequired
                    hint="Used for identity verification only"
                />
                <Input
                    label="Signature Date"
                    placeholder="MM/DD/YYYY"
                    icon={Calendar}
                />
            </div>
        </div>
    );
}

export function OwnersStep() {
    return (
        <div className="space-y-6">
            <SectionHeader stepNumber={4} title="Shareholders & Owners" />
            <InfoBanner>
                List all shareholders or members with their ownership percentage. Each owner&apos;s information will be used to prepare Schedule K-1s.
            </InfoBanner>
            <div className="overflow-hidden rounded-xl border border-secondary">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-secondary bg-secondary">
                            <th className="px-4 py-3 text-left font-medium text-secondary">Name</th>
                            <th className="px-4 py-3 text-left font-medium text-secondary">SSN / EIN</th>
                            <th className="px-4 py-3 text-left font-medium text-secondary">Ownership %</th>
                            <th className="px-4 py-3 text-left font-medium text-secondary">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { name: "Jordan Rivera", ssn: "***-**-4521", pct: "60%", complete: true },
                            { name: "Alex Chen", ssn: "***-**-7834", pct: "25%", complete: true },
                            { name: ", ", ssn: ", ", pct: "15%", complete: false },
                        ].map((owner, i) => (
                            <tr key={i} className="border-b border-secondary last:border-b-0">
                                <td className="px-4 py-3 text-primary">{owner.name}</td>
                                <td className="px-4 py-3 font-mono text-tertiary">{owner.ssn}</td>
                                <td className="px-4 py-3 text-primary">{owner.pct}</td>
                                <td className="px-4 py-3">
                                    {owner.complete ? (
                                        <BadgeWithDot color="success" size="sm" type="pill-color">Complete</BadgeWithDot>
                                    ) : (
                                        <MissingBadge />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Button color="secondary" size="sm" iconLeading={Users01}>
                Add shareholder
            </Button>
        </div>
    );
}

export function ComplianceStep() {
    return (
        <div className="space-y-6">
            <SectionHeader stepNumber={5} title="Compliance" />
            <InfoBanner>
                Confirm state registrations and prior filing details. If the company received any IRS notices, upload them in the Documents step.
            </InfoBanner>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <Input
                    label="State Registrations"
                    placeholder="e.g. CA, DE, NY"
                    isRequired
                    hint="Comma-separated list of states where registered"
                />
                <Input
                    label="Prior Year Filing Status"
                    placeholder="e.g. Filed on time"
                />
                <Input
                    label="Outstanding IRS Notices"
                    placeholder="None"
                    hint="Describe any notices received, or enter None"
                />
            </div>
        </div>
    );
}

export function DocumentsStep() {
    return (
        <div className="space-y-6">
            <SectionHeader stepNumber={6} title="Documents" />
            <InfoBanner>
                Upload relevant tax documents. Accepted formats: PDF, JPG, PNG. Maximum 25 MB per file.
            </InfoBanner>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {[
                    { label: "Prior Year Tax Returns", desc: "Upload last year's filed return (1120-S)" },
                    { label: "W-2 Forms", desc: "Upload all W-2s issued to employees" },
                    { label: "1099 Forms", desc: "Upload 1099-NEC, 1099-MISC, 1099-INT, etc." },
                    { label: "Schedule K-1s", desc: "Upload K-1s distributed to shareholders" },
                ].map((doc) => (
                    <div
                        key={doc.label}
                        className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-secondary p-6 text-center"
                    >
                        <FeaturedIcon icon={Upload01} color="gray" theme="outline" size="md" />
                        <div>
                            <p className="text-sm font-medium text-primary">{doc.label}</p>
                            <p className="mt-0.5 text-xs text-tertiary">{doc.desc}</p>
                        </div>
                        <Button color="secondary" size="sm">
                            Choose files
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AccessStep() {
    return (
        <div className="space-y-6">
            <SectionHeader stepNumber={7} title="Accountant Access" />
            <InfoBanner>
                Grant your accountant or CPA access to review and file on your behalf. They will receive an email invitation with secure access instructions.
            </InfoBanner>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <Input
                    label="Accountant Email"
                    placeholder="cpa@firm.com"
                    icon={Mail01}
                    isRequired
                />
                <Input
                    label="Permission Level"
                    placeholder="Full access"
                    hint="Accountant will have read + file permissions"
                />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                <FeaturedIcon icon={Key01} color="brand" theme="light" size="sm" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-primary">Secure access link</p>
                    <p className="text-xs text-tertiary">
                        A unique invitation link will be sent once you grant access. The link expires after 7 days.
                    </p>
                </div>
                <Button color="primary" size="sm">
                    Grant access
                </Button>
            </div>
        </div>
    );
}

export function ReviewStep({ completedSteps }: { completedSteps: Set<string> }) {
    return (
        <div className="space-y-6">
            <SectionHeader stepNumber={8} title="Review & Submit" />
            <InfoBanner>
                Review all sections below before submitting. Sections marked as incomplete will need to be finished before filing.
            </InfoBanner>
            <div className="divide-y divide-secondary overflow-hidden rounded-xl border border-secondary">
                {STEPS.slice(0, 7).map((step, i) => {
                    const done = completedSteps.has(step.id);
                    return (
                        <div key={step.id} className="flex items-center gap-4 px-4 py-3">
                            <div
                                className={cx(
                                    "flex size-8 items-center justify-center rounded-full",
                                    done ? "bg-success-secondary" : "bg-secondary",
                                )}
                            >
                                {done ? (
                                    <Check className="size-4 text-fg-success-primary" />
                                ) : (
                                    <span className="text-xs font-medium text-tertiary">{i + 1}</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-primary">{step.label}</p>
                            </div>
                            {done ? (
                                <BadgeWithDot color="success" size="sm" type="pill-color">Complete</BadgeWithDot>
                            ) : (
                                <BadgeWithDot color="warning" size="sm" type="pill-color">Incomplete</BadgeWithDot>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TaxFilingScreen() {
    const [activeStep, setActiveStep] = useState(0);
    const completedSteps = new Set(["activity", "signer"]);

    const filledStepCount = Array.from(completedSteps).reduce(
        (sum, id) => sum + (STEP_FIELD_COUNTS[id] ?? 0),
        0,
    );
    const totalFields = Object.values(STEP_FIELD_COUNTS).reduce((a, b) => a + b, 0);
    const progressPct = totalFields > 0 ? Math.round((filledStepCount / totalFields) * 100) : 0;

    function goNext() {
        setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
    }

    function goBack() {
        setActiveStep((s) => Math.max(s - 1, 0));
    }

    const stepContent: Record<string, React.ReactNode> = {
        company: <CompanyProfileStep />,
        activity: <ActivityStep />,
        signer: <SignerStep />,
        owners: <OwnersStep />,
        compliance: <ComplianceStep />,
        documents: <DocumentsStep />,
        access: <AccessStep />,
        review: <ReviewStep completedSteps={completedSteps} />,
    };

    return (
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-primary">
            {/* ── Top Bar ──────────────────────────────────────────────── */}
            <div className="shrink-0 border-b border-secondary px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FeaturedIcon icon={ReceiptCheck} color="brand" theme="light" size="sm" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-semibold text-primary">Tax Filing Portal</h1>
                                <Badge color="brand" size="sm" type="pill-color">
                                    S-Corporation (1120-S)
                                </Badge>
                            </div>
                            <p className="text-sm text-tertiary">Adaptive Tax Intake</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-success-primary">
                            <span className="size-1.5 rounded-full bg-success-solid" />
                            Auto-saving
                        </div>
                        <Button color="secondary" size="sm" iconLeading={Upload01}>
                            Upload
                        </Button>
                        <Button color="tertiary" size="sm" iconLeading={RefreshCw05}>
                            Start Over
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Step Navigation Tabs ─────────────────────────────────── */}
            <div className="shrink-0 border-b border-secondary bg-primary px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 overflow-x-auto">
                        {STEPS.map((step, i) => {
                            const isActive = i === activeStep;
                            const Icon = step.icon;
                            return (
                                <button
                                    key={step.id}
                                    type="button"
                                    onClick={() => setActiveStep(i)}
                                    className={cx(
                                        "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition duration-100 ease-linear",
                                        isActive
                                            ? "border-brand text-brand-secondary"
                                            : "border-transparent text-tertiary hover:text-secondary",
                                    )}
                                >
                                    <Icon className="size-4" />
                                    {step.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="hidden shrink-0 items-center gap-2 pl-4 text-xs text-tertiary sm:flex">
                        <Clock className="size-3.5" />
                        Your filing progress
                        <span className="font-medium text-brand-secondary">{progressPct}% complete</span>
                    </div>
                </div>
            </div>

            {/* ── Step Content ─────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-3xl px-6 py-8">
                    {stepContent[STEPS[activeStep].id]}
                </div>
            </div>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div className="shrink-0 border-t border-secondary bg-primary px-6 py-4">
                <div className="mx-auto flex max-w-3xl items-center justify-between">
                    <Button
                        color="secondary"
                        size="md"
                        iconLeading={ArrowLeft}
                        isDisabled={activeStep === 0}
                        onClick={goBack}
                    >
                        Back
                    </Button>
                    <Button
                        color="primary"
                        size="md"
                        iconTrailing={activeStep === STEPS.length - 1 ? CheckCircle : ArrowRight}
                        onClick={goNext}
                    >
                        {activeStep === STEPS.length - 1 ? "Submit Filing" : "Continue"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
