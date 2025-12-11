-- Add icon_url column to api_keys table
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS icon_url text;
