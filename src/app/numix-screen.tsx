"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/providers/auth-provider";
import { getSupabase } from "@/utils/supabase";
import {
    DndContext,
    type DragEndEvent,
    DragOverlay,
    type DragStartEvent,
    PointerSensor,
    closestCenter,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { IntegrationsSetup } from "@/app/integrations/integrations-setup";
import { TaxScreen } from "@/app/tax/tax-screen";
import { CFOScreen } from "@/app/cfo/cfo-screen";
import { BookkeepingScreen } from "@/app/bookkeeping/bookkeeping-screen";
import { SettingsScreen, type Section as SettingsSection } from "@/app/settings/settings-screen";
import { NewAskPanel } from "@/app/new-ask/new-ask-screen";
import { ConversationDetailPanel } from "@/app/conversation/conversation-panel";
import {
    BarChart01,
    BarChartSquare02,
    Calendar,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    CoinsStacked01,
    CurrencyDollar,
    Eye,
    File01,
    FileCheck02,
    Flag04,
    Hash01,
    HelpCircle,
    Home01,
    LineChartUp01,
    Link01,
    Mail01,
    MessageSquare01,
    Phone01,
    Plus,
    ReceiptCheck,
    Rows01,
    SearchLg,
    Settings01,
    Stars01,
    Upload01,
    User01,
} from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { ModalOverlay, Modal, Dialog } from "@/components/application/modals/modal";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "waiting-you" | "waiting-numix" | "done";

type TaskCategory = "Tax Filing" | "Tax Planning" | "Bookkeeping" | "Fractional CFO";

const CATEGORY_BADGE_COLOR: Record<TaskCategory, "blue" | "purple" | "success" | "brand"> = {
    "Tax Filing": "blue",
    "Tax Planning": "purple",
    "Bookkeeping": "success",
    "Fractional CFO": "brand",
};

interface Task {
    id: string;
    title: string;
    taskNumber: string;
    status: TaskStatus;
    category?: TaskCategory;
    description?: string;
    dueDate?: string;
    source: string;
    channel: string;
    action: "upload" | "review" | "confirm";
    completedDate?: string;
    conversationId?: string;
    // When set, clicking the task's action button (or the card itself in
    // board view) navigates to the corresponding panel instead of doing
    // the default action.
    panelId?: MainPanel;
    // Optional accent for tasks that need extra visual attention in the list
    // (e.g. flagged-for-review entry points).
    accent?: "flag";
    // For tax-calendar payment tasks: the calculated amount due.
    amount?: string;
    // For deadline tasks: distinguishes "pay" vs "file" action language.
    deadlineKind?: "payment" | "filing";
    // When Numix can prove the obligation was already handled (matched
    // from a linked bank, or processed by Numix directly), the task shows
    // a one-tap confirm flow instead of the back-and-forth SMS thread.
    autoDetected?: {
        source: string;        // e.g. "Mercury, Checking ···4821" or "Numix"
        payee: string;         // e.g. "U.S. Treasury (IRS Direct Pay)"
        matchedAt: string;     // e.g. "Apr 14, 2026"
        matchedAmount: string; // e.g. "$4,200.00"
        confidence: number;    // 0..1
    };
    // Priority drives the Priority sort option. Defaults to medium when missing.
    priority?: "high" | "medium" | "low";
}

type SortKey = "due-date" | "priority" | "source" | "channel" | "created";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "due-date", label: "Due date" },
    { key: "priority", label: "Priority" },
    { key: "source", label: "Source" },
    { key: "channel", label: "Channel" },
    { key: "created", label: "Created" },
];
const PRIORITY_ORDER: Record<NonNullable<Task["priority"]>, number> = { high: 0, medium: 1, low: 2 };

// Module-level context so tasks (rendered through DroppableListGroup → Row
// chains) can navigate without prop-drilling goToPanel through every layer.
const PanelNavContext = createContext<((panel: MainPanel) => void) | null>(null);
const usePanelNav = () => useContext(PanelNavContext);

// Format a due date for display. Adds an explicit year suffix when the date
// has been rolled into a different calendar year than today's, so the user
// doesn't read "Due Feb 28" as "this year" when it actually means next year.
function displayDueDate(dueDate?: string): string | undefined {
    if (!dueDate) return undefined;
    const cleaned = dueDate.replace(/^Due\s+/i, "").trim();
    if (/^this week$/i.test(cleaned)) return dueDate;
    if (/,\s*\d{4}$/.test(cleaned)) return dueDate;
    const now = new Date();
    const year = now.getFullYear();
    const parsed = Date.parse(`${cleaned}, ${year}`);
    if (isNaN(parsed)) return dueDate;
    if (parsed < now.getTime()) return `Due ${cleaned}, ${year + 1}`;
    return dueDate;
}

// Convert a human due-date string ("Due Feb 28", "Due this week") into a
// comparable timestamp for sorting. Unparseable / missing dates sort last.
// If a parsed date is already in the past, roll it forward to next year. These
// are recurring deadlines (quarterly taxes, monthly reconciliation), so the
// next occurrence is what's actually due.
function dueDateSortKey(dueDate?: string): number {
    if (!dueDate) return Number.POSITIVE_INFINITY;
    const cleaned = dueDate.replace(/^Due\s+/i, "").trim();
    if (/^this week$/i.test(cleaned)) {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.getTime();
    }
    const now = new Date();
    const year = now.getFullYear();
    const parsed = Date.parse(`${cleaned}, ${year}`);
    if (isNaN(parsed)) return Number.POSITIVE_INFINITY;
    if (parsed < now.getTime()) {
        const nextYear = Date.parse(`${cleaned}, ${year + 1}`);
        return isNaN(nextYear) ? parsed : nextYear;
    }
    return parsed;
}

// Lets any task in the tree open the detail slideout without prop-drilling.
const TaskDetailContext = createContext<((taskId: string) => void) | null>(null);
const useOpenTaskDetail = () => useContext(TaskDetailContext);

// ─── Data ─────────────────────────────────────────────────────────────────────

const navItems = [
    { label: "Home", icon: Home01, panelId: "home" as const },
    {
        label: "Bookkeeping", icon: BarChart01, subItems: [
            { label: "Accounts Payable", panelId: "bk-ap" as const, icon: CurrencyDollar },
            { label: "Accounts Receivable", panelId: "bk-ar" as const, icon: CoinsStacked01 },
            { label: "Transactions", panelId: "bk-transactions" as const, icon: Rows01 },
            { label: "Reports", panelId: "bk-reports" as const, icon: BarChartSquare02 },
        ],
    },
    {
        label: "Tax", icon: ReceiptCheck, subItems: [
            { label: "Tax Filing", panelId: "tax-filing" as const, icon: FileCheck02 },
            { label: "Tax Planning", panelId: "tax-planning" as const, icon: LineChartUp01 },
        ],
    },
    {
        label: "Fractional CFO", icon: LineChartUp01, subItems: [
            { label: "Forecast", panelId: "cfo-forecast" as const, icon: LineChartUp01 },
            { label: "How to Save Money", panelId: "cfo-save-money" as const, icon: CoinsStacked01 },
            { label: "How to Make Money", panelId: "cfo-make-money" as const, icon: Stars01 },
        ],
    },
    { label: "Documents", icon: File01, panelId: "documents" as const },
];

const recentConversations = [
    { id: "rd-payroll", title: "R&D Payroll Clarification", time: "2h ago", status: "waiting-you" as TaskStatus },
    { id: "return-2024", title: "2024 Return Review", time: "1d ago", status: "waiting-numix" as TaskStatus },
    { id: "mileage", title: "Mileage Deduction", time: "2d ago", status: "done" as TaskStatus },
    { id: "q4-taxes", title: "Q4 Estimated Taxes", time: "3d ago", status: "done" as TaskStatus },
    { id: "contractor-1099", title: "Contractor 1099 Filing", time: "5d ago", status: "waiting-you" as TaskStatus },
];

const INITIAL_TASKS: Task[] = [
    {
        id: "flagged-transactions",
        title: "3 transactions flagged for your review",
        taskNumber: "NUM-1099",
        status: "waiting-you",
        category: "Bookkeeping",
        description: "AI couldn't categorise 3 recent transactions confidently. Confirm or recategorise them in Bookkeeping → Transactions.",
        dueDate: "Due this week",
        source: "System Generated",
        channel: "In-app",
        action: "review",
        panelId: "bk-transactions",
        accent: "flag",
        priority: "high",
    },
    {
        id: "1",
        title: "Upload December Bank Statement",
        taskNumber: "NUM-1042",
        status: "waiting-you",
        category: "Tax Filing",
        description: "Please upload your December bank statement to verify end-of-year balances for your 2024 return.",
        dueDate: "Due Feb 28",
        source: "System Generated",
        channel: "Email",
        action: "upload",
        conversationId: "return-2024",
        priority: "high",
    },
    {
        id: "2",
        title: "Review Draft Tax Summary",
        taskNumber: "NUM-1045",
        status: "waiting-you",
        category: "Tax Filing",
        description: "Your CPA has prepared a draft tax summary. Please review and flag any discrepancies before we file.",
        dueDate: "Due Mar 10",
        source: "Requested by CPA",
        channel: "Slack",
        action: "review",
        conversationId: "return-2024",
        priority: "medium",
    },
    {
        id: "3",
        title: "Preparing 2024 1120-S Federal Return",
        taskNumber: "NUM-1051",
        status: "waiting-numix",
        category: "Tax Filing",
        description: "Numix is drafting your S-Corp federal income tax return for tax year 2024. We'll share a draft for your review before filing.",
        dueDate: "Due Mar 15",
        source: "Numix CPA Team",
        channel: "Slack",
        action: "review",
        conversationId: "return-2024",
    },
    {
        id: "4",
        title: "Reconciling January Bank Activity",
        taskNumber: "NUM-1052",
        status: "waiting-numix",
        category: "Bookkeeping",
        description: "Numix is matching January transactions from Mercury against your QuickBooks ledger to close the books for the month.",
        dueDate: "Due Feb 5",
        source: "Numix CPA Team",
        channel: "Slack",
        action: "review",
    },
    {
        id: "5",
        title: "Monthly Payroll Review - January",
        taskNumber: "NUM-1035",
        status: "done",
        category: "Bookkeeping",
        source: "System Generated",
        channel: "Email",
        action: "review",
        completedDate: "Completed Feb 10",
    },
    {
        id: "6",
        title: "Submit Contractor 1099 Forms",
        taskNumber: "NUM-1038",
        status: "done",
        category: "Tax Filing",
        source: "Requested by CPA",
        channel: "SMS",
        action: "upload",
        completedDate: "Completed Feb 15",
    },
    {
        id: "dl-1",
        title: "Q3 Estimated Tax Payment",
        taskNumber: "DEADLINE",
        status: "waiting-you",
        category: "Tax Planning",
        description: "Confirm you paid your Q3 estimated tax. We sent the payment link by SMS. If you've already paid, mark this done.",
        dueDate: "Due Sep 15",
        source: "Tax Calendar",
        channel: "SMS",
        action: "confirm",
        priority: "medium",
        amount: "$4,200",
        deadlineKind: "payment",
    },
    {
        id: "dl-2",
        title: "Extended Individual Return Deadline",
        taskNumber: "DEADLINE",
        status: "waiting-you",
        category: "Tax Filing",
        description: "Confirm you filed your extended individual return. If Numix filed for you, this will close automatically once the IRS acknowledges.",
        dueDate: "Due Oct 15",
        source: "Tax Calendar",
        channel: "Email",
        action: "confirm",
        priority: "low",
        deadlineKind: "filing",
    },
    {
        id: "dl-3",
        title: "Q1 Estimated Tax Payment",
        taskNumber: "DEADLINE",
        status: "waiting-you",
        category: "Tax Planning",
        description: "Q1 estimated tax payment was due Apr 15. Numix matched the payment from your Mercury account. One-tap confirm to close out.",
        dueDate: "Due Apr 15",
        source: "Tax Calendar",
        channel: "Auto-detected",
        action: "confirm",
        priority: "low",
        amount: "$4,200",
        deadlineKind: "payment",
        autoDetected: {
            source: "Mercury, Checking ···4821",
            payee: "U.S. Treasury (IRS Direct Pay)",
            matchedAt: "Apr 14, 2026",
            matchedAmount: "$4,200.00",
            confidence: 0.96,
        },
    },
];

// Map task.id → original creation order (index in INITIAL_TASKS).
// Lower index = older. Used by the "Created" sort option.
const CREATED_ORDER: Map<string, number> = new Map(INITIAL_TASKS.map((t, i) => [t.id, i]));

// ─── Presentational components ────────────────────────────────────────────────

function SidebarStatusBadge({ status }: { status: TaskStatus }) {
    if (status === "waiting-you") {
        return <Badge color="brand" type="pill-color" size="sm">Waiting on You</Badge>;
    }
    if (status === "waiting-numix") {
        return <Badge color="blue-light" type="pill-color" size="sm">Waiting on Numix</Badge>;
    }
    return <Badge color="gray" type="pill-color" size="sm">Done</Badge>;
}

function ChannelIcon({ channel }: { channel: string }) {
    if (channel === "Email") return <Mail01 className="size-3.5 text-fg-tertiary" />;
    if (channel === "SMS") return <Phone01 className="size-3.5 text-fg-tertiary" />;
    return <MessageSquare01 className="size-3.5 text-fg-tertiary" />;
}

function TaskActionButton({ task }: { task: Task }) {
    const nav = usePanelNav();
    const openDetail = useOpenTaskDetail();
    const onClick = task.panelId && nav ? () => nav(task.panelId!) : undefined;
    if (task.action === "upload") return <Button color="secondary" size="sm" iconLeading={Upload01} onClick={onClick}>Upload</Button>;
    if (task.action === "review") {
        const icon = task.accent === "flag" ? Flag04 : Eye;
        const label = task.accent === "flag" ? "Review flagged" : "Review";
        return <Button color="secondary" size="sm" iconLeading={icon} onClick={onClick}>{label}</Button>;
    }
    if (task.deadlineKind) {
        const label = task.autoDetected
            ? "Confirm match"
            : task.deadlineKind === "payment"
            ? "Mark paid"
            : "Mark filed";
        return <Button color="secondary" size="sm" iconLeading={Check} onClick={openDetail ? () => openDetail(task.id) : undefined}>{label}</Button>;
    }
    return <Button color="secondary" size="sm" iconLeading={Check} onClick={onClick}>Confirm</Button>;
}

function DragHandle() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-fg-quaternary">
            <circle cx="5.5" cy="4" r="1.25" fill="currentColor" />
            <circle cx="5.5" cy="8" r="1.25" fill="currentColor" />
            <circle cx="5.5" cy="12" r="1.25" fill="currentColor" />
            <circle cx="10.5" cy="4" r="1.25" fill="currentColor" />
            <circle cx="10.5" cy="8" r="1.25" fill="currentColor" />
            <circle cx="10.5" cy="12" r="1.25" fill="currentColor" />
        </svg>
    );
}

// BoardIcon inherits color from parent via currentColor
function BoardIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="size-4">
            <rect x="1" y="1" width="5" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
            <rect x="8" y="1" width="5" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
        </svg>
    );
}

function TaskCard({ task, dragListeners }: { task: Task; dragListeners?: Record<string, unknown> }) {
    const isDone = task.status === "done";
    const openDetail = useOpenTaskDetail();
    return (
        <div
            role={openDetail ? "button" : undefined}
            tabIndex={openDetail ? 0 : undefined}
            onClick={openDetail ? () => openDetail(task.id) : undefined}
            onKeyDown={openDetail ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(task.id); } } : undefined}
            className={cx(
                "rounded-xl border border-secondary bg-primary p-4 shadow-xs",
                isDone && "opacity-75",
                openDetail && "cursor-pointer transition duration-100 ease-linear hover:border-brand hover:bg-primary_hover",
            )}
        >
            <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <p className={cx("text-sm font-semibold leading-snug text-primary", isDone && "text-tertiary line-through")}>{task.title}</p>
                        {!isDone && <div onClick={(e) => e.stopPropagation()}><TaskActionButton task={task} /></div>}
                    </div>
                    {task.category && (
                        <div className="mt-2">
                            <Badge color={CATEGORY_BADGE_COLOR[task.category]} type="pill-color" size="sm">
                                {task.category}
                            </Badge>
                        </div>
                    )}
                    <div className="mt-2 flex items-center gap-1">
                        <Hash01 className="size-3 text-fg-quaternary" />
                        <span className={cx("text-xs text-tertiary", isDone && "line-through")}>{task.taskNumber}</span>
                        <Link01 className="size-3 text-fg-quaternary" />
                    </div>
                    {task.dueDate && (
                        <div className="mt-2 flex items-center gap-1.5">
                            <Clock className="size-3.5 text-fg-quaternary" />
                            <span className="text-xs text-tertiary">{displayDueDate(task.dueDate)}</span>
                            {task.amount && (
                                <>
                                    <span className="text-xs text-quaternary">·</span>
                                    <span className="text-xs font-medium tabular-nums text-primary">{task.amount}</span>
                                </>
                            )}
                        </div>
                    )}
                    {task.completedDate && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                            <Check className="size-3.5 text-fg-success-secondary" />
                            <span className="text-xs text-tertiary">{task.completedDate}</span>
                        </div>
                    )}
                    <div className="mt-1.5 flex items-center gap-1.5">
                        {task.source === "System Generated" ? <Settings01 className="size-3.5 text-fg-quaternary" /> : <User01 className="size-3.5 text-fg-quaternary" />}
                        <span className="text-xs text-tertiary">{task.source}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                        <ChannelIcon channel={task.channel} />
                        <span className="text-xs text-tertiary">{task.channel}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ListTaskRow({ task, dragListeners }: { task: Task; dragListeners?: Record<string, unknown> }) {
    const isDone = task.status === "done";
    const openDetail = useOpenTaskDetail();
    // Flag-accented tasks (e.g., flagged transactions) jump straight to their
    // target panel via the action button (no detail slideout, since the work
    // happens on the destination page itself).
    const canOpenDetail = openDetail && task.accent !== "flag";
    return (
        <div
            role={canOpenDetail ? "button" : undefined}
            tabIndex={canOpenDetail ? 0 : undefined}
            onClick={canOpenDetail ? () => openDetail!(task.id) : undefined}
            onKeyDown={canOpenDetail ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail!(task.id); } } : undefined}
            className={cx(
                "flex items-center gap-3 rounded-lg border border-secondary bg-primary px-4 py-3 transition duration-100 ease-linear hover:bg-primary_hover",
                isDone && "opacity-60",
                canOpenDetail && "cursor-pointer hover:border-brand",
            )}
        >
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className={cx("truncate text-sm font-medium text-primary", isDone && "text-tertiary line-through")}>{task.title}</p>
                    {task.category && (
                        <Badge color={CATEGORY_BADGE_COLOR[task.category]} type="pill-color" size="sm">
                            {task.category}
                        </Badge>
                    )}
                    <div className="flex shrink-0 items-center gap-0.5">
                        <Hash01 className="size-3 text-fg-quaternary" />
                        <span className="text-xs text-quaternary">{task.taskNumber}</span>
                    </div>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        {task.source === "System Generated" ? <Settings01 className="size-3 text-fg-quaternary" /> : <User01 className="size-3 text-fg-quaternary" />}
                        <span className="text-xs text-quaternary">{task.source}</span>
                    </div>
                    <span className="text-xs text-quaternary">·</span>
                    <div className="flex items-center gap-1">
                        <ChannelIcon channel={task.channel} />
                        <span className="text-xs text-quaternary">{task.channel}</span>
                    </div>
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
                {task.amount && !isDone && (
                    <span className="text-xs font-medium tabular-nums text-primary">{task.amount}</span>
                )}
                {task.dueDate && !isDone && (
                    <div className="flex items-center gap-1">
                        <Clock className="size-3.5 text-fg-quaternary" />
                        <span className="text-xs text-tertiary">{displayDueDate(task.dueDate)}</span>
                    </div>
                )}
                {task.completedDate && (
                    <div className="flex items-center gap-1">
                        <Check className="size-3.5 text-fg-success-secondary" />
                        <span className="text-xs text-tertiary">{task.completedDate}</span>
                    </div>
                )}
                {!isDone && <div onClick={(e) => e.stopPropagation()}><TaskActionButton task={task} /></div>}
            </div>
        </div>
    );
}

// ─── Search modal ─────────────────────────────────────────────────────────────

function SearchModal({ tasks, onClose }: { tasks: Task[]; onClose: () => void }) {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const results = query.trim()
        ? tasks.filter((t) =>
            t.title.toLowerCase().includes(query.toLowerCase()) ||
            t.taskNumber.toLowerCase().includes(query.toLowerCase()),
          )
        : tasks;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg overflow-hidden rounded-2xl border border-secondary bg-primary shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Input row */}
                <div className="flex items-center gap-3 border-b border-secondary px-4 py-3.5">
                    <SearchLg className="size-5 shrink-0 text-fg-quaternary" aria-hidden />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Escape" && onClose()}
                        placeholder="Search..."
                        className="flex-1 bg-transparent text-sm text-primary placeholder:text-placeholder focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded border border-secondary bg-secondary px-1.5 py-0.5 text-xs font-medium text-tertiary transition duration-100 ease-linear hover:bg-tertiary"
                    >
                        ESC
                    </button>
                </div>

                {/* Results */}
                <div className="py-2">
                    {results.length > 0 ? (
                        <>
                            <p className="px-4 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wider text-quaternary">Tasks</p>
                            {results.map((task) => (
                                <button
                                    key={task.id}
                                    type="button"
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition duration-100 ease-linear hover:bg-primary_hover"
                                >
                                    <Hash01 className="size-4 shrink-0 text-fg-quaternary" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-primary">{task.title}</p>
                                        <p className="text-xs text-tertiary">{task.taskNumber}</p>
                                    </div>
                                    <ChevronRight className="size-4 shrink-0 text-fg-quaternary" />
                                </button>
                            ))}
                        </>
                    ) : (
                        <p className="px-4 py-4 text-sm text-tertiary">No tasks found for &ldquo;{query}&rdquo;</p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-secondary px-4 py-3">
                    <p className="text-xs text-quaternary">Search across your entire workspace</p>
                    <div className="flex items-center gap-1">
                        <span className="rounded border border-secondary bg-secondary px-1.5 py-0.5 text-xs font-medium text-tertiary">CMD</span>
                        <span className="rounded border border-secondary bg-secondary px-1.5 py-0.5 text-xs font-medium text-tertiary">K</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── DnD wrapper components ───────────────────────────────────────────────────

function DraggableTaskCard({ task }: { task: Task }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
    const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
    return (
        <div ref={setNodeRef} {...attributes} style={style} className={isDragging ? "opacity-30" : undefined}>
            <TaskCard task={task} dragListeners={listeners as Record<string, unknown>} />
        </div>
    );
}

const columnColors = {
    brand: {
        columnBg: "bg-brand-primary_alt",
        headerBg: "border-l-2 border-brand-600 bg-brand-primary_alt",
        title: "text-brand-secondary",
        count: "text-brand-tertiary",
        ring: "ring-2 ring-brand ring-inset bg-brand-primary_alt",
    },
    warning: {
        columnBg: "bg-warning-primary",
        headerBg: "border-l-2 border-warning-600 bg-warning-primary",
        title: "text-warning-primary",
        count: "text-warning-primary",
        ring: "ring-2 ring-warning ring-inset bg-warning-primary",
    },
    success: {
        columnBg: "bg-success-primary",
        headerBg: "border-l-2 border-success-600 bg-success-primary",
        title: "text-success-primary",
        count: "text-success-primary",
        ring: "ring-2 ring-success ring-inset bg-success-primary",
    },
} as const;

type ColumnColor = keyof typeof columnColors;

function CategoryTabs({ visibleCategories, categoryFilter, onChange, counts }: {
    visibleCategories: Array<TaskCategory | "All">;
    categoryFilter: TaskCategory | "All";
    onChange: (c: TaskCategory | "All") => void;
    counts: Record<string, number>;
}) {
    return (
        <div className="flex items-center gap-1 rounded-md border border-secondary bg-primary p-0.5">
            {visibleCategories.map((cat) => {
                const isActive = categoryFilter === cat;
                return (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => onChange(cat)}
                        className={cx(
                            "flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition duration-100 ease-linear",
                            isActive ? "bg-secondary text-primary shadow-xs" : "text-tertiary hover:text-primary",
                        )}
                    >
                        {cat}
                        <span className={cx(
                            "rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                            isActive ? "bg-primary text-primary" : "bg-secondary text-tertiary",
                        )}>
                            {counts[cat] ?? 0}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function DroppableBoardColumn({ status, title, count, tasks, color, headerRight }: {
    status: TaskStatus; title: string; count: number; tasks: Task[]; color?: ColumnColor; headerRight?: ReactNode;
}) {
    const { isOver, setNodeRef } = useDroppable({ id: status });
    const c = color ? columnColors[color] : null;
    return (
        <div
            ref={setNodeRef}
            className={cx(
                "flex flex-1 flex-col gap-3 rounded-xl p-3 transition duration-150",
                c ? c.columnBg : "bg-secondary",
                isOver && (c ? c.ring : "ring-2 ring-brand ring-inset bg-brand-primary_alt"),
            )}
        >
            <div className={cx("flex items-center gap-2 rounded-lg px-3 py-2", c ? c.headerBg : "bg-secondary")}>
                <span className={cx("text-sm font-semibold", c ? c.title : "text-secondary")}>{title}</span>
                <span className={cx("text-sm font-medium", c ? c.count : "text-tertiary")}>{count}</span>
                {headerRight && <div className="ml-auto flex items-center">{headerRight}</div>}
            </div>
            <div className="flex min-h-14 flex-col gap-3">
                {tasks.map((task) => <DraggableTaskCard key={task.id} task={task} />)}
            </div>
        </div>
    );
}

function DraggableListRow({ task }: { task: Task }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
    const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
    return (
        <div ref={setNodeRef} {...attributes} style={style} className={isDragging ? "opacity-30" : undefined}>
            <ListTaskRow task={task} dragListeners={listeners as Record<string, unknown>} />
        </div>
    );
}

function DroppableListGroup({ status, title, count, tasks, color, headerRight }: {
    status: TaskStatus; title: string; count: number; tasks: Task[]; color?: ColumnColor; headerRight?: ReactNode;
}) {
    const { isOver, setNodeRef } = useDroppable({ id: status });
    const c = color ? columnColors[color] : null;
    return (
        <div
            ref={setNodeRef}
            className={cx(
                "space-y-3 rounded-xl p-3 transition duration-150",
                c ? c.columnBg : "bg-secondary",
                isOver && (c ? c.ring : "bg-brand-primary_alt ring-2 ring-brand ring-inset"),
            )}
        >
            <div className={cx("flex items-center gap-2 rounded-lg px-3 py-2", c ? c.headerBg : "bg-secondary")}>
                <span className={cx("text-sm font-semibold", c ? c.title : "text-secondary")}>{title}</span>
                <span className={cx("text-sm font-medium", c ? c.count : "text-tertiary")}>{count}</span>
                {headerRight && <div className="ml-auto flex items-center">{headerRight}</div>}
            </div>
            <div className="min-h-10 space-y-1">
                {tasks.map((task) => <DraggableListRow key={task.id} task={task} />)}
            </div>
        </div>
    );
}

// ─── Login screen ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [signUpSuccess, setSignUpSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (isSignUp) {
            const { error } = await getSupabase().auth.signUp({ email, password });
            if (error) {
                setError(error.message);
                setLoading(false);
            } else {
                setLoading(false);
                setSignUpSuccess(true);
            }
        } else {
            const { error } = await getSupabase().auth.signInWithPassword({ email, password });
            if (error) {
                setError(error.message);
                setLoading(false);
            } else {
                onLogin();
            }
        }
    }

    async function handleGoogleSignIn() {
        const { error } = await getSupabase().auth.signInWithOAuth({ provider: "google" });
        if (error) setError(error.message);
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex h-dvh flex-col items-center bg-primary"
        >
            {/* Form content */}
            <div className="flex flex-1 flex-col items-center justify-center px-4">
                {/* Logo */}
                <img src="/numix-logo.png" alt="Numix" className="mb-16 h-16 w-auto" />

                {signUpSuccess ? (
                    <div className="flex w-full max-w-sm flex-col items-center text-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-success-secondary">
                            <Mail01 className="size-6 text-fg-success-primary" />
                        </div>
                        <h1 className="mt-5 text-3xl font-semibold text-primary">Check your email</h1>
                        <p className="mt-3 text-sm text-tertiary">
                            We&apos;ve sent a confirmation link to <span className="font-medium text-primary">{email}</span>. Click the link to verify your account and get started.
                        </p>
                        <button
                            type="button"
                            onClick={() => { setSignUpSuccess(false); setIsSignUp(false); setError(null); }}
                            className="mt-8 text-sm font-medium text-brand-secondary"
                        >
                            Back to sign in
                        </button>
                    </div>
                ) : (<>

                <h1 className="text-center text-3xl font-semibold text-primary">
                    {isSignUp ? "Create your account" : "Log in to your account"}
                </h1>

                {error && (
                    <div className="mt-4 w-full max-w-sm rounded-lg border border-error bg-error-primary px-4 py-3 text-sm text-error-primary">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-8 w-full max-w-sm space-y-5">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-secondary">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full rounded-lg border border-primary bg-primary px-3.5 py-2.5 text-sm text-primary placeholder:text-placeholder transition duration-100 ease-linear focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-secondary">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-lg border border-primary bg-primary px-3.5 py-2.5 text-sm text-primary placeholder:text-placeholder transition duration-100 ease-linear focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex cursor-pointer items-center gap-2">
                            <input type="checkbox" className="size-4 rounded border-primary accent-brand-600" />
                            <span className="text-sm text-secondary">Remember me</span>
                        </label>
                        <button type="button" className="text-sm font-medium text-brand-secondary">
                            Forgot password
                        </button>
                    </div>

                    <Button
                        type="submit"
                        color="primary"
                        size="lg"
                        isLoading={loading}
                        showTextWhileLoading
                        className="w-full"
                    >
                        {isSignUp ? "Sign up" : "Sign in"}
                    </Button>

                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-tertiary" />
                        <span className="text-sm text-quaternary">OR</span>
                        <div className="h-px flex-1 bg-tertiary" />
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="flex w-full items-center justify-center gap-3 rounded-lg border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-secondary transition duration-100 ease-linear hover:bg-primary_hover"
                    >
                        <svg className="size-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        {isSignUp ? "Sign up with Google" : "Sign in with Google"}
                    </button>
                </form>

                <p className="mt-6 text-sm text-tertiary">
                    {isSignUp ? "Already have an account?" : "Don\u2019t have an account?"}{" "}
                    <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="font-medium text-brand-secondary">
                        {isSignUp ? "Sign in" : "Sign up"}
                    </button>
                </p>

                </>)}
            </div>
        </motion.div>
    );
}

// ─── Page shells ─────────────────────────────────────────────────────────────

type MainPanel = "home" | "new-ask" | "conversation" | "status-overview" | "tax-filing" | "tax-planning" | "cfo-forecast" | "cfo-save-money" | "cfo-make-money" | "bk-ap" | "bk-ar" | "bk-transactions" | "bk-reports" | "documents";

function StatusOverviewPage({ goToPanel }: { goToPanel: (panel: MainPanel) => void }) {
    return (
        <div className="flex min-w-0 flex-1 flex-col bg-secondary">
            <main className="flex-1 overflow-auto px-10 py-8">
                <div className="mb-6">
                    <h2 className="text-display-sm font-semibold text-primary">Status Overview</h2>
                    <p className="mt-1 text-md text-tertiary">Track the progress of your tax filing, planning, and credits.</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {/* Filing */}
                    <div className="flex flex-col rounded-xl border border-secondary bg-primary p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-primary">Tax Filing</h3>
                            <BadgeWithDot color="success" type="pill-color" size="sm">On Track</BadgeWithDot>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success-secondary">
                                <Check className="size-4 text-fg-success-primary" aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-primary">2024 Returns</p>
                                <p className="text-xs text-tertiary">In review &middot; due Mar 15</p>
                            </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                                <div className="h-full w-3/4 rounded-full bg-success-solid" />
                            </div>
                            <span className="text-xs font-medium tabular-nums text-quaternary">75%</span>
                        </div>

                        {/* Milestones */}
                        <div className="mt-3 space-y-0">
                            <div className="flex items-center gap-2.5 py-1.5">
                                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success-solid">
                                    <Check className="size-3 text-white" aria-hidden />
                                </div>
                                <span className="text-sm text-tertiary line-through">Documents collected</span>
                            </div>
                            <div className="flex items-center gap-2.5 py-1.5">
                                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success-solid">
                                    <Check className="size-3 text-white" aria-hidden />
                                </div>
                                <span className="text-sm text-tertiary line-through">Returns prepared</span>
                            </div>
                            <div className="flex items-center gap-2.5 py-1.5">
                                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-solid">
                                    <span className="text-[10px] font-bold text-white">3</span>
                                </div>
                                <span className="text-sm font-medium text-primary">CPA review in progress</span>
                            </div>
                            <div className="flex items-center gap-2.5 py-1.5">
                                <div className="size-5 shrink-0 rounded-full border-2 border-tertiary" />
                                <span className="text-sm text-quaternary">Final sign-off &amp; file</span>
                            </div>
                        </div>

                        <div className="mt-auto pt-4">
                            <Button color="link-color" size="sm" iconTrailing={ChevronRight} onClick={() => goToPanel("tax-filing")}>
                                View details
                            </Button>
                        </div>
                    </div>

                    {/* Planning */}
                    <div className="flex flex-col rounded-xl border border-secondary bg-primary p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-primary">Tax Planning</h3>
                            <BadgeWithDot color="warning" type="pill-color" size="sm">Action Needed</BadgeWithDot>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning-secondary">
                                <Clock className="size-4 text-fg-warning-primary" aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-primary">Q1 Planning</p>
                                <p className="text-xs text-tertiary">Payment due Apr 15</p>
                            </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                                <div className="h-full w-2/5 rounded-full bg-warning-solid" />
                            </div>
                            <span className="text-xs font-medium tabular-nums text-quaternary">40%</span>
                        </div>

                        {/* AI Suggestions */}
                        <div className="mt-3 rounded-lg bg-gradient-to-r from-purple-200/60 via-purple-100/50 to-blue-200/60 p-3.5">
                            <div className="mb-2.5 flex items-center gap-2">
                                <Stars01 className="size-4 text-fg-brand-primary" aria-hidden />
                                <span className="text-sm font-semibold text-brand-primary">AI Suggestions</span>
                            </div>
                            <ul className="space-y-2.5">
                                <li className="flex items-start gap-2.5 text-sm text-primary">
                                    <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-brand-solid" />
                                    <span>Review estimated Q1 payment of <span className="font-semibold">$4,200</span> before Apr 15</span>
                                </li>
                                <li className="flex items-start gap-2.5 text-sm text-primary">
                                    <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-brand-solid" />
                                    <span>Max out 401(k) contributions to reduce taxable income</span>
                                </li>
                                <li className="flex items-start gap-2.5 text-sm text-primary">
                                    <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-brand-solid" />
                                    <span>Upload Q1 expense receipts for deduction review</span>
                                </li>
                            </ul>
                        </div>

                        <div className="mt-auto pt-4">
                            <Button color="link-color" size="sm" iconTrailing={ChevronRight} onClick={() => goToPanel("tax-planning")}>
                                View details
                            </Button>
                        </div>
                    </div>

                    {/* R&D Credit */}
                    <div className="flex flex-col rounded-xl border border-secondary bg-primary p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-primary">R&D Credits</h3>
                            <BadgeWithDot color="brand" type="pill-color" size="sm">In Progress</BadgeWithDot>
                        </div>

                        <p className="text-xs text-tertiary">Potential credit</p>
                        <p className="mt-0.5 text-2xl font-semibold tracking-tight text-primary">$3,850</p>

                        <div className="mt-3 flex-1 space-y-1.5 rounded-lg bg-secondary p-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-tertiary">Software &amp; cloud</span>
                                <span className="font-medium text-secondary">$2,100</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-tertiary">Engineering payroll</span>
                                <span className="font-medium text-secondary">$1,450</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-tertiary">Contractor R&amp;D</span>
                                <span className="font-medium text-secondary">$300</span>
                            </div>
                        </div>

                        <div className="mt-auto pt-4">
                            <Button color="primary" size="sm" className="w-full" iconTrailing={ChevronRight} onClick={() => goToPanel("tax-planning")}>
                                Start claim
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function PageShell({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
    return (
        <div className="flex min-w-0 flex-1 flex-col bg-secondary">
            <main className="flex-1 overflow-auto px-10 py-8">
                <div className="mb-6">
                    <h2 className="text-display-sm font-semibold text-primary">{title}</h2>
                    <p className="mt-1 text-md text-tertiary">{description}</p>
                </div>
                {children || (
                    <div className="rounded-xl border border-secondary bg-primary p-8 text-center">
                        <p className="text-sm text-tertiary">This page is coming soon.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

// ─── Connected summary (post-integration) ────────────────────────────────────

function ConnectedSummary({ onNavigate }: { onNavigate: (panel: MainPanel, taxIntent?: { tab?: "expenses" | "credits"; credit?: string }) => void }) {
    // Demo: starts collapsed so the home page leads with "Your next steps".
    // Clicking the header expands the metrics grid.
    const [expanded, setExpanded] = useState(false);

    const metrics = [
        { label: "Cash on hand", value: "$128,450", trend: "+2.4% this week", source: "Mercury", subLine: "$3,421 on Brex card", icon: CurrencyDollar, tone: "success" as const, onClick: () => onNavigate("bk-transactions"), hint: "View transactions" },
        { label: "Open invoices", value: "$18,300", trend: "5 invoices · 2 overdue", source: "QuickBooks", icon: ReceiptCheck, tone: "warning" as const, onClick: () => onNavigate("bk-ar"), hint: "View receivables" },
        { label: "R&D credit eligible", value: "$448,183.82", trend: "Tax year 2024", source: "Tax Planning", icon: Stars01, tone: "brand" as const, onClick: () => onNavigate("tax-planning", { tab: "credits", credit: "rd" }), hint: "Start claim" },
    ];

    const toneStyles = {
        success: { value: "text-success-primary", iconBg: "bg-success-secondary", iconFg: "text-fg-success-primary", trend: "text-success-primary" },
        warning: { value: "text-warning-primary", iconBg: "bg-warning-secondary", iconFg: "text-fg-warning-primary", trend: "text-warning-primary" },
        brand: { value: "text-brand-secondary", iconBg: "bg-brand-primary_alt", iconFg: "text-fg-brand-primary", trend: "text-tertiary" },
    };

    return (
        <div className="mb-8 overflow-hidden rounded-xl border border-secondary bg-primary">
            {/* Brand banner header. Matches CFO / Tax / Bookkeeping. Click to expand/collapse. */}
            <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className={cx(
                    "flex w-full items-center justify-between gap-3 bg-brand-primary_alt px-6 py-4 text-left transition duration-100 ease-linear hover:bg-brand-primary_alt/80",
                    expanded && "border-b border-brand/20",
                )}
                aria-expanded={expanded}
            >
                <div className="flex items-center gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-primary">Financial overview</h3>
                        <p className="text-xs text-tertiary">Mercury &middot; Brex &middot; QuickBooks</p>
                    </div>
                    <BadgeWithDot color="success" size="sm" type="pill-color">Live</BadgeWithDot>
                </div>
                <div className="flex items-center gap-3 text-xs text-tertiary">
                    <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        Synced 2 min ago
                    </div>
                    <ChevronDown
                        className={cx("size-5 text-fg-quaternary transition-transform duration-150", expanded && "rotate-180")}
                        aria-hidden
                    />
                </div>
            </button>

            {/* Metrics grid. Each tile links to its source page. */}
            {expanded && (
                <div className="grid grid-cols-1 divide-y divide-secondary sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    {metrics.map((m) => {
                        const t = toneStyles[m.tone];
                        return (
                            <div key={m.label} className="flex items-center justify-between gap-4 px-6 py-5">
                                <div className="min-w-0">
                                    <p className="text-xs text-tertiary">{m.label}</p>
                                    <p className={cx("mt-1 text-2xl font-semibold tabular-nums tracking-tight", t.value)}>{m.value}</p>
                                    <p className={cx("mt-1 text-xs", t.trend)}>{m.trend}</p>
                                    {m.subLine && (
                                        <p className="mt-0.5 text-xs text-tertiary">{m.subLine}</p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={m.onClick}
                                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-secondary hover:underline"
                                    >
                                        {m.hint}
                                        <ChevronRight className="size-3.5" />
                                    </button>
                                </div>
                                <div className={cx("flex size-10 shrink-0 items-center justify-center rounded-full", t.iconBg)}>
                                    <m.icon className={cx("size-5", t.iconFg)} aria-hidden />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Task detail slideout ────────────────────────────────────────────────────

function TaskDetailSlideout({
    task,
    isOpen,
    onClose,
    goToPanel,
    goToConversation,
    onMarkDone,
}: {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    goToPanel: (panel: MainPanel) => void;
    goToConversation: (id: string, title: string) => void;
    onMarkDone: (id: string, completedLabel: string) => void;
}) {
    const statusMeta = task
        ? task.status === "waiting-you"
            ? { label: "Waiting on You", color: "brand" as const }
            : task.status === "waiting-numix"
                ? { label: "Waiting on Numix", color: "blue-light" as const }
                : { label: "Done", color: "gray" as const }
        : null;

    const actionMeta = task
        ? task.deadlineKind
            ? { icon: Calendar, headerLabel: task.deadlineKind === "payment" ? "Payment confirmation" : "Filing confirmation", featuredColor: "warning" as const }
            : task.action === "upload"
                ? { icon: Upload01, headerLabel: "Upload required", featuredColor: "brand" as const }
                : task.action === "review"
                    ? { icon: task.accent === "flag" ? Flag04 : Eye, headerLabel: task.accent === "flag" ? "Flagged for review" : "Review required", featuredColor: task.accent === "flag" ? ("warning" as const) : ("brand" as const) }
                    : { icon: Check, headerLabel: "Confirmation needed", featuredColor: "brand" as const }
        : null;

    const linkedConversation = task?.conversationId
        ? recentConversations.find((c) => c.id === task.conversationId)
        : null;

    return (
        <SlideoutMenu isDismissable isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} modalClassName="w-[640px] max-w-none">
            {({ close }) => {
                if (!task || !statusMeta || !actionMeta) return null;
                return (
                    <>
                        <SlideoutMenu.Header onClose={close}>
                            <div className="flex items-start gap-3 pr-8">
                                <FeaturedIcon icon={actionMeta.icon} color={actionMeta.featuredColor} theme="light" size="md" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium uppercase tracking-wider text-tertiary">{actionMeta.headerLabel}</p>
                                    <h2 className="mt-0.5 text-lg font-semibold leading-snug text-primary">{task.title}</h2>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Badge color={statusMeta.color} type="pill-color" size="sm">{statusMeta.label}</Badge>
                                        <div className="flex items-center gap-1 text-xs text-tertiary">
                                            <Hash01 className="size-3 text-fg-quaternary" />
                                            {task.taskNumber}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SlideoutMenu.Header>

                        <SlideoutMenu.Content>
                            <div className="space-y-5">
                                {/* Description */}
                                {task.description && (
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Description</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-secondary">{task.description}</p>
                                    </div>
                                )}

                                {/* Meta grid */}
                                <div className="grid grid-cols-2 gap-3 rounded-xl border border-secondary bg-secondary/50 p-4">
                                    {task.dueDate && (
                                        <div>
                                            <p className="text-xs text-tertiary">Due date</p>
                                            <div className="mt-1 flex items-center gap-1.5">
                                                <Clock className="size-3.5 text-fg-quaternary" />
                                                <span className="text-sm font-medium text-primary">{displayDueDate(task.dueDate)}</span>
                                            </div>
                                        </div>
                                    )}
                                    {task.completedDate && (
                                        <div>
                                            <p className="text-xs text-tertiary">Completed</p>
                                            <div className="mt-1 flex items-center gap-1.5">
                                                <Check className="size-3.5 text-fg-success-secondary" />
                                                <span className="text-sm font-medium text-primary">{task.completedDate}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-tertiary">Source</p>
                                        <div className="mt-1 flex items-center gap-1.5">
                                            {task.source === "System Generated" ? <Settings01 className="size-3.5 text-fg-quaternary" /> : <User01 className="size-3.5 text-fg-quaternary" />}
                                            <span className="text-sm font-medium text-primary">{task.source}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-tertiary">Channel</p>
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <ChannelIcon channel={task.channel} />
                                            <span className="text-sm font-medium text-primary">{task.channel}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action-specific body */}
                                {task.action === "upload" && (
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Upload area</h3>
                                        <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-secondary bg-secondary/40 px-4 py-8 transition hover:border-brand hover:bg-brand-primary_alt/30">
                                            <div className="flex size-10 items-center justify-center rounded-full bg-brand-primary_alt">
                                                <Upload01 className="size-5 text-fg-brand-primary" />
                                            </div>
                                            <p className="text-sm font-medium text-primary">Drag & drop or click to upload</p>
                                            <p className="text-xs text-tertiary">PDF, JPG, PNG &middot; up to 10MB</p>
                                            <input type="file" className="hidden" />
                                        </label>
                                    </div>
                                )}

                                {task.action === "review" && task.accent === "flag" && (
                                    <div className="rounded-xl border border-warning bg-warning-secondary/40 p-4">
                                        <div className="flex items-start gap-3">
                                            <Flag04 className="mt-0.5 size-5 shrink-0 text-fg-warning-primary" />
                                            <div>
                                                <p className="text-sm font-semibold text-primary">Flagged transactions need your call</p>
                                                <p className="mt-1 text-xs text-tertiary">Open the Transactions page to confirm or recategorise each one. Numix will learn from your choices.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tax-calendar confirmation: show the amount and the original
                                    reminder message. The user just needs to confirm "did you
                                    handle it?". The SMS/email already contains the payment
                                    or filing link. */}
                                {task.deadlineKind && (
                                    <>
                                        {task.amount && !task.autoDetected && (
                                            <div className="rounded-xl border border-warning-600 bg-warning-secondary/40 p-5">
                                                <p className="text-xs font-medium uppercase tracking-wider text-warning-primary">{task.deadlineKind === "payment" ? "Amount owed" : "Filing fee"}</p>
                                                <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-primary">{task.amount}</p>
                                                <div className="mt-3 flex items-center gap-1.5">
                                                    <Calendar className="size-4 text-fg-warning-primary" />
                                                    <span className="text-sm font-medium text-primary">{displayDueDate(task.dueDate)?.replace(/^Due /, "")}, 2024</span>
                                                </div>
                                            </div>
                                        )}

                                        {task.autoDetected ? (
                                            /* Auto-detected: show the matched-transaction card instead of */
                                            /* the SMS/email thread. The user just confirms Numix got it right. */
                                            <div>
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">
                                                    Matched payment
                                                </h3>
                                                <div className="mt-2 rounded-xl border border-success-600 bg-success-secondary/40 p-4">
                                                    {/* Match facts at the top, condensed to 3 rows. */}
                                                    <div className="overflow-hidden rounded-lg border border-secondary bg-primary text-sm">
                                                        <div className="flex items-center justify-between border-b border-secondary px-3 py-2.5">
                                                            <span className="text-xs text-tertiary">Payee</span>
                                                            <span className="font-medium text-primary">{task.autoDetected.payee}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between border-b border-secondary px-3 py-2.5">
                                                            <span className="text-xs text-tertiary">Amount</span>
                                                            <span className="text-primary">
                                                                <span className="font-semibold tabular-nums">{task.autoDetected.matchedAmount}</span>
                                                                <span className="ml-2 text-tertiary">{task.autoDetected.matchedAt}</span>
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between px-3 py-2.5">
                                                            <span className="text-xs text-tertiary">Account</span>
                                                            <span className="font-medium text-primary">{task.autoDetected.source}</span>
                                                        </div>
                                                    </div>

                                                    {/* Summary + confidence sit below the table. */}
                                                    <div className="mt-3 flex items-start gap-3">
                                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success-primary ring-1 ring-success-600">
                                                            <Check className="size-4 text-fg-success-primary" aria-hidden />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-primary">
                                                                Auto-paid via {task.autoDetected.source.split(",")[0]}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-tertiary">
                                                                Numix matched this payment from your linked account. Confirm to close out.
                                                            </p>
                                                        </div>
                                                        <BadgeWithDot color="success" type="pill-color" size="sm">
                                                            {Math.round(task.autoDetected.confidence * 100)}% match
                                                        </BadgeWithDot>
                                                    </div>

                                                    <p className="mt-3 text-xs text-tertiary">
                                                        Not this payment?{" "}
                                                        <a
                                                            href="#"
                                                            onClick={(e) => e.preventDefault()}
                                                            className="font-medium text-brand-secondary underline underline-offset-2 transition duration-100 ease-linear hover:text-brand-secondary_hover"
                                                        >
                                                            Search other transactions
                                                        </a>
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                        <div>
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">
                                                {task.channel === "SMS" ? "Text message thread" : "Email thread"}
                                            </h3>

                                            {task.channel === "SMS" ? (
                                                <>
                                                    {/* SMS: chat-bubble layout */}
                                                    <div className="mt-2 flex items-start gap-2">
                                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary_alt">
                                                            <ChannelIcon channel={task.channel} />
                                                        </div>
                                                        <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-secondary bg-secondary/60 px-4 py-3">
                                                            <p className="text-sm leading-relaxed text-primary">
                                                                Heads up, your {task.title.toLowerCase()}
                                                                {task.amount && <> of <span className="font-semibold">{task.amount}</span></>}
                                                                {" "}is due {displayDueDate(task.dueDate)?.replace(/^Due /, "")}.
                                                                {" "}Tap the{" "}
                                                                <a
                                                                    href="#"
                                                                    onClick={(e) => e.preventDefault()}
                                                                    className="font-medium text-brand-secondary underline underline-offset-2 transition duration-100 ease-linear hover:text-brand-secondary_hover"
                                                                >
                                                                    link
                                                                </a>
                                                                {" "}{task.deadlineKind === "payment" ? "to pay through Numix, or reply DONE if you already paid." : "to file through Numix, or reply DONE if you already filed."}
                                                            </p>
                                                            <p className="mt-1 text-xs text-quaternary">Numix &middot; +1 (415) 555-NUMIX &middot; 2 days ago</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex items-start justify-end gap-2">
                                                        <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-solid px-4 py-3 text-white">
                                                            <p className="text-sm leading-relaxed">
                                                                DONE. {task.deadlineKind === "payment" ? "Paid via my bank yesterday." : "Filed yesterday."}
                                                            </p>
                                                            <p className="mt-1 text-xs text-white/70">You &middot; 1 day ago</p>
                                                        </div>
                                                        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-secondary">
                                                            <img
                                                                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"
                                                                alt="You"
                                                                className="size-full object-cover"
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Email: card layout with From / To / Subject headers */}
                                                    <div className="mt-2 overflow-hidden rounded-xl border border-secondary bg-primary">
                                                        <div className="flex items-center justify-between gap-3 border-b border-secondary bg-secondary/40 px-4 py-3">
                                                            <div className="flex min-w-0 items-center gap-2.5">
                                                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary_alt">
                                                                    <Mail01 className="size-4 text-fg-brand-primary" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-medium text-primary">Numix Tax Team</p>
                                                                    <p className="truncate text-xs text-tertiary">tax@numix.ai</p>
                                                                </div>
                                                            </div>
                                                            <p className="shrink-0 text-xs text-tertiary">2 days ago</p>
                                                        </div>
                                                        <div className="px-4 py-3">
                                                            <p className="text-xs text-tertiary">
                                                                To: <span className="text-secondary">olivia@acme.com</span>
                                                            </p>
                                                            <p className="mt-1 text-sm font-semibold text-primary">
                                                                {task.deadlineKind === "payment" ? `Payment reminder: ${task.title}` : `Filing reminder: ${task.title}`}
                                                            </p>
                                                        </div>
                                                        <div className="border-t border-secondary px-4 py-4">
                                                            <p className="text-sm leading-relaxed text-secondary">Hi Olivia,</p>
                                                            <p className="mt-3 text-sm leading-relaxed text-secondary">
                                                                {task.deadlineKind === "payment" ? (
                                                                    <>
                                                                        This is a reminder that your <span className="font-medium text-primary">{task.title}</span>
                                                                        {task.amount && <> of <span className="font-semibold text-primary">{task.amount}</span></>}
                                                                        {" "}is due on <span className="font-medium text-primary">{displayDueDate(task.dueDate)?.replace(/^Due /, "")}, 2024</span>. Quarterly estimated payments help you avoid IRS underpayment penalties when you file your annual return.
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        This is a reminder that your <span className="font-medium text-primary">extended individual return (Form 1040)</span> must be filed by <span className="font-medium text-primary">{displayDueDate(task.dueDate)?.replace(/^Due /, "")}, 2024</span>. Missing the extension deadline can result in IRS late-filing penalties of up to 5% per month.
                                                                    </>
                                                                )}
                                                            </p>
                                                            <p className="mt-3 text-sm leading-relaxed text-secondary">
                                                                {task.deadlineKind === "payment"
                                                                    ? "If you'd like Numix to schedule this payment from your linked Mercury account, click the button below. If you've already paid the IRS directly (via EFTPS, Direct Pay, or your bank), reply DONE and we'll mark it complete in your tax planner."
                                                                    : "If you'd like Numix to prepare and file your return, click the button below to start the review process. If you've already filed elsewhere, or your CPA filed on your behalf, reply DONE and we'll close this out."}
                                                            </p>
                                                            <p className="mt-3 text-sm leading-relaxed text-secondary">
                                                                As always, let us know if anything has changed about your tax situation this year. We want to make sure the numbers we have on file are still accurate before {task.deadlineKind === "payment" ? "we initiate any payment" : "we file"}.
                                                            </p>
                                                            <a
                                                                href="#"
                                                                onClick={(e) => e.preventDefault()}
                                                                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-sm font-semibold text-white transition duration-100 ease-linear hover:bg-brand-solid_hover"
                                                            >
                                                                {task.deadlineKind === "payment" ? "Pay through Numix" : "File through Numix"}
                                                                <ChevronRight className="size-3.5" />
                                                            </a>
                                                            <div className="mt-6 space-y-1 border-t border-secondary pt-4 text-xs text-tertiary">
                                                                <p className="font-medium text-secondary">The Numix Tax Team</p>
                                                                <p>tax@numix.ai &middot; numix.ai</p>
                                                                <p className="mt-2">
                                                                    You&apos;re receiving this email because tax deadline notifications are enabled on your Numix account.{" "}
                                                                    <a href="#" onClick={(e) => e.preventDefault()} className="text-brand-secondary hover:underline">
                                                                        Manage preferences
                                                                    </a>
                                                                    {" "}or{" "}
                                                                    <a href="#" onClick={(e) => e.preventDefault()} className="text-brand-secondary hover:underline">
                                                                        unsubscribe
                                                                    </a>.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* User's reply rendered as a forwarded/quoted email */}
                                                    <div className="mt-3 overflow-hidden rounded-xl border border-secondary bg-primary">
                                                        <div className="flex items-center justify-between gap-3 border-b border-secondary bg-brand-primary_alt/40 px-4 py-3">
                                                            <div className="flex min-w-0 items-center gap-2.5">
                                                                <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-secondary">
                                                                    <img
                                                                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"
                                                                        alt="You"
                                                                        className="size-full object-cover"
                                                                    />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-medium text-primary">Olivia Rhye</p>
                                                                    <p className="truncate text-xs text-tertiary">olivia@acme.com</p>
                                                                </div>
                                                            </div>
                                                            <p className="shrink-0 text-xs text-tertiary">1 day ago</p>
                                                        </div>
                                                        <div className="px-4 py-4">
                                                            <p className="text-sm leading-relaxed text-secondary">
                                                                Hi, just confirming I {task.deadlineKind === "payment" ? "paid this via my bank yesterday" : "filed this yesterday"}. All set on my end.
                                                            </p>
                                                            <p className="mt-3 text-sm text-tertiary">Olivia</p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        )}
                                    </>
                                )}

                                {/* Linked conversation */}
                                {linkedConversation && (
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Linked conversation</h3>
                                        <button
                                            type="button"
                                            onClick={() => { close(); goToConversation(linkedConversation.id, linkedConversation.title); }}
                                            className="mt-2 flex w-full items-center gap-3 rounded-lg border border-secondary bg-primary p-3 text-left transition hover:border-brand hover:bg-brand-primary_alt/30"
                                        >
                                            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-primary_alt">
                                                <MessageSquare01 className="size-4 text-fg-brand-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-primary">{linkedConversation.title}</p>
                                                <p className="text-xs text-tertiary">{linkedConversation.time}</p>
                                            </div>
                                            <ChevronRight className="size-4 text-fg-quaternary" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </SlideoutMenu.Content>

                        <SlideoutMenu.Footer>
                            <div className="flex items-center justify-end gap-2">
                                {(() => {
                                    if (task.action === "upload") {
                                        return (
                                            <>
                                                <Button color="tertiary" size="md" onClick={() => { close(); goToPanel("documents"); }}>Open Documents</Button>
                                                <Button color="primary" size="md" iconLeading={Upload01}>Upload</Button>
                                            </>
                                        );
                                    }
                                    if (task.action === "review" && task.accent === "flag") {
                                        return <Button color="primary" size="md" iconLeading={Flag04} onClick={() => { close(); goToPanel("bk-transactions"); }}>Review in Transactions</Button>;
                                    }
                                    if (task.deadlineKind) {
                                        // Auto-detected payments: user is confirming Numix's match,
                                        // not telling Numix something new. Different verb + escape hatch.
                                        if (task.autoDetected) {
                                            const note = `Confirmed match, ${task.autoDetected.source}`;
                                            return (
                                                <>
                                                    <Button color="secondary" size="md" onClick={() => { onMarkDone(task.id, "Marked needs-manual-review"); close(); }}>Not this match</Button>
                                                    <Button color="primary" size="md" iconLeading={Check} onClick={() => { onMarkDone(task.id, note); close(); }}>Confirm match</Button>
                                                </>
                                            );
                                        }
                                        const label = task.deadlineKind === "payment" ? "Mark paid" : "Mark filed";
                                        const note = task.deadlineKind === "payment" ? "Marked paid today" : "Marked filed today";
                                        return <Button color="primary" size="md" iconLeading={Check} onClick={() => { onMarkDone(task.id, note); close(); }}>{label}</Button>;
                                    }
                                    if (task.action === "review") {
                                        return <Button color="primary" size="md" iconLeading={Eye} onClick={() => { close(); goToPanel("tax-filing"); }}>Open Tax Filing</Button>;
                                    }
                                    return <Button color="primary" size="md" iconLeading={Check} onClick={() => { onMarkDone(task.id, "Marked done today"); close(); }}>Mark as done</Button>;
                                })()}
                            </div>
                        </SlideoutMenu.Footer>
                    </>
                );
            }}
        </SlideoutMenu>
    );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export const NumixScreen = ({ connected = false }: { connected?: boolean } = {}) => {
    const { user, loading: authLoading, signOut } = useAuth();
    const [showLogin, setShowLogin] = useState(() => {
        if (connected) return false;
        if (typeof window === "undefined") return false;
        const step = new URLSearchParams(window.location.search).get("step");
        if (step === "login") return true;
        return false;
    });
    const [showIntegrations, setShowIntegrations] = useState(() => {
        if (typeof window === "undefined") return false;
        const params = new URLSearchParams(window.location.search);
        const step = params.get("step");
        if (step === "home" || step === "login") return false;
        // Demo behaviour: every refresh of any route lands on the integration
        // setup screen. The `connected` URL prop no longer suppresses this so
        // refreshing /connected also resets the demo.
        // Use ?step=home to skip past it for testing other flows.
        return true;
    });
    // After the user clicks "Continue" on the integrations page, this becomes
    // true to enable the post-integration home (ConnectedSummary, banners) on
    // the same render without needing a URL change. Refreshing resets it.
    const [completedThisSession, setCompletedThisSession] = useState(false);
    const isConnected = connected || completedThisSession;

    // Demo behaviour: clear any prior completion flag on mount so refreshing
    // resets the flow back to the integrations page.
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("numix:integrations-complete");
        }
    }, []);

    // Sync showLogin with auth state. Only hide login when user logs in, never force it back.
    useEffect(() => {
        if (authLoading) return;
        if (user) {
            setShowLogin(false);
        }
    }, [user, authLoading]);
    const [showSettings, setShowSettings] = useState(false);
    const [setupIncomplete, setSetupIncomplete] = useState(false);
    const [settingsInitialSection, setSettingsInitialSection] = useState<SettingsSection | undefined>(undefined);
    const [expandedNav, setExpandedNav] = useState<string | null>(null);
    const [receiptDragOver, setReceiptDragOver] = useState(false);
    const [uploadOverlay, setUploadOverlay] = useState(false);
    const dragCounter = useRef(0);
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [mainPanel, setMainPanel] = useState<MainPanel>("home");
    const [activeConversation, setActiveConversation] = useState<{ id: string; title: string } | null>(null);
    const [showAllWaitingYou, setShowAllWaitingYou] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>("due-date");
    const [sortMenuOpen, setSortMenuOpen] = useState(false);
    const sortMenuRef = useRef<HTMLDivElement>(null);
    // Channel filter. Empty Set means "all channels" (no filter applied).
    const [channelFilter, setChannelFilter] = useState<Set<string>>(new Set());
    const [channelMenuOpen, setChannelMenuOpen] = useState(false);
    const channelMenuRef = useRef<HTMLDivElement>(null);
    const WAITING_YOU_PAGE_SIZE = 5;

    // Close sort menu on outside click
    useEffect(() => {
        if (!sortMenuOpen) return;
        const onClick = (e: MouseEvent) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
                setSortMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [sortMenuOpen]);

    // Close channel filter menu on outside click
    useEffect(() => {
        if (!channelMenuOpen) return;
        const onClick = (e: MouseEvent) => {
            if (channelMenuRef.current && !channelMenuRef.current.contains(e.target as Node)) {
                setChannelMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [channelMenuOpen]);
    const [statusExpanded, setStatusExpanded] = useState(true);
    const [numixWorkExpanded, setNumixWorkExpanded] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<TaskCategory | "All">("All");
    const [taxIntent, setTaxIntent] = useState<{ tab?: "expenses" | "credits"; credit?: string } | null>(null);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [askInitialPrompt, setAskInitialPrompt] = useState<string | undefined>(undefined);
    const [askBackPanel, setAskBackPanel] = useState<MainPanel>("home");
    const [conversations, setConversations] = useState(recentConversations);
    const [detailTaskId, setDetailTaskId] = useState<string | null>(null);

    // Append-only log of every R&D §41 label change the user makes in
    // Bookkeeping or Tax Planning. The latest action per txnId determines
    // the current cross-page state.
    const [rdLabelActivity, setRdLabelActivity] = useState<{ id: string; txnId: string; description: string; action: "added" | "removed"; time: string }[]>([]);

    // Derived current state: for each txnId the latest action wins.
    // Bookkeeping and Tax Planning use these to override their initial data.
    const { linkedRdTxnIds, unlinkedRdTxnIds } = useMemo(() => {
        const latest = new Map<string, "added" | "removed">();
        rdLabelActivity.forEach((a) => { latest.set(a.txnId, a.action); });
        const linked = new Set<string>();
        const unlinked = new Set<string>();
        latest.forEach((action, txnId) => {
            (action === "added" ? linked : unlinked).add(txnId);
        });
        return { linkedRdTxnIds: linked, unlinkedRdTxnIds: unlinked };
    }, [rdLabelActivity]);

    function handleRdLabelChange(txnId: string, description: string, isAdding: boolean) {
        setRdLabelActivity((prev) => [
            ...prev,
            {
                id: `rd-${txnId}-${Date.now()}`,
                txnId,
                description,
                action: isAdding ? "added" : "removed",
                time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            },
        ]);
    }

    const direction = useRef<1 | -1>(1);

    const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;
    const detailTask = tasks.find((t) => t.id === detailTaskId) ?? null;
    const openTaskDetail = useCallback((id: string) => setDetailTaskId(id), []);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    // Sort Waiting-on-You by the user's chosen key, then slice to a 5-row
    // default. Show-more button reveals the rest.
    const compareTasks = (a: Task, b: Task): number => {
        switch (sortKey) {
            case "priority": {
                const pa = PRIORITY_ORDER[a.priority ?? "medium"];
                const pb = PRIORITY_ORDER[b.priority ?? "medium"];
                return pa - pb;
            }
            case "source":
                return a.source.localeCompare(b.source);
            case "channel":
                return a.channel.localeCompare(b.channel);
            case "created": {
                // Newest first → highest original index first.
                const oa = CREATED_ORDER.get(a.id) ?? -1;
                const ob = CREATED_ORDER.get(b.id) ?? -1;
                return ob - oa;
            }
            case "due-date":
            default:
                return dueDateSortKey(a.dueDate) - dueDateSortKey(b.dueDate);
        }
    };
    const matchesCategory = (t: Task) => categoryFilter === "All" || t.category === categoryFilter;
    const matchesChannel = (t: Task) => channelFilter.size === 0 || channelFilter.has(t.channel);
    const waitingYouTasksAll = tasks
        .filter((t) => t.status === "waiting-you" && matchesCategory(t) && matchesChannel(t))
        .slice()
        .sort(compareTasks);
    const waitingYouHiddenCount = Math.max(0, waitingYouTasksAll.length - WAITING_YOU_PAGE_SIZE);
    const waitingYouTasks = showAllWaitingYou
        ? waitingYouTasksAll
        : waitingYouTasksAll.slice(0, WAITING_YOU_PAGE_SIZE);
    const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? "Due date";
    // Unique channels across all Waiting-on-You tasks, used to populate the filter dropdown.
    const availableChannels = Array.from(
        new Set(tasks.filter((t) => t.status === "waiting-you").map((t) => t.channel))
    ).sort();
    const channelFilterLabel =
        channelFilter.size === 0
            ? "All"
            : channelFilter.size === 1
            ? Array.from(channelFilter)[0]
            : `${channelFilter.size} selected`;
    const waitingNumixTasks = tasks.filter((t) => t.status === "waiting-numix" && matchesCategory(t));
    const doneTasks = tasks.filter((t) => t.status === "done");
    const activeTasks = tasks.filter((t) => t.status !== "done");
    const allWaitingYouTasks = tasks.filter((t) => t.status === "waiting-you");
    const categoryCounts: Record<string, number> = { All: allWaitingYouTasks.length };
    for (const t of allWaitingYouTasks) {
        if (t.category) categoryCounts[t.category] = (categoryCounts[t.category] ?? 0) + 1;
    }
    const visibleCategories: Array<TaskCategory | "All"> = [
        "All",
        ...(Object.keys(CATEGORY_BADGE_COLOR) as TaskCategory[]).filter((c) => (categoryCounts[c] ?? 0) > 0),
    ];

    // CMD+K to open search
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen(true);
            }
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    // Global file drag detection
    useEffect(() => {
        function hasFiles(e: DragEvent) {
            return e.dataTransfer?.types?.includes("Files") ?? false;
        }
        function onDragEnter(e: DragEvent) {
            if (!hasFiles(e)) return;
            e.preventDefault();
            dragCounter.current++;
            if (dragCounter.current === 1) setUploadOverlay(true);
        }
        function onDragLeave(e: DragEvent) {
            if (!hasFiles(e)) return;
            e.preventDefault();
            dragCounter.current--;
            if (dragCounter.current === 0) setUploadOverlay(false);
        }
        function onDragOver(e: DragEvent) {
            if (!hasFiles(e)) return;
            e.preventDefault();
        }
        function onDrop(e: DragEvent) {
            e.preventDefault();
            dragCounter.current = 0;
            setUploadOverlay(false);
        }
        document.addEventListener("dragenter", onDragEnter);
        document.addEventListener("dragleave", onDragLeave);
        document.addEventListener("dragover", onDragOver);
        document.addEventListener("drop", onDrop);
        return () => {
            document.removeEventListener("dragenter", onDragEnter);
            document.removeEventListener("dragleave", onDragLeave);
            document.removeEventListener("dragover", onDragOver);
            document.removeEventListener("drop", onDrop);
        };
    }, []);

    function goToPanel(panel: typeof mainPanel) {
        direction.current = panel === "home" ? -1 : 1;
        setMainPanel(panel);
    }

    function goToConversation(id: string, title: string) {
        direction.current = 1;
        setActiveConversation({ id, title });
        setMainPanel("conversation");
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveTaskId(event.active.id as string);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveTaskId(null);
        if (!over) return;
        const newStatus = over.id as TaskStatus;
        if (!["waiting-you", "waiting-numix", "done"].includes(newStatus)) return;
        setTasks((prev) => prev.map((t) => t.id === active.id ? { ...t, status: newStatus } : t));
    }

    const slideVariants = {
        initial: (d: number) => ({ x: d * 32, opacity: 0 }),
        animate: { x: 0, opacity: 1 },
        exit:    (d: number) => ({ x: d * -32, opacity: 0 }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slideTransition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] as any };

    if (showLogin) {
        return (
            <LoginScreen onLogin={() => { setShowIntegrations(true); }} />
        );
    }

    if (showIntegrations) {
        return (
            <motion.div
                key="integrations"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="h-dvh"
            >
                <IntegrationsSetup
                    onComplete={(connectedCount, totalCount) => {
                        // Demo: completion is in-memory only. Refresh resets
                        // back to integrations on every route.
                        setShowIntegrations(false);
                        setCompletedThisSession(true);
                        if (connectedCount < totalCount) setSetupIncomplete(true);
                    }}
                    onBack={() => { setShowIntegrations(false); setShowLogin(true); }}
                />
            </motion.div>
        );
    }

    return (
        <PanelNavContext.Provider value={goToPanel}>
        <TaskDetailContext.Provider value={openTaskDetail}>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex h-dvh overflow-hidden"
        >
            {searchOpen && <SearchModal tasks={tasks} onClose={() => setSearchOpen(false)} />}

            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <aside className="flex w-64 shrink-0 flex-col border-r border-secondary bg-white">
                <div className="flex h-16 items-center border-b border-secondary px-5">
                    <button type="button" onClick={() => signOut()} className="cursor-pointer">
                        <img src="/numix-logo.png" alt="Numix" className="h-6 w-auto" />
                    </button>
                </div>

                <nav className="flex flex-col gap-0.5 px-3">
                    {navItems.map((item) => {
                        const hasSubItems = "subItems" in item && item.subItems;
                        const subPanelIds = hasSubItems ? item.subItems.map((s) => s.panelId) : [];
                        const isParentActive = hasSubItems && subPanelIds.includes(mainPanel as typeof subPanelIds[number]);
                        const isActive = "panelId" in item && item.panelId === mainPanel;
                        return (
                            <div key={item.label}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (hasSubItems) {
                                            setExpandedNav((prev) => prev === item.label ? null : item.label);
                                        }
                                        if ("panelId" in item && item.panelId) {
                                            goToPanel(item.panelId);
                                        }
                                    }}
                                    className={cx(
                                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition duration-100 ease-linear",
                                        isActive || isParentActive ? "bg-brand-primary_alt text-brand-secondary" : "text-tertiary hover:bg-primary_hover hover:text-secondary",
                                    )}
                                >
                                    <item.icon className={cx("size-5 shrink-0", isActive || isParentActive ? "text-fg-brand-secondary_alt" : "text-fg-quaternary")} aria-hidden />
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {hasSubItems && (
                                        <ChevronDown
                                            className={cx(
                                                "size-4 shrink-0 text-fg-quaternary transition-transform duration-150",
                                                expandedNav === item.label && "rotate-180",
                                            )}
                                            aria-hidden
                                        />
                                    )}
                                </button>
                                {hasSubItems && expandedNav === item.label && (
                                    <div className="ml-8 mt-0.5 flex flex-col gap-0.5">
                                        {item.subItems.map((sub) => {
                                            const isSubActive = mainPanel === sub.panelId;
                                            return (
                                                <button
                                                    key={sub.label}
                                                    type="button"
                                                    onClick={() => {
                                                        goToPanel(sub.panelId);
                                                    }}
                                                    className={cx(
                                                        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition duration-100 ease-linear",
                                                        isSubActive ? "font-medium text-brand-secondary" : "text-tertiary hover:bg-primary_hover hover:text-secondary",
                                                    )}
                                                >
                                                    {"icon" in sub && sub.icon && <sub.icon className="size-4" />}
                                                    {sub.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="mx-5 my-4 h-px bg-border-secondary" />

                <div className="px-[22px]">
                    <motion.button
                        type="button"
                        onClick={() => goToPanel("new-ask")}
                        whileHover={{ opacity: 0.92 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.1 }}
                        className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                        style={{ background: "linear-gradient(to right, #7C5CFC, #2B53FE)" }}
                    >
                        <Stars01 className="size-4 text-white" aria-hidden />
                        Ask My Accountant
                    </motion.button>
                </div>

                <div className="mt-5 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3">
                    <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-quaternary">Recent Conversations</p>
                    {conversations.map((conv) => (
                        <button
                            key={conv.id}
                            type="button"
                            onClick={() => goToConversation(conv.id, conv.title)}
                            className={cx(
                                "flex w-full shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition duration-100 ease-linear hover:bg-primary_hover",
                                activeConversation?.id === conv.id && mainPanel === "conversation" && "bg-brand-primary_alt",
                            )}
                        >
                            <div className="min-w-0 flex-1 text-left">
                                <p className={cx("truncate font-medium", activeConversation?.id === conv.id && mainPanel === "conversation" ? "text-brand-secondary" : "text-secondary")}>
                                    {conv.title}
                                </p>
                                <div className="mt-0.5 flex items-center gap-2">
                                    <span className="text-xs text-tertiary">{conv.time}</span>
                                    <SidebarStatusBadge status={conv.status} />
                                </div>
                            </div>
                            <MessageSquare01 className="size-4 shrink-0 text-fg-quaternary" aria-hidden />
                        </button>
                    ))}
                </div>

                <div className="shrink-0">
                    <div className="mx-5 my-3 h-px bg-border-secondary" />
                    <div className="px-3 pb-1">
                        <button
                            type="button"
                            onClick={() => goToPanel("status-overview")}
                            className={cx(
                                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:bg-primary_hover hover:text-secondary",
                                mainPanel === "status-overview" && "bg-brand-primary_alt text-brand-secondary",
                            )}
                        >
                            <Eye className="size-5 shrink-0 text-fg-quaternary" aria-hidden />
                            Status Overview
                        </button>
                        <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:bg-primary_hover hover:text-secondary">
                            <HelpCircle className="size-5 shrink-0 text-fg-quaternary" aria-hidden />
                            Help
                        </a>
                        <button
                            type="button"
                            onClick={() => setShowSettings(true)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:bg-primary_hover hover:text-secondary"
                        >
                            <Settings01 className="size-5 shrink-0 text-fg-quaternary" aria-hidden />
                            Settings
                            {setupIncomplete && (
                                <span className="ml-auto size-2 rounded-full bg-warning-solid" />
                            )}
                        </button>
                    </div>
                    <div className="px-3 pb-4">
                        <button type="button" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-tertiary transition duration-100 ease-linear hover:bg-primary_hover hover:text-secondary">
                            <ChevronLeft className="size-4 text-fg-quaternary" aria-hidden />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main content ─────────────────────────────────────────────── */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Sticky top bar */}
                <header className="flex h-16 shrink-0 items-center gap-4 border-b border-secondary bg-white px-6">
                    <button
                        type="button"
                        onClick={() => setSearchOpen(true)}
                        className="flex flex-1 items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-placeholder transition duration-100 ease-linear hover:border-brand"
                    >
                        <SearchLg className="size-4 text-fg-quaternary" aria-hidden />
                        <span className="flex-1 text-left">Search...</span>
                    </button>
                    <Button color="secondary" size="sm" iconLeading={Upload01} onClick={() => setUploadOverlay(true)} className="!ring-brand text-brand-secondary *:data-icon:!text-fg-brand-secondary hover:!bg-brand-solid hover:!text-white hover:*:data-icon:!text-white">
                        Upload
                    </Button>
                    <button type="button" className="relative size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-secondary transition duration-100 ease-linear hover:ring-brand">
                        <img
                            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"
                            alt="Olivia Rhye"
                            className="size-full object-cover"
                        />
                    </button>
                </header>

            <AnimatePresence mode="wait" initial={false} custom={direction.current}>
                {mainPanel === "new-ask" ? (
                    <motion.div
                        key="new-ask"
                        custom={direction.current}
                        variants={slideVariants}
                        initial="initial" animate="animate" exit="exit"
                        transition={slideTransition}
                        className="flex min-w-0 flex-1 overflow-hidden"
                    >
                        <NewAskPanel onBack={() => { setAskInitialPrompt(undefined); const back = askBackPanel; setAskBackPanel("home"); goToPanel(back); }} backLabel={askBackPanel === "cfo-make-money" ? "How to Make Money" : askBackPanel === "cfo-save-money" ? "How to Save Money" : askBackPanel === "bk-transactions" ? "Transactions" : "Home"} initialPrompt={askInitialPrompt} rdLabelActivity={rdLabelActivity} />
                    </motion.div>
                ) : mainPanel === "conversation" && activeConversation ? (
                    <motion.div
                        key={`conversation-${activeConversation.id}`}
                        custom={direction.current}
                        variants={slideVariants}
                        initial="initial" animate="animate" exit="exit"
                        transition={slideTransition}
                        className="flex min-w-0 flex-1 overflow-hidden"
                    >
                        <ConversationDetailPanel
                            conversationTitle={activeConversation.title}
                            tasks={tasks.filter((t) => t.conversationId === activeConversation.id)}
                            onBack={() => goToPanel("home")}
                        />
                    </motion.div>
                ) : mainPanel === "status-overview" ? (
                    <motion.div key="status-overview" custom={direction.current} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={slideTransition} className="flex min-w-0 flex-1 overflow-hidden">
                        <StatusOverviewPage goToPanel={goToPanel} />
                    </motion.div>
                ) : mainPanel === "tax-filing" ? (
                    <motion.div key="tax-filing" custom={direction.current} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={slideTransition} className="flex min-w-0 flex-1 overflow-hidden">
                        <TaxScreen page="filing" />
                    </motion.div>
                ) : mainPanel === "tax-planning" ? (
                    <motion.div key="tax-planning" custom={direction.current} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={slideTransition} className="flex min-w-0 flex-1 overflow-hidden">
                        <TaxScreen page="planning" intent={taxIntent} clearIntent={() => setTaxIntent(null)} linkedRdTxnIds={linkedRdTxnIds} unlinkedRdTxnIds={unlinkedRdTxnIds} onRdLabelChange={handleRdLabelChange} />
                    </motion.div>
                ) : mainPanel === "cfo-forecast" ? (
                    <motion.div key="cfo-forecast" custom={direction.current} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={slideTransition} className="flex min-w-0 flex-1 overflow-hidden">
                        <CFOScreen page="forecast" />
                    </motion.div>
                ) : mainPanel === "cfo-save-money" ? (
                    <motion.div key="cfo-save-money" custom={direction.current} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={slideTransition} className="flex min-w-0 flex-1 overflow-hidden">
                        <CFOScreen page="save-money" onAskAccountant={(prompt) => {
                            setAskInitialPrompt(prompt);
                            setAskBackPanel("cfo-save-money");
                            goToPanel("new-ask");
                        }} />
                    </motion.div>
                ) : mainPanel === "cfo-make-money" ? (
                    <motion.div key="cfo-make-money" custom={direction.current} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={slideTransition} className="flex min-w-0 flex-1 overflow-hidden">
                        <CFOScreen page="make-money" onAskAccountant={(prompt) => {
                            setAskInitialPrompt(prompt);
                            setAskBackPanel("cfo-make-money");
                            goToPanel("new-ask");
                        }} />
                    </motion.div>
                ) : mainPanel === "bk-ap" ? (
                    <motion.div key="bk-ap" custom={direction.current} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={slideTransition} className="flex min-w-0 flex-1 overflow-hidden">
                        <BookkeepingScreen page="ap" />
                    </motion.div>
                ) : mainPanel === "bk-ar" ? (
                    <motion.div key="bk-ar" custom={direction.current} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={slideTransition} className="flex min-w-0 flex-1 overflow-hidden">
                        <BookkeepingScreen page="ar" />
                    </motion.div>
                ) : mainPanel === "bk-transactions" ? (
                    <motion.div key="bk-transactions" custom={direction.current} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={slideTransition} className="flex min-w-0 flex-1 overflow-hidden">
                        <BookkeepingScreen
                            page="transactions"
                            onNavigate={(p, opts) => {
                                if (opts?.taxIntent) setTaxIntent(opts.taxIntent);
                                if (opts?.askPrompt) {
                                    setAskInitialPrompt(opts.askPrompt);
                                    setAskBackPanel("bk-transactions");
                                }
                                goToPanel(p as MainPanel);
                            }}
                            onRdLabel={handleRdLabelChange}
                            linkedRdTxnIds={linkedRdTxnIds}
                            unlinkedRdTxnIds={unlinkedRdTxnIds}
                        />
                    </motion.div>
                ) : mainPanel === "bk-reports" ? (
                    <motion.div key="bk-reports" custom={direction.current} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={slideTransition} className="flex min-w-0 flex-1 overflow-hidden">
                        <BookkeepingScreen page="reports" />
                    </motion.div>
                ) : mainPanel === "documents" ? (
                    <motion.div key="documents" custom={direction.current} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={slideTransition} className="flex min-w-0 flex-1 overflow-hidden">
                        <PageShell title="Documents" description="Manage and organize your documents." />
                    </motion.div>
                ) : (
                    <motion.div
                        key="home"
                        custom={direction.current}
                        variants={{
                            initial: (d: number) => ({ x: d * -32, opacity: 0 }),
                            animate: { x: 0, opacity: 1 },
                            exit:    (d: number) => ({ x: d * 32, opacity: 0 }),
                        }}
                        initial="initial" animate="animate" exit="exit"
                        transition={slideTransition}
                        className="flex min-w-0 flex-1 overflow-hidden"
                    >
                        <div className="flex min-w-0 flex-1 flex-col bg-secondary">
                            {/* Scrollable content */}
                            <main className="flex-1 overflow-auto px-10 py-8">
                                <div className="mb-8">
                                    <h1 className="text-display-sm font-semibold text-primary">{getGreeting()}, Olivia</h1>
                                    <p className="mt-1 text-md text-tertiary">Here&apos;s what to do next.</p>
                                </div>

                                {isConnected && setupIncomplete && (
                                    <div className="mb-8 flex items-center gap-3 rounded-xl border border-secondary bg-brand-primary_alt/40 px-4 py-3">
                                        <FeaturedIcon icon={Link01} color="brand" theme="light" size="md" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-primary">Add more integrations anytime</p>
                                            <p className="mt-0.5 text-xs text-tertiary">
                                                You can always connect additional banking, accounting, or expense tools whenever you&apos;re ready.
                                            </p>
                                        </div>
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            iconTrailing={ChevronRight}
                                            onClick={() => { setSettingsInitialSection("integrations"); setShowSettings(true); }}
                                        >
                                            Add integrations
                                        </Button>
                                    </div>
                                )}

                                {isConnected && (
                                    <ConnectedSummary
                                        onNavigate={(panel, intent) => {
                                            if (intent) setTaxIntent(intent);
                                            goToPanel(panel);
                                        }}
                                    />
                                )}

                                <div className="flex items-start gap-6">
                                    {/* Left: What Needs Your Attention */}
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-lg font-semibold text-primary">Your next steps</h2>
                                                <Badge color="brand" type="pill-color" size="sm">{activeTasks.length} active</Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* All three controls share the same h-9, rounded-lg, */}
                                                {/* border-secondary, no-shadow chrome for visual parity. */}

                                                {/* Channel filter (multi-select) */}
                                                <div ref={channelMenuRef} className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setChannelMenuOpen((v) => !v)}
                                                        className="flex h-9 items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 text-sm font-medium text-primary transition duration-100 ease-linear hover:bg-primary_hover"
                                                    >
                                                        <MessageSquare01 className="size-4 text-fg-quaternary" aria-hidden />
                                                        <span className="text-tertiary">Channel:</span>
                                                        <span>{channelFilterLabel}</span>
                                                        <ChevronDown className={cx("size-4 text-fg-quaternary transition-transform duration-100 ease-linear", channelMenuOpen && "rotate-180")} aria-hidden />
                                                    </button>
                                                    {channelMenuOpen && (
                                                        <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-secondary bg-primary p-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => setChannelFilter(new Set())}
                                                                className={cx(
                                                                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition duration-100 ease-linear hover:bg-primary_hover",
                                                                    channelFilter.size === 0 ? "font-semibold text-primary" : "text-secondary",
                                                                )}
                                                            >
                                                                All channels
                                                                {channelFilter.size === 0 && <Check className="size-3.5 text-fg-brand-primary" aria-hidden />}
                                                            </button>
                                                            <div className="my-1 h-px bg-secondary" />
                                                            {availableChannels.map((ch) => {
                                                                const selected = channelFilter.has(ch);
                                                                return (
                                                                    <button
                                                                        key={ch}
                                                                        type="button"
                                                                        onClick={() => setChannelFilter((prev) => {
                                                                            const next = new Set(prev);
                                                                            if (next.has(ch)) next.delete(ch); else next.add(ch);
                                                                            return next;
                                                                        })}
                                                                        className={cx(
                                                                            "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition duration-100 ease-linear hover:bg-primary_hover",
                                                                            selected ? "font-semibold text-primary" : "text-secondary",
                                                                        )}
                                                                    >
                                                                        <span className="flex items-center gap-2">
                                                                            <span className={cx(
                                                                                "flex size-4 items-center justify-center rounded border",
                                                                                selected ? "border-brand bg-brand-solid" : "border-secondary bg-primary",
                                                                            )}>
                                                                                {selected && <Check className="size-3 text-white" aria-hidden />}
                                                                            </span>
                                                                            {ch}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Sort dropdown */}
                                                <div ref={sortMenuRef} className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSortMenuOpen((v) => !v)}
                                                        className="flex h-9 items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 text-sm font-medium text-primary transition duration-100 ease-linear hover:bg-primary_hover"
                                                    >
                                                        <Clock className="size-4 text-fg-quaternary" aria-hidden />
                                                        <span className="text-tertiary">Sort:</span>
                                                        <span>{currentSortLabel}</span>
                                                        <ChevronDown className={cx("size-4 text-fg-quaternary transition-transform duration-100 ease-linear", sortMenuOpen && "rotate-180")} aria-hidden />
                                                    </button>
                                                    {sortMenuOpen && (
                                                        <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-secondary bg-primary p-1">
                                                            {SORT_OPTIONS.map((opt) => (
                                                                <button
                                                                    key={opt.key}
                                                                    type="button"
                                                                    onClick={() => { setSortKey(opt.key); setSortMenuOpen(false); }}
                                                                    className={cx(
                                                                        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition duration-100 ease-linear hover:bg-primary_hover",
                                                                        sortKey === opt.key ? "font-semibold text-primary" : "text-secondary",
                                                                    )}
                                                                >
                                                                    {opt.label}
                                                                    {sortKey === opt.key && <Check className="size-3.5 text-fg-brand-primary" aria-hidden />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Create New Task: plain button so it stays shadow-free */}
                                                <button
                                                    type="button"
                                                    className="flex h-9 items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 text-sm font-medium text-primary transition duration-100 ease-linear hover:bg-primary_hover"
                                                >
                                                    <Plus className="size-4 text-fg-quaternary" aria-hidden />
                                                    Create New Task
                                                </button>

                                            </div>
                                        </div>

                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <div className="space-y-4 pb-4">
                                                <DroppableListGroup
                                                    status="waiting-you"
                                                    title="Waiting on You"
                                                    count={waitingYouTasksAll.length}
                                                    tasks={waitingYouTasks}
                                                    color="brand"
                                                    headerRight={
                                                        <CategoryTabs
                                                            visibleCategories={visibleCategories}
                                                            categoryFilter={categoryFilter}
                                                            onChange={setCategoryFilter}
                                                            counts={categoryCounts}
                                                        />
                                                    }
                                                />
                                            </div>

                                            {/* Show more / less, styled as a list footer so it sits clearly */}
                                            {/* at the bottom of the Waiting on You list (rather than floating */}
                                            {/* loose under it where users miss it). */}
                                            {(waitingYouHiddenCount > 0 || showAllWaitingYou) && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAllWaitingYou((v) => !v)}
                                                    className="group -mt-2 mb-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-secondary bg-primary/50 px-3 py-2.5 text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:border-brand hover:bg-brand-primary_alt hover:text-brand-secondary_hover"
                                                >
                                                    {showAllWaitingYou ? (
                                                        <>
                                                            Show less
                                                            <ChevronDown className="size-4 rotate-180 transition-transform duration-100 ease-linear" aria-hidden />
                                                        </>
                                                    ) : (
                                                        <>
                                                            Show {waitingYouHiddenCount} more
                                                            <ChevronDown className="size-4 transition-transform duration-100 ease-linear group-hover:translate-y-0.5" aria-hidden />
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {waitingNumixTasks.length > 0 && (
                                                <div className="mt-2 rounded-xl border border-secondary bg-primary/60">
                                                    <button
                                                        type="button"
                                                        onClick={() => setNumixWorkExpanded((v) => !v)}
                                                        className="flex w-full items-center gap-2 px-4 py-3 text-left transition duration-100 ease-linear hover:bg-primary_hover"
                                                    >
                                                        <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-fg-warning-primary" />
                                                        <span className="flex-1 text-sm text-secondary">
                                                            Numix is working on{" "}
                                                            <span className="font-semibold text-primary">
                                                                {waitingNumixTasks.length} item{waitingNumixTasks.length === 1 ? "" : "s"}
                                                            </span>{" "}
                                                            for you
                                                        </span>
                                                        <span className="shrink-0 rounded-full bg-warning-primary px-2 py-0.5 text-xs font-medium text-warning-primary">In progress</span>
                                                        <ChevronDown
                                                            className={cx(
                                                                "size-4 text-fg-quaternary transition-transform duration-150",
                                                                numixWorkExpanded && "rotate-180",
                                                            )}
                                                            aria-hidden
                                                        />
                                                    </button>
                                                    <AnimatePresence initial={false}>
                                                        {numixWorkExpanded && (
                                                            <motion.div
                                                                key="numix-work"
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.18, ease: "easeInOut" }}
                                                                className="overflow-hidden"
                                                            >
                                                                <ul className="divide-y divide-secondary border-t border-secondary">
                                                                    {waitingNumixTasks.map((t) => (
                                                                        <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                                                                            <div className="min-w-0">
                                                                                <p className="truncate text-sm text-primary">{t.title}</p>
                                                                                <p className="truncate text-xs text-tertiary">{t.source}</p>
                                                                            </div>
                                                                            {t.dueDate && (
                                                                                <span className="shrink-0 text-xs text-tertiary">{displayDueDate(t.dueDate)}</span>
                                                                            )}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )}
                                            <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
                                                {activeTask ? (
                                                    <div className="rotate-1 shadow-xl opacity-95">
                                                        <ListTaskRow task={activeTask} />
                                                    </div>
                                                ) : null}
                                            </DragOverlay>
                                        </DndContext>
                                    </div>

                                    {/* Right: Company Overview */}
                                    <div className="w-64 shrink-0 self-start overflow-hidden rounded-xl border border-secondary bg-primary">
                                        <div className="px-4 py-3">
                                            <h3 className="text-sm font-semibold text-primary">Company Overview</h3>
                                        </div>
                                        <div className="border-t border-secondary">
                                                <div className="space-y-3 px-4 py-3">
                                                    <div>
                                                        <p className="text-[11px] text-tertiary">Company Name</p>
                                                        <p className="text-sm font-medium text-primary">Acme Technologies Inc.</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] text-tertiary">EIN</p>
                                                        <p className="font-mono text-sm text-primary">82-1234567</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] text-tertiary">Entity Type</p>
                                                        <Badge color="brand" size="sm" type="pill-color">S-Corp</Badge>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] text-tertiary">State of Formation</p>
                                                        <p className="text-sm font-medium text-primary">Delaware</p>
                                                    </div>
                                                </div>
                                                <div className="border-t border-secondary px-4 py-3">
                                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">Filing Details</p>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-[11px] text-tertiary">Fiscal Year</p>
                                                            <p className="text-sm font-medium text-primary">Calendar (Jan–Dec)</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] text-tertiary">Filing Status</p>
                                                            <BadgeWithDot color="success" size="sm" type="pill-color">Active</BadgeWithDot>
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] text-tertiary">Tax Year</p>
                                                            <p className="text-sm font-medium text-primary">2024</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] text-tertiary">Form Type</p>
                                                            <p className="text-sm font-medium text-primary">1120-S</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="border-t border-secondary px-4 py-3">
                                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">Contact</p>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Mail01 className="size-3.5 text-fg-quaternary" />
                                                            <span className="text-xs text-primary">finance@acmetech.com</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Phone01 className="size-3.5 text-fg-quaternary" />
                                                            <span className="text-xs text-primary">(555) 012-3456</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="border-t border-secondary p-4">
                                                    <div className="rounded-xl bg-gradient-to-r from-purple-200/60 via-purple-100/50 to-blue-200/60 p-3">
                                                        <Stars01 className="mb-1.5 size-4 text-fg-brand-secondary_alt" />
                                                        <p className="text-xs text-tertiary">Need to manage multiple companies?</p>
                                                        <button
                                                            type="button"
                                                            className="mt-1.5 text-xs font-semibold text-brand-secondary hover:underline"
                                                            onClick={() => {
                                                                const newConv = { id: "add-company-" + Date.now(), title: "Add Another Company", time: "Just now", status: "waiting-numix" as TaskStatus };
                                                                setConversations((prev) => [newConv, ...prev]);
                                                                setAskInitialPrompt("I'd like to add another company to my account. Can you help me set it up?");
                                                                setAskBackPanel("home");
                                                                goToPanel("new-ask");
                                                            }}
                                                        >
                                                            Add another company
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                            </main>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            </div>

            {/* ── Settings modal ──────────────────────────────────────────── */}
            <ModalOverlay
                isOpen={showSettings}
                onOpenChange={(open) => { setShowSettings(open); if (!open) setSettingsInitialSection(undefined); }}
                isDismissable
            >
                <Modal className="max-w-[900px]">
                    <Dialog className="outline-hidden">
                        <SettingsScreen
                            onBack={() => { setShowSettings(false); setSettingsInitialSection(undefined); }}
                            setupIncomplete={setupIncomplete}
                            onSetupComplete={() => setSetupIncomplete(false)}
                            initialSection={settingsInitialSection}
                        />
                    </Dialog>
                </Modal>
            </ModalOverlay>

            {/* ── Upload overlay ──────────────────────────────────────────── */}
            <AnimatePresence>
                {uploadOverlay && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay/70 backdrop-blur-[6px]"
                        onClick={() => setUploadOverlay(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="mx-4 w-full max-w-lg rounded-2xl border border-secondary bg-primary p-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div
                                className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-brand p-10 text-center"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    dragCounter.current = 0;
                                    setUploadOverlay(false);
                                }}
                            >
                                <div className="flex size-12 items-center justify-center rounded-full bg-brand-primary_alt">
                                    <Upload01 className="size-6 text-fg-brand-primary" aria-hidden />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-primary">Drop files anywhere to upload</p>
                                    <p className="mt-1 text-sm text-tertiary">
                                        Files will be automatically categorized and routed to the right place.
                                    </p>
                                </div>
                                <div className="mt-2 flex gap-3">
                                    <label className="cursor-pointer">
                                        <Button color="primary" size="md" iconLeading={Upload01} onClick={() => {}}>
                                            Browse files
                                        </Button>
                                        <input type="file" multiple className="hidden" onChange={() => setUploadOverlay(false)} />
                                    </label>
                                    <Button color="secondary" size="md" onClick={() => setUploadOverlay(false)}>
                                        Cancel
                                    </Button>
                                </div>
                                <p className="text-xs text-quaternary">PDF, CSV, Excel, images (up to 25 MB each)</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>

        <TaskDetailSlideout
            task={detailTask}
            isOpen={detailTaskId !== null}
            onClose={() => setDetailTaskId(null)}
            goToPanel={goToPanel}
            goToConversation={goToConversation}
            onMarkDone={(id, completedLabel) => {
                setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: "done", completedDate: completedLabel } : t));
                setDetailTaskId(null);
            }}
        />
        </TaskDetailContext.Provider>
        </PanelNavContext.Provider>
    );
};
