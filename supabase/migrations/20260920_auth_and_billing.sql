-- Run in the Supabase SQL editor before enabling Razorpay in production.
-- Supabase Auth itself is configured in Authentication > Providers (Email and Google).

create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  activated_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  razorpay_order_id text not null unique,
  razorpay_payment_id text not null unique,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR',
  status text not null,
  created_at timestamptz not null default now()
);

alter table public.user_subscriptions enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists "user_subscriptions_select_own" on public.user_subscriptions;
create policy "user_subscriptions_select_own" on public.user_subscriptions for select using (auth.uid() = user_id);
drop policy if exists "payment_events_select_own" on public.payment_events;
create policy "payment_events_select_own" on public.payment_events for select using (auth.uid() = user_id);

-- Existing accounts start on Free. New accounts are created by this trigger.
insert into public.user_subscriptions (user_id, plan, status)
select id, 'free', 'active' from auth.users
on conflict (user_id) do nothing;

create or replace function public.create_default_subscription()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_subscriptions (user_id, plan, status) values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_subscription_created on auth.users;
create trigger on_auth_user_subscription_created
after insert on auth.users for each row execute procedure public.create_default_subscription();
