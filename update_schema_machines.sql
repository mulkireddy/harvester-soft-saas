
-- Create Machines Table
create table if not exists public.machines (
    id uuid default gen_random_uuid() primary key,
    name text not NULL, -- e.g. "Green Kubota", "Red Mahindra"
    registration_number text, 
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for machines
alter table public.machines enable row level security;
create policy "Enable access for all users" on public.machines for all using (true);

-- Link Jobs to Machines
alter table public.jobs 
add column if not exists machine_id uuid references public.machines(id);

-- Link Expenses to Machines (Optional but recommended)
alter table public.expenses 
add column if not exists machine_id uuid references public.machines(id);

-- Insert Default/Sample Machines if none exist
insert into public.machines (name, registration_number)
select 'Machine 1', 'MH-DEFAULT-01'
where not exists (select 1 from public.machines);

insert into public.machines (name, registration_number)
select 'Machine 2', 'MH-DEFAULT-02'
where not exists (select 1 from public.machines);
