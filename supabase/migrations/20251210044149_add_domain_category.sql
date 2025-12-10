/*
  # Add Domain Category to Subscriptions

  ## Changes
  - Update category check constraint to include 'Domain' category
  - This allows users to track domain registrations and renewals

  ## Notes
  - This migration safely adds the new category without affecting existing data
  - All existing subscriptions remain unchanged
*/

-- Drop the existing check constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_category_check;

-- Add updated check constraint with Domain category
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_category_check 
  CHECK (category IN ('Entertainment', 'Productivity', 'Cloud', 'Gaming', 'Reading', 'Fitness', 'Domain', 'Other'));