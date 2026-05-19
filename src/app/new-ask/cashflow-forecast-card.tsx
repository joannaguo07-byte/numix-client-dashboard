import { ArrowDownRight, ArrowUpRight, TrendUp01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

const INFLOWS = [
    { label: "Stripe — recurring subscriptions", date: "May 1 – May 30", amount: 48200 },
    { label: "Outstanding invoices (Acme, Loom, Figma)", date: "Expected May 8 – May 22", amount: 27450 },
    { label: "Annual contract renewal — Northwind", date: "May 14", amount: 18000 },
];

const OUTFLOWS = [
    { label: "Payroll (2 cycles)", date: "May 15 & May 30", amount: 41200 },
    { label: "Contractors & vendor invoices", date: "Throughout May", amount: 12800 },
    { label: "Software & SaaS", date: "May 3 – May 28", amount: 4350 },
    { label: "Rent & utilities", date: "May 1", amount: 6200 },
    { label: "Estimated quarterly taxes", date: "May 17", amount: 9500 },
];

const STARTING_CASH = 142300;
export const CASHFLOW_TOTAL_INFLOWS = INFLOWS.reduce((s, x) => s + x.amount, 0);
export const CASHFLOW_TOTAL_OUTFLOWS = OUTFLOWS.reduce((s, x) => s + x.amount, 0);
const NET = CASHFLOW_TOTAL_INFLOWS - CASHFLOW_TOTAL_OUTFLOWS;
const ENDING_CASH = STARTING_CASH + NET;
export const CASHFLOW_TIGHTEST_DAY_BALANCE = 118400;
export const CASHFLOW_AT_RISK_AR = 27450;
export const CASHFLOW_TAX_RESERVE_SUGGESTION = 15000;

export const fmtUsd = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function CashflowForecastCard() {
    return (
        <div className="mt-3 overflow-hidden rounded-xl border border-secondary bg-primary">
            <div className="grid grid-cols-3 gap-px bg-border-secondary">
                <div className="bg-primary p-4">
                    <p className="text-xs font-medium text-tertiary">Starting cash</p>
                    <p className="mt-1 text-lg font-semibold text-primary">{fmtUsd(STARTING_CASH)}</p>
                    <p className="mt-0.5 text-xs text-quaternary">As of May 1</p>
                </div>
                <div className="bg-primary p-4">
                    <p className="text-xs font-medium text-tertiary">Net change</p>
                    <p
                        className={cx(
                            "mt-1 text-lg font-semibold",
                            NET >= 0 ? "text-success-primary" : "text-error-primary",
                        )}
                    >
                        {NET >= 0 ? "+" : ""}
                        {fmtUsd(NET)}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-quaternary">
                        <TrendUp01 className="size-3" aria-hidden />
                        Over 30 days
                    </p>
                </div>
                <div className="bg-primary p-4">
                    <p className="text-xs font-medium text-tertiary">Projected ending cash</p>
                    <p className="mt-1 text-lg font-semibold text-primary">{fmtUsd(ENDING_CASH)}</p>
                    <p className="mt-0.5 text-xs text-quaternary">May 30</p>
                </div>
            </div>

            <div className="border-t border-secondary p-4">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-success-secondary">
                            <ArrowDownRight className="size-3.5 text-fg-success-primary" aria-hidden />
                        </span>
                        <p className="text-sm font-semibold text-primary">Expected inflows</p>
                    </div>
                    <p className="text-sm font-semibold text-success-primary">+{fmtUsd(CASHFLOW_TOTAL_INFLOWS)}</p>
                </div>
                <div className="space-y-2">
                    {INFLOWS.map((row) => (
                        <div key={row.label} className="flex items-start justify-between gap-3 text-sm">
                            <div className="min-w-0">
                                <p className="truncate text-primary">{row.label}</p>
                                <p className="text-xs text-tertiary">{row.date}</p>
                            </div>
                            <p className="shrink-0 tabular-nums text-secondary">+{fmtUsd(row.amount)}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-secondary p-4">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-error-secondary">
                            <ArrowUpRight className="size-3.5 text-fg-error-primary" aria-hidden />
                        </span>
                        <p className="text-sm font-semibold text-primary">Expected outflows</p>
                    </div>
                    <p className="text-sm font-semibold text-error-primary">−{fmtUsd(CASHFLOW_TOTAL_OUTFLOWS)}</p>
                </div>
                <div className="space-y-2">
                    {OUTFLOWS.map((row) => (
                        <div key={row.label} className="flex items-start justify-between gap-3 text-sm">
                            <div className="min-w-0">
                                <p className="truncate text-primary">{row.label}</p>
                                <p className="text-xs text-tertiary">{row.date}</p>
                            </div>
                            <p className="shrink-0 tabular-nums text-secondary">−{fmtUsd(row.amount)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
