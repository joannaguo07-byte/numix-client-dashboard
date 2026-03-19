-- ============================================================================
-- Supabase Schema for Numix Dashboard
-- Run this in the Supabase SQL Editor to create all tables + RLS policies
-- ============================================================================

-- 1. Companies
create table if not exists public.companies (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    legal_name text not null,
    ein text,
    entity_type text,
    state_of_formation text,
    address_line1 text,
    address_line2 text,
    city text,
    state text,
    zip text,
    phone text,
    email text,
    fiscal_year text,
    filing_status text,
    created_at timestamptz default now()
);

alter table public.companies enable row level security;
create policy "Users see own company" on public.companies for select using (auth.uid() = user_id);
create policy "Users insert own company" on public.companies for insert with check (auth.uid() = user_id);
create policy "Users update own company" on public.companies for update using (auth.uid() = user_id);

-- 2. Tasks
create table if not exists public.tasks (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    task_number text,
    title text not null,
    description text,
    status text default 'waiting-you' check (status in ('waiting-you', 'waiting-numix', 'done')),
    action text check (action in ('upload', 'review', 'confirm')),
    due_date text,
    completed_date text,
    source text,
    channel text,
    conversation_id text,
    created_at timestamptz default now()
);

alter table public.tasks enable row level security;
create policy "Users see own tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "Users insert own tasks" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users update own tasks" on public.tasks for update using (auth.uid() = user_id);
create policy "Users delete own tasks" on public.tasks for delete using (auth.uid() = user_id);

-- 3. Conversations
create table if not exists public.conversations (
    id text primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    status text default 'waiting-you' check (status in ('waiting-you', 'waiting-numix', 'done')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.conversations enable row level security;
create policy "Users see own conversations" on public.conversations for select using (auth.uid() = user_id);
create policy "Users insert own conversations" on public.conversations for insert with check (auth.uid() = user_id);
create policy "Users update own conversations" on public.conversations for update using (auth.uid() = user_id);

-- 4. Messages
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    conversation_id text references public.conversations(id) on delete cascade not null,
    sender text not null check (sender in ('user', 'assistant')),
    content text not null,
    created_at timestamptz default now()
);

alter table public.messages enable row level security;
create policy "Users see own messages" on public.messages for select
    using (exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "Users insert own messages" on public.messages for insert
    with check (exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));

-- 5. Documents
create table if not exists public.documents (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    file_path text not null,
    file_size bigint default 0,
    category text default 'Uncategorized',
    status text default 'pending' check (status in ('pending', 'verified', 'error')),
    uploaded_at timestamptz default now()
);

alter table public.documents enable row level security;
create policy "Users see own documents" on public.documents for select using (auth.uid() = user_id);
create policy "Users insert own documents" on public.documents for insert with check (auth.uid() = user_id);
create policy "Users update own documents" on public.documents for update using (auth.uid() = user_id);
create policy "Users delete own documents" on public.documents for delete using (auth.uid() = user_id);

-- 6. Checklist Items
create table if not exists public.checklist_items (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    category text not null,
    label text not null,
    description text,
    done boolean default false,
    due_date text,
    document_id uuid references public.documents(id) on delete set null,
    created_at timestamptz default now()
);

alter table public.checklist_items enable row level security;
create policy "Users see own checklist" on public.checklist_items for select using (auth.uid() = user_id);
create policy "Users insert own checklist" on public.checklist_items for insert with check (auth.uid() = user_id);
create policy "Users update own checklist" on public.checklist_items for update using (auth.uid() = user_id);

-- 7. Tax Filings
create table if not exists public.tax_filings (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    tax_year int not null,
    current_step int default 1,
    form_data jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.tax_filings enable row level security;
create policy "Users see own filings" on public.tax_filings for select using (auth.uid() = user_id);
create policy "Users insert own filings" on public.tax_filings for insert with check (auth.uid() = user_id);
create policy "Users update own filings" on public.tax_filings for update using (auth.uid() = user_id);

-- 8. Integrations
create table if not exists public.integrations (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    provider text not null,
    status text default 'disconnected' check (status in ('connected', 'disconnected', 'pending')),
    connected_at timestamptz,
    created_at timestamptz default now()
);

alter table public.integrations enable row level security;
create policy "Users see own integrations" on public.integrations for select using (auth.uid() = user_id);
create policy "Users insert own integrations" on public.integrations for insert with check (auth.uid() = user_id);
create policy "Users update own integrations" on public.integrations for update using (auth.uid() = user_id);

-- ============================================================================
-- Storage: Create a 'documents' bucket (do this via Supabase Dashboard > Storage)
-- Settings: Private bucket, 50MB file size limit
-- ============================================================================

-- Storage policies (run after creating bucket)
create policy "Users upload own files" on storage.objects for insert
    with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users read own files" on storage.objects for select
    using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own files" on storage.objects for delete
    using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
