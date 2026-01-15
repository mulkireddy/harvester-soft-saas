-- Fix typo in status constraint ('Padding' -> 'Pending')
alter table public.jobs drop constraint if exists jobs_status_check;

alter table public.jobs 
add constraint jobs_status_check 
check (status in ('Pending', 'Partial', 'Paid'));
