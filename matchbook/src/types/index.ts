export type UserRole = 'admin' | 'expert' | 'client';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface ExpertProfile {
  id: string;
  user_id: string;
  name: string;
  bio: string;
  headshot_url: string | null;
  tags: string[];
  rate_per_hour: number;
  calendly_access_token: string | null;
  calendly_refresh_token: string | null;
  calendly_event_type_uri: string | null;
  calendly_event_type_name: string | null;
  calendly_user_uri: string | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  rating_avg: number | null;
  review_count: number;
  approved: boolean;
  credentials: string | null;
  past_roles: string | null;
  created_at: string;
  updated_at: string;
}

export type SessionStatus =
  | 'pending_payment'
  | 'payment_confirmed'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PayoutStatus = 'pending' | 'transferred' | 'failed';

export interface Session {
  id: string;
  expert_id: string;
  client_id: string;
  expert_profile?: ExpertProfile;
  client?: User;
  calendly_event_uri: string | null;
  calendly_scheduling_link: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  status: SessionStatus;
  scheduled_at: string | null;
  duration_minutes: number;
  amount_cents: number;
  platform_fee_cents: number;
  payout_status: PayoutStatus;
  client_context: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  session_id: string;
  client_id: string;
  expert_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  note: string | null;
  created_at: string;
}

export interface Invite {
  id: string;
  token: string;
  role: 'expert' | 'client';
  email: string | null;
  used: boolean;
  created_by: string;
  expires_at: string;
  created_at: string;
}

export interface PlatformSettings {
  platform_fee_percent: number;
  refund_window_hours: number;
  invite_expiry_hours: number;
}
