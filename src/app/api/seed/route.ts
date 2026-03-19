import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const {
        data: { user },
        error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = user.id;

    // Check if already seeded (has tasks)
    const { data: existingTasks } = await supabaseAdmin
        .from("tasks")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

    if (existingTasks && existingTasks.length > 0) {
        return NextResponse.json({ message: "Already seeded" });
    }

    // ─── Seed company ────────────────────────────────────────────────────────
    await supabaseAdmin.from("companies").insert({
        user_id: userId,
        legal_name: "Acme Technologies Inc.",
        ein: "82-1234567",
        entity_type: "S-Corp",
        state_of_formation: "Delaware",
        email: "finance@acmetech.com",
        phone: "(555) 012-3456",
        fiscal_year: "Calendar (Jan–Dec)",
        filing_status: "Active",
    });

    // ─── Seed conversations ──────────────────────────────────────────────────
    const conversations = [
        { id: "rd-payroll", title: "R&D Payroll Clarification", status: "waiting-you" },
        { id: "return-2024", title: "2024 Return Review", status: "waiting-numix" },
        { id: "mileage", title: "Mileage Deduction", status: "done" },
        { id: "q4-taxes", title: "Q4 Estimated Taxes", status: "done" },
        { id: "contractor-1099", title: "Contractor 1099 Filing", status: "waiting-you" },
    ];

    await supabaseAdmin.from("conversations").insert(
        conversations.map((c) => ({ ...c, user_id: userId })),
    );

    // ─── Seed tasks ──────────────────────────────────────────────────────────
    const tasks = [
        {
            task_number: "NUM-1042",
            title: "Upload December Bank Statement",
            description: "Please upload your December bank statement to verify end-of-year balances for your 2024 return.",
            status: "waiting-you",
            action: "upload",
            due_date: "Due Feb 28",
            source: "System Generated",
            channel: "Workspace",
            conversation_id: "return-2024",
        },
        {
            task_number: "NUM-1045",
            title: "Review Draft Tax Summary",
            description: "Your CPA has prepared a draft tax summary. Please review and flag any discrepancies before we file.",
            status: "waiting-you",
            action: "review",
            due_date: "Due Mar 10",
            source: "Requested by CPA",
            channel: "Slack",
            conversation_id: "return-2024",
        },
        {
            task_number: "NUM-1047",
            title: "Confirm Business Address",
            description: "We need to verify your current registered business address for the R&D credit filings.",
            status: "waiting-numix",
            action: "confirm",
            due_date: "Due Mar 5",
            source: "System Generated",
            channel: "Workspace",
            conversation_id: "rd-payroll",
        },
        {
            task_number: "NUM-1048",
            title: "R&D Credit Documentation",
            description: "Upload supporting documentation for the R&D payroll tax credit claim, including employee time logs.",
            status: "waiting-numix",
            action: "upload",
            source: "Requested by CPA",
            channel: "Slack",
            conversation_id: "rd-payroll",
        },
        {
            task_number: "NUM-1035",
            title: "Monthly Payroll Review - January",
            status: "done",
            action: "review",
            completed_date: "Completed Feb 10",
            source: "System Generated",
            channel: "Email",
        },
        {
            task_number: "NUM-1038",
            title: "Submit Contractor 1099 Forms",
            status: "done",
            action: "upload",
            completed_date: "Completed Feb 15",
            source: "Requested by CPA",
            channel: "SMS",
        },
    ];

    await supabaseAdmin.from("tasks").insert(
        tasks.map((t) => ({ ...t, user_id: userId })),
    );

    // ─── Seed checklist items ────────────────────────────────────────────────
    const checklistItems = [
        { category: "Personal Information", label: "Last year tax return", due_date: "Apr 2, 2024", description: "Please upload tax return from last year.", done: false },
        { category: "Personal Information", label: "Driver's License", due_date: "Apr 2, 2024", description: null, done: true },
        { category: "Dependent Information", label: "Children tax documents", due_date: "Apr 2, 2024", description: "Please upload any children tax documents.", done: false },
        { category: "Dependent Information", label: "Seniors tax documents", due_date: "Apr 2, 2024", description: "Please upload any seniors tax documents.", done: false },
    ];

    await supabaseAdmin.from("checklist_items").insert(
        checklistItems.map((item) => ({ ...item, user_id: userId })),
    );

    return NextResponse.json({ message: "Seeded successfully" });
}
