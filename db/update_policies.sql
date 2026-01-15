
-- Enable UPDATE policy for jobs table
drop policy if exists "Enable update access for all users" on public.jobs;

create policy "Enable update access for all users"
on public.jobs
for update
using (true)
with check (true);

-- Also Enable DELETE while we are at it, just in case
drop policy if exists "Enable delete access for all users" on public.jobs;

create policy "Enable delete access for all users"
on public.jobs
for delete
using (true);
