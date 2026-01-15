-- Expenses Table
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  category text not null check (category in ('Fuel', 'Spares & Repairs', 'Driver Salary', 'Food', 'Other')),
  amount numeric not null,
  description text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  payment_method text default 'Cash'
);

-- RLS
alter table public.expenses enable row level security;
create policy "Enable all access for expenses" on public.expenses for all using (true) with check (true);
