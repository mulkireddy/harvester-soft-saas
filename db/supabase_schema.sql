-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Farmers Table
create table public.farmers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  mobile text,
  place text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Jobs / Records Table
create table public.jobs (
  id uuid default uuid_generate_v4() primary key,
  farmer_id uuid references public.farmers(id) on delete cascade not null,
  crop text,
  
  -- Billing Details
  billing_mode text check (billing_mode in ('acre', 'hour')),
  quantity numeric not null, -- Stores Acres or Hours
  rate numeric not null,
  total_amount numeric not null,
  
  -- Payment Tracking
  paid_amount numeric default 0,
  payment_method text,
  status text check (status in ('Padding', 'Partial', 'Paid')),
  
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS) - Optional for now but good practice
alter table public.farmers enable row level security;
alter table public.jobs enable row level security;

-- Create policies to allow public access (for development simplicity)
-- WARNING: In production, you'd want authenticated policies
create policy "Enable read access for all users" on public.farmers for select using (true);
create policy "Enable insert access for all users" on public.farmers for insert with check (true);
create policy "Enable read access for all users" on public.jobs for select using (true);
create policy "Enable insert access for all users" on public.jobs for insert with check (true);
