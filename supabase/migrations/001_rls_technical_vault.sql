-- Enable Row Level Security on TechnicalVault
-- Run this in the Supabase SQL Editor after running prisma db push

ALTER TABLE "TechnicalVault" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read vault records
CREATE POLICY "Authenticated users can read vault"
  ON "TechnicalVault"
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert vault records
CREATE POLICY "Authenticated users can insert vault"
  ON "TechnicalVault"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update vault records
CREATE POLICY "Authenticated users can update vault"
  ON "TechnicalVault"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
