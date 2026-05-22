"use client";

import {
    Check,
    CheckCircle,
    Clock,
    Eye,
    Hash01,
    Link01,
    Mail01,
    MessageSquare01,
    Phone01,
    Plus,
    Rows01,
    SearchLg,
    Settings01,
    Upload01,
    User01,
    X,
} from "@untitledui/icons";

function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
}
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "waiting-you" | "waiting-numix" | "done";

export interface ConversationTask {
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TaskStatus }) {
    if (status === "waiting-you") {
        return (
            <BadgeWithDot color="brand" type="pill-color" size="sm">
                Waiting on You
            </BadgeWithDot>
        );
    }
    if (status === "waiting-numix") {
        return (
            <BadgeWithDot color="blue-light" type="pill-color" size="sm">
                Waiting on Numix
            </BadgeWithDot>
        );
    }
    return (
        <Badge color="gray" type="pill-color" size="sm">
            Done
        </Badge>
    );
}

function ChannelIcon({ channel }: { channel: string }) {
    if (channel === "Email") return <Mail01 className="size-3.5 text-fg-quaternary" />;
    if (channel === "SMS") return <Phone01 className="size-3.5 text-fg-quaternary" />;
    return <MessageSquare01 className="size-3.5 text-fg-quaternary" />;
}

function TaskActionButton({ task }: { task: ConversationTask }) {
    if (task.action === "upload") {
        return (
            <Button color="secondary" size="sm" iconLeading={Upload01}>
                Upload
            </Button>
        );
    }
    if (task.action === "review") {
        return (
            <Button color="secondary" size="sm" iconLeading={Eye}>
                Review
            </Button>
        );
    }
    return (
        <Button color="secondary" size="sm" iconLeading={Check}>
            Confirm
        </Button>
    );
}

function BoardIcon({ active }: { active: boolean }) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={cx("size-4", active ? "text-fg-secondary" : "text-fg-quaternary")}
        >
            <rect x="1" y="1" width="5" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} fillOpacity="0.15" />
            <rect x="8" y="1" width="5" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} fillOpacity="0.15" />
        </svg>
    );
}

function ListTaskCard({ task }: { task: ConversationTask }) {
    const isDone = task.status === "done";
    return (
        <div className={cx("rounded-xl border border-secondary bg-primary p-5", isDone && "opacity-60")}>
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <p className={cx("text-sm font-semibold leading-snug text-primary", isDone && "text-tertiary line-through")}>
                        {task.title}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                        <Hash01 className="size-3 text-fg-quaternary" />
                        <span className={cx("text-xs text-tertiary", isDone && "line-through")}>{task.taskNumber}</span>
                        <Link01 className="ml-0.5 size-3 text-fg-quaternary" />
                    </div>
                    {task.description && (
                        <p className="mt-2 text-sm leading-relaxed text-tertiary">{task.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusBadge status={task.status} />
                        <div className="flex items-center gap-1">
                            {task.source === "System Generated" ? (
                                <Settings01 className="size-3.5 text-fg-quaternary" />
                            ) : (
                                <User01 className="size-3.5 text-fg-quaternary" />
                            )}
                            <span className="text-xs text-tertiary">{task.source}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <ChannelIcon channel={task.channel} />
                            <span className="text-xs text-tertiary">{task.channel}</span>
                        </div>
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
                    </div>
                </div>
                {!isDone && (
                    <div className="shrink-0">
                        <TaskActionButton task={task} />
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-success-secondary">
                <CheckCircle className="size-6 text-fg-success-primary" />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-primary">All caught up</h3>
                <p className="mt-1 text-sm text-tertiary">Nothing needs your attention right now.</p>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ConversationDetailPanel({
    conversationTitle,
    tasks,
    onBack,
}: {
    conversationTitle: string;
    tasks: ConversationTask[];
    onBack: () => void;
}) {
    const activeCount = tasks.filter((t) => t.status !== "done").length;

    return (
        <div className="flex min-w-0 flex-1 flex-col bg-secondary">
            {/* Top bar, same as home */}
            <header className="flex h-16 shrink-0 items-center justify-end gap-4 border-b border-secondary bg-white px-6">
                <div className="flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-placeholder transition duration-100 ease-linear hover:border-primary focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
                    <SearchLg className="size-4 text-fg-quaternary" aria-hidden />
                    <span>Search...</span>
                </div>
                <button
                    type="button"
                    className="relative size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-secondary transition duration-100 ease-linear hover:ring-brand"
                >
                    <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"
                        alt="Olivia Rhye"
                        className="size-full object-cover"
                    />
                </button>
            </header>

            {/* Scrollable content */}
            <main className="flex-1 overflow-auto px-10 py-8">
                {/* Greeting */}
                <div className="mb-8">
                    <h1 className="text-display-sm font-semibold text-primary">{getGreeting()}, Olivia</h1>
                    <p className="mt-1 text-md text-tertiary">Here&apos;s what needs your attention.</p>
                </div>

                {/* Filter banner */}
                <div className="mb-5 flex items-center justify-between rounded-xl border border-secondary bg-primary px-4 py-3">
                    <p className="text-sm text-tertiary">
                        Filtered:{" "}
                        <span className="font-semibold text-brand-secondary">{conversationTitle}</span>
                    </p>
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex size-7 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-secondary"
                        aria-label="Clear filter"
                    >
                        <X className="size-4" aria-hidden />
                    </button>
                </div>

                {/* Section header */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-primary">What Needs Your Attention</h2>
                        {activeCount > 0 && (
                            <Badge color="brand" type="pill-color" size="sm">
                                {activeCount} active
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button color="secondary" size="sm" iconLeading={Plus}>
                            Create New Task
                        </Button>
                        <div className="flex items-center gap-1 rounded-lg border border-secondary bg-primary p-1">
                            <button
                                type="button"
                                className="flex items-center gap-1.5 rounded-md bg-brand-solid px-2.5 py-1.5 text-sm font-semibold text-white"
                            >
                                <Rows01 className="size-4" aria-hidden />
                                List
                            </button>
                            <button
                                type="button"
                                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold text-quaternary transition duration-100 ease-linear hover:text-tertiary"
                            >
                                <BoardIcon active={false} />
                                Board
                            </button>
                        </div>
                    </div>
                </div>

                {tasks.length > 0 ? (
                    <>
                        {/* Info banner */}
                        <div className="mb-4 flex items-center gap-2 rounded-xl border border-secondary bg-primary px-4 py-3">
                            <MessageSquare01 className="size-4 shrink-0 text-fg-tertiary" aria-hidden />
                            <p className="text-sm text-tertiary">
                                Showing items related to this conversation{" "}
                                <span className="text-secondary">({tasks.length} {tasks.length === 1 ? "item" : "items"})</span>
                            </p>
                        </div>

                        {/* Task list */}
                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <ListTaskCard key={task.id} task={task} />
                            ))}
                        </div>
                    </>
                ) : (
                    <EmptyState />
                )}
            </main>
        </div>
    );
}
