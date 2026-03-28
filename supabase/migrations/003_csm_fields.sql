-- CSM pipeline and communications fields
ALTER TABLE company
  ADD COLUMN IF NOT EXISTS pipeline_stage text,
  ADD COLUMN IF NOT EXISTS contract_value numeric,
  ADD COLUMN IF NOT EXISTS next_action text,
  ADD COLUMN IF NOT EXISTS ball_in_court text;
