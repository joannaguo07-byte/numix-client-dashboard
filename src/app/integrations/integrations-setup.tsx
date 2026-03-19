"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle,
    ChevronDown,
    Clock,
    CreditCard01,
    CoinsStacked01,
    BookOpen01,
    InfoCircle,
    Key01,
    Shield01,
} from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryId = "payroll" | "accounting" | "banking";

interface Integration {
    id: string;
    name: string;
    initials: string;
    color: string;
    category: CategoryId;
    tagline: string;
    sharedData: string[];
    time: string;
    priority: "recommended" | "optional";
    steps: string[];
    details: { name: string; email: string; role: string };
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const INTEGRATIONS: Integration[] = [
    {
        id: "quickbooks",
        name: "QuickBooks Online",
        initials: "QB",
        color: "#2CA01C",
        category: "accounting",
        tagline: "Sync your books so your CPA can run reports without asking you for exports.",
        sharedData: ["Chart of accounts", "Transactions", "Invoices & bills", "Vendor list"],
        time: "~2 min",
        priority: "recommended",
        steps: [
            "Sign in to QuickBooks Online as the Admin",
            "Go to Settings ⚙ → Manage Users",
            "Click Accounting Firms → Invite",
            "Enter the accountant email address below",
            "Select All Access permission level",
            "Click Save and send invitation",
        ],
        details: { name: "Numix Finance Team", email: "onboarding@numix.co", role: "Accountant (All Access)" },
    },
    {
        id: "xero",
        name: "Xero",
        initials: "XR",
        color: "#13B5EA",
        category: "accounting",
        tagline: "Connect your accounting software for real-time bookkeeping visibility.",
        sharedData: ["Chart of accounts", "Transactions", "Bank feeds", "Contact list"],
        time: "~2 min",
        priority: "recommended",
        steps: [
            "Sign in to Xero as the Subscriber or Admin",
            "Go to Settings → General Settings → Users",
            "Click Invite a User",
            "Enter the email address below",
            "Set role to Adviser",
            "Click Send Invite",
        ],
        details: { name: "Numix Finance Team", email: "onboarding@numix.co", role: "Adviser" },
    },
    {
        id: "gusto",
        name: "Gusto",
        initials: "GU",
        color: "#F45B35",
        category: "payroll",
        tagline: "Share payroll records for tax filings and R&D credit calculations.",
        sharedData: ["Payroll runs", "Employee list", "Contractor payments", "Tax withholdings"],
        time: "~3 min",
        priority: "recommended",
        steps: [
            "Sign in to Gusto as the Primary Administrator",
            "Go to Settings → Permissions",
            "In the Gusto Admins card, click Add or edit admins",
            "Click Add new admin",
            "Select Not an employee and choose Accountant",
            "Enter: Name: Numix Finance Team, Email: onboarding@numix.co",
            "Select Role: Full Access (Global Admin) — Allows payroll, filings, and compliance review",
            "Click Add Admin",
        ],
        details: { name: "Numix Finance Team", email: "onboarding@numix.co", role: "Full Access (Global Admin)" },
    },
    {
        id: "rippling",
        name: "Rippling",
        initials: "RP",
        color: "#5C4BF5",
        category: "payroll",
        tagline: "Pull payroll data automatically for accurate quarterly filings.",
        sharedData: ["Payroll history", "Benefits data", "Headcount reports"],
        time: "~3 min",
        priority: "recommended",
        steps: [
            "Sign in to Rippling as an Admin",
            "Go to Company Settings → User Management",
            "Click Invite User",
            "Enter the email address below",
            "Assign the Payroll Admin role",
            "Click Send Invite",
        ],
        details: { name: "Numix Finance Team", email: "onboarding@numix.co", role: "Payroll Admin" },
    },
    {
        id: "deel",
        name: "Deel",
        initials: "DL",
        color: "#19181A",
        category: "payroll",
        tagline: "Import global contractor payments for 1099 and international tax reporting.",
        sharedData: ["Contractor payments", "Worker classification", "Contract history"],
        time: "~2 min",
        priority: "recommended",
        steps: [
            "Sign in to Deel as an Admin",
            "Go to Organization Settings → Team Members",
            "Click Invite Member",
            "Enter the email address below",
            "Set role to Finance Manager",
            "Click Send Invite",
        ],
        details: { name: "Numix Finance Team", email: "onboarding@numix.co", role: "Finance Manager" },
    },
    {
        id: "mercury",
        name: "Mercury",
        initials: "MC",
        color: "#1E2A3A",
        category: "banking",
        tagline: "Read-only access to your transactions — no more manual statement uploads.",
        sharedData: ["Account balances", "Transaction history", "Wire transfers"],
        time: "~1 min",
        priority: "recommended",
        steps: [
            "Sign in to Mercury as an Admin",
            "Go to Settings → Team",
            "Click Invite a teammate",
            "Enter the email address below",
            "Set role to Bookkeeper (read-only)",
            "Click Send Invite",
        ],
        details: { name: "Numix Finance Team", email: "onboarding@numix.co", role: "Bookkeeper (Read-only)" },
    },
    {
        id: "chase",
        name: "Chase Business",
        initials: "CH",
        color: "#117ACA",
        category: "banking",
        tagline: "Connect your business checking for automatic transaction categorization.",
        sharedData: ["Account balances", "Transaction history", "Check images"],
        time: "~2 min",
        priority: "recommended",
        steps: [
            "Sign in to Chase Business Online",
            "Go to Administration → Manage Users",
            "Click Add User",
            "Enter the name and email below",
            "Select View Only access for the accounts",
            "Submit and confirm via verification code",
        ],
        details: { name: "Numix Finance Team", email: "onboarding@numix.co", role: "View Only" },
    },
    {
        id: "brex",
        name: "Brex",
        initials: "BX",
        color: "#FF5233",
        category: "banking",
        tagline: "Sync card transactions and receipts directly into your books.",
        sharedData: ["Card transactions", "Receipts", "Monthly statements"],
        time: "~1 min",
        priority: "recommended",
        steps: [
            "Sign in to Brex as an Account Admin",
            "Go to Settings → Team",
            "Click Invite User",
            "Enter the email address below",
            "Set role to Bookkeeper",
            "Click Send Invite",
        ],
        details: { name: "Numix Finance Team", email: "onboarding@numix.co", role: "Bookkeeper" },
    },
    {
        id: "svb",
        name: "Silicon Valley Bank",
        initials: "SV",
        color: "#C8102E",
        category: "banking",
        tagline: "Pull bank transactions automatically for cleaner monthly closes.",
        sharedData: ["Account balances", "Transaction history"],
        time: "~2 min",
        priority: "recommended",
        steps: [
            "Sign in to SVB Online Banking as an Admin",
            "Go to Administration → User Management",
            "Click Add New User",
            "Enter the name and email below",
            "Select View Only entitlements",
            "Click Submit",
        ],
        details: { name: "Numix Finance Team", email: "onboarding@numix.co", role: "View Only" },
    },
];

const ACCESS_CATEGORIES = [
    {
        id: "payroll" as CategoryId,
        label: "Payroll Systems",
        accessLabel: "Payroll Access",
        description: "Used for wage validation, R&D credit calc, officer comp",
        icon: CoinsStacked01,
    },
    {
        id: "accounting" as CategoryId,
        label: "Ledger / Accounting",
        accessLabel: "Ledger Access",
        description: "Used to ingest Chart of Accounts + transactions",
        icon: BookOpen01,
    },
    {
        id: "banking" as CategoryId,
        label: "Banking / Spend Platforms",
        accessLabel: "Banking Access",
        description: "Used for reconciliation + expense classification",
        icon: CreditCard01,
    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function LogoBadge({ initials, color }: { initials: string; color: string }) {
    return (
        <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
            style={{ backgroundColor: color }}
        >
            {initials}
        </div>
    );
}

function GrantAccessDetail({
    integration,
    onBack,
    onGranted,
}: {
    integration: Integration;
    onBack: () => void;
    onGranted: () => void;
}) {
    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-primary">
            {/* ── Top bar ─────────────────────────────────────────────────── */}
            <div className="shrink-0 px-6 pt-6">
                <img src="/numix-logo.png" alt="Numix" className="h-8 w-auto" />
            </div>

            {/* ── Scrollable content ──────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-2xl px-6 py-8">
                    {/* Page header */}
                    <div className="mb-4">
                        <h1 className="text-2xl font-semibold text-primary">Grant Access</h1>
                    </div>

                    {/* Back link */}
                    <button
                        type="button"
                        onClick={onBack}
                        className="mb-6 flex items-center gap-1.5 text-sm font-medium text-secondary transition duration-100 ease-linear hover:text-primary"
                    >
                        <ArrowLeft className="size-4" aria-hidden />
                        Back to Grant Access
                    </button>

                    {/* Integration header card */}
                    <div className="mb-6 rounded-xl border border-secondary p-5">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-secondary">
                                <Key01 className="size-5 text-fg-brand-primary" aria-hidden />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-primary">
                                    Grant Numix Access to {integration.name}
                                </h2>
                                <p className="mt-0.5 text-sm text-tertiary">
                                    Follow these steps to securely authorize Numix as your accountant. This takes about {integration.time.replace("~", "")}.
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-tertiary">
                            <Clock className="size-3.5" aria-hidden />
                            Takes about {integration.time.replace("~", "")}
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="mb-6">
                        <h3 className="mb-4 text-sm font-semibold text-primary">
                            Steps to Grant Accountant Access
                        </h3>
                        <div className="space-y-3">
                            {integration.steps.map((step, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-xs font-semibold text-brand-secondary">
                                        {i + 1}
                                    </span>
                                    <p className="pt-1 text-sm text-secondary">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Details to enter */}
                    <div className="mb-6 rounded-xl border border-brand bg-brand-secondary p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <InfoCircle className="size-4 text-fg-brand-primary" aria-hidden />
                            <span className="text-sm font-semibold text-primary">Details to enter:</span>
                        </div>
                        <div className="space-y-1 pl-6">
                            <p className="text-sm text-secondary">
                                Name: <span className="font-semibold">{integration.details.name}</span>
                            </p>
                            <p className="text-sm text-secondary">
                                Email: <span className="font-semibold">{integration.details.email}</span>
                            </p>
                            <p className="text-sm text-secondary">
                                Role: <span className="font-semibold">{integration.details.role}</span>
                            </p>
                        </div>
                    </div>

                    {/* Done note */}
                    <p className="text-center text-sm text-tertiary">
                        You&apos;re done. The platform will notify us automatically.
                    </p>
                </div>
            </div>

            {/* ── Footer bar ──────────────────────────────────────────────── */}
            <div className="shrink-0 px-6 py-4">
                <div className="mx-auto max-w-2xl">
                    <Button
                        color="primary"
                        size="lg"
                        iconLeading={CheckCircle}
                        onClick={onGranted}
                        className="w-full"
                    >
                        I&apos;ve Granted Access
                    </Button>
                </div>
            </div>
        </div>
    );
}

function CategoryRow({
    category,
    connected,
    onSelect,
}: {
    category: (typeof ACCESS_CATEGORIES)[0];
    connected: Set<string>;
    onSelect: (integration: Integration) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const integrations = INTEGRATIONS.filter((i) => i.category === category.id);
    const connectedCount = integrations.filter((i) => connected.has(i.id)).length;
    const hasConnection = connectedCount > 0;
    const Icon = category.icon;

    return (
        <div className="overflow-hidden rounded-xl border border-secondary">
            <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="flex w-full items-center gap-3 p-4 text-left transition duration-100 ease-linear hover:bg-primary_hover"
            >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-secondary">
                    <Icon className="size-5 text-fg-brand-primary" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary">{category.label}</p>
                    <p className="text-xs text-tertiary">{category.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {hasConnection && (
                        <BadgeWithDot color="success" type="pill-color" size="sm">
                            {connectedCount} connected
                        </BadgeWithDot>
                    )}
                    <ChevronDown
                        className={cx(
                            "size-5 text-fg-quaternary transition-transform duration-150",
                            expanded && "rotate-180",
                        )}
                        aria-hidden
                    />
                </div>
            </button>

            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        key="integrations"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-secondary">
                            {integrations.map((integration) => {
                                const isConnected = connected.has(integration.id);

                                return (
                                    <div
                                        key={integration.id}
                                        className="flex items-center gap-3 border-b border-secondary px-4 py-3 last:border-b-0"
                                    >
                                        <LogoBadge initials={integration.initials} color={integration.color} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-primary">{integration.name}</p>
                                            <p className="text-xs text-tertiary">{integration.tagline}</p>
                                        </div>
                                        <div className="shrink-0">
                                            {isConnected ? (
                                                <span className="flex items-center gap-1 text-xs font-medium text-success-primary">
                                                    <Check className="size-3.5" aria-hidden />
                                                    Access Granted
                                                </span>
                                            ) : (
                                                <Button
                                                    color="primary"
                                                    size="sm"
                                                    onClick={() => onSelect(integration)}
                                                >
                                                    Grant access to {integration.name}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function IntegrationsSetup({
    onComplete,
    onBack,
}: {
    onComplete: (connectedCount: number, totalCount: number) => void;
    onBack?: () => void;
}) {
    const [connected, setConnected] = useState<Set<string>>(new Set());
    const [completing, setCompleting] = useState(false);
    const [activeIntegration, setActiveIntegration] = useState<Integration | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const confirmRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!confirmOpen) return;
        function handleClickOutside(e: MouseEvent) {
            if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) {
                setConfirmOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [confirmOpen]);

    function handleGranted(id: string) {
        setConnected((prev) => new Set([...prev, id]));
        setActiveIntegration(null);
    }

    const allConnected = ACCESS_CATEGORIES.every((cat) =>
        INTEGRATIONS.filter((i) => i.category === cat.id).some((i) => connected.has(i.id)),
    );

    async function handleComplete() {
        setCompleting(true);
        await new Promise((r) => setTimeout(r, 700));
        onComplete(connected.size, INTEGRATIONS.length);
    }

    function getCategoryStatus(categoryId: CategoryId) {
        const integrations = INTEGRATIONS.filter((i) => i.category === categoryId);
        return integrations.some((i) => connected.has(i.id));
    }

    // ── Detail page ──────────────────────────────────────────────────────────
    if (activeIntegration) {
        return (
            <GrantAccessDetail
                integration={activeIntegration}
                onBack={() => setActiveIntegration(null)}
                onGranted={() => handleGranted(activeIntegration.id)}
            />
        );
    }

    // ── Main list page ───────────────────────────────────────────────────────
    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-primary">
            {/* ── Top bar — logo ──────────────────────────────────────────────── */}
            <div className="shrink-0 px-6 pt-6">
                <img src="/numix-logo.png" alt="Numix" className="h-8 w-auto" />
            </div>

            {/* ── Scrollable content ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-2xl px-6 py-8">
                    {/* Welcome header */}
                    <div className="mb-6 text-center">
                        <h1 className="mb-1 text-3xl font-semibold text-primary">Welcome to Numix! 👋</h1>
                        <p className="mb-4 text-lg text-tertiary">Let&apos;s connect your accounts</p>
                        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-secondary bg-secondary px-2.5 py-1">
                            <div className="size-1.5 rounded-full bg-brand-solid" />
                            <span className="text-xs font-medium text-secondary">
                                Set up by your CPA at Numix
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-tertiary">
                            We need read-only access to pull your financial data — takes about 3–5 minutes. Skip anything and come back later.
                        </p>
                    </div>

                    {/* Access Status card */}
                    <div className="mb-6 rounded-xl border border-secondary p-4">
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-quaternary">
                            Access Status
                        </p>
                        <div className="space-y-2.5">
                            {ACCESS_CATEGORIES.map((cat) => {
                                const isConnected = getCategoryStatus(cat.id);
                                return (
                                    <div key={cat.id} className="flex items-center justify-between">
                                        <span className="text-sm text-secondary">{cat.accessLabel}</span>
                                        {isConnected ? (
                                            <span className="flex items-center gap-1 text-xs font-medium text-success-primary">
                                                <Check className="size-3.5" aria-hidden />
                                                Connected
                                            </span>
                                        ) : (
                                            <span className="text-xs font-medium text-warning-primary">
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Category rows */}
                    <div className="mb-6 space-y-3">
                        {ACCESS_CATEGORIES.map((category) => (
                            <CategoryRow
                                key={category.id}
                                category={category}
                                connected={connected}
                                onSelect={setActiveIntegration}
                            />
                        ))}
                    </div>

                    {/* Bottom note */}
                    <p className="text-center text-xs text-tertiary">
                        You can finish this later. Granting access helps us run bookkeeping and tax
                        preparation on your behalf.
                    </p>
                </div>
            </div>

            {/* ── Footer bar ──────────────────────────────────────────────────── */}
            <div className="shrink-0 border-t border-secondary bg-primary px-6 py-4">
                <div className="mx-auto flex max-w-2xl items-center justify-between">
                    <Button
                        color="secondary"
                        size="md"
                        iconLeading={ArrowLeft}
                        onClick={onBack}
                    >
                        Back
                    </Button>
                    <div className="relative" ref={confirmRef}>
                        <Button
                            color="primary"
                            size="md"
                            iconTrailing={completing ? undefined : ArrowRight}
                            isLoading={completing}
                            showTextWhileLoading
                            onClick={() => {
                                if (allConnected) {
                                    handleComplete();
                                } else {
                                    setConfirmOpen((o) => !o);
                                }
                            }}
                            isDisabled={completing}
                        >
                            Continue
                        </Button>

                        <AnimatePresence>
                            {confirmOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full right-0 z-50 mb-2 w-80 rounded-xl border border-secondary bg-primary p-4 shadow-lg"
                                >
                                    <p className="text-sm font-semibold text-primary">
                                        {connected.size === 0
                                            ? "No access granted yet"
                                            : `${connected.size} connection${connected.size === 1 ? "" : "s"} made`}
                                    </p>
                                    <p className="mt-1.5 text-xs leading-relaxed text-tertiary">
                                        {connected.size === 0
                                            ? "You haven't granted access to any platforms yet. You can always finish this from "
                                            : "Some platforms still need access. You can finish granting access anytime from "}
                                        <span className="font-semibold text-secondary">Settings</span>
                                        {" "}in your dashboard sidebar.
                                    </p>
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setConfirmOpen(false)}
                                            className="flex-1 rounded-lg border border-secondary py-1.5 text-xs font-medium text-secondary transition duration-100 ease-linear hover:bg-primary_hover"
                                        >
                                            Stay here
                                        </button>
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setConfirmOpen(false);
                                                handleComplete();
                                            }}
                                        >
                                            Got it, continue
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
