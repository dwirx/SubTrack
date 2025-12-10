/*
  # Add Extra Subscription Fields

  ## Overview
  Adds new fields to the subscriptions table for better subscription management including
  contact information, cancellation details, and reminder scheduling.

  ## New Columns Added to subscriptions table
  - `description` (text) - Optional description or plan details
  - `subscription_email` (text) - Email associated with the subscription account
  - `phone_number` (text) - Phone number for the subscription
  - `cancellation_url` (text) - Direct link to cancellation page
  - `cancellation_steps` (text) - Step-by-step cancellation instructions
  - `reminder_days` (integer array) - Days before billing to send reminders (e.g., [0, 1, 3, 7])
  - `notification_time` (time) - Preferred time for notifications (e.g., 09:00)

  ## Notes
  - All new fields are optional to maintain backward compatibility
  - reminder_days stores values like [0, 1, 3, 7, 14, 30] representing H-0, H-1, H-3, etc.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'description'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'subscription_email'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN subscription_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN phone_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'cancellation_url'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN cancellation_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'cancellation_steps'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN cancellation_steps text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'reminder_days'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN reminder_days integer[] DEFAULT ARRAY[1, 3, 7]::integer[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'notification_time'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN notification_time time DEFAULT '09:00:00';
  END IF;
END $$;