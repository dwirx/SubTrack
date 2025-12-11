/*
  # Add Long Date Format Option

  1. Changes
    - Update date_format check constraint to include 'DD MMMM YYYY' format
    - This format displays dates like "31 December 2024" or "31 Desember 2024"

  2. Notes
    - Drop existing constraint first, then recreate with new value
*/

-- Drop the existing constraint
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_date_format_check;

-- Add new constraint with the additional format
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_date_format_check 
  CHECK (date_format IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD MMMM YYYY'));
