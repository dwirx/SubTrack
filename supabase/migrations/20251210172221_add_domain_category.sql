ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_category_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_category_check 
  CHECK (category IN ('Entertainment', 'Productivity', 'Cloud', 'Gaming', 'Reading', 'Fitness', 'Domain', 'Other'));;
