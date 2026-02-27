"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    ArrowRight,
    Check,
    CheckCircle,
    ChevronDown,
    Eye,
    Lock01,
    Shield01,
    Upload01,
    X,
} from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryId = "accounting" | "payroll" | "banking" | "expense";

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
}

interface CategoryDef {
    id: CategoryId;
    label: string;
    description: string;
    badge?: string;
    badgeColor?: "brand" | "gray";
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
    },
    {
        id: "ramp",
        name: "Ramp",
        initials: "RM",
        color: "#20B464",
        category: "expense",
        tagline: "Auto-sync corporate card transactions and receipts into your accounting.",
        sharedData: ["Card transactions", "Receipts", "Expense reports", "Merchant data"],
        time: "~1 min",
        priority: "optional",
    },
    {
        id: "expensify",
        name: "Expensify",
        initials: "EX",
        color: "#0185FF",
        category: "expense",
        tagline: "Import expense reports so nothing falls through the cracks at tax time.",
        sharedData: ["Expense reports", "Receipts", "Policy violations"],
        time: "~2 min",
        priority: "optional",
    },
];

const CATEGORIES: CategoryDef[] = [
    {
        id: "accounting",
        label: "Accounting Software",
        description: "The most important connection — this is where your books live.",
        badge: "Start here",
        badgeColor: "brand",
    },
    {
        id: "payroll",
        label: "Payroll",
        description: "Needed for tax filings, W-2s, and R&D credit calculations.",
    },
    {
        id: "banking",
        label: "Banking",
        description: "Eliminates the need to manually send statements to your CPA.",
    },
    {
        id: "expense",
        label: "Expense & Cards",
        description: "Optional — but saves hours on monthly categorization.",
        badge: "Optional",
        badgeColor: "gray",
    },
];

const MANUAL_UPLOADS = [
    { id: "bank-statements", label: "Bank Statements", hint: "CSV or PDF" },
    { id: "payroll-reports", label: "Payroll Reports", hint: "CSV or Excel" },
    { id: "tax-return", label: "Prior Tax Return", hint: "PDF" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function LogoBadge({ initials, color }: { initials: string; color: string }) {
    return (
        <div
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: color }}
        >
            {initials}
        </div>
    );
}

function IntegrationCard({
    integration,
    connected,
    connecting,
    onConnect,
    onDisconnect,
}: {
    integration: Integration;
    connected: boolean;
    connecting: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            className={cx(
                "overflow-hidden rounded-xl border bg-primary transition duration-100 ease-linear",
                connected ? "border-border-brand" : "border-secondary hover:border-primary",
            )}
        >
            <div className="p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <LogoBadge initials={integration.initials} color={integration.color} />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold leading-tight text-primary">
                                {integration.name}
                            </p>
                            <AnimatePresence>
                                {connected && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="mt-0.5 overflow-hidden"
                                    >
                                        <BadgeWithDot color="success" type="pill-color" size="sm">
                                            Connected
                                        </BadgeWithDot>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    <div className="shrink-0 pt-0.5">
                        {connected ? (
                            <button
                                type="button"
                                onClick={onDisconnect}
                                className="text-xs text-quaternary transition duration-100 ease-linear hover:text-secondary"
                            >
                                Disconnect
                            </button>
                        ) : (
                            <Button
                                color="secondary"
                                size="sm"
                                isLoading={connecting}
                                showTextWhileLoading
                                onClick={onConnect}
                                isDisabled={connecting}
                            >
                                {connecting ? "Connecting…" : "Connect"}
                            </Button>
                        )}
                    </div>
                </div>

                <p className="line-clamp-2 text-xs leading-relaxed text-tertiary">
                    {integration.tagline}
                </p>

                <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-xs text-quaternary">{integration.time}</span>
                    <span className="text-xs text-quaternary">·</span>
                    <button
                        type="button"
                        onClick={() => setExpanded((e) => !e)}
                        className="flex items-center gap-0.5 text-xs text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover"
                    >
                        What&apos;s shared?
                        <ChevronDown
                            className={cx(
                                "size-3 transition-transform duration-150",
                                expanded && "rotate-180",
                            )}
                            aria-hidden
                        />
                    </button>
                </div>
            </div>

            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        key="detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-secondary bg-secondary px-4 py-3">
                            <p className="mb-1.5 text-xs font-medium text-tertiary">
                                Read-only — no write access:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {integration.sharedData.map((item) => (
                                    <span
                                        key={item}
                                        className="rounded-md border border-secondary bg-primary px-2 py-0.5 text-xs text-secondary"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CategorySection({
    category,
    connected,
    connecting,
    onConnect,
    onDisconnect,
}: {
    category: CategoryDef;
    connected: Set<string>;
    connecting: string | null;
    onConnect: (id: string) => void;
    onDisconnect: (id: string) => void;
}) {
    const integrations = INTEGRATIONS.filter((i) => i.category === category.id);
    const connectedCount = integrations.filter((i) => connected.has(i.id)).length;

    return (
        <section>
            <div className="mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-quaternary">
                        {category.label}
                    </h3>
                    {category.badge && (
                        <Badge color={category.badgeColor ?? "gray"} type="pill-color" size="sm">
                            {category.badge}
                        </Badge>
                    )}
                    <AnimatePresence>
                        {connectedCount > 0 && (
                            <motion.span
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-xs font-medium text-success-primary"
                            >
                                {connectedCount} connected
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
                <p className="mt-0.5 text-xs text-tertiary">{category.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
                {integrations.map((integration) => (
                    <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        connected={connected.has(integration.id)}
                        connecting={connecting === integration.id}
                        onConnect={() => onConnect(integration.id)}
                        onDisconnect={() => onDisconnect(integration.id)}
                    />
                ))}
            </div>
        </section>
    );
}

function ManualUploadCard({ item }: { item: (typeof MANUAL_UPLOADS)[0] }) {
    const [uploaded, setUploaded] = useState(false);

    return (
        <button
            type="button"
            onClick={() => setUploaded(true)}
            className={cx(
                "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition duration-100 ease-linear",
                uploaded
                    ? "border-border-brand bg-brand-primary_alt"
                    : "border-dashed border-secondary bg-primary hover:border-brand hover:bg-brand-primary_alt",
            )}
        >
            {uploaded ? (
                <Check className="size-4 text-fg-success-primary" />
            ) : (
                <Upload01 className="size-4 text-fg-quaternary" />
            )}
            <div>
                <p className="text-xs font-medium text-secondary">{item.label}</p>
                <p className="text-xs text-quaternary">{item.hint}</p>
            </div>
        </button>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function IntegrationsSetup({ onComplete }: { onComplete: () => void }) {
    const [connected, setConnected] = useState<Set<string>>(new Set());
    const [connecting, setConnecting] = useState<string | null>(null);
    const [bankBannerDismissed, setBankBannerDismissed] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
    const skipPopoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!skipConfirmOpen) return;
        function handleClickOutside(e: MouseEvent) {
            if (skipPopoverRef.current && !skipPopoverRef.current.contains(e.target as Node)) {
                setSkipConfirmOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [skipConfirmOpen]);

    const totalConnected = connected.size;
    const totalRecommended = INTEGRATIONS.filter((i) => i.priority === "recommended").length;
    const progressPercent = Math.min(Math.round((totalConnected / totalRecommended) * 100), 100);

    const hasBankingConnected = INTEGRATIONS.filter((i) => i.category === "banking").some((i) =>
        connected.has(i.id),
    );

    async function handleConnect(id: string) {
        setConnecting(id);
        await new Promise((r) => setTimeout(r, 1500));
        setConnected((prev) => new Set([...prev, id]));
        setConnecting(null);
    }

    function handleDisconnect(id: string) {
        setConnected((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }

    async function handleComplete() {
        setCompleting(true);
        await new Promise((r) => setTimeout(r, 700));
        onComplete();
    }

    function getProgressMessage() {
        if (totalConnected === 0) return "Connect what you can — skip the rest for now.";
        if (totalConnected === 1) return "Good start — a few more will save time later.";
        if (totalConnected < 4) return "Your CPA is getting the access they need.";
        return "You're well set up. Your CPA has great visibility.";
    }

    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-primary">

            {/* ── Top bar — logo ──────────────────────────────────────────────── */}
            <div className="shrink-0 px-6 pt-6">
                <img src="/numix-logo.png" alt="Numix" className="h-8 w-auto" />
            </div>

            {/* ── Scrollable content ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-5xl px-6 py-8">

                    {/* Welcome + Hero header */}
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

                    {/* Progress + trust signals row */}
                    <div className="mb-8 flex items-start gap-6 rounded-xl border border-secondary bg-secondary p-5">
                        <div className="flex-1">
                            <div className="mb-1 flex items-baseline justify-between">
                                <span className="text-2xl font-semibold tabular-nums text-primary">
                                    {totalConnected}
                                    <span className="text-base font-normal text-tertiary"> / {totalRecommended}</span>
                                </span>
                                <span className="text-xs text-tertiary">connections made</span>
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary">
                                <motion.div
                                    className="h-full rounded-full bg-brand-solid"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                />
                            </div>
                            <p className="mt-2 text-xs text-tertiary">{getProgressMessage()}</p>
                        </div>
                        <div className="hidden shrink-0 space-y-2 border-l border-secondary pl-6 sm:block">
                            <div className="flex items-center gap-2">
                                <Lock01 className="size-3.5 shrink-0 text-fg-quaternary" aria-hidden />
                                <span className="text-xs text-tertiary">Read-only — we can&apos;t move money</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield01 className="size-3.5 shrink-0 text-fg-quaternary" aria-hidden />
                                <span className="text-xs text-tertiary">Bank-grade encryption</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Eye className="size-3.5 shrink-0 text-fg-quaternary" aria-hidden />
                                <span className="text-xs text-tertiary">Used only for accounting & tax</span>
                            </div>
                        </div>
                    </div>

                    {/* Banking connected smart banner */}
                    <AnimatePresence>
                        {hasBankingConnected && !bankBannerDismissed && (
                            <motion.div
                                initial={{ opacity: 0, y: -6, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto", marginBottom: 20 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                transition={{ duration: 0.22 }}
                                className="overflow-hidden"
                            >
                                <div className="flex items-start gap-3 rounded-xl border border-border-brand bg-brand-primary_alt px-4 py-3.5">
                                    <CheckCircle className="mt-0.5 size-4 shrink-0 text-fg-brand-primary" aria-hidden />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-brand-secondary">
                                            Bank connected — no more statement requests
                                        </p>
                                        <p className="mt-0.5 text-xs text-tertiary">
                                            Your CPA can now pull transactions directly. Manual bank
                                            uploads are no longer needed.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setBankBannerDismissed(true)}
                                        className="shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                                        aria-label="Dismiss"
                                    >
                                        <X className="size-4" aria-hidden />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Category sections */}
                    <div className="space-y-6">
                        {CATEGORIES.map((category) => (
                            <CategorySection
                                key={category.id}
                                category={category}
                                connected={connected}
                                connecting={connecting}
                                onConnect={handleConnect}
                                onDisconnect={handleDisconnect}
                            />
                        ))}

                        {/* Manual upload fallback */}
                        <section>
                            <div className="mb-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-quaternary">
                                    Not using any of these tools?
                                </h3>
                                <p className="mt-0.5 text-xs text-tertiary">
                                    Upload documents directly — your CPA will handle the rest.
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {MANUAL_UPLOADS.map((item) => (
                                    <ManualUploadCard key={item.id} item={item} />
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* ── Bottom CTA bar ──────────────────────────────────────────────── */}
            <div className="shrink-0 border-t border-secondary bg-primary px-6 py-4">
                <div className="mx-auto flex max-w-5xl items-center justify-end gap-3">
                    <div className="relative" ref={skipPopoverRef}>
                        <Button
                            color="primary"
                            size="md"
                            iconTrailing={completing ? undefined : ArrowRight}
                            isLoading={completing}
                            showTextWhileLoading
                            onClick={() => setSkipConfirmOpen((o) => !o)}
                            isDisabled={completing}
                        >
                            Go to my dashboard
                        </Button>

                        {/* Confirmation popover */}
                        <AnimatePresence>
                            {skipConfirmOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full right-0 z-50 mb-2 w-80 rounded-xl border border-secondary bg-primary p-4 shadow-lg"
                                >
                                    <p className="text-sm font-semibold text-primary">
                                        {totalConnected === 0
                                            ? "Nothing connected yet — that's okay"
                                            : `${totalConnected} connection${totalConnected === 1 ? "" : "s"} made`}
                                    </p>
                                    <p className="mt-1.5 text-xs leading-relaxed text-tertiary">
                                        {totalConnected === 0
                                            ? "Your CPA will follow up on anything they need. You can always reconnect from "
                                            : "Your CPA will be notified and get started. You can manage connections anytime from "}
                                        <span className="font-semibold text-secondary">Settings</span>
                                        {" "}in your dashboard sidebar.
                                    </p>
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSkipConfirmOpen(false)}
                                            className="flex-1 rounded-lg border border-secondary py-1.5 text-xs font-medium text-secondary transition duration-100 ease-linear hover:bg-primary_hover"
                                        >
                                            Stay here
                                        </button>
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setSkipConfirmOpen(false);
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
