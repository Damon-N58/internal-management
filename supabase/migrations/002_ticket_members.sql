CREATE TABLE IF NOT EXISTS ticket_members (
  id text PRIMARY KEY,
  ticket_id text NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ticket_id, user_id)
);

ALTER TABLE ticket_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select ticket_members"
  ON ticket_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert ticket_members"
  ON ticket_members FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete ticket_members"
  ON ticket_members FOR DELETE TO authenticated USING (true);
