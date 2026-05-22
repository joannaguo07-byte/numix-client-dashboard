"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    ArrowLeft,
    ArrowRight,
    Bell01,
    Check,
    CheckCircle,
    ChevronDown,
    Clock,
    CreditCard01,
    BookOpen01,
    InfoCircle,
    Key01,
    Plus,
    Shield01,
} from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryId = "accounting" | "banking" | "notifications";

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
    // Optional URL to a brand logo (SVG). When set, LogoBadge renders the
    // image instead of the colored-initial fallback.
    logoUrl?: string;
    // Optional privacy/limitation note rendered as a callout on the detail
    // page. Used for inbox-style integrations where Numix only ingests a
    // subset of messages and the user needs to see the boundary.
    privacyNote?: string;
}

const EMAIL_PRIVACY_NOTE = "Numix only pulls emails related to your finances: invoices, receipts, IRS notices, vendor bills, and payment confirmations. We never read personal emails, calendar, contacts, or drafts. The filter rules are visible and editable in Settings → Integrations.";

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
        logoUrl: "https://cdn.simpleicons.org/quickbooks",
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
        logoUrl: "https://cdn.simpleicons.org/xero",
    },
    {
        id: "mercury",
        name: "Mercury",
        initials: "MC",
        color: "#1E2A3A",
        category: "banking",
        tagline: "Read-only access to your transactions, no more manual statement uploads.",
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
        logoUrl: "https://www.google.com/s2/favicons?domain=mercury.com&sz=128",
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
        logoUrl: "https://www.google.com/s2/favicons?domain=chase.com&sz=128",
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
        logoUrl: "https://cdn.simpleicons.org/brex",
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
        logoUrl: "https://www.google.com/s2/favicons?domain=svb.com&sz=128",
    },
    {
        id: "gmail",
        name: "Gmail",
        initials: "GM",
        color: "#EA4335",
        category: "notifications",
        tagline: "Auto-pull financial emails (invoices, receipts, IRS notices) from Gmail and Google Workspace.",
        sharedData: ["Financial emails matching filters", "Tax-related correspondence", "Vendor & payment notifications"],
        time: "~1 min",
        priority: "recommended",
        steps: [
            "Click \"Continue with Google\" below",
            "Sign in to your Google account",
            "Review the read-only scopes on Google's consent screen",
            "Click Allow. Numix immediately starts ingesting matched emails.",
        ],
        details: { name: "olivia@acme.com", email: "tax-reminders@numix.ai", role: "Read-only (filtered)" },
        logoUrl: "https://cdn.simpleicons.org/gmail",
        privacyNote: EMAIL_PRIVACY_NOTE,
    },
    {
        id: "outlook",
        name: "Outlook 365",
        initials: "OL",
        color: "#0078D4",
        category: "notifications",
        tagline: "Auto-pull financial emails from Outlook, Microsoft 365, and Hotmail accounts.",
        sharedData: ["Financial emails matching filters", "Tax-related correspondence", "Vendor & payment notifications"],
        time: "~1 min",
        priority: "recommended",
        steps: [
            "Click \"Continue with Microsoft\" below",
            "Sign in with your Microsoft 365 account",
            "Review the read-only scopes on the Microsoft consent dialog",
            "Click Accept. Numix immediately starts ingesting matched emails.",
        ],
        details: { name: "olivia@acme.com", email: "tax-reminders@numix.ai", role: "Read-only (filtered)" },
        logoUrl: "https://cdn.simpleicons.org/microsoftoutlook",
        privacyNote: EMAIL_PRIVACY_NOTE,
    },
    {
        id: "icloud-mail",
        name: "iCloud Mail",
        initials: "IC",
        color: "#007AFF",
        category: "notifications",
        tagline: "Auto-pull financial emails from your Apple iCloud Mail account.",
        sharedData: ["Financial emails matching filters", "Tax-related correspondence", "Vendor & payment notifications"],
        time: "~3 min",
        priority: "optional",
        steps: [
            "Sign in at appleid.apple.com and go to Sign-In and Security",
            "Generate an app-specific password labelled \"Numix\"",
            "Paste the password into the field Numix shows next",
            "Numix verifies the IMAP connection automatically",
        ],
        details: { name: "olivia@icloud.com", email: "tax-reminders@numix.ai", role: "Read-only (filtered)" },
        logoUrl: "https://cdn.simpleicons.org/icloud",
        privacyNote: EMAIL_PRIVACY_NOTE,
    },
    {
        id: "yahoo-mail",
        name: "Yahoo Mail",
        initials: "YM",
        color: "#6001D2",
        category: "notifications",
        tagline: "Auto-pull financial emails from your Yahoo Mail or AOL Mail account.",
        sharedData: ["Financial emails matching filters", "Tax-related correspondence", "Vendor & payment notifications"],
        time: "~3 min",
        priority: "optional",
        steps: [
            "Open Yahoo Account Info → Account Security",
            "Generate an app password labelled \"Numix\"",
            "Paste the password into the field Numix shows next",
            "Numix verifies the IMAP connection automatically",
        ],
        details: { name: "olivia@yahoo.com", email: "tax-reminders@numix.ai", role: "Read-only (filtered)" },
        logoUrl: "https://cdn.simpleicons.org/yahoo",
        privacyNote: EMAIL_PRIVACY_NOTE,
    },
    {
        id: "slack",
        name: "Slack",
        initials: "SL",
        color: "#4A154B",
        category: "notifications",
        tagline: "Get reminders and updates in your team's Slack workspace.",
        sharedData: ["Channel notifications", "Direct messages", "File uploads"],
        time: "~2 min",
        priority: "recommended",
        steps: [
            "Click \"Add to Slack\" below",
            "Sign in to your Slack workspace as an Admin",
            "Choose a channel for Numix to post in (e.g. #finance)",
            "Click Allow to install the Numix app",
        ],
        details: { name: "Acme Workspace", email: "numix-app@slack.com", role: "Channel: #finance" },
        logoUrl: "https://cdn.simpleicons.org/slack",
    },
    {
        id: "sms",
        name: "SMS",
        initials: "TX",
        color: "#10B981",
        category: "notifications",
        tagline: "Get critical tax-deadline reminders by text message.",
        sharedData: ["Deadline reminders", "Payment confirmations", "Critical alerts"],
        time: "~30 sec",
        priority: "optional",
        steps: [
            "Enter your mobile number below",
            "Reply YES to the verification text we send",
            "Pick which alert types you want by SMS",
        ],
        details: { name: "+1 (415) 555-0123", email: "+1 (415) 555-NUMIX", role: "SMS Notifications" },
    },
];

const ACCESS_CATEGORIES = [
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
    {
        id: "notifications" as CategoryId,
        label: "Notifications & Channels",
        accessLabel: "Notification Access",
        description: "Where Numix reaches you with reminders and updates",
        icon: Bell01,
    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function LogoBadge({ initials, color, logoUrl }: { initials: string; color: string; logoUrl?: string }) {
    const [imgFailed, setImgFailed] = useState(false);
    if (logoUrl && !imgFailed) {
        return (
            <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-secondary bg-white">
                <img
                    src={logoUrl}
                    alt=""
                    className="size-5"
                    onError={() => setImgFailed(true)}
                />
            </div>
        );
    }
    return (
        <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
            style={{ backgroundColor: color }}
        >
            {initials}
        </div>
    );
}

function ChannelConnectForm({
    integration,
    existingCount,
    onConnected,
}: {
    integration: Integration;
    existingCount: number;
    onConnected: (identifier: string) => void;
}) {
    const [step, setStep] = useState<"input" | "verifying" | "success">("input");
    // When adding a second account, start with an empty field instead of the
    // prefilled default so the user doesn't accidentally re-add the same one.
    const defaultEmail = existingCount > 0 ? "" : integration.details.name;
    const [emailValue, setEmailValue] = useState(defaultEmail);
    const [pwValue, setPwValue] = useState("");
    const [workspaceValue, setWorkspaceValue] = useState(existingCount > 0 ? "" : "acme");
    const [channelValue, setChannelValue] = useState(existingCount > 0 ? "" : "finance");
    const [phoneValue, setPhoneValue] = useState(existingCount > 0 ? "" : "+1 (415) 555-0123");
    const [codeValue, setCodeValue] = useState("");
    const [codeSent, setCodeSent] = useState(false);

    function captureIdentifier(): string {
        if (integration.id === "slack") return `${workspaceValue}.slack.com · #${channelValue}`;
        if (integration.id === "sms") return phoneValue;
        return emailValue;
    }

    function simulateConnect() {
        const identifier = captureIdentifier();
        setStep("verifying");
        setTimeout(() => {
            setStep("success");
            setTimeout(() => onConnected(identifier), 700);
        }, 1200);
    }

    if (step === "verifying" || step === "success") {
        return (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-secondary bg-secondary/40 px-6 py-10 text-center">
                {step === "verifying" ? (
                    <>
                        <div className="size-10 animate-spin rounded-full border-2 border-secondary border-t-brand" />
                        <p className="text-sm font-semibold text-primary">
                            {integration.id === "gmail" || integration.id === "outlook"
                                ? `Authorizing with ${integration.name}…`
                                : integration.id === "slack"
                                    ? "Installing Numix into your Slack workspace…"
                                    : integration.id === "sms"
                                        ? "Verifying your phone number…"
                                        : `Verifying ${integration.name} connection…`}
                        </p>
                        <p className="text-xs text-tertiary">This usually takes a few seconds.</p>
                    </>
                ) : (
                    <>
                        <div className="flex size-10 items-center justify-center rounded-full bg-success-secondary">
                            <CheckCircle className="size-6 text-fg-success-primary" />
                        </div>
                        <p className="text-sm font-semibold text-primary">Connected to {integration.name}</p>
                        <p className="text-xs text-tertiary">Numix will start syncing in the background.</p>
                    </>
                )}
            </div>
        );
    }

    // OAuth flow (Gmail, Outlook)
    if (integration.id === "gmail" || integration.id === "outlook") {
        const providerLabel = integration.id === "gmail" ? "Google" : "Microsoft";
        return (
            <div className="space-y-4 rounded-xl border border-secondary p-5">
                <div>
                    <label className="text-xs font-medium text-secondary">Email address</label>
                    <input
                        type="email"
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary placeholder:text-placeholder focus:border-brand focus:outline-none"
                        placeholder={`you@${integration.id === "gmail" ? "company.com" : "outlook.com"}`}
                    />
                </div>
                <button
                    type="button"
                    onClick={simulateConnect}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-secondary bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-xs transition duration-100 ease-linear hover:bg-gray-50"
                    disabled={!emailValue.trim()}
                >
                    {integration.logoUrl && <img src={integration.logoUrl} alt="" className="size-4" />}
                    Continue with {providerLabel}
                </button>
                <p className="text-center text-xs text-tertiary">
                    You&apos;ll be asked to review the read-only permissions Numix needs.
                </p>
            </div>
        );
    }

    // IMAP + app-specific password (iCloud, Yahoo)
    if (integration.id === "icloud-mail" || integration.id === "yahoo-mail") {
        const helpUrl = integration.id === "icloud-mail" ? "https://appleid.apple.com" : "https://login.yahoo.com/account/security";
        return (
            <div className="space-y-4 rounded-xl border border-secondary p-5">
                <div>
                    <label className="text-xs font-medium text-secondary">Email address</label>
                    <input
                        type="email"
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary placeholder:text-placeholder focus:border-brand focus:outline-none"
                        placeholder={integration.id === "icloud-mail" ? "you@icloud.com" : "you@yahoo.com"}
                    />
                </div>
                <div>
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-secondary">App-specific password</label>
                        <a href={helpUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-brand-secondary hover:underline">
                            How to generate
                        </a>
                    </div>
                    <input
                        type="password"
                        value={pwValue}
                        onChange={(e) => setPwValue(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary placeholder:text-placeholder focus:border-brand focus:outline-none"
                        placeholder="xxxx-xxxx-xxxx-xxxx"
                    />
                </div>
                <Button color="primary" size="md" onClick={simulateConnect} isDisabled={!emailValue.trim() || !pwValue.trim()} className="w-full">
                    Verify and connect
                </Button>
            </div>
        );
    }

    // Slack "Add to Slack" flow
    if (integration.id === "slack") {
        return (
            <div className="space-y-4 rounded-xl border border-secondary p-5">
                <div>
                    <label className="text-xs font-medium text-secondary">Slack workspace</label>
                    <div className="mt-1.5 flex items-center rounded-lg border border-secondary bg-primary focus-within:border-brand">
                        <input
                            type="text"
                            value={workspaceValue}
                            onChange={(e) => setWorkspaceValue(e.target.value)}
                            className="flex-1 rounded-l-lg bg-transparent px-3 py-2 text-sm text-primary placeholder:text-placeholder focus:outline-none"
                            placeholder="acme"
                        />
                        <span className="border-l border-secondary px-3 py-2 text-sm text-tertiary">.slack.com</span>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-medium text-secondary">Channel to post in</label>
                    <div className="mt-1.5 flex items-center rounded-lg border border-secondary bg-primary focus-within:border-brand">
                        <span className="border-r border-secondary px-3 py-2 text-sm text-tertiary">#</span>
                        <input
                            type="text"
                            value={channelValue}
                            onChange={(e) => setChannelValue(e.target.value)}
                            className="flex-1 rounded-r-lg bg-transparent px-3 py-2 text-sm text-primary placeholder:text-placeholder focus:outline-none"
                            placeholder="finance"
                        />
                    </div>
                </div>
                <button
                    type="button"
                    onClick={simulateConnect}
                    disabled={!workspaceValue.trim() || !channelValue.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4A154B] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition duration-100 ease-linear hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {integration.logoUrl && (
                        <span className="flex size-4 items-center justify-center rounded bg-white">
                            <img src={integration.logoUrl} alt="" className="size-3" />
                        </span>
                    )}
                    Add to Slack
                </button>
            </div>
        );
    }

    // SMS phone + code flow
    if (integration.id === "sms") {
        return (
            <div className="space-y-4 rounded-xl border border-secondary p-5">
                <div>
                    <label className="text-xs font-medium text-secondary">Mobile number</label>
                    <input
                        type="tel"
                        value={phoneValue}
                        onChange={(e) => setPhoneValue(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary placeholder:text-placeholder focus:border-brand focus:outline-none"
                        placeholder="+1 (___) ___-____"
                        disabled={codeSent}
                    />
                </div>
                {!codeSent ? (
                    <Button color="primary" size="md" onClick={() => setCodeSent(true)} isDisabled={!phoneValue.trim()} className="w-full">
                        Send verification code
                    </Button>
                ) : (
                    <>
                        <div>
                            <label className="text-xs font-medium text-secondary">6-digit code</label>
                            <input
                                type="text"
                                value={codeValue}
                                onChange={(e) => setCodeValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                className="mt-1.5 w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-center text-lg font-semibold tracking-[0.5em] text-primary placeholder:tracking-normal placeholder:text-placeholder focus:border-brand focus:outline-none"
                                placeholder="••••••"
                                autoFocus
                            />
                            <p className="mt-1 text-xs text-tertiary">
                                We sent a code to {phoneValue}.{" "}
                                <button type="button" onClick={() => setCodeSent(false)} className="font-medium text-brand-secondary hover:underline">
                                    Edit number
                                </button>
                            </p>
                        </div>
                        <Button color="primary" size="md" onClick={simulateConnect} isDisabled={codeValue.length !== 6} className="w-full">
                            Verify and connect
                        </Button>
                    </>
                )}
            </div>
        );
    }

    // Fallback (shouldn't hit for current channel set, but keeps the type
    // exhaustive if a new channel is added without a form variant).
    return (
        <Button color="primary" size="md" onClick={simulateConnect} className="w-full">
            Connect {integration.name}
        </Button>
    );
}

function GrantAccessDetail({
    integration,
    existingInstanceCount,
    onBack,
    onGranted,
}: {
    integration: Integration;
    existingInstanceCount: number;
    onBack: () => void;
    onGranted: (identifier?: string) => void;
}) {
    const isChannel = integration.category === "notifications";
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
                        <h1 className="text-2xl font-semibold text-primary">{isChannel ? "Connect channel" : "Grant Access"}</h1>
                    </div>

                    {/* Back link */}
                    <button
                        type="button"
                        onClick={onBack}
                        className="mb-6 flex items-center gap-1.5 text-sm font-medium text-secondary transition duration-100 ease-linear hover:text-primary"
                    >
                        <ArrowLeft className="size-4" aria-hidden />
                        Back to setup
                    </button>

                    {/* Integration header card */}
                    <div className="mb-6 rounded-xl border border-secondary p-5">
                        <div className="flex items-start gap-3">
                            {integration.logoUrl ? (
                                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-secondary bg-white">
                                    <img src={integration.logoUrl} alt="" className="size-6" />
                                </div>
                            ) : (
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-secondary">
                                    <Key01 className="size-5 text-fg-brand-primary" aria-hidden />
                                </div>
                            )}
                            <div>
                                <h2 className="text-lg font-semibold text-primary">
                                    {isChannel ? `Connect ${integration.name} to Numix` : `Grant Numix Access to ${integration.name}`}
                                </h2>
                                <p className="mt-0.5 text-sm text-tertiary">
                                    {isChannel
                                        ? `Follow these steps to link ${integration.name} so Numix can ingest financial messages. This takes about ${integration.time.replace("~", "")}.`
                                        : `Follow these steps to securely authorize Numix as your accountant. This takes about ${integration.time.replace("~", "")}.`}
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-tertiary">
                            <Clock className="size-3.5" aria-hidden />
                            Takes about {integration.time.replace("~", "")}
                        </div>
                    </div>

                    {/* Privacy / limitation callout for inbox-style integrations */}
                    {integration.privacyNote && (
                        <div className="mb-6 rounded-xl border border-warning bg-warning-secondary/40 p-4">
                            <div className="flex items-start gap-3">
                                <Shield01 className="mt-0.5 size-5 shrink-0 text-fg-warning-primary" aria-hidden />
                                <div>
                                    <p className="text-sm font-semibold text-primary">What Numix can &amp; cannot see</p>
                                    <p className="mt-1 text-xs leading-relaxed text-secondary">{integration.privacyNote}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Channels: connect inline within Numix.
                        Other categories: external steps to follow. */}
                    {isChannel ? (
                        <div className="mb-6">
                            <h3 className="mb-4 text-sm font-semibold text-primary">
                                {existingInstanceCount > 0 ? `Add another ${integration.name} account` : `Connect ${integration.name}`}
                            </h3>
                            <ChannelConnectForm
                                integration={integration}
                                existingCount={existingInstanceCount}
                                onConnected={(id) => onGranted(id)}
                            />
                        </div>
                    ) : (
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
                    )}

                    {/* Details to enter — only for invite-style integrations
                        (accounting / banking). Channel OAuth flows don't ask
                        the user to type anything into a third-party UI. */}
                    {!isChannel && (
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
                    )}

                    {/* Done note */}
                    <p className="text-center text-sm text-tertiary">
                        {isChannel
                            ? "You're done. Numix will start syncing as soon as the connection completes."
                            : "You're done. The platform will notify us automatically."}
                    </p>
                </div>
            </div>

            {/* ── Footer bar ──────────────────────────────────────────────── */}
            {/* Only invite-style integrations need this confirmation button.
                Channel forms complete themselves once the user submits. */}
            {!isChannel && (
                <div className="shrink-0 px-6 py-4">
                    <div className="mx-auto max-w-2xl">
                        <Button
                            color="primary"
                            size="lg"
                            iconLeading={CheckCircle}
                            onClick={() => onGranted()}
                            className="w-full"
                        >
                            I&apos;ve Granted Access
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

interface CustomIntegration {
    id: string;
    name: string;
    initials: string;
    color: string;
    category: CategoryId;
}

// A single connected account for a channel integration. e.g. user can have
// two Gmail accounts (work + personal) both connected to Numix.
interface ChannelInstance {
    id: string;
    identifier: string;
}

function CategoryRow({
    category,
    connected,
    customs,
    channelInstances,
    onSelect,
    onAddCustom,
    onRemoveCustom,
    onRemoveInstance,
}: {
    category: (typeof ACCESS_CATEGORIES)[0];
    connected: Set<string>;
    customs: CustomIntegration[];
    channelInstances: Record<string, ChannelInstance[]>;
    onSelect: (integration: Integration) => void;
    onAddCustom: (categoryId: CategoryId, name: string) => void;
    onRemoveCustom: (id: string) => void;
    onRemoveInstance: (integrationId: string, instanceId: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [adding, setAdding] = useState(false);
    const [addName, setAddName] = useState("");
    const integrations = INTEGRATIONS.filter((i) => i.category === category.id);
    // Channel integrations count by instances; non-channels count by Set membership.
    const totalInstances = integrations
        .filter((i) => i.category === "notifications")
        .reduce((sum, i) => sum + (channelInstances[i.id]?.length ?? 0), 0);
    const nonChannelConnected = integrations
        .filter((i) => i.category !== "notifications" && connected.has(i.id))
        .length;
    const connectedCount = totalInstances + nonChannelConnected + customs.length;
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
                                const isChannelKind = integration.category === "notifications";
                                const instances = channelInstances[integration.id] ?? [];
                                const isConnected = isChannelKind ? instances.length > 0 : connected.has(integration.id);

                                return (
                                    <div key={integration.id} className="border-b border-secondary last:border-b-0">
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            <LogoBadge initials={integration.initials} color={integration.color} logoUrl={integration.logoUrl} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-primary">{integration.name}</p>
                                                <p className="text-xs text-tertiary">{integration.tagline}</p>
                                            </div>
                                            <div className="shrink-0">
                                                {isChannelKind ? (
                                                    instances.length > 0 ? (
                                                        <Button
                                                            color="secondary"
                                                            size="sm"
                                                            iconLeading={Plus}
                                                            onClick={() => onSelect(integration)}
                                                        >
                                                            Add another
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            color="primary"
                                                            size="sm"
                                                            onClick={() => onSelect(integration)}
                                                        >
                                                            Connect {integration.name}
                                                        </Button>
                                                    )
                                                ) : isConnected ? (
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

                                        {/* Per-instance sub-rows for channels (Gmail x2, etc.) */}
                                        {isChannelKind && instances.length > 0 && (
                                            <div className="space-y-1.5 border-t border-secondary bg-secondary/30 px-4 py-3">
                                                {instances.map((inst) => (
                                                    <div key={inst.id} className="flex items-center gap-2.5 rounded-lg bg-primary px-3 py-2 ring-1 ring-secondary">
                                                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success-secondary">
                                                            <Check className="size-3.5 text-fg-success-primary" />
                                                        </div>
                                                        <p className="min-w-0 flex-1 truncate text-sm text-primary">{inst.identifier}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => onRemoveInstance(integration.id, inst.id)}
                                                            className="text-xs text-quaternary transition duration-100 ease-linear hover:text-secondary"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Custom tools the user has added themselves */}
                            {customs.map((c) => (
                                <div key={c.id} className="flex items-center gap-3 border-b border-secondary px-4 py-3 last:border-b-0">
                                    <LogoBadge initials={c.initials} color={c.color} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-primary">{c.name}</p>
                                            <Badge color="gray" type="pill-color" size="sm">Custom</Badge>
                                        </div>
                                        <p className="text-xs text-tertiary">Added by you</p>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-xs font-medium text-success-primary">
                                            <Check className="size-3.5" aria-hidden />
                                            Connected
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => onRemoveCustom(c.id)}
                                            className="text-xs text-quaternary transition duration-100 ease-linear hover:text-secondary"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Add your own tool */}
                            <div className="border-t border-secondary bg-secondary/30 px-4 py-3">
                                {adding ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={addName}
                                            onChange={(e) => setAddName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    if (addName.trim()) {
                                                        onAddCustom(category.id, addName.trim());
                                                        setAddName("");
                                                        setAdding(false);
                                                    }
                                                }
                                                if (e.key === "Escape") { setAdding(false); setAddName(""); }
                                            }}
                                            placeholder={category.id === "banking" ? "e.g., First Republic Business" : category.id === "accounting" ? "e.g., FreshBooks" : "e.g., Microsoft Teams"}
                                            className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary placeholder:text-placeholder focus:border-brand focus:outline-none"
                                            autoFocus
                                        />
                                        <Button color="secondary" size="sm" onClick={() => { setAdding(false); setAddName(""); }}>
                                            Cancel
                                        </Button>
                                        <Button
                                            color="primary"
                                            size="sm"
                                            isDisabled={!addName.trim()}
                                            onClick={() => {
                                                onAddCustom(category.id, addName.trim());
                                                setAddName("");
                                                setAdding(false);
                                            }}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => { setAdding(true); setAddName(""); }}
                                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-secondary bg-primary px-3 py-2 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:border-brand hover:bg-brand-primary_alt/30 hover:text-brand-secondary"
                                    >
                                        <Plus className="size-4" />
                                        Add your own {category.id === "banking" ? "banking" : category.id === "accounting" ? "accounting" : "notification"} tool
                                    </button>
                                )}
                            </div>
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
    // Demo: every page reset starts with zero connections.
    const [connected, setConnected] = useState<Set<string>>(() => new Set());
    const [completing, setCompleting] = useState(false);
    const [activeIntegration, setActiveIntegration] = useState<Integration | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [customs, setCustoms] = useState<CustomIntegration[]>([]);
    // Per-integration list of connected accounts. Channels (Gmail, Slack,
    // SMS, etc.) can have multiple instances; non-channels stay single.
    const [channelInstances, setChannelInstances] = useState<Record<string, ChannelInstance[]>>({});
    const confirmRef = useRef<HTMLDivElement>(null);

    function handleAddCustom(categoryId: CategoryId, name: string) {
        const id = `custom-${categoryId}-${Date.now()}`;
        const initials = name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "??";
        const item: CustomIntegration = { id, name, initials, color: "#6B7280", category: categoryId };
        setCustoms((prev) => [...prev, item]);
        setConnected((prev) => new Set([...prev, id]));
    }

    function handleRemoveCustom(id: string) {
        setCustoms((prev) => prev.filter((c) => c.id !== id));
        setConnected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }

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

    function handleGranted(id: string, identifier?: string) {
        setConnected((prev) => new Set([...prev, id]));
        // For channels, also track the per-instance identifier so the user
        // can connect multiple accounts (e.g. work + personal Gmail).
        if (identifier) {
            const integration = INTEGRATIONS.find((i) => i.id === id);
            if (integration?.category === "notifications") {
                setChannelInstances((prev) => ({
                    ...prev,
                    [id]: [...(prev[id] ?? []), { id: `inst-${Date.now()}`, identifier }],
                }));
            }
        }
        setActiveIntegration(null);
    }

    function handleRemoveInstance(integrationId: string, instanceId: string) {
        setChannelInstances((prev) => {
            const next = (prev[integrationId] ?? []).filter((i) => i.id !== instanceId);
            // If no instances remain, also unmark the integration as connected
            // so it returns to the "Connect" state.
            if (next.length === 0) {
                setConnected((p) => { const n = new Set(p); n.delete(integrationId); return n; });
            }
            return { ...prev, [integrationId]: next };
        });
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
                existingInstanceCount={(channelInstances[activeIntegration.id] ?? []).length}
                onBack={() => setActiveIntegration(null)}
                onGranted={(identifier) => handleGranted(activeIntegration.id, identifier)}
            />
        );
    }

    // ── Main list page ───────────────────────────────────────────────────────
    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-primary">
            {/* ── Top bar, logo ──────────────────────────────────────────────── */}
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
                            We need read-only access to pull your financial data, takes about 3–5 minutes. Skip anything and come back later.
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
                                            <span className="text-xs font-medium text-tertiary">
                                                Not set up yet
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
                                customs={customs.filter((c) => c.category === category.id)}
                                channelInstances={channelInstances}
                                onSelect={setActiveIntegration}
                                onAddCustom={handleAddCustom}
                                onRemoveCustom={handleRemoveCustom}
                                onRemoveInstance={handleRemoveInstance}
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
                            color="secondary"
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
