"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/utils/supabase";
import { useAuth } from "@/providers/auth-provider";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DbTask {
    id: string;
    user_id: string;
    task_number: string;
    title: string;
    description: string | null;
    status: "waiting-you" | "waiting-numix" | "done";
    action: "upload" | "review" | "confirm";
    due_date: string | null;
    completed_date: string | null;
    source: string;
    channel: string;
    conversation_id: string | null;
    created_at: string;
}

export interface DbConversation {
    id: string;
    user_id: string;
    title: string;
    status: "waiting-you" | "waiting-numix" | "done";
    created_at: string;
    updated_at: string;
}

export interface DbMessage {
    id: string;
    conversation_id: string;
    sender: "user" | "assistant";
    content: string;
    created_at: string;
}

export interface DbDocument {
    id: string;
    user_id: string;
    name: string;
    file_path: string;
    file_size: number;
    category: string;
    status: "pending" | "verified" | "error";
    uploaded_at: string;
}

export interface DbChecklistItem {
    id: string;
    user_id: string;
    category: string;
    label: string;
    description: string | null;
    done: boolean;
    due_date: string | null;
    document_id: string | null;
    created_at: string;
}

export interface DbCompany {
    id: string;
    user_id: string;
    legal_name: string;
    ein: string | null;
    entity_type: string | null;
    state_of_formation: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    phone: string | null;
    email: string | null;
    fiscal_year: string | null;
    filing_status: string | null;
}

export interface DbIntegration {
    id: string;
    user_id: string;
    provider: string;
    status: "connected" | "disconnected" | "pending";
    connected_at: string | null;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useTasks() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<DbTask[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = useCallback(async () => {
        if (!user) return;
        const { data } = await getSupabase()
            .from("tasks")
            .select("*")
            .order("created_at", { ascending: true });
        if (data) setTasks(data);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    async function updateTask(id: string, updates: Partial<DbTask>) {
        const { error } = await getSupabase().from("tasks").update(updates).eq("id", id);
        if (!error) {
            setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
        }
        return { error };
    }

    return { tasks, loading, fetchTasks, updateTask, setTasks };
}

export function useConversations() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<DbConversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        getSupabase()
            .from("conversations")
            .select("*")
            .order("updated_at", { ascending: false })
            .then(({ data }) => {
                if (data) setConversations(data);
                setLoading(false);
            });
    }, [user]);

    return { conversations, loading };
}

export function useMessages(conversationId: string | null) {
    const [messages, setMessages] = useState<DbMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            setLoading(false);
            return;
        }
        getSupabase()
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true })
            .then(({ data }) => {
                if (data) setMessages(data);
                setLoading(false);
            });
    }, [conversationId]);

    return { messages, loading };
}

export function useDocuments() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<DbDocument[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDocuments = useCallback(async () => {
        if (!user) return;
        const { data } = await getSupabase()
            .from("documents")
            .select("*")
            .order("uploaded_at", { ascending: false });
        if (data) setDocuments(data);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    async function uploadDocument(file: File, category: string) {
        if (!user) return { error: new Error("Not authenticated") };

        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const result = await res.json();

        if (!res.ok) return { error: new Error(result.error) };

        await fetchDocuments();
        return { data: result.document, error: null };
    }

    return { documents, loading, fetchDocuments, uploadDocument };
}

export function useChecklist() {
    const { user } = useAuth();
    const [items, setItems] = useState<DbChecklistItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchItems = useCallback(async () => {
        if (!user) return;
        const { data } = await getSupabase()
            .from("checklist_items")
            .select("*")
            .order("created_at", { ascending: true });
        if (data) setItems(data);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    async function toggleItem(id: string, done: boolean) {
        const { error } = await getSupabase()
            .from("checklist_items")
            .update({ done })
            .eq("id", id);
        if (!error) {
            setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done } : item)));
        }
        return { error };
    }

    async function linkDocument(checklistItemId: string, documentId: string) {
        const { error } = await getSupabase()
            .from("checklist_items")
            .update({ document_id: documentId, done: true })
            .eq("id", checklistItemId);
        if (!error) {
            setItems((prev) =>
                prev.map((item) =>
                    item.id === checklistItemId ? { ...item, document_id: documentId, done: true } : item,
                ),
            );
        }
        return { error };
    }

    return { items, loading, fetchItems, toggleItem, linkDocument };
}

export function useCompany() {
    const { user } = useAuth();
    const [company, setCompany] = useState<DbCompany | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        getSupabase()
            .from("companies")
            .select("*")
            .single()
            .then(({ data }) => {
                if (data) setCompany(data);
                setLoading(false);
            });
    }, [user]);

    async function updateCompany(updates: Partial<DbCompany>) {
        if (!company) return { error: new Error("No company found") };
        const { error } = await getSupabase().from("companies").update(updates).eq("id", company.id);
        if (!error) setCompany({ ...company, ...updates });
        return { error };
    }

    return { company, loading, updateCompany };
}
