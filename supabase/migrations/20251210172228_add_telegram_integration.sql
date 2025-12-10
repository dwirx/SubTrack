ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS telegram_chat_id text,
ADD COLUMN IF NOT EXISTS telegram_notifications boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS telegram_connected_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_user_preferences_telegram_chat_id 
ON user_preferences(telegram_chat_id) 
WHERE telegram_chat_id IS NOT NULL;;
