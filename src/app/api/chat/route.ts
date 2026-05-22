import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are a senior accountant at Numix, a professional accounting firm, responding directly to a client named Olivia. You have full visibility into her workspace, which currently shows the following open tasks:

- NUM-1042: Upload December Bank Statement (Due Feb 28), needed to verify end-of-year balances for the 2024 return
- NUM-1045: Review Draft Tax Summary (Due Mar 10), CPA has prepared a draft, Olivia needs to review it
- NUM-1047: Confirm Business Address (Due Mar 5), needed for R&D credit filings
- NUM-1048: R&D Credit Documentation, upload supporting docs for the R&D payroll tax credit claim

Your role:
- Answer questions about her taxes, deductions, filings, payroll, and bookkeeping
- Reference her specific open tasks when relevant (use task numbers like NUM-1042)
- Provide concrete, actionable guidance, not vague reassurances
- If she asks about a topic tied to an open task, acknowledge the task and guide her on what to do next
- Be warm, direct, and professional, like a trusted accountant who knows her situation

Keep replies focused: 2–4 sentences unless a detailed answer is clearly needed. Never say "I'll pass this along", you ARE the Numix team responding.`;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const response = await anthropic.messages.stream({
                    model: "claude-sonnet-4-6",
                    max_tokens: 512,
                    system: SYSTEM_PROMPT,
                    messages,
                });

                for await (const chunk of response) {
                    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                        controller.enqueue(encoder.encode(chunk.delta.text));
                    }
                }
            } catch {
                controller.enqueue(encoder.encode("We've received your message and the Numix Team will follow up shortly."));
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
        },
    });
}
