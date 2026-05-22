"use client";

import { useEffect, useRef, useState } from "react";
import { Attachment01, ArrowUp, ChevronLeft, Stars01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import {
    CASHFLOW_AT_RISK_AR,
    CASHFLOW_TAX_RESERVE_SUGGESTION,
    CASHFLOW_TIGHTEST_DAY_BALANCE,
    CashflowForecastCard,
    fmtUsd,
} from "./cashflow-forecast-card";

// ─── Types ────────────────────────────────────────────────────────────────────

type Sender = "user" | "system" | "agent";
type MessageKind = "text" | "cashflow-forecast";

interface Message {
    id: string;
    sender: Sender;
    text: string;
    time: string;
    streaming?: boolean;
    kind?: MessageKind;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTime() {
    return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const SUGGESTIONS = [
    "Show me my cashflow forecast for the next 30 days",
    "I need help with my tax return",
    "Can you review my expenses?",
    "Question about a deduction",
];

const SYSTEM_ACK = "Numix Team will be notified. Someone will follow up shortly.";

const CASHFLOW_TRIGGER = "show me my cashflow forecast for the next 30 days";

const CASHFLOW_INTRO =
    "Here's your projected cashflow for May 1 – May 30, based on confirmed recurring revenue, open invoices, scheduled payroll, and your typical monthly spend.";

// ─── Sub-components ───────────────────────────────────────────────────────────

function UserBubble({ message }: { message: Message }) {
    return (
        <div className="flex justify-end">
            <div className="max-w-sm">
                <div className="rounded-2xl rounded-tr-sm bg-brand-solid px-4 py-3 text-sm text-white">{message.text}</div>
                <p className="mt-1 text-right text-xs text-tertiary">{message.time}</p>
            </div>
        </div>
    );
}

function SystemBubble({ message }: { message: Message }) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary">N</div>
            <div className="max-w-sm rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
                <p className="mb-0.5 text-xs font-semibold text-tertiary">Numix</p>
                <p className="text-sm text-primary">{message.text}</p>
                <p className="mt-1 text-xs text-tertiary">{message.time}</p>
            </div>
        </div>
    );
}

function AgentBubble({ message }: { message: Message }) {
    const isCashflow = message.kind === "cashflow-forecast" && !message.streaming;
    return (
        <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-solid text-xs font-semibold text-white">NT</div>
            <div className={cx("rounded-2xl rounded-tl-sm border border-secondary bg-primary px-4 py-3 shadow-xs", isCashflow ? "max-w-2xl flex-1" : "max-w-md")}>
                <p className="mb-0.5 text-xs font-semibold text-tertiary">Numix Team</p>
                <p className="text-sm leading-relaxed text-primary">
                    {message.text}
                    {message.streaming && <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-brand-solid align-middle" />}
                </p>
                {isCashflow && (
                    <>
                        <CashflowForecastCard />
                        <p className="mt-4 text-sm leading-relaxed text-primary">A few things worth flagging:</p>
                        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-primary">
                            <li>
                                <span className="font-medium">May 15 will be your tightest day</span>, payroll lands the same week as the quarterly tax payment. You&apos;ll dip to roughly{" "}
                                <span className="font-medium">{fmtUsd(CASHFLOW_TIGHTEST_DAY_BALANCE)}</span> before the Northwind renewal hits on May 14.
                            </li>
                            <li>
                                About <span className="font-medium">{fmtUsd(CASHFLOW_AT_RISK_AR)}</span> of expected inflow depends on outstanding invoices clearing on time. The Acme invoice is 12 days from due, worth a polite nudge this week.
                            </li>
                            <li>
                                You&apos;re still tracking ahead of last month by ~18% on net cash. Want me to set aside an additional{" "}
                                <span className="font-medium">{fmtUsd(CASHFLOW_TAX_RESERVE_SUGGESTION)}</span> into the tax reserve account?
                            </li>
                        </ul>
                    </>
                )}
                {!message.streaming && <p className="mt-2 text-xs text-tertiary">{message.time}</p>}
            </div>
        </div>
    );
}

function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void; }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
                <Stars01 className="size-6 text-fg-tertiary" />
            </div>
            <div className="max-w-sm">
                <h2 className="text-xl font-semibold text-primary">Ask your accountant anything</h2>
                <p className="mt-2 text-sm leading-relaxed text-tertiary">
                    Send a message and the Numix Team will get back to you. Use this for questions, clarifications, and back-and-forth discussions.
                </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => onSuggestion(s)}
                        className="rounded-full border border-secondary bg-primary px-4 py-2 text-sm text-secondary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary"
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Shared chat logic hook ───────────────────────────────────────────────────

function useChat(seedMessages?: Message[]) {
    const [messages, setMessages] = useState<Message[]>(seedMessages ?? []);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Keep the chat in sync with externally-seeded messages (R&D label
    // activity from Bookkeeping). New seeds are prepended above any user
    // turns the chat may already have.
    const seedSig = (seedMessages ?? []).map((m) => m.id).join("|");
    useEffect(() => {
        if (!seedMessages || seedMessages.length === 0) return;
        setMessages((prev) => {
            const userTurns = prev.filter((m) => !m.id.startsWith("seed-"));
            return [...seedMessages, ...userTurns];
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seedSig]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage(text: string) {
        if (!text.trim() || isLoading) return;

        const time = getTime();
        const userMessage: Message = { id: crypto.randomUUID(), sender: "user", text: text.trim(), time };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        await new Promise((r) => setTimeout(r, 400));
        const sysMessage: Message = { id: crypto.randomUUID(), sender: "system", text: SYSTEM_ACK, time };
        setMessages((prev) => [...prev, sysMessage]);

        const agentId = crypto.randomUUID();
        setMessages((prev) => [...prev, { id: agentId, sender: "agent", text: "", time, streaming: true }]);

        // Intercept the cashflow demo question with a hardcoded rich response
        if (text.trim().toLowerCase() === CASHFLOW_TRIGGER) {
            await new Promise((r) => setTimeout(r, 700));
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === agentId
                        ? { ...m, kind: "cashflow-forecast", text: CASHFLOW_INTRO, streaming: false, time: getTime() }
                        : m,
                ),
            );
            setIsLoading(false);
            return;
        }

        try {
            // Build proper multi-turn conversation history (user + assistant turns)
            const history = [...messages, userMessage]
                .filter((m) => (m.sender === "user" || m.sender === "agent") && !m.streaming && m.text.trim())
                .map((m) => ({
                    role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
                    content: m.text,
                }));

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: history }),
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                accumulated += decoder.decode(value, { stream: true });
                setMessages((prev) => prev.map((m) => (m.id === agentId ? { ...m, text: accumulated } : m)));
            }

            setMessages((prev) => prev.map((m) => (m.id === agentId ? { ...m, streaming: false, time: getTime() } : m)));
        } catch {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === agentId
                        ? { ...m, text: "We've received your message. The Numix Team will follow up shortly.", streaming: false }
                        : m,
                ),
            );
        } finally {
            setIsLoading(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    }

    return { messages, input, setInput, isLoading, bottomRef, inputRef, sendMessage, handleKeyDown };
}

// ─── Panel (used inside the main layout) ─────────────────────────────────────

export interface RdLabelActivityEntry {
    id: string;
    txnId: string;
    description: string;
    time: string;
}

export function NewAskPanel({
    onBack,
    backLabel = "Home",
    initialPrompt,
    rdLabelActivity,
}: {
    onBack?: () => void;
    backLabel?: string;
    initialPrompt?: string;
    rdLabelActivity?: RdLabelActivityEntry[];
}) {
    // Surface R&D label events from Bookkeeping as system context at the
    // top of the chat. This lets the Numix CPA team see what the user
    // recently flagged without the user having to repeat it.
    const seedMessages: Message[] = (rdLabelActivity ?? []).map((a) => ({
        id: `seed-${a.id}`,
        sender: "system" as Sender,
        text: `R&D §41 label added to "${a.description}". Item now appears in your R&D Incentive table.`,
        time: a.time,
    }));
    const { messages, input, setInput, isLoading, bottomRef, inputRef, sendMessage, handleKeyDown } = useChat(seedMessages);
    const initialPromptSent = useRef(false);

    useEffect(() => {
        if (initialPrompt && !initialPromptSent.current && !isLoading) {
            initialPromptSent.current = true;
            sendMessage(initialPrompt);
        }
    }, [initialPrompt]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleSuggestion(text: string) {
        setInput(text);
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.style.height = "auto";
                inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
            }
        }, 0);
    }

    return (
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-primary">
            {/* Header */}
            <header className="flex shrink-0 items-center justify-between border-b border-secondary bg-primary px-6 py-4">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <>
                            <button
                                type="button"
                                onClick={onBack}
                                className="flex items-center gap-1.5 text-sm text-tertiary transition duration-100 ease-linear hover:text-secondary"
                            >
                                <ChevronLeft className="size-4" aria-hidden />
                                {backLabel}
                            </button>
                            <div className="h-5 w-px bg-border-secondary" />
                        </>
                    )}
                    <div>
                        <p className="text-sm font-semibold text-primary">New Accountant Ask</p>
                        <p className="text-xs text-tertiary">Numix Team will be notified</p>
                    </div>
                </div>
                <div className="flex size-9 items-center justify-center rounded-full bg-brand-solid text-xs font-semibold text-white">NT</div>
            </header>

            {/* Messages */}
            <div className="flex flex-1 flex-col overflow-y-auto">
                {messages.length === 0 ? (
                    <EmptyState onSuggestion={handleSuggestion} />
                ) : (
                    <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-6 py-8">
                        {messages.map((msg) => {
                            if (msg.sender === "user") return <UserBubble key={msg.id} message={msg} />;
                            if (msg.sender === "system") return <SystemBubble key={msg.id} message={msg} />;
                            return <AgentBubble key={msg.id} message={msg} />;
                        })}
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-secondary bg-primary px-6 py-4">
                <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-xl border border-secondary bg-primary px-4 py-3 shadow-xs transition duration-100 ease-linear focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
                    <button
                        type="button"
                        className="shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-tertiary"
                        aria-label="Attach file"
                    >
                        <Attachment01 className="size-5" />
                    </button>
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="max-h-40 flex-1 resize-none bg-transparent text-sm text-primary placeholder:text-placeholder focus:outline-none disabled:opacity-60"
                        style={{ height: "24px" }}
                    />
                    <button
                        type="button"
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || isLoading}
                        className={cx(
                            "flex size-8 shrink-0 items-center justify-center rounded-full transition duration-100 ease-linear",
                            input.trim() && !isLoading ? "bg-brand-solid text-white hover:opacity-90" : "bg-secondary text-fg-quaternary",
                        )}
                        aria-label="Send message"
                    >
                        <ArrowUp className="size-4" />
                    </button>
                </div>
                <p className="mt-2 text-center text-xs text-quaternary">
                    Your message will be sent to the Numix Team. Typically responds within 1 business day.
                </p>
            </div>
        </div>
    );
}

// ─── Full-page wrapper (for direct /new-ask route) ────────────────────────────

export function NewAskScreen() {
    return (
        <div className="flex h-dvh flex-col">
            <NewAskPanel />
        </div>
    );
}
