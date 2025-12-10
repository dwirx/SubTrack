import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Subscription = {
  id: string;
  user_id: string;
  service_name: string;
  category: 'Entertainment' | 'Productivity' | 'Cloud' | 'Gaming' | 'Reading' | 'Fitness' | 'Domain' | 'Other';
  plan_name?: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly' | 'once';
  start_date: string;
  next_billing_date?: string;
  payment_method?: string;
  status: 'active' | 'trial' | 'cancelled';
  auto_renew: boolean;
  notes?: string;
  is_shared: boolean;
  shared_with_count?: number;
  paid_by_company: boolean;
  icon_emoji?: string;
  custom_data?: Record<string, unknown>;
  tags?: string[];
  description?: string;
  subscription_email?: string;
  phone_number?: string;
  cancellation_url?: string;
  cancellation_steps?: string;
  reminder_days?: number[];
  notification_time?: string;
  created_at: string;
  updated_at: string;
};

export const CURRENCIES = [
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

export const CATEGORIES = [
  { value: 'Entertainment', label: 'Entertainment', emoji: '🎬' },
  { value: 'Productivity', label: 'Productivity', emoji: '📝' },
  { value: 'Cloud', label: 'Cloud Storage', emoji: '☁️' },
  { value: 'Gaming', label: 'Gaming', emoji: '🎮' },
  { value: 'Reading', label: 'Reading & News', emoji: '📚' },
  { value: 'Fitness', label: 'Fitness & Health', emoji: '🏃' },
  { value: 'Domain', label: 'Domain & Hosting', emoji: '🌐' },
  { value: 'Other', label: 'Other', emoji: '📦' },
];

export const REMINDER_OPTIONS = [
  { value: 0, label: 'On the day (H-0)', emoji: '🔔' },
  { value: 1, label: '1 day before (H-1)', emoji: '⏰' },
  { value: 3, label: '3 days before (H-3)', emoji: '📢' },
  { value: 7, label: '1 week before (H-7)', emoji: '📣' },
  { value: 14, label: '2 weeks before (H-14)', emoji: '📯' },
  { value: 30, label: '1 month before (H-30)', emoji: '🔊' },
];
