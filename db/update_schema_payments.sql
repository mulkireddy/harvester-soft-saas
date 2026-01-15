-- 1. Create Payments Table
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs(id) on delete cascade not null,
  amount numeric not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  method text, -- Cash, Online, etc.
  notes text
);

-- 2. Enable RLS
alter table public.payments enable row level security;
create policy "Enable access for all users" on public.payments for all using (true) with check (true);

-- 3. Create a Function to Auto-Update Job Status
create or replace function update_job_payment_status()
returns trigger as $$
begin
  -- Update the parent job's paid_amount and status
  update public.jobs
  set 
    paid_amount = (select sum(amount) from public.payments where job_id = new.job_id),
    status = case 
      when (select sum(amount) from public.payments where job_id = new.job_id) >= total_amount then 'Paid'
      when (select sum(amount) from public.payments where job_id = new.job_id) > 0 then 'Partial'
      else 'Pending'
    end
  where id = new.job_id;
  
  return new;
end;
$$ language plpgsql;

-- 4. Create Trigger
create trigger on_payment_added
after insert on public.payments
for each row execute procedure update_job_payment_status();
