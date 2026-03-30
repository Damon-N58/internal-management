-- Add per-user targeting to notifications
ALTER TABLE notification
  ADD COLUMN IF NOT EXISTS user_id text REFERENCES profile(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS ticket_id text REFERENCES ticket(id) ON DELETE CASCADE;
