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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "Uncategorized";

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload to Supabase Storage
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: storageError } = await supabaseAdmin.storage
        .from("documents")
        .upload(filePath, file, { contentType: file.type });

    if (storageError) {
        return NextResponse.json({ error: storageError.message }, { status: 500 });
    }

    // Create documents row
    const { data: document, error: dbError } = await supabaseAdmin
        .from("documents")
        .insert({
            user_id: user.id,
            name: file.name,
            file_path: filePath,
            file_size: file.size,
            category,
            status: "pending",
        })
        .select()
        .single();

    if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ document });
}
