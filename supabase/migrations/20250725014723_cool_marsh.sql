/*
  # Enable RLS for registrasi_file table

  1. Security
    - Enable RLS on registrasi_file table
    - Add policies for authenticated users to manage files
*/

-- Enable RLS on registrasi_file table
ALTER TABLE registrasi_file ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to insert files
CREATE POLICY "Authenticated users can insert files"
  ON registrasi_file
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for authenticated users to view files
CREATE POLICY "Authenticated users can view files"
  ON registrasi_file
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to delete files
CREATE POLICY "Authenticated users can delete files"
  ON registrasi_file
  FOR DELETE
  TO authenticated
  USING (true);

-- Policy for authenticated users to update files
CREATE POLICY "Authenticated users can update files"
  ON registrasi_file
  FOR UPDATE
  TO authenticated
  USING (true);
