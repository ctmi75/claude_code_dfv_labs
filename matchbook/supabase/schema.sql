-- Matchbook Platform Schema
-- Supabase (PostgreSQL) complete schema definition

-- =============================================================================
-- Trigger function: auto-update updated_at column
-- =============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =============================================================================
-- Table: users (extends Supabase auth.users)
-- =============================================================================
create table public.users (
  id          uuid        primary key references auth.users on delete cascade,
  email       text        unique not null,
  role        text        not null check (role in ('admin', 'expert', 'client')),
  name        text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- Table: expert_profiles
-- =============================================================================
create table public.expert_profiles (
  id                          uuid          primary key default gen_random_uuid(),
  user_id                     uuid          unique not null references public.users on delete cascade,
  name                        text          not null,
  bio                         text,
  headshot_url                text,
  tags                        text[]        not null default '{}',
  rate_per_hour               integer       not null, -- in cents
  calendly_access_token       text,
  calendly_refresh_token      text,
  calendly_event_type_uri     text,
  calendly_event_type_name    text,
  calendly_user_uri           text,
  stripe_account_id           text,
  stripe_onboarding_complete  boolean       not null default false,
  rating_avg                  numeric(3,2)  not null default 0,
  review_count                integer       not null default 0,
  approved                    boolean       not null default false,
  credentials                 text,
  past_roles                  text,
  created_at                  timestamptz   not null default now(),
  updated_at                  timestamptz   not null default now()
);

comment on column public.expert_profiles.rate_per_hour is 'in cents';

create trigger expert_profiles_updated_at
  before update on public.expert_profiles
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- Table: sessions
-- =============================================================================
create table public.sessions (
  id                          uuid          primary key default gen_random_uuid(),
  expert_id                   uuid          not null references public.users on delete restrict,
  client_id                   uuid          not null references public.users on delete restrict,
  calendly_event_uri          text,
  calendly_scheduling_link    text,
  stripe_payment_intent_id    text,
  stripe_checkout_session_id  text,
  status                      text          not null default 'pending_payment'
                                            check (status in (
                                              'pending_payment',
                                              'payment_confirmed',
                                              'confirmed',
                                              'completed',
                                              'cancelled',
                                              'refunded'
                                            )),
  scheduled_at                timestamptz,
  duration_minutes            integer       not null default 30,
  amount_cents                integer       not null,
  platform_fee_cents          integer       not null,
  payout_status               text          not null default 'pending'
                                            check (payout_status in ('pending', 'transferred', 'failed')),
  client_context              text          check (char_length(client_context) <= 200),
  created_at                  timestamptz   not null default now(),
  updated_at                  timestamptz   not null default now()
);

create trigger sessions_updated_at
  before update on public.sessions
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- Table: reviews
-- =============================================================================
create table public.reviews (
  id          uuid        primary key default gen_random_uuid(),
  session_id  uuid        unique not null references public.sessions on delete cascade,
  client_id   uuid        not null references public.users on delete restrict,
  expert_id   uuid        not null references public.users on delete restrict,
  rating      integer     not null check (rating >= 1 and rating <= 5),
  note        text,
  created_at  timestamptz not null default now()
);

-- =============================================================================
-- Table: invites
-- =============================================================================
create table public.invites (
  id          uuid        primary key default gen_random_uuid(),
  token       text        unique not null,
  role        text        not null check (role in ('expert', 'client')),
  email       text,
  used        boolean     not null default false,
  created_by  uuid        references public.users on delete set null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- =============================================================================
-- Table: platform_settings (single-row config)
-- =============================================================================
create table public.platform_settings (
  id                    integer       primary key default 1 check (id = 1),
  platform_fee_percent  numeric(5,2)  not null default 15.00,
  refund_window_hours   integer       not null default 24,
  invite_expiry_hours   integer       not null default 72,
  updated_at            timestamptz   not null default now()
);

create trigger platform_settings_updated_at
  before update on public.platform_settings
  for each row execute function public.handle_updated_at();

-- Insert the single default row
insert into public.platform_settings (id) values (1);

-- =============================================================================
-- Indexes
-- =============================================================================
create index idx_expert_profiles_approved on public.expert_profiles (approved);
create index idx_expert_profiles_tags     on public.expert_profiles using gin (tags);
create index idx_sessions_status          on public.sessions (status);
create index idx_sessions_expert_id       on public.sessions (expert_id);
create index idx_sessions_client_id       on public.sessions (client_id);
create index idx_invites_token            on public.invites (token);

-- =============================================================================
-- Enable Row Level Security on all tables
-- =============================================================================
alter table public.users             enable row level security;
alter table public.expert_profiles   enable row level security;
alter table public.sessions          enable row level security;
alter table public.reviews           enable row level security;
alter table public.invites           enable row level security;
alter table public.platform_settings enable row level security;

-- =============================================================================
-- Helper: check if current user is admin
-- =============================================================================
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- =============================================================================
-- RLS Policies: users
-- =============================================================================

-- Users can read their own row
create policy "users_select_own"
  on public.users for select
  using (id = auth.uid());

-- Admins can read all users
create policy "users_select_admin"
  on public.users for select
  using (public.is_admin());

-- Users can update their own row
create policy "users_update_own"
  on public.users for update
  using (id = auth.uid());

-- Admins can update any user
create policy "users_update_admin"
  on public.users for update
  using (public.is_admin());

-- =============================================================================
-- RLS Policies: expert_profiles
-- =============================================================================

-- Any authenticated user can read approved profiles
create policy "expert_profiles_select_approved"
  on public.expert_profiles for select
  using (approved = true and auth.uid() is not null);

-- Admins can read all profiles (including unapproved)
create policy "expert_profiles_select_admin"
  on public.expert_profiles for select
  using (public.is_admin());

-- Experts can read their own profile (even if unapproved)
create policy "expert_profiles_select_own"
  on public.expert_profiles for select
  using (user_id = auth.uid());

-- Experts can insert their own profile
create policy "expert_profiles_insert_own"
  on public.expert_profiles for insert
  with check (user_id = auth.uid());

-- Experts can update their own profile
create policy "expert_profiles_update_own"
  on public.expert_profiles for update
  using (user_id = auth.uid());

-- Admins can update any profile
create policy "expert_profiles_update_admin"
  on public.expert_profiles for update
  using (public.is_admin());

-- =============================================================================
-- RLS Policies: sessions
-- =============================================================================

-- Clients can read their own sessions
create policy "sessions_select_client"
  on public.sessions for select
  using (client_id = auth.uid());

-- Experts can read their own sessions
create policy "sessions_select_expert"
  on public.sessions for select
  using (expert_id = auth.uid());

-- Admins can read all sessions
create policy "sessions_select_admin"
  on public.sessions for select
  using (public.is_admin());

-- Clients can insert sessions (book a session)
create policy "sessions_insert_client"
  on public.sessions for insert
  with check (client_id = auth.uid());

-- Admins can update any session
create policy "sessions_update_admin"
  on public.sessions for update
  using (public.is_admin());

-- =============================================================================
-- RLS Policies: reviews
-- =============================================================================

-- Any authenticated user can read reviews
create policy "reviews_select_authenticated"
  on public.reviews for select
  using (auth.uid() is not null);

-- Clients can insert a review for their completed session
create policy "reviews_insert_client"
  on public.reviews for insert
  with check (
    client_id = auth.uid()
    and exists (
      select 1 from public.sessions s
      where s.id = session_id
        and s.client_id = auth.uid()
        and s.status = 'completed'
    )
  );

-- =============================================================================
-- RLS Policies: invites (admin only)
-- =============================================================================

create policy "invites_select_admin"
  on public.invites for select
  using (public.is_admin());

create policy "invites_insert_admin"
  on public.invites for insert
  with check (public.is_admin());

create policy "invites_update_admin"
  on public.invites for update
  using (public.is_admin());

create policy "invites_delete_admin"
  on public.invites for delete
  using (public.is_admin());

-- =============================================================================
-- RLS Policies: platform_settings (admin only)
-- =============================================================================

create policy "platform_settings_select_admin"
  on public.platform_settings for select
  using (public.is_admin());

create policy "platform_settings_update_admin"
  on public.platform_settings for update
  using (public.is_admin());
