"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { SettingsScreen } from "@/app/settings/settings-screen";
import { NewAskPanel } from "@/app/new-ask/new-ask-screen";
import { ConversationDetailPanel } from "@/app/conversation/conversation-panel";
import {
    BarChart01,
    BarChartSquare02,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "waiting-you" | "waiting-numix" | "done";

interface Task {
    id: string;
    title: string;
    taskNumber: string;
    status: TaskStatus;
    description?: string;
    dueDate?: string;
    source: string;
    channel: string;
    action: "upload" | "review" | "confirm";
    completedDate?: string;
    conversationId?: string;
}

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
        label: "Tax", icon: ReceiptCheck, panelId: "tax-overview" as const, subItems: [
            { label: "Tax Overview", panelId: "tax-overview" as const, icon: BarChartSquare02 },
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
        id: "1",
        title: "Upload December Bank Statement",
        taskNumber: "NUM-1042",
        status: "waiting-you",
        description: "Please upload your December bank statement to verify end-of-year balances for your 2024 return.",
        dueDate: "Due Feb 28",
        source: "System Generated",
        channel: "Workspace",
        action: "upload",
        conversationId: "return-2024",
    },
    {
        id: "2",
        title: "Review Draft Tax Summary",
        taskNumber: "NUM-1045",
        status: "waiting-you",
        description: "Your CPA has prepared a draft tax summary. Please review and flag any discrepancies before we file.",
        dueDate: "Due Mar 10",
        source: "Requested by CPA",
        channel: "Slack",
        action: "review",
        conversationId: "return-2024",
    },
    {
        id: "3",
        title: "Confirm Business Address",
        taskNumber: "NUM-1047",
        status: "waiting-numix",
        description: "We need to verify your current registered business address for the R&D credit filings.",
        dueDate: "Due Mar 5",
        source: "System Generated",
        channel: "Workspace",
        action: "confirm",
        conversationId: "rd-payroll",
    },
    {
        id: "4",
        title: "R&D Credit Documentation",
        taskNumber: "NUM-1048",
        status: "waiting-numix",
        description: "Upload supporting documentation for the R&D payroll tax credit claim, including employee time logs.",
        source: "Requested by CPA",
        channel: "Slack",
        action: "upload",
        conversationId: "rd-payroll",
    },
    {
        id: "5",
        title: "Monthly Payroll Review - January",
        taskNumber: "NUM-1035",
        status: "done",
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
        source: "Requested by CPA",
        channel: "SMS",
        action: "upload",
        completedDate: "Completed Feb 15",
    },
];

// ─── Presentational components ────────────────────────────────────────────────

function StatusBadge({ status }: { status: TaskStatus }) {
    if (status === "waiting-you") {
        return <BadgeWithDot color="brand" type="pill-color" size="sm">Waiting on You</BadgeWithDot>;
    }
    if (status === "waiting-numix") {
        return <BadgeWithDot color="blue-light" type="pill-color" size="sm">Waiting on Numix</BadgeWithDot>;
    }
    return <Badge color="gray" type="pill-color" size="sm">Done</Badge>;
}

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
    if (task.action === "upload") return <Button color="secondary" size="sm" iconLeading={Upload01}>Upload</Button>;
    if (task.action === "review") return <Button color="secondary" size="sm" iconLeading={Eye}>Review</Button>;
    return <Button color="secondary" size="sm" iconLeading={Check}>Confirm</Button>;
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
    return (
        <div className={cx("rounded-xl border border-secondary bg-primary p-4 shadow-xs", isDone && "opacity-75")}>
            <div className="flex items-start gap-2">
                <div
                    {...(dragListeners as object)}
                    className="mt-0.5 shrink-0 cursor-grab touch-none active:cursor-grabbing"
                >
                    <DragHandle />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <p className={cx("text-sm font-semibold leading-snug text-primary", isDone && "text-tertiary line-through")}>{task.title}</p>
                        {!isDone && <TaskActionButton task={task} />}
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                        <Hash01 className="size-3 text-fg-quaternary" />
                        <span className={cx("text-xs text-tertiary", isDone && "line-through")}>{task.taskNumber}</span>
                        <Link01 className="size-3 text-fg-quaternary" />
                    </div>
                    <div className="mt-2"><StatusBadge status={task.status} /></div>
                    {task.dueDate && (
                        <div className="mt-2 flex items-center gap-1.5">
                            <Clock className="size-3.5 text-fg-quaternary" />
                            <span className="text-xs text-tertiary">{task.dueDate}</span>
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
    return (
        <div className={cx("flex items-center gap-3 rounded-lg border border-secondary bg-primary px-4 py-3 transition duration-100 ease-linear hover:bg-primary_hover", isDone && "opacity-60")}>
            <div
                {...(dragListeners as object)}
                className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
            >
                <DragHandle />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className={cx("truncate text-sm font-medium text-primary", isDone && "text-tertiary line-through")}>{task.title}</p>
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
                <StatusBadge status={task.status} />
                {task.dueDate && !isDone && (
                    <div className="flex items-center gap-1">
                        <Clock className="size-3.5 text-fg-quaternary" />
                        <span className="text-xs text-tertiary">{task.dueDate}</span>
                    </div>
                )}
                {task.completedDate && (
                    <div className="flex items-center gap-1">
                        <Check className="size-3.5 text-fg-success-secondary" />
                        <span className="text-xs text-tertiary">{task.completedDate}</span>
                    </div>
                )}
                {!isDone && <TaskActionButton task={task} />}
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

function DroppableBoardColumn({ status, title, count, tasks, color }: {
    status: TaskStatus; title: string; count: number; tasks: Task[]; color?: ColumnColor;
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

function DroppableListGroup({ status, title, count, tasks, color }: {
    status: TaskStatus; title: string; count: number; tasks: Task[]; color?: ColumnColor;
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

type MainPanel = "home" | "new-ask" | "conversation" | "status-overview" | "tax-overview" | "tax-filing" | "tax-planning" | "cfo-forecast" | "cfo-save-money" | "cfo-make-money" | "bk-ap" | "bk-ar" | "bk-transactions" | "bk-reports" | "documents";

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
                                <p className="text-xs text-tertiary">In review — due Mar 15</p>
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export const NumixScreen = () => {
    const { user, loading: authLoading, signOut } = useAuth();
    const [showLogin, setShowLogin] = useState(() => {
        if (typeof window === "undefined") return true;
        const step = new URLSearchParams(window.location.search).get("step");
        if (step === "access" || step === "dashboard") return false;
        return true;
    });
    const [showIntegrations, setShowIntegrations] = useState(() => {
        if (typeof window === "undefined") return false;
        const step = new URLSearchParams(window.location.search).get("step");
        return step === "access";
    });

    // Sync showLogin with auth state
    useEffect(() => {
        if (authLoading) return;
        if (user) {
            setShowLogin(false);
        } else {
            setShowLogin(true);
            setShowIntegrations(false);
        }
    }, [user, authLoading]);
    const [showSettings, setShowSettings] = useState(false);
    const [setupIncomplete, setSetupIncomplete] = useState(false);
    const [expandedNav, setExpandedNav] = useState<string | null>(null);
    const [receiptDragOver, setReceiptDragOver] = useState(false);
    const [uploadOverlay, setUploadOverlay] = useState(false);
    const dragCounter = useRef(0);
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [mainPanel, setMainPanel] = useState<MainPanel>("home");
    const [activeConversation, setActiveConversation] = useState<{ id: string; title: string } | null>(null);
    const [boardView, setBoardView] = useState<"list" | "board">("board");
    const [statusExpanded, setStatusExpanded] = useState(true);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [askInitialPrompt, setAskInitialPrompt] = useState<string | undefined>(undefined);
    const [askBackPanel, setAskBackPanel] = useState<MainPanel>("home");
    const [conversations, setConversations] = useState(recentConversations);
    const direction = useRef<1 | -1>(1);

    const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const waitingYouTasks = tasks.filter((t) => t.status === "waiting-you");
    const waitingNumixTasks = tasks.filter((t) => t.status === "waiting-numix");
    const doneTasks = tasks.filter((t) => t.status === "done");
    const activeTasks = tasks.filter((t) => t.status !== "done");

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
                        setShowIntegrations(false);
                        if (connectedCount < totalCount) setSetupIncomplete(true);
                    }}
                    onBack={() => { setShowIntegrations(false); setShowLogin(true); }}
                />
            </motion.div>
        );
    }

    return (
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
                        <NewAskPanel onBack={() => { setAskInitialPrompt(undefined); const back = askBackPanel; setAskBackPanel("home"); goToPanel(back); }} backLabel={askBackPanel === "tax-overview" ? "Tax Overview" : askBackPanel === "cfo-make-money" ? "How to Make Money" : askBackPanel === "cfo-save-money" ? "How to Save Money" : "Home"} initialPrompt={askInitialPrompt} />
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
                ) : mainPanel === "tax-overview" ? (
                    <motion.div key="tax-overview" custom={direction.current} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={slideTransition} className="flex min-w-0 flex-1 overflow-hidden">
                        <TaxScreen page="overview" onAddCompany={() => {
                            const newConv = { id: "add-company-" + Date.now(), title: "Add Another Company", time: "Just now", status: "waiting-numix" as TaskStatus };
                            setConversations((prev) => [newConv, ...prev]);
                            setAskInitialPrompt("I'd like to add another company to my account. Can you help me set it up?");
                            setAskBackPanel("tax-overview");
                            goToPanel("new-ask");
                        }} />
                    </motion.div>
                ) : mainPanel === "tax-filing" ? (
                    <motion.div key="tax-filing" custom={direction.current} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={slideTransition} className="flex min-w-0 flex-1 overflow-hidden">
                        <TaxScreen page="filing" />
                    </motion.div>
                ) : mainPanel === "tax-planning" ? (
                    <motion.div key="tax-planning" custom={direction.current} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={slideTransition} className="flex min-w-0 flex-1 overflow-hidden">
                        <TaxScreen page="planning" />
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
                        <BookkeepingScreen page="transactions" />
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
                                    <p className="mt-1 text-md text-tertiary">Here&apos;s what needs your attention.</p>
                                </div>

                                <div className="flex items-start gap-6">
                                    {/* Left: What Needs Your Attention */}
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-lg font-semibold text-primary">What Needs Your Attention</h2>
                                                <Badge color="brand" type="pill-color" size="sm">{activeTasks.length} active</Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button color="secondary" size="sm" iconLeading={Plus}>Create New Task</Button>
                                                <div className="flex items-center gap-1 rounded-lg border border-secondary bg-primary p-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setBoardView("list")}
                                                        className={cx(
                                                            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold transition duration-100 ease-linear",
                                                            boardView === "list" ? "bg-brand-solid text-white" : "text-quaternary hover:text-tertiary",
                                                        )}
                                                    >
                                                        <Rows01 className="size-4" aria-hidden />
                                                        List
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setBoardView("board")}
                                                        className={cx(
                                                            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold transition duration-100 ease-linear",
                                                            boardView === "board" ? "bg-brand-solid text-white" : "text-quaternary hover:text-tertiary",
                                                        )}
                                                    >
                                                        <BoardIcon />
                                                        Board
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                        >
                                            {boardView === "list" ? (
                                                <div className="space-y-4 pb-4">
                                                    <DroppableListGroup status="waiting-you" title="Waiting on You" count={waitingYouTasks.length} tasks={waitingYouTasks} color="brand" />
                                                    <DroppableListGroup status="waiting-numix" title="Waiting on Numix" count={waitingNumixTasks.length} tasks={waitingNumixTasks} color="warning" />
                                                    <DroppableListGroup status="done" title="Done" count={doneTasks.length} tasks={doneTasks} color="success" />
                                                </div>
                                            ) : (
                                                <div className="flex gap-4 pb-4">
                                                    <DroppableBoardColumn status="waiting-you" title="Waiting on You" count={waitingYouTasks.length} tasks={waitingYouTasks} color="brand" />
                                                    <DroppableBoardColumn status="waiting-numix" title="Waiting on Numix" count={waitingNumixTasks.length} tasks={waitingNumixTasks} color="warning" />
                                                    <DroppableBoardColumn status="done" title="Done" count={doneTasks.length} tasks={doneTasks} color="success" />
                                                </div>
                                            )}
                                            <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
                                                {activeTask ? (
                                                    boardView === "list" ? (
                                                        <div className="rotate-1 shadow-xl opacity-95">
                                                            <ListTaskRow task={activeTask} />
                                                        </div>
                                                    ) : (
                                                        <div className="w-72 rotate-1 shadow-xl opacity-95">
                                                            <TaskCard task={activeTask} />
                                                        </div>
                                                    )
                                                ) : null}
                                            </DragOverlay>
                                        </DndContext>
                                    </div>

                                </div>
                            </main>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            </div>

            {/* ── Settings modal ──────────────────────────────────────────── */}
            <ModalOverlay isOpen={showSettings} onOpenChange={setShowSettings} isDismissable>
                <Modal className="max-w-[900px]">
                    <Dialog className="outline-hidden">
                        <SettingsScreen
                            onBack={() => setShowSettings(false)}
                            setupIncomplete={setupIncomplete}
                            onSetupComplete={() => setSetupIncomplete(false)}
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
                                <p className="text-xs text-quaternary">PDF, CSV, Excel, images — up to 25 MB each</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
