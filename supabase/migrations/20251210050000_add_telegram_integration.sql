/*
  # Add Telegram Integration

  1. Changes
    - Add telegram_chat_id to user_preferences for storing connected Telegram account
    - Add telegram_notifications boolean flag
    - Add telegram_connected_at timestamp

  2. Security
    - Existing RLS policies cover these new columns
*/

ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS telegram_chat_id text,
ADD COLUMN IF NOT EXISTS telegram_notifications boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS telegram_connected_at timestamptz;

-- Create index for faster lookup by telegram_chat_id
CREATE INDEX IF NOT EXISTS idx_user_preferences_telegram_chat_id 
ON user_preferences(telegram_chat_id) 
WHERE telegram_chat_id IS NOT NULL;
