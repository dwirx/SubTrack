/*
  # Subscription Management System Schema

  ## Overview
  Creates the complete database schema for tracking user subscriptions across multiple service categories
  including entertainment, productivity, cloud storage, gaming, reading, and fitness services.

  ## New Tables
  
  ### subscriptions
  Core table for storing all user subscription data
  - `id` (uuid, primary key) - Unique identifier for each subscription
  - `user_id` (uuid, foreign key) - References auth.users for user ownership
  - `service_name` (text, required) - Name of the service (Netflix, Spotify, etc.)
  - `category` (text, required) - Category type (Entertainment, Productivity, Cloud, Gaming, Reading, Fitness, Other)
  - `plan_name` (text) - Subscription plan name (Individual, Family, Premium, etc.)
  - `price` (decimal, required) - Subscription price
  - `currency` (text, default 'IDR') - Currency code (IDR, USD, EUR, etc.)
  - `billing_cycle` (text, required) - Payment frequency (monthly, yearly, once)
  - `start_date` (date, required) - When subscription started
  - `next_billing_date` (date) - Next payment due date
  - `payment_method` (text) - How user pays (Credit Card, Debit, PayPal, GoPay, etc.)
  - `status` (text, default 'active') - Current status (active, trial, cancelled)
  - `auto_renew` (boolean, default true) - Whether auto-renewal is enabled
  - `notes` (text) - User notes about the subscription
  - `is_shared` (boolean, default false) - Whether subscription is shared with others
  - `shared_with_count` (integer) - Number of people sharing the subscription
  - `paid_by_company` (boolean, default false) - Whether company pays for this
  - `icon_emoji` (text) - Custom emoji icon for the service
  - `custom_data` (jsonb) - Service-specific additional data (resolution, storage capacity, etc.)
  - `tags` (text array) - User-defined tags for organization
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record last update timestamp

  ## Security
  - Enable RLS on subscriptions table
  - Users can only read their own subscriptions
  - Users can only insert their own subscriptions
  - Users can only update their own subscriptions
  - Users can only delete their own subscriptions

  ## Indexes
  - Index on user_id for fast user subscription lookups
  - Index on next_billing_date for reminder queries
  - Index on category for filtering
  - Index on status for filtering
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Entertainment', 'Productivity', 'Cloud', 'Gaming', 'Reading', 'Fitness', 'Other')),
  plan_name text,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'IDR',
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'once')),
  start_date date NOT NULL,
  next_billing_date date,
  payment_method text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'cancelled')),
  auto_renew boolean DEFAULT true,
  notes text,
  is_shared boolean DEFAULT false,
  shared_with_count integer CHECK (shared_with_count > 0),
  paid_by_company boolean DEFAULT false,
  icon_emoji text,
  custom_data jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(category);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions table

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on subscription changes
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();