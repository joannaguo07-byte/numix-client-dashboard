"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
    Bell01,
    Building01,
    Check,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    CreditCard01,
    Eye,
    File01,
    HelpCircle,
    Link01,
    Lock01,
    Mail01,
    Phone01,
    Plus,
    Shield01,
    User01,
    Users01,
    X,
    ChevronDown,
    Upload01,
    LinkExternal01,
} from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
    | "profile"
    | "notifications"
    | "security"
    | "company"
    | "team"
    | "integrations"
    | "tax"
    | "billing"
    | "help";

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV_GROUPS: { label: string; items: { id: Section; label: string; icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> }[] }[] = [
    {
        label: "Your Account",
        items: [
            { id: "profile", label: "Profile", icon: User01 },
            { id: "notifications", label: "Notifications", icon: Bell01 },
            { id: "security", label: "Security", icon: Shield01 },
        ],
    },
    {
        label: "Your Business",
        items: [
            { id: "company", label: "Company", icon: Building01 },
            { id: "team", label: "Team & Permissions", icon: Users01 },
            { id: "integrations", label: "Integrations", icon: Link01 },
            { id: "tax", label: "Tax & Compliance", icon: File01 },
            { id: "billing", label: "Billing & Plan", icon: CreditCard01 },
        ],
    },
];

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description: string }) {
    return (
        <div className="mb-6">
            <h2 className="text-lg font-semibold text-primary">{title}</h2>
            <p className="mt-1 text-sm text-tertiary">{description}</p>
        </div>
    );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cx("rounded-xl border border-secondary bg-primary p-6", className)}>
            {children}
        </div>
    );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-medium text-secondary">{label}</label>
            {hint && <p className="mt-0.5 text-xs text-tertiary">{hint}</p>}
            <div className="mt-1.5">{children}</div>
        </div>
    );
}

function TextInput({ defaultValue, placeholder, type = "text", readOnly }: {
    defaultValue?: string; placeholder?: string; type?: string; readOnly?: boolean;
}) {
    return (
        <input
            type={type}
            defaultValue={defaultValue}
            placeholder={placeholder}
            readOnly={readOnly}
            className={cx(
                "w-full rounded-lg border border-secondary px-3.5 py-2.5 text-sm text-primary placeholder:text-placeholder transition duration-100 ease-linear focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
                readOnly && "cursor-default bg-secondary text-tertiary",
            )}
        />
    );
}

function SelectInput({ defaultValue, options }: { defaultValue?: string; options: string[] }) {
    return (
        <div className="relative">
            <select
                defaultValue={defaultValue}
                className="w-full appearance-none rounded-lg border border-secondary bg-primary px-3.5 py-2.5 pr-9 text-sm text-primary transition duration-100 ease-linear focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
                {options.map((o) => <option key={o}>{o}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" aria-hidden />
        </div>
    );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            className={cx(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition duration-200 ease-linear",
                enabled ? "bg-brand-solid" : "bg-tertiary",
            )}
            aria-checked={enabled}
            role="switch"
        >
            <span
                className={cx(
                    "inline-block size-5 rounded-full bg-white shadow-sm transition duration-200 ease-linear",
                    enabled ? "translate-x-5" : "translate-x-0.5",
                )}
            />
        </button>
    );
}

function NotifRow({ label, hint, enabled, onChange }: {
    label: string; hint?: string; enabled: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-3.5">
            <div>
                <p className="text-sm font-medium text-secondary">{label}</p>
                {hint && <p className="mt-0.5 text-xs text-tertiary">{hint}</p>}
            </div>
            <Toggle enabled={enabled} onChange={onChange} />
        </div>
    );
}

// ─── Section: Profile ─────────────────────────────────────────────────────────

function ProfileSection() {
    return (
        <div className="space-y-5">
            <SectionHeader
                title="Profile"
                description="Your personal details as they appear inside Numix and to your CPA team."
            />

            {/* Avatar */}
            <Card>
                <p className="mb-4 text-sm font-semibold text-secondary">Profile Photo</p>
                <div className="flex items-center gap-5">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-full ring-2 ring-secondary">
                        <img
                            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&crop=face"
                            alt="Olivia Rhye"
                            className="size-full object-cover"
                        />
                    </div>
                    <div>
                        <Button color="secondary" size="sm" iconLeading={Upload01}>
                            Upload new photo
                        </Button>
                        <p className="mt-1.5 text-xs text-quaternary">JPG or PNG, max 2MB</p>
                    </div>
                </div>
            </Card>

            {/* Personal info */}
            <Card>
                <p className="mb-4 text-sm font-semibold text-secondary">Personal Information</p>
                <div className="grid grid-cols-2 gap-4">
                    <FieldRow label="First name">
                        <TextInput defaultValue="Olivia" />
                    </FieldRow>
                    <FieldRow label="Last name">
                        <TextInput defaultValue="Rhye" />
                    </FieldRow>
                    <FieldRow label="Preferred name" hint="Used in greetings and messages">
                        <TextInput defaultValue="Olivia" />
                    </FieldRow>
                    <FieldRow label="Job title">
                        <TextInput defaultValue="CEO & Founder" />
                    </FieldRow>
                    <FieldRow label="Email address">
                        <TextInput defaultValue="olivia@acmecorp.com" type="email" />
                    </FieldRow>
                    <FieldRow label="Phone number">
                        <TextInput defaultValue="+1 (415) 555-0182" type="tel" />
                    </FieldRow>
                    <FieldRow label="Time zone">
                        <SelectInput
                            defaultValue="America/Los_Angeles"
                            options={["America/Los_Angeles", "America/New_York", "America/Chicago", "America/Denver"]}
                        />
                    </FieldRow>
                </div>
                <div className="mt-5 flex justify-end">
                    <Button color="primary" size="sm">Save changes</Button>
                </div>
            </Card>
        </div>
    );
}

// ─── Section: Notifications ───────────────────────────────────────────────────

function NotificationsSection() {
    const [notifs, setNotifs] = useState({
        taskAssigned: true,
        taskDue: true,
        cpaMessage: true,
        deadlines: true,
        weeklyDigest: false,
        integrationAlerts: true,
        rdUpdates: false,
    });

    const set = (key: keyof typeof notifs) => (v: boolean) =>
        setNotifs((prev) => ({ ...prev, [key]: v }));

    return (
        <div className="space-y-5">
            <SectionHeader
                title="Notifications"
                description="Control when and how Numix contacts you. Your CPA can still reach you directly."
            />

            <Card>
                <p className="mb-1 text-sm font-semibold text-secondary">Tasks & Actions</p>
                <div className="divide-y divide-secondary">
                    <NotifRow label="Task assigned to me" hint="When your CPA creates a task that needs your input" enabled={notifs.taskAssigned} onChange={set("taskAssigned")} />
                    <NotifRow label="Task due in 24 hours" hint="Reminder before a deadline passes" enabled={notifs.taskDue} onChange={set("taskDue")} />
                </div>
            </Card>

            <Card>
                <p className="mb-1 text-sm font-semibold text-secondary">Messages & Updates</p>
                <div className="divide-y divide-secondary">
                    <NotifRow label="New message from your accountant" hint="Replies in the Ask My Accountant chat" enabled={notifs.cpaMessage} onChange={set("cpaMessage")} />
                    <NotifRow label="Filing deadline alerts" hint="7-day and 1-day reminders for tax and payroll filings" enabled={notifs.deadlines} onChange={set("deadlines")} />
                    <NotifRow label="R&D credit milestones" hint="Updates when your CPA advances the R&D credit claim" enabled={notifs.rdUpdates} onChange={set("rdUpdates")} />
                </div>
            </Card>

            <Card>
                <p className="mb-1 text-sm font-semibold text-secondary">Summaries & Health</p>
                <div className="divide-y divide-secondary">
                    <NotifRow label="Weekly email digest" hint="One email each Monday with your week's financial snapshot" enabled={notifs.weeklyDigest} onChange={set("weeklyDigest")} />
                    <NotifRow label="Integration health alerts" hint="Notify me if a connected tool (QuickBooks, Mercury) loses sync" enabled={notifs.integrationAlerts} onChange={set("integrationAlerts")} />
                </div>
            </Card>

            <Card>
                <p className="mb-2 text-sm font-semibold text-secondary">Quiet Hours</p>
                <p className="mb-4 text-xs text-tertiary">Non-critical alerts are paused during these hours. Deadline alerts still fire.</p>
                <div className="flex items-center gap-3">
                    <SelectInput defaultValue="9:00 PM" options={["7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM"]} />
                    <span className="text-sm text-tertiary">to</span>
                    <SelectInput defaultValue="7:00 AM" options={["5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM"]} />
                </div>
            </Card>
        </div>
    );
}

// ─── Section: Security ────────────────────────────────────────────────────────

function SecuritySection() {
    const [mfaEnabled, setMfaEnabled] = useState(true);
    const [showEin, setShowEin] = useState(false);

    const sessions = [
        { device: "MacBook Pro — Chrome", location: "San Francisco, CA", time: "Active now", current: true },
        { device: "iPhone 15 — Safari", location: "San Francisco, CA", time: "2 hours ago", current: false },
        { device: "iPad — Safari", location: "New York, NY", time: "3 days ago", current: false },
    ];

    const logins = [
        { date: "Feb 26, 2026", device: "MacBook Pro", ip: "192.168.1.1", status: "success" },
        { date: "Feb 24, 2026", device: "iPhone 15", ip: "76.102.45.11", status: "success" },
        { date: "Feb 20, 2026", device: "Unknown Device", ip: "89.201.44.22", status: "failed" },
    ];

    return (
        <div className="space-y-5">
            <SectionHeader
                title="Security & Privacy"
                description="Protect your account and control who can see your financial data."
            />

            <Card>
                <p className="mb-4 text-sm font-semibold text-secondary">Authentication</p>
                <div className="flex items-center justify-between py-2">
                    <div>
                        <p className="text-sm font-medium text-secondary">Two-factor authentication</p>
                        <p className="mt-0.5 text-xs text-tertiary">
                            {mfaEnabled ? "Enabled via Authenticator app" : "Not enabled — your account is less secure"}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {mfaEnabled && (
                            <Badge color="success" type="pill-color" size="sm">Active</Badge>
                        )}
                        <Toggle enabled={mfaEnabled} onChange={setMfaEnabled} />
                    </div>
                </div>
                <div className="mt-3 border-t border-secondary pt-4">
                    <Button color="secondary" size="sm">Change password</Button>
                </div>
            </Card>

            <Card>
                <p className="mb-4 text-sm font-semibold text-secondary">Active Sessions</p>
                <div className="space-y-3">
                    {sessions.map((s) => (
                        <div key={s.device} className="flex items-center justify-between gap-4 rounded-lg border border-secondary p-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-secondary">{s.device}</p>
                                    {s.current && <Badge color="brand" type="pill-color" size="sm">Current</Badge>}
                                </div>
                                <p className="mt-0.5 text-xs text-tertiary">{s.location} · {s.time}</p>
                            </div>
                            {!s.current && (
                                <button type="button" className="text-xs text-error-primary transition duration-100 ease-linear hover:opacity-75">
                                    Sign out
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-4 border-t border-secondary pt-4">
                    <button type="button" className="text-sm font-medium text-error-primary transition duration-100 ease-linear hover:opacity-75">
                        Sign out of all other sessions
                    </button>
                </div>
            </Card>

            <Card>
                <p className="mb-4 text-sm font-semibold text-secondary">Recent Login History</p>
                <div className="divide-y divide-secondary">
                    {logins.map((l) => (
                        <div key={l.date + l.device} className="flex items-center justify-between py-3">
                            <div>
                                <p className="text-sm text-secondary">{l.device}</p>
                                <p className="text-xs text-tertiary">{l.date} · {l.ip}</p>
                            </div>
                            {l.status === "success" ? (
                                <Badge color="success" type="pill-color" size="sm">Success</Badge>
                            ) : (
                                <Badge color="error" type="pill-color" size="sm">Failed</Badge>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <p className="mb-1 text-sm font-semibold text-secondary">Data Access Log</p>
                <p className="mb-4 text-xs text-tertiary">A read-only audit of what your CPA firm has viewed or downloaded.</p>
                <div className="divide-y divide-secondary">
                    {[
                        { action: "Viewed payroll report — Q4 2024", actor: "Sarah Chen, Numix CPA", time: "Feb 25" },
                        { action: "Downloaded tax draft — 2024 return", actor: "Marcus Rivera, Numix CPA", time: "Feb 22" },
                        { action: "Synced QuickBooks transactions", actor: "Numix System", time: "Feb 20" },
                    ].map((entry) => (
                        <div key={entry.action} className="py-3">
                            <p className="text-sm text-secondary">{entry.action}</p>
                            <p className="mt-0.5 text-xs text-tertiary">{entry.actor} · {entry.time}</p>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <p className="mb-1 text-sm font-semibold text-secondary">Privacy Controls</p>
                <div className="divide-y divide-secondary">
                    <NotifRow
                        label="Allow Numix support access"
                        hint="Temporarily let the Numix team view your account to resolve issues (expires in 24h)"
                        enabled={false}
                        onChange={() => {}}
                    />
                    <NotifRow
                        label="Contribute to product improvement"
                        hint="Share anonymized usage data to help us improve the product"
                        enabled={true}
                        onChange={() => {}}
                    />
                </div>
            </Card>
        </div>
    );
}

// ─── Section: Company ─────────────────────────────────────────────────────────

function CompanySection() {
    return (
        <div className="space-y-5">
            <SectionHeader
                title="Company"
                description="Your business identity used across tax filings, payroll, and compliance documents."
            />

            <Card>
                <p className="mb-4 text-sm font-semibold text-secondary">Business Identity</p>
                <div className="grid grid-cols-2 gap-4">
                    <FieldRow label="Legal business name">
                        <TextInput defaultValue="Acme Corp, Inc." />
                    </FieldRow>
                    <FieldRow label="DBA / Trade name" hint="Leave blank if same as legal name">
                        <TextInput placeholder="e.g. Acme" />
                    </FieldRow>
                    <FieldRow label="Entity type">
                        <SelectInput
                            defaultValue="C-Corp"
                            options={["C-Corp", "S-Corp", "LLC", "Partnership", "Sole Proprietor"]}
                        />
                    </FieldRow>
                    <FieldRow label="Fiscal year end">
                        <SelectInput
                            defaultValue="December 31"
                            options={["December 31", "March 31", "June 30", "September 30"]}
                        />
                    </FieldRow>
                    <FieldRow label="EIN (Tax ID)" hint="Masked for security — click to reveal">
                        <TextInput defaultValue="••-•••7842" type="text" />
                    </FieldRow>
                    <FieldRow label="State of incorporation">
                        <SelectInput defaultValue="Delaware" options={["Delaware", "California", "New York", "Texas", "Nevada", "Wyoming"]} />
                    </FieldRow>
                </div>
                <div className="mt-5 flex justify-end">
                    <Button color="primary" size="sm">Save changes</Button>
                </div>
            </Card>

            <Card>
                <p className="mb-4 text-sm font-semibold text-secondary">Business Address</p>
                <div className="grid grid-cols-2 gap-4">
                    <FieldRow label="Street address" hint="" >
                        <TextInput defaultValue="340 Pine Street, Suite 800" />
                    </FieldRow>
                    <FieldRow label="City">
                        <TextInput defaultValue="San Francisco" />
                    </FieldRow>
                    <FieldRow label="State">
                        <SelectInput defaultValue="California" options={["California", "New York", "Texas", "Delaware", "Washington"]} />
                    </FieldRow>
                    <FieldRow label="ZIP code">
                        <TextInput defaultValue="94104" />
                    </FieldRow>
                </div>
                <div className="mt-5 flex justify-end">
                    <Button color="primary" size="sm">Save changes</Button>
                </div>
            </Card>

            <Card>
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-semibold text-secondary">CPA Firm Assignment</p>
                        <p className="mt-0.5 text-xs text-tertiary">Managed by your accounting firm. Contact support to make changes.</p>
                    </div>
                    <Lock01 className="size-4 text-fg-quaternary" aria-hidden />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <FieldRow label="Accounting firm">
                        <TextInput defaultValue="Numix Accounting, LLP" readOnly />
                    </FieldRow>
                    <FieldRow label="Primary accountant">
                        <TextInput defaultValue="Sarah Chen, CPA" readOnly />
                    </FieldRow>
                    <FieldRow label="Engagement start">
                        <TextInput defaultValue="January 1, 2024" readOnly />
                    </FieldRow>
                    <FieldRow label="Accountant email">
                        <TextInput defaultValue="sarah.chen@numix.com" readOnly />
                    </FieldRow>
                </div>
            </Card>
        </div>
    );
}

// ─── Section: Team ────────────────────────────────────────────────────────────

function TeamSection() {
    const yourTeam = [
        { name: "Olivia Rhye", email: "olivia@acmecorp.com", role: "Owner", lastActive: "Active now", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=face", you: true },
        { name: "James Whitfield", email: "james@acmecorp.com", role: "Admin", lastActive: "1 hour ago", avatar: null, you: false },
        { name: "Lisa Tanaka", email: "lisa@acmecorp.com", role: "Viewer", lastActive: "3 days ago", avatar: null, you: false },
    ];

    const cpaTeam = [
        { name: "Sarah Chen", role: "Lead CPA", lastAccessed: "Feb 25, 2026" },
        { name: "Marcus Rivera", role: "Tax Associate", lastAccessed: "Feb 22, 2026" },
        { name: "Priya Nair", role: "Staff Accountant", lastAccessed: "Feb 18, 2026" },
    ];

    const roleColors: Record<string, "brand" | "gray" | "success"> = {
        Owner: "brand",
        Admin: "success",
        Viewer: "gray",
    };

    return (
        <div className="space-y-5">
            <SectionHeader
                title="Team & Permissions"
                description="Manage who on your team can view the Numix dashboard, separate from your CPA firm's access."
            />

            <Card>
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-secondary">Your Team</p>
                    <Button color="secondary" size="sm" iconLeading={Plus}>Invite member</Button>
                </div>
                <div className="divide-y divide-secondary">
                    {yourTeam.map((m) => (
                        <div key={m.email} className="flex items-center justify-between gap-4 py-3.5">
                            <div className="flex items-center gap-3">
                                {m.avatar ? (
                                    <img src={m.avatar} alt={m.name} className="size-9 rounded-full object-cover" />
                                ) : (
                                    <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary">
                                        {m.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-primary">{m.name}</p>
                                        {m.you && <span className="text-xs text-quaternary">(you)</span>}
                                    </div>
                                    <p className="text-xs text-tertiary">{m.email} · {m.lastActive}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge color={roleColors[m.role] ?? "gray"} type="pill-color" size="sm">{m.role}</Badge>
                                {!m.you && (
                                    <button type="button" className="text-xs text-quaternary transition duration-100 ease-linear hover:text-secondary">
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <div className="mb-1 flex items-start justify-between">
                    <div>
                        <p className="text-sm font-semibold text-secondary">Numix Accounting Firm</p>
                        <p className="mt-0.5 text-xs text-tertiary">
                            Your CPA team has read access to your full dashboard. Contact your accountant to change access.
                        </p>
                    </div>
                    <Lock01 className="mt-0.5 size-4 shrink-0 text-fg-quaternary" aria-hidden />
                </div>
                <div className="mt-4 divide-y divide-secondary">
                    {cpaTeam.map((m) => (
                        <div key={m.name} className="flex items-center justify-between gap-4 py-3.5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-full bg-brand-solid text-sm font-bold text-white">
                                    {m.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-primary">{m.name}</p>
                                    <p className="text-xs text-tertiary">{m.role} · Last accessed {m.lastAccessed}</p>
                                </div>
                            </div>
                            <Badge color="brand" type="pill-color" size="sm">Numix CPA</Badge>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// ─── Section: Integrations ────────────────────────────────────────────────────

const INTEGRATION_GROUPS = [
    {
        label: "Accounting",
        items: [
            { id: "quickbooks", name: "QuickBooks Online", initials: "QB", color: "#2CA01C", lastSync: "2 hours ago", defaultConnected: true },
            { id: "xero", name: "Xero", initials: "XR", color: "#13B5EA", lastSync: null, defaultConnected: false },
        ],
    },
    {
        label: "Payroll",
        items: [
            { id: "gusto", name: "Gusto", initials: "GU", color: "#F45B35", lastSync: "4 hours ago", defaultConnected: true },
            { id: "rippling", name: "Rippling", initials: "RP", color: "#5C4BF5", lastSync: null, defaultConnected: false },
            { id: "deel", name: "Deel", initials: "DL", color: "#19181A", lastSync: null, defaultConnected: false },
        ],
    },
    {
        label: "Banking",
        items: [
            { id: "mercury", name: "Mercury", initials: "MC", color: "#1E2A3A", lastSync: "30 min ago", defaultConnected: true },
            { id: "chase", name: "Chase Business", initials: "CH", color: "#117ACA", lastSync: null, defaultConnected: false },
            { id: "brex", name: "Brex", initials: "BX", color: "#FF5233", lastSync: null, defaultConnected: false },
        ],
    },
    {
        label: "Expense & Cards",
        items: [
            { id: "ramp", name: "Ramp", initials: "RM", color: "#20B464", lastSync: null, defaultConnected: false },
            { id: "expensify", name: "Expensify", initials: "EX", color: "#0185FF", lastSync: null, defaultConnected: false },
        ],
    },
];

function IntegrationsSection() {
    const defaultConnected = new Set(
        INTEGRATION_GROUPS.flatMap((g) => g.items.filter((i) => i.defaultConnected).map((i) => i.id)),
    );
    const [connected, setConnected] = useState<Set<string>>(defaultConnected);
    const [connecting, setConnecting] = useState<string | null>(null);

    async function handleConnect(id: string) {
        setConnecting(id);
        await new Promise((r) => setTimeout(r, 1500));
        setConnected((prev) => new Set([...prev, id]));
        setConnecting(null);
    }

    function handleDisconnect(id: string) {
        setConnected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }

    const totalConnected = connected.size;
    const totalAll = INTEGRATION_GROUPS.flatMap((g) => g.items).length;

    return (
        <div className="space-y-5">
            <SectionHeader
                title="Integrations"
                description="Connect your financial tools so your CPA has the access they need — no manual exports required."
            />

            {/* Summary */}
            <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary px-5 py-4">
                <div className="flex size-9 items-center justify-center rounded-full bg-brand-solid text-sm font-bold text-white">
                    {totalConnected}
                </div>
                <div>
                    <p className="text-sm font-semibold text-primary">{totalConnected} of {totalAll} tools connected</p>
                    <p className="text-xs text-tertiary">All connections are read-only — we can&apos;t move money or make changes.</p>
                </div>
            </div>

            {INTEGRATION_GROUPS.map((group) => (
                <Card key={group.label}>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-quaternary">{group.label}</p>
                    <div className="divide-y divide-secondary">
                        {group.items.map((item) => {
                            const isConnected = connected.has(item.id);
                            const isConnecting = connecting === item.id;
                            return (
                                <div key={item.id} className="flex items-center justify-between gap-4 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                                            style={{ backgroundColor: item.color }}
                                        >
                                            {item.initials}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-primary">{item.name}</p>
                                                {isConnected && (
                                                    <BadgeWithDot color="success" type="pill-color" size="sm">
                                                        Connected
                                                    </BadgeWithDot>
                                                )}
                                            </div>
                                            <p className="text-xs text-tertiary">
                                                {isConnected && item.lastSync
                                                    ? `Last synced ${item.lastSync}`
                                                    : isConnected
                                                      ? "Connected"
                                                      : "Not connected"}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        {isConnected ? (
                                            <button
                                                type="button"
                                                onClick={() => handleDisconnect(item.id)}
                                                className="text-xs text-quaternary transition duration-100 ease-linear hover:text-secondary"
                                            >
                                                Disconnect
                                            </button>
                                        ) : (
                                            <Button
                                                color="secondary"
                                                size="sm"
                                                isLoading={isConnecting}
                                                showTextWhileLoading
                                                onClick={() => handleConnect(item.id)}
                                                isDisabled={isConnecting}
                                            >
                                                {isConnecting ? "Connecting…" : "Connect"}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            ))}
        </div>
    );
}

// ─── Section: Tax & Compliance ────────────────────────────────────────────────

function TaxSection() {
    return (
        <div className="space-y-5">
            <SectionHeader
                title="Tax & Compliance"
                description="Your tax profile and filing obligations. Your CPA manages the details — this is your visibility layer."
            />

            <Card>
                <p className="mb-4 text-sm font-semibold text-secondary">Tax Profile</p>
                <div className="divide-y divide-secondary">
                    {[
                        { label: "Federal tax classification", value: "C-Corporation (Form 1120)" },
                        { label: "Tax year", value: "Calendar year (Jan 1 – Dec 31)" },
                        { label: "Estimated tax payments", value: "Quarterly — Q1/Q2/Q3/Q4" },
                        { label: "State nexus", value: "CA, NY, DE" },
                    ].map((r) => (
                        <div key={r.label} className="flex items-center justify-between py-3">
                            <p className="text-sm text-tertiary">{r.label}</p>
                            <p className="text-sm font-medium text-secondary">{r.value}</p>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <p className="mb-1 text-sm font-semibold text-secondary">R&D Tax Credit</p>
                <p className="mb-4 text-xs text-tertiary">Your CPA is tracking qualified research expenses for a potential R&D payroll tax credit.</p>
                <div className="mb-4 flex items-center gap-2">
                    <BadgeWithDot color="success" type="pill-color" size="sm">Eligible</BadgeWithDot>
                    <span className="text-xs text-tertiary">2024 tax year</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {["Employee wages (QRE)", "Contractor costs", "Cloud computing", "Supply costs"].map((item) => (
                        <div key={item} className="flex items-center gap-2 rounded-lg border border-secondary bg-secondary px-3 py-2">
                            <Check className="size-3.5 shrink-0 text-fg-success-primary" aria-hidden />
                            <span className="text-xs text-secondary">{item}</span>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <p className="mb-1 text-sm font-semibold text-secondary">Filing Preferences</p>
                <div className="divide-y divide-secondary">
                    <NotifRow
                        label="Authorize CPA to e-file on my behalf"
                        hint="Equivalent to signing Form 8879 electronically"
                        enabled={true}
                        onChange={() => {}}
                    />
                    <NotifRow
                        label="State registration renewal reminders"
                        hint="Annual report deadlines vary by state"
                        enabled={true}
                        onChange={() => {}}
                    />
                    <NotifRow
                        label="Notify me of new tax obligations"
                        hint="If your CPA detects new nexus or filing requirements"
                        enabled={true}
                        onChange={() => {}}
                    />
                </div>
            </Card>

            <Card>
                <p className="mb-4 text-sm font-semibold text-secondary">Upcoming Filing Dates</p>
                <div className="divide-y divide-secondary">
                    {[
                        { filing: "Form 941 — Q4 2024 Payroll Tax", due: "Jan 31, 2026", status: "Filed" },
                        { filing: "Federal Tax Return — 2024 (C-Corp)", due: "Apr 15, 2026", status: "In Progress" },
                        { filing: "CA State Tax Return — 2024", due: "Apr 15, 2026", status: "In Progress" },
                        { filing: "Form 941 — Q1 2025 Payroll Tax", due: "Apr 30, 2026", status: "Upcoming" },
                    ].map((f) => (
                        <div key={f.filing} className="flex items-center justify-between gap-4 py-3">
                            <div>
                                <p className="text-sm text-secondary">{f.filing}</p>
                                <p className="text-xs text-tertiary">Due {f.due}</p>
                            </div>
                            <Badge
                                color={f.status === "Filed" ? "success" : f.status === "In Progress" ? "brand" : "gray"}
                                type="pill-color"
                                size="sm"
                            >
                                {f.status}
                            </Badge>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// ─── Section: Billing ─────────────────────────────────────────────────────────

function BillingSection() {
    const invoices = [
        { date: "Feb 1, 2026", desc: "Numix Growth Plan — February", amount: "$349", status: "Paid" },
        { date: "Jan 1, 2026", desc: "Numix Growth Plan — January", amount: "$349", status: "Paid" },
        { date: "Dec 1, 2025", desc: "Numix Growth Plan — December", amount: "$349", status: "Paid" },
        { date: "Nov 1, 2025", desc: "Numix Growth Plan — November", amount: "$349", status: "Paid" },
    ];

    return (
        <div className="space-y-5">
            <SectionHeader
                title="Billing & Plan"
                description="Your Numix subscription. Your CPA firm manages plan configuration — contact them to upgrade."
            />

            <Card>
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-semibold text-secondary">Current Plan</p>
                        <div className="mt-2 flex items-center gap-2">
                            <p className="text-2xl font-bold text-primary">Growth</p>
                            <Badge color="brand" type="pill-color" size="sm">Active</Badge>
                        </div>
                        <p className="mt-1 text-sm text-tertiary">$349/month · Renews March 1, 2026</p>
                    </div>
                    <Button color="secondary" size="sm">View plans</Button>
                </div>
                <div className="mt-5 border-t border-secondary pt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-quaternary">Includes</p>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            "Monthly bookkeeping close",
                            "Annual federal + state tax return",
                            "Quarterly payroll tax filings",
                            "R&D credit assessment",
                            "Unlimited accountant messages",
                            "Up to 5 integrations",
                            "3 dashboard users",
                            "Priority support",
                        ].map((item) => (
                            <div key={item} className="flex items-center gap-2">
                                <Check className="size-3.5 shrink-0 text-fg-success-primary" aria-hidden />
                                <span className="text-xs text-secondary">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            <Card>
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-secondary">Payment Method</p>
                    <Button color="secondary" size="sm">Update card</Button>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-secondary bg-secondary px-4 py-3">
                    <div className="flex size-9 items-center justify-center rounded-md bg-primary text-xs font-bold text-secondary shadow-sm">
                        VISA
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary">Visa ending in 4242</p>
                        <p className="text-xs text-tertiary">Expires 08/27</p>
                    </div>
                </div>
            </Card>

            <Card>
                <p className="mb-4 text-sm font-semibold text-secondary">Invoice History</p>
                <div className="divide-y divide-secondary">
                    {invoices.map((inv) => (
                        <div key={inv.date} className="flex items-center justify-between gap-4 py-3">
                            <div>
                                <p className="text-sm text-secondary">{inv.desc}</p>
                                <p className="text-xs text-tertiary">{inv.date}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <p className="text-sm font-medium text-primary">{inv.amount}</p>
                                <Badge color="success" type="pill-color" size="sm">{inv.status}</Badge>
                                <button type="button" className="text-xs text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover">
                                    Download
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// ─── Section: Help ────────────────────────────────────────────────────────────

function HelpSection({ onMessageAccountant }: { onMessageAccountant?: () => void }) {
    return (
        <div className="space-y-5">
            <SectionHeader
                title="Help & Support"
                description="Most questions are best answered by your CPA. For software issues, Numix support is here."
            />

            <Card>
                <p className="mb-4 text-sm font-semibold text-secondary">Get Help</p>
                <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-secondary bg-secondary p-4">
                        <div>
                            <p className="text-sm font-medium text-secondary">Message your accountant</p>
                            <p className="mt-0.5 text-xs text-tertiary">Best for questions about your taxes, bookkeeping, or filings</p>
                        </div>
                        <Button color="primary" size="sm">Open chat</Button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-secondary bg-secondary p-4">
                        <div>
                            <p className="text-sm font-medium text-secondary">Contact Numix support</p>
                            <p className="mt-0.5 text-xs text-tertiary">For bugs, software issues, or billing questions</p>
                        </div>
                        <Button color="secondary" size="sm">Get support</Button>
                    </div>
                </div>
            </Card>

            <Card>
                <p className="mb-4 text-sm font-semibold text-secondary">Resources</p>
                <div className="divide-y divide-secondary">
                    {[
                        { label: "Help Center", hint: "Guides and how-tos for the Numix dashboard" },
                        { label: "Accounting Glossary", hint: "Plain-English definitions of terms your CPA uses" },
                        { label: "Video Walkthroughs", hint: "Short tutorials for common tasks" },
                        { label: "Keyboard Shortcuts", hint: "Navigate faster with CMD+K and more" },
                    ].map((r) => (
                        <div key={r.label} className="flex items-center justify-between py-3.5">
                            <div>
                                <p className="text-sm font-medium text-secondary">{r.label}</p>
                                <p className="mt-0.5 text-xs text-tertiary">{r.hint}</p>
                            </div>
                            <LinkExternal01 className="size-4 text-fg-quaternary" aria-hidden />
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <p className="mb-4 text-sm font-semibold text-secondary">System Status</p>
                <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-success-solid" />
                    <p className="text-sm text-secondary">All systems operational</p>
                    <span className="text-xs text-quaternary">· Updated 5 min ago</span>
                </div>
            </Card>

            <div className="rounded-xl border border-error-secondary bg-error-primary px-5 py-4">
                <p className="mb-1 text-sm font-semibold text-secondary">Account Actions</p>
                <p className="mb-4 text-xs text-tertiary">These actions affect your entire account. Proceed carefully.</p>
                <div className="flex gap-3">
                    <Button color="secondary" size="sm">Export all data</Button>
                    <Button color="secondary" size="sm">Pause account</Button>
                    <button type="button" className="text-sm font-medium text-error-primary transition duration-100 ease-linear hover:opacity-75">
                        Close account
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function SettingsScreen({ onBack }: { onBack: () => void }) {
    const [activeSection, setActiveSection] = useState<Section>("profile");

    function renderSection() {
        switch (activeSection) {
            case "profile": return <ProfileSection />;
            case "notifications": return <NotificationsSection />;
            case "security": return <SecuritySection />;
            case "company": return <CompanySection />;
            case "team": return <TeamSection />;
            case "integrations": return <IntegrationsSection />;
            case "tax": return <TaxSection />;
            case "billing": return <BillingSection />;
            case "help": return <HelpSection />;
        }
    }

    return (
        <div className="flex h-[85vh] max-h-[900px] w-[900px] max-w-[95vw] overflow-hidden rounded-xl bg-primary">

            {/* ── Left nav ──────────────────────────────────────────────────── */}
            <aside className="flex w-60 shrink-0 flex-col border-r border-secondary bg-primary">

                {/* Close button */}
                <div className="flex shrink-0 items-center justify-start px-4 py-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center justify-center rounded-lg p-1.5 text-fg-quaternary transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-secondary"
                    >
                        <X className="size-5" aria-hidden />
                        <span className="sr-only">Close settings</span>
                    </button>
                </div>

                {/* Nav groups */}
                <nav className="flex-1 overflow-y-auto px-3 pb-4">
                    {NAV_GROUPS.map((group, gi) => (
                        <div key={group.label} className={cx(gi > 0 && "mt-5")}>
                            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-quaternary">
                                {group.label}
                            </p>
                            {group.items.map((item) => {
                                const isActive = activeSection === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveSection(item.id)}
                                        className={cx(
                                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition duration-100 ease-linear",
                                            isActive
                                                ? "bg-brand-primary_alt text-brand-secondary"
                                                : "text-tertiary hover:bg-primary_hover hover:text-secondary",
                                        )}
                                    >
                                        <item.icon
                                            className={cx(
                                                "size-4 shrink-0",
                                                isActive ? "text-fg-brand-secondary_alt" : "text-fg-quaternary",
                                            )}
                                            aria-hidden
                                        />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    ))}

                    {/* Help — bottom of nav */}
                    <div className="mt-5 border-t border-secondary pt-4">
                        <button
                            type="button"
                            onClick={() => setActiveSection("help")}
                            className={cx(
                                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition duration-100 ease-linear",
                                activeSection === "help"
                                    ? "bg-brand-primary_alt text-brand-secondary"
                                    : "text-tertiary hover:bg-primary_hover hover:text-secondary",
                            )}
                        >
                            <HelpCircle
                                className={cx(
                                    "size-4 shrink-0",
                                    activeSection === "help" ? "text-fg-brand-secondary_alt" : "text-fg-quaternary",
                                )}
                                aria-hidden
                            />
                            Help & Support
                        </button>
                    </div>
                </nav>
            </aside>

            {/* ── Content area ──────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto bg-secondary">
                <div className="mx-auto max-w-2xl px-8 py-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                        >
                            {renderSection()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
