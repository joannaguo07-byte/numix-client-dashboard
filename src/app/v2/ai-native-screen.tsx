"use client";

import {
    type FC,
    type ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
    AlertCircle,
    ArrowRight,
    BarChart01,
    Bell01,
    Building01,
    Calendar,
    Check,
    CheckCircle,
    ChevronDown,
    Clock,
    CreditCard01,
    Edit05,
    File06,
    Home01,
    InfoCircle,
    LineChartUp01,
    Link01,
    MessageSquare01,
    Plus,
    SearchLg,
    Settings01,
    Shield01,
    Stars01,
    Trash01,
    Upload01,
    User01,
    X,
} from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

// ─── Types ───────────────────────────────────────────────────────────────────

type View = "feed" | "chat" | "pulse" | "settings";

interface ActionItem {
    id: string;
    title: string;
    description: string;
    amount?: string;
    icon: FC<{ className?: string }>;
    type: "approve" | "upload" | "confirm";
}

interface InsightItem {
    id: string;
    title: string;
    metric: string;
    change: string;
    direction: "up" | "down";
    sentiment: "warning" | "success" | "info";
}

interface StrategyItem {
    id: string;
    title: string;
    savings: string;
    confidence: number;
    category: string;
    details: string;
}

interface TimelineEvent {
    id: string;
    text: string;
    timestamp: string;
    icon: FC<{ className?: string }>;
}

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface EntityInfo {
    name: string;
    revenue: number;
    expenses: number;
    cashFlow: number;
}

interface IntegrationInfo {
    name: string;
    status: "connected" | "disconnected" | "syncing";
    lastSync?: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const ACTIONS: ActionItem[] = [
    {
        id: "a1",
        title: "Approve 3 transactions",
        description: "3 transactions totaling $2,847 need review",
        amount: "$2,847",
        icon: CheckCircle,
        type: "approve",
    },
    {
        id: "a2",
        title: "Upload bank statement",
        description: "March statement for Chase Business account",
        icon: Upload01,
        type: "upload",
    },
    {
        id: "a3",
        title: "Confirm business address",
        description: "Required for Q1 tax filing",
        icon: Building01,
        type: "confirm",
    },
];

const INSIGHTS: InsightItem[] = [
    {
        id: "i1",
        title: "Marketing spend trending up",
        metric: "$12,400",
        change: "+27%",
        direction: "up",
        sentiment: "warning",
    },
    {
        id: "i2",
        title: "Revenue growth accelerating",
        metric: "$1.24M",
        change: "+12.3%",
        direction: "up",
        sentiment: "success",
    },
    {
        id: "i3",
        title: "New integration available",
        metric: "Stripe",
        change: "Connect",
        direction: "up",
        sentiment: "info",
    },
];

const STRATEGIES: StrategyItem[] = [
    {
        id: "s1",
        title: "SaaS subscription renegotiation",
        savings: "$42,000",
        confidence: 87,
        category: "Cost Reduction",
        details:
            "Based on your current usage patterns, 4 SaaS subscriptions are significantly over-provisioned. Renegotiating or switching to annual plans could save approximately $42K/year.",
    },
    {
        id: "s2",
        title: "R&D tax credit opportunity",
        savings: "$69,000",
        confidence: 92,
        category: "Tax Optimization",
        details:
            "Your engineering team's work on the new platform qualifies for federal R&D tax credits. Based on qualifying expenses, the estimated credit is $69K.",
    },
];

const TIMELINE: TimelineEvent[] = [
    {
        id: "t1",
        text: "Categorized 47 transactions automatically",
        timestamp: "2 hours ago",
        icon: CheckCircle,
    },
    {
        id: "t2",
        text: "Detected duplicate vendor payment, flagged for review",
        timestamp: "5 hours ago",
        icon: AlertCircle,
    },
    {
        id: "t3",
        text: "Monthly financial report generated",
        timestamp: "Yesterday",
        icon: File06,
    },
    {
        id: "t4",
        text: "QuickBooks sync completed",
        timestamp: "Yesterday",
        icon: Link01,
    },
];

const ENTITIES: EntityInfo[] = [
    { name: "Acme Technologies", revenue: 1235000, expenses: 828000, cashFlow: 453000 },
    { name: "Acme East LLC", revenue: 540000, expenses: 380000, cashFlow: 172000 },
    { name: "Acme Staffing Co.", revenue: 310000, expenses: 245000, cashFlow: 78000 },
];

const INTEGRATIONS: IntegrationInfo[] = [
    { name: "QuickBooks", status: "connected", lastSync: "2 min ago" },
    { name: "Xero", status: "disconnected" },
    { name: "Gusto", status: "connected", lastSync: "1 hour ago" },
];

const SUGGESTION_CHIPS = [
    "What are my biggest expenses?",
    "Show me cash flow trends",
    "Any tax deadlines coming up?",
    "Summarize last month",
];

const SPARKLINE_DATA = {
    revenue: [65, 59, 80, 81, 56, 72, 90, 85, 95, 100, 92, 105],
    expenses: [45, 48, 52, 50, 55, 58, 53, 56, 60, 58, 62, 65],
    cashFlow: [20, 11, 28, 31, 1, 14, 37, 29, 35, 42, 30, 40],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
}

function formatCurrency(value: number) {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
}

// ─── Mini Sparkline ──────────────────────────────────────────────────────────

function MiniSparkline({
    data,
    color = "var(--color-brand-500)",
    width = 80,
    height = 32,
}: {
    data: number[];
    color?: string;
    width?: number;
    height?: number;
}) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data
        .map((v, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((v - min) / range) * height;
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const NAV_ITEMS: { view: View; icon: FC<{ className?: string }>; label: string }[] = [
    { view: "feed", icon: Home01, label: "Feed" },
    { view: "chat", icon: MessageSquare01, label: "Chat" },
    { view: "pulse", icon: LineChartUp01, label: "Pulse" },
    { view: "settings", icon: Settings01, label: "Settings" },
];

function Sidebar({
    activeView,
    onViewChange,
}: {
    activeView: View;
    onViewChange: (v: View) => void;
}) {
    return (
        <div className="flex h-full w-16 flex-col items-center border-r border-secondary bg-primary py-4">
            {/* Logo */}
            <div className="mb-8 flex size-9 items-center justify-center rounded-lg bg-brand-solid">
                <Stars01 className="size-5 text-white" />
            </div>

            {/* Nav */}
            <nav className="flex flex-1 flex-col items-center gap-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = activeView === item.view;
                    return (
                        <button
                            key={item.view}
                            onClick={() => onViewChange(item.view)}
                            title={item.label}
                            className={cx(
                                "group relative flex size-10 items-center justify-center rounded-lg transition-colors",
                                isActive
                                    ? "bg-active text-fg-brand-primary"
                                    : "text-fg-quaternary hover:bg-primary_hover hover:text-fg-secondary",
                            )}
                        >
                            <item.icon className="size-5" />
                            {/* Tooltip */}
                            <span className="pointer-events-none absolute left-full ml-2 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary opacity-0 shadow-lg ring-1 ring-secondary transition-opacity group-hover:opacity-100">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Avatar */}
            <div className="mt-auto flex size-9 items-center justify-center rounded-full bg-brand-secondary">
                <span className="text-xs font-semibold text-brand-tertiary">OR</span>
            </div>
        </div>
    );
}

// ─── Command Bar ─────────────────────────────────────────────────────────────

function CommandBar({
    onSend,
    onFocusChat,
}: {
    onSend: (message: string) => void;
    onFocusChat?: () => void;
}) {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleResize = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }, []);

    const handleSend = useCallback(() => {
        const trimmed = value.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setValue("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
        onFocusChat?.();
    }, [value, onSend, onFocusChat]);

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-6 pb-5">
            {/* Gradient fade */}
            <div className="h-8 bg-gradient-to-t from-primary to-transparent" />
            <div className="pointer-events-auto mx-auto max-w-2xl">
                <div className="flex items-end gap-2 rounded-2xl border border-secondary bg-primary p-2 shadow-lg ring-1 ring-tertiary/50">
                    <button
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition-colors hover:bg-secondary hover:text-fg-secondary"
                        title="Attach file"
                    >
                        <Plus className="size-5" />
                    </button>
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            handleResize();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Ask Numix anything..."
                        rows={1}
                        className="min-h-[36px] flex-1 resize-none bg-transparent py-2 text-sm text-primary outline-none placeholder:text-placeholder"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!value.trim()}
                        className={cx(
                            "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                            value.trim()
                                ? "bg-brand-solid text-white hover:bg-brand-solid_hover"
                                : "bg-tertiary text-fg-disabled",
                        )}
                    >
                        <ArrowRight className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Card Wrapper ────────────────────────────────────────────────────────────

function Card({
    children,
    className,
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: "easeOut" }}
            className={cx("rounded-2xl border border-secondary bg-primary shadow-xs", className)}
        >
            {children}
        </motion.div>
    );
}

// ─── Morning Brief Card ─────────────────────────────────────────────────────

function MorningBriefCard() {
    const items = [
        { text: "Tax filing deadline in 12 days", urgent: true },
        { text: "3 transactions need your review", urgent: false },
        { text: "Revenue up 12.3% vs last month", urgent: false },
        { text: "New R&D tax credit opportunity identified", urgent: false },
    ];

    return (
        <Card className="overflow-hidden border-none">
            {/* Gradient header */}
            <div className="bg-gradient-to-br from-brand-solid via-purple-600 to-indigo-700 px-6 py-5">
                <p className="text-sm font-medium text-white/80">
                    {getGreeting()}, Olivia
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                    Here&apos;s your morning brief
                </h2>
            </div>
            <div className="divide-y divide-secondary px-6">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-brand-tertiary">
                            {i + 1}
                        </span>
                        <span className="flex-1 text-sm text-secondary">{item.text}</span>
                        {item.urgent && (
                            <BadgeWithDot color="error" size="sm">
                                Urgent
                            </BadgeWithDot>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ─── Action Card ─────────────────────────────────────────────────────────────

function ActionCard({
    action,
    onDismiss,
    delay = 0,
}: {
    action: ActionItem;
    onDismiss: (id: string) => void;
    delay?: number;
}) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100, transition: { duration: 0.25 } }}
            transition={{ duration: 0.4, delay, ease: "easeOut" }}
            className="rounded-2xl border border-secondary bg-primary p-4 shadow-xs"
        >
            <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary">
                    <action.icon className="size-5 text-fg-brand-primary" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-primary">{action.title}</h3>
                    <p className="mt-0.5 text-sm text-tertiary">{action.description}</p>
                    {action.amount && (
                        <p className="mt-1 text-lg font-semibold text-primary">{action.amount}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                        <Button
                            size="sm"
                            color="primary"
                            onClick={() => onDismiss(action.id)}
                        >
                            {action.type === "approve"
                                ? "Approve"
                                : action.type === "upload"
                                  ? "Upload"
                                  : "Confirm"}
                        </Button>
                        <Button
                            size="sm"
                            color="tertiary"
                            onClick={() => onDismiss(action.id)}
                        >
                            Dismiss
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Insight Card ────────────────────────────────────────────────────────────

const INSIGHT_STYLES = {
    warning: "bg-warning-primary border-none",
    success: "bg-success-primary border-none",
    info: "bg-brand-primary border-none",
} as const;

const INSIGHT_TEXT = {
    warning: "text-warning-primary",
    success: "text-success-primary",
    info: "text-fg-brand-primary",
} as const;

function InsightCard({ insight, delay = 0 }: { insight: InsightItem; delay?: number }) {
    return (
        <Card className={INSIGHT_STYLES[insight.sentiment]} delay={delay}>
            <div className="p-4">
                <p className="text-xs font-medium text-tertiary">{insight.title}</p>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-primary">{insight.metric}</span>
                    <span className={cx("text-sm font-medium", INSIGHT_TEXT[insight.sentiment])}>
                        {insight.change}
                    </span>
                </div>
                <button className={cx("mt-2 text-xs font-medium", INSIGHT_TEXT[insight.sentiment])}>
                    Tell me more &rarr;
                </button>
            </div>
        </Card>
    );
}

// ─── Financial Pulse Card ────────────────────────────────────────────────────

function FinancialPulseCard({ delay = 0 }: { delay?: number }) {
    const metrics = [
        {
            label: "Revenue",
            value: "$1.2M",
            change: "+12.3%",
            positive: true,
            data: SPARKLINE_DATA.revenue,
        },
        {
            label: "Expenses",
            value: "$828K",
            change: "+4.2%",
            positive: false,
            data: SPARKLINE_DATA.expenses,
        },
        {
            label: "Cash Flow",
            value: "$453K",
            change: "+18.7%",
            positive: true,
            data: SPARKLINE_DATA.cashFlow,
        },
    ];

    return (
        <Card delay={delay}>
            <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-primary">Financial Pulse</h3>
                    <BadgeWithDot color="success" size="sm">
                        Live
                    </BadgeWithDot>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                    {metrics.map((m) => (
                        <div key={m.label}>
                            <p className="text-xs text-tertiary">{m.label}</p>
                            <p className="mt-1 text-lg font-semibold text-primary">{m.value}</p>
                            <div className="mt-1 flex items-center gap-1.5">
                                <span
                                    className={cx(
                                        "text-xs font-medium",
                                        m.positive ? "text-success-primary" : "text-error-primary",
                                    )}
                                >
                                    {m.change}
                                </span>
                            </div>
                            <div className="mt-2">
                                <MiniSparkline
                                    data={m.data}
                                    color={
                                        m.positive
                                            ? "var(--color-success-500)"
                                            : "var(--color-error-500)"
                                    }
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}

// ─── Strategy Card ───────────────────────────────────────────────────────────

function StrategyCard({ strategy, delay = 0 }: { strategy: StrategyItem; delay?: number }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <Card delay={delay}>
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <Badge color="purple" size="sm">
                            {strategy.category}
                        </Badge>
                        <h3 className="mt-2 text-sm font-semibold text-primary">
                            {strategy.title}
                        </h3>
                        <p className="mt-1 text-lg font-semibold text-success-primary">
                            {strategy.savings}/yr potential
                        </p>
                    </div>
                </div>
                {/* Confidence bar */}
                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-tertiary">Confidence</span>
                        <span className="font-medium text-primary">{strategy.confidence}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-secondary">
                        <div
                            className="h-1.5 rounded-full bg-brand-solid"
                            style={{ width: `${strategy.confidence}%` }}
                        />
                    </div>
                </div>
                {/* Expandable details */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <p className="mt-3 text-sm text-tertiary">{strategy.details}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2 text-xs font-medium text-fg-brand-primary"
                >
                    {expanded ? "Show less" : "Show details"} &rarr;
                </button>
            </div>
        </Card>
    );
}

// ─── Timeline Card ───────────────────────────────────────────────────────────

function TimelineCard({ delay = 0 }: { delay?: number }) {
    return (
        <Card delay={delay}>
            <div className="px-5 py-4">
                <h3 className="text-sm font-semibold text-primary">Recent Activity</h3>
                <div className="mt-3 space-y-3">
                    {TIMELINE.map((event) => (
                        <div key={event.id} className="flex items-start gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                <event.icon className="size-4 text-fg-quaternary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-secondary">{event.text}</p>
                                <p className="mt-0.5 text-xs text-quaternary">{event.timestamp}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}

// ─── Feed View ───────────────────────────────────────────────────────────────

function FeedView() {
    const [dismissedActions, setDismissedActions] = useState<Set<string>>(new Set());

    const handleDismiss = useCallback((id: string) => {
        setDismissedActions((prev) => new Set(prev).add(id));
    }, []);

    const visibleActions = ACTIONS.filter((a) => !dismissedActions.has(a.id));

    return (
        <div className="space-y-4">
            {/* Morning Brief */}
            <MorningBriefCard />

            {/* Actions */}
            <AnimatePresence mode="popLayout">
                {visibleActions.map((action, i) => (
                    <ActionCard
                        key={action.id}
                        action={action}
                        onDismiss={handleDismiss}
                        delay={0.1 * (i + 1)}
                    />
                ))}
            </AnimatePresence>

            {/* Insights (2-col grid) */}
            <div className="grid grid-cols-2 gap-4">
                {INSIGHTS.slice(0, 2).map((insight, i) => (
                    <InsightCard key={insight.id} insight={insight} delay={0.3 + i * 0.1} />
                ))}
            </div>
            {INSIGHTS.length > 2 && (
                <InsightCard insight={INSIGHTS[2]} delay={0.5} />
            )}

            {/* Financial Pulse */}
            <FinancialPulseCard delay={0.5} />

            {/* Strategies */}
            {STRATEGIES.map((s, i) => (
                <StrategyCard key={s.id} strategy={s} delay={0.6 + i * 0.1} />
            ))}

            {/* Timeline */}
            <TimelineCard delay={0.8} />
        </div>
    );
}

// ─── Chat View ───────────────────────────────────────────────────────────────

function ChatView({
    messages,
    isStreaming,
    streamingText,
}: {
    messages: ChatMessage[];
    isStreaming: boolean;
    streamingText: string;
}) {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamingText]);

    return (
        <div className="space-y-4">
            {messages.length === 0 && !isStreaming && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-20 text-center"
                >
                    <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-primary">
                        <Stars01 className="size-8 text-fg-brand-primary" />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-primary">
                        How can I help you today?
                    </h2>
                    <p className="mt-2 text-sm text-tertiary">
                        Ask me about your finances, tax deadlines, or anything else.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                        {SUGGESTION_CHIPS.map((chip) => (
                            <button
                                key={chip}
                                className="rounded-full border border-secondary bg-primary px-3 py-1.5 text-xs font-medium text-secondary shadow-xs transition-colors hover:bg-secondary"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {messages.map((msg) => (
                <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cx(
                        "flex",
                        msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                >
                    <div
                        className={cx(
                            "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                            msg.role === "user"
                                ? "bg-brand-solid text-white"
                                : "border border-secondary bg-primary text-primary",
                        )}
                    >
                        {msg.content}
                    </div>
                </motion.div>
            ))}

            {isStreaming && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                >
                    <div className="max-w-[80%] rounded-2xl border border-secondary bg-primary px-4 py-3 text-sm text-primary">
                        {streamingText}
                        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-fg-brand-primary" />
                    </div>
                </motion.div>
            )}

            <div ref={endRef} />
        </div>
    );
}

// ─── Pulse View ──────────────────────────────────────────────────────────────

function PulseView() {
    const [selectedEntity, setSelectedEntity] = useState(0);
    const entity = ENTITIES[selectedEntity];

    return (
        <div className="space-y-4">
            {/* Entity Selector */}
            <Card>
                <div className="px-5 py-4">
                    <h3 className="text-sm font-semibold text-primary">Entity</h3>
                    <div className="mt-3 flex gap-2">
                        {ENTITIES.map((e, i) => (
                            <button
                                key={e.name}
                                onClick={() => setSelectedEntity(i)}
                                className={cx(
                                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                                    i === selectedEntity
                                        ? "bg-brand-solid text-white"
                                        : "bg-secondary text-secondary hover:bg-tertiary",
                                )}
                            >
                                {e.name}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Key Metrics */}
            <Card delay={0.1}>
                <div className="px-5 py-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-primary">
                            Financial Overview
                        </h3>
                        <BadgeWithDot color="success" size="sm">
                            Live
                        </BadgeWithDot>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-6">
                        {[
                            {
                                label: "Revenue",
                                value: entity.revenue,
                                data: SPARKLINE_DATA.revenue,
                                color: "var(--color-success-500)",
                            },
                            {
                                label: "Expenses",
                                value: entity.expenses,
                                data: SPARKLINE_DATA.expenses,
                                color: "var(--color-error-500)",
                            },
                            {
                                label: "Cash Flow",
                                value: entity.cashFlow,
                                data: SPARKLINE_DATA.cashFlow,
                                color: "var(--color-brand-500)",
                            },
                        ].map((m) => (
                            <div key={m.label}>
                                <p className="text-xs text-tertiary">{m.label}</p>
                                <p className="mt-1 text-xl font-semibold text-primary">
                                    {formatCurrency(m.value)}
                                </p>
                                <div className="mt-3">
                                    <MiniSparkline
                                        data={m.data}
                                        color={m.color}
                                        width={100}
                                        height={40}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Health Indicators */}
            <Card delay={0.2}>
                <div className="px-5 py-4">
                    <h3 className="text-sm font-semibold text-primary">Health Indicators</h3>
                    <div className="mt-4 space-y-3">
                        {[
                            { label: "Burn Rate", value: "14 months runway", status: "success" as const },
                            { label: "Debt-to-Equity", value: "0.4x", status: "success" as const },
                            { label: "AR Aging", value: "32 days avg", status: "warning" as const },
                        ].map((h) => (
                            <div key={h.label} className="flex items-center justify-between">
                                <span className="text-sm text-secondary">{h.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-primary">
                                        {h.value}
                                    </span>
                                    <div
                                        className={cx(
                                            "size-2 rounded-full",
                                            h.status === "success"
                                                ? "bg-success-500"
                                                : "bg-warning-500",
                                        )}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Integrations */}
            <Card delay={0.3}>
                <div className="px-5 py-4">
                    <h3 className="text-sm font-semibold text-primary">Integrations</h3>
                    <div className="mt-3 space-y-2">
                        {INTEGRATIONS.map((integ) => (
                            <div
                                key={integ.name}
                                className="flex items-center justify-between rounded-lg border border-secondary px-3 py-2"
                            >
                                <span className="text-sm font-medium text-primary">
                                    {integ.name}
                                </span>
                                <div className="flex items-center gap-2">
                                    {integ.lastSync && (
                                        <span className="text-xs text-quaternary">
                                            Synced {integ.lastSync}
                                        </span>
                                    )}
                                    <BadgeWithDot
                                        color={
                                            integ.status === "connected"
                                                ? "success"
                                                : integ.status === "syncing"
                                                  ? "warning"
                                                  : "gray"
                                        }
                                        size="sm"
                                    >
                                        {integ.status === "connected"
                                            ? "Connected"
                                            : integ.status === "syncing"
                                              ? "Syncing"
                                              : "Disconnected"}
                                    </BadgeWithDot>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}

// ─── Settings View ───────────────────────────────────────────────────────────

function SettingsView() {
    return (
        <Card>
            <div className="px-5 py-4">
                <h3 className="text-sm font-semibold text-primary">Settings</h3>
                <p className="mt-2 text-sm text-tertiary">
                    Settings and preferences will appear here.
                </p>
                <div className="mt-6 space-y-4">
                    {[
                        { label: "Notifications", description: "Configure alert preferences", icon: Bell01 },
                        { label: "AI Preferences", description: "Customize AI behavior and tone", icon: Stars01 },
                        { label: "Security", description: "Manage authentication and access", icon: Shield01 },
                        { label: "Billing", description: "View plans and payment methods", icon: CreditCard01 },
                    ].map((item) => (
                        <button
                            key={item.label}
                            className="flex w-full items-center gap-3 rounded-xl border border-secondary p-3 text-left transition-colors hover:bg-secondary"
                        >
                            <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                                <item.icon className="size-5 text-fg-quaternary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-primary">{item.label}</p>
                                <p className="text-xs text-tertiary">{item.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </Card>
    );
}

// ─── Simulated Streaming ─────────────────────────────────────────────────────

const SIMULATED_RESPONSES: Record<string, string> = {
    default:
        "Based on your current financial data, here's what I can tell you:\n\nYour revenue is trending upward at $1.24M (+12.3% MoM), while expenses remain controlled at $828K. Your cash position is strong with $453K in operating cash flow.\n\nThe most notable items requiring attention are:\n1. Tax filing deadline in 12 days\n2. 3 pending transactions totaling $2,847\n3. Marketing spend has increased 27%, worth reviewing if the ROI justifies the increase.\n\nWould you like me to dive deeper into any of these areas?",
};

function useSimulatedStream() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingText, setStreamingText] = useState("");
    const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    const sendMessage = useCallback((text: string) => {
        const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
        setMessages((prev) => [...prev, userMsg]);
        setIsStreaming(true);
        setStreamingText("");

        const response = SIMULATED_RESPONSES.default;
        let charIndex = 0;

        intervalRef.current = setInterval(() => {
            charIndex += 2;
            if (charIndex >= response.length) {
                clearInterval(intervalRef.current);
                intervalRef.current = undefined;
                setIsStreaming(false);
                setStreamingText("");
                setMessages((prev) => [
                    ...prev,
                    { id: `a-${Date.now()}`, role: "assistant", content: response },
                ]);
            } else {
                setStreamingText(response.slice(0, charIndex));
            }
        }, 15);
    }, []);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return { messages, isStreaming, streamingText, sendMessage };
}

// ─── View Titles ─────────────────────────────────────────────────────────────

const VIEW_TITLES: Record<View, string> = {
    feed: "Feed",
    chat: "Chat",
    pulse: "Pulse",
    settings: "Settings",
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function AINativeScreen() {
    const [activeView, setActiveView] = useState<View>("feed");
    const { messages, isStreaming, streamingText, sendMessage } = useSimulatedStream();

    const handleSend = useCallback(
        (text: string) => {
            sendMessage(text);
        },
        [sendMessage],
    );

    const handleFocusChat = useCallback(() => {
        if (activeView !== "chat") setActiveView("chat");
    }, [activeView]);

    return (
        <div className="flex h-screen overflow-hidden bg-primary">
            <Sidebar activeView={activeView} onViewChange={setActiveView} />

            <div className="relative flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between border-b border-secondary px-6 py-3">
                    <h1 className="text-sm font-semibold text-primary">
                        {VIEW_TITLES[activeView]}
                    </h1>
                    <div className="flex items-center gap-3">
                        <button className="flex size-9 items-center justify-center rounded-lg text-fg-quaternary transition-colors hover:bg-secondary hover:text-fg-secondary">
                            <SearchLg className="size-5" />
                        </button>
                        <div className="flex size-8 items-center justify-center rounded-full bg-brand-secondary">
                            <span className="text-xs font-semibold text-brand-tertiary">OR</span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto pb-28">
                    <div className="mx-auto max-w-2xl px-6 py-6">
                        <AnimatePresence mode="wait">
                            {activeView === "feed" && (
                                <motion.div
                                    key="feed"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <FeedView />
                                </motion.div>
                            )}
                            {activeView === "chat" && (
                                <motion.div
                                    key="chat"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <ChatView
                                        messages={messages}
                                        isStreaming={isStreaming}
                                        streamingText={streamingText}
                                    />
                                </motion.div>
                            )}
                            {activeView === "pulse" && (
                                <motion.div
                                    key="pulse"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <PulseView />
                                </motion.div>
                            )}
                            {activeView === "settings" && (
                                <motion.div
                                    key="settings"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <SettingsView />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Command Bar */}
                <CommandBar onSend={handleSend} onFocusChat={handleFocusChat} />
            </div>
        </div>
    );
}
