"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
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
import { SettingsScreen } from "@/app/settings/settings-screen";
import { NewAskPanel } from "@/app/new-ask/new-ask-screen";
import { ConversationDetailPanel } from "@/app/conversation/conversation-panel";
import {
    BarChart01,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eye,
    File01,
    Hash01,
    HelpCircle,
    Home01,
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
    { label: "Home", icon: Home01 },
    { label: "Tax Returns", icon: ReceiptCheck },
    { label: "Financials", icon: BarChart01 },
    { label: "Documents", icon: File01 },
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

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => { setLoading(false); onLogin(); }, 800);
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex h-dvh flex-col items-center bg-primary"
        >
            {/* Logo */}
            <div className="pt-6">
                <img src="/numix-logo.png" alt="Numix" className="h-8 w-auto" />
            </div>

            {/* Centered content */}
            <div className="flex flex-1 flex-col items-center justify-center px-4">
                <h1 className="text-center text-3xl font-semibold text-primary">
                    Log in to your account
                </h1>
                <p className="mt-2 text-center text-base text-tertiary">
                    Welcome back! Please enter your details.
                </p>

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
                        Sign in
                    </Button>
                </form>

                <p className="mt-6 text-sm text-tertiary">
                    Don&apos;t have an account?{" "}
                    <button type="button" className="font-medium text-brand-secondary">Sign up</button>
                </p>
            </div>
        </motion.div>
    );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export const NumixScreen = () => {
    const [showLogin, setShowLogin] = useState(true);
    const [showIntegrations, setShowIntegrations] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [receiptDragOver, setReceiptDragOver] = useState(false);
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [mainPanel, setMainPanel] = useState<"home" | "new-ask" | "conversation">("home");
    const [activeConversation, setActiveConversation] = useState<{ id: string; title: string } | null>(null);
    const [boardView, setBoardView] = useState<"list" | "board">("board");
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);
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

    function goToPanel(panel: "home" | "new-ask") {
        direction.current = panel === "new-ask" ? 1 : -1;
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
            <LoginScreen onLogin={() => { setShowLogin(false); setShowIntegrations(true); }} />
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
                <IntegrationsSetup onComplete={() => setShowIntegrations(false)} />
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
                    <button type="button" onClick={() => setShowLogin(true)} className="cursor-pointer">
                        <img src="/numix-logo.png" alt="Numix" className="h-6 w-auto" />
                    </button>
                </div>

                <nav className="flex flex-col gap-0.5 px-3">
                    {navItems.map((item) => {
                        const isActive = item.label === "Home" && mainPanel === "home";
                        return (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() => { if (item.label === "Home") goToPanel("home"); }}
                                className={cx(
                                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition duration-100 ease-linear",
                                    isActive ? "bg-brand-primary_alt text-brand-secondary" : "text-tertiary hover:bg-primary_hover hover:text-secondary",
                                )}
                            >
                                <item.icon className={cx("size-5 shrink-0", isActive ? "text-fg-brand-secondary_alt" : "text-fg-quaternary")} aria-hidden />
                                {item.label}
                            </button>
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

                <div className="mt-5 flex flex-col gap-1 px-3">
                    <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-quaternary">Recent Conversations</p>
                    {recentConversations.map((conv) => (
                        <button
                            key={conv.id}
                            type="button"
                            onClick={() => goToConversation(conv.id, conv.title)}
                            className={cx(
                                "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition duration-100 ease-linear hover:bg-primary_hover",
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

                <div className="mt-auto">
                    <div className="mx-5 my-3 h-px bg-border-secondary" />
                    <div className="px-3 pb-1">
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
                        <NewAskPanel onBack={() => goToPanel("home")} />
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
                            {/* Top bar */}
                            <header className="flex h-16 shrink-0 items-center gap-4 border-b border-secondary bg-white px-6">
                                <button
                                    type="button"
                                    onClick={() => setSearchOpen(true)}
                                    className="flex flex-1 items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-placeholder transition duration-100 ease-linear hover:border-brand"
                                >
                                    <SearchLg className="size-4 text-fg-quaternary" aria-hidden />
                                    <span className="flex-1 text-left">Search...</span>
                                </button>
                                <button type="button" className="relative size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-secondary transition duration-100 ease-linear hover:ring-brand">
                                    <img
                                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"
                                        alt="Olivia Rhye"
                                        className="size-full object-cover"
                                    />
                                </button>
                            </header>

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

                                    {/* Right: Smart Insights + Quick Receipt Upload */}
                                    <div className="w-72 shrink-0 space-y-5 pb-4">
                                        {/* Numix Smart Insights */}
                                        <div>
                                            <div className="mb-3 flex items-center gap-2">
                                                <Stars01 className="size-4 text-fg-brand-secondary_alt" aria-hidden />
                                                <h2 className="text-sm font-semibold text-secondary">Numix Smart Insights</h2>
                                            </div>
                                            <div className="space-y-3">
                                                {/* Expense Spike Alert */}
                                                <div className="rounded-xl border border-secondary bg-primary p-4">
                                                    <div className="flex gap-3">
                                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning-secondary">
                                                            <BarChart01 className="size-4 text-fg-warning-primary" aria-hidden />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-primary">Expense Spike Alert</p>
                                                            <p className="mt-1 text-sm leading-relaxed text-tertiary">Your operating expenses rose 15% this quarter, driven by a $420 jump in software subscriptions.</p>
                                                            <button type="button" className="mt-2 flex items-center gap-1 text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover">
                                                                View expense breakdown
                                                                <ChevronRight className="size-3.5" aria-hidden />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* R&D Tax Credit Opportunity */}
                                                <div className="rounded-xl border border-secondary bg-primary p-4">
                                                    <div className="flex gap-3">
                                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning-secondary">
                                                            <ReceiptCheck className="size-4 text-fg-warning-primary" aria-hidden />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-primary">R&amp;D Tax Credit Opportunity</p>
                                                            <p className="mt-1 text-sm leading-relaxed text-tertiary">You may qualify $3,850 in R&amp;D tax credits based on Q2 tech and payroll spend.</p>
                                                            <button type="button" className="mt-2 flex items-center gap-1 text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover">
                                                                Start R&amp;D credit
                                                                <ChevronRight className="size-3.5" aria-hidden />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Receipt Upload */}
                                        <div>
                                            <h2 className="mb-3 text-sm font-semibold text-secondary">Quick Receipt Upload</h2>
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                className={cx(
                                                    "flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition duration-100 ease-linear",
                                                    receiptDragOver
                                                        ? "border-brand bg-brand-primary_alt"
                                                        : "border-secondary bg-primary hover:border-primary hover:bg-primary_hover",
                                                )}
                                                onDragOver={(e) => { e.preventDefault(); setReceiptDragOver(true); }}
                                                onDragLeave={() => setReceiptDragOver(false)}
                                                onDrop={(e) => { e.preventDefault(); setReceiptDragOver(false); }}
                                            >
                                                <div className={cx(
                                                    "mb-3 flex size-10 items-center justify-center rounded-full transition duration-100 ease-linear",
                                                    receiptDragOver ? "bg-brand-secondary" : "bg-secondary",
                                                )}>
                                                    <Upload01 className={cx("size-5 transition duration-100 ease-linear", receiptDragOver ? "text-fg-brand-primary" : "text-fg-quaternary")} aria-hidden />
                                                </div>
                                                <p className="text-sm font-semibold text-secondary">Drop receipt here</p>
                                                <p className="mt-0.5 text-xs text-tertiary">or click to browse</p>
                                                <p className="mt-3 text-xs text-quaternary">Supports JPG, PNG, PDF</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </main>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Settings modal ──────────────────────────────────────────── */}
            <ModalOverlay isOpen={showSettings} onOpenChange={setShowSettings} isDismissable>
                <Modal className="max-w-[900px]">
                    <Dialog className="outline-hidden">
                        <SettingsScreen onBack={() => setShowSettings(false)} />
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </motion.div>
    );
};
