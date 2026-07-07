-- Create categories table
create table public.categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
    name text not null,
    created_at timestamptz not null default now()
);

-- Create products table
create table public.products (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
    category_id uuid references public.categories(id) on delete set null,
    name text not null,
    cost_usd numeric not null check (cost_usd >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create sales table
create table public.sales (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
    product_id uuid references public.products(id) on delete set null,
    quantity integer not null check (quantity > 0),
    payment_type text not null check (payment_type in ('cash_usd', 'bcv_bs')),
    rate_usdt_at_sale numeric not null check (rate_usdt_at_sale >= 0),
    rate_bcv_at_sale numeric not null check (rate_bcv_at_sale >= 0),
    margin_at_sale numeric not null check (margin_at_sale >= 0),
    product_name_snapshot text not null,
    product_cost_snapshot numeric not null check (product_cost_snapshot >= 0),
    sale_date timestamptz not null default now(),
    created_at timestamptz not null default now()
);

-- Create rates_history table
create table public.rates_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
    rate_date timestamptz not null default now(),
    rate_usdt numeric not null check (rate_usdt >= 0),
    rate_bcv numeric not null check (rate_bcv >= 0),
    profit_margin numeric not null check (profit_margin >= 0),
    created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.rates_history enable row level security;

-- Create Policies
create policy "Users can manage their own categories" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their own products" on public.products for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their own sales" on public.sales for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their own rates history" on public.rates_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Create updated_at trigger for products
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_products_updated_at
  before update on public.products
  for each row
  execute function public.handle_updated_at();
