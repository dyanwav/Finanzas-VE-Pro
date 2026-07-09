-- Create customers table
create table public.customers (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
    name text not null,
    email text,
    phone text,
    document_id text,
    created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.customers enable row level security;

-- Create policy
create policy "Users can manage their own customers" on public.customers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Add customer_id to sales
alter table public.sales add column customer_id uuid references public.customers(id) on delete set null;

-- Add sku to products
alter table public.products add column sku text;
