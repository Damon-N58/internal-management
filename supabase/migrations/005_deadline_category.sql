-- Add category to deadline for typed milestones
ALTER TABLE deadline
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'Milestone';
