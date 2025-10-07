/*
  # Allow Zero Value for Nuts Field

  1. Changes
    - Remove CHECK constraint that enforces number_of_nuts > 0
    - Add new CHECK constraint that allows number_of_nuts >= 0
    - This enables legitimate data collection scenarios where nuts = 0

  2. Rationale
    - Users need to be able to record encounters with zero nuts
    - Existing calculation functions already handle zero values correctly
    - This change maintains data integrity while expanding valid use cases

  3. Impact
    - Existing entries are unaffected (all have nuts > 0)
    - New entries can now have nuts = 0
    - Statistics calculations remain accurate with zero-value handling
*/

-- Drop the existing constraint that enforces number_of_nuts > 0
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'data_entries_number_of_nuts_check'
  ) THEN
    ALTER TABLE data_entries DROP CONSTRAINT data_entries_number_of_nuts_check;
  END IF;
END $$;

-- Add new constraint that allows number_of_nuts >= 0 (no negative values)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'data_entries_number_of_nuts_nonnegative'
  ) THEN
    ALTER TABLE data_entries 
    ADD CONSTRAINT data_entries_number_of_nuts_nonnegative 
    CHECK (number_of_nuts >= 0);
  END IF;
END $$;
