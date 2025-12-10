ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS subscription_email text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancellation_url text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancellation_steps text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS reminder_days integer[] DEFAULT ARRAY[1, 3, 7]::integer[];
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS notification_time time DEFAULT '09:00:00';;
