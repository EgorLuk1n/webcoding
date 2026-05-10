ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS client_phone TEXT,
  ADD COLUMN IF NOT EXISTS car_brand TEXT,
  ADD COLUMN IF NOT EXISTS car_model TEXT,
  ADD COLUMN IF NOT EXISTS car_year INTEGER,
  ADD COLUMN IF NOT EXISTS license_plate TEXT,
  ADD COLUMN IF NOT EXISTS mileage INTEGER,
  ADD COLUMN IF NOT EXISTS service_type TEXT,
  ADD COLUMN IF NOT EXISTS problem_description TEXT,
  ADD COLUMN IF NOT EXISTS preferred_date DATE,
  ADD COLUMN IF NOT EXISTS preferred_time TIME,
  ADD COLUMN IF NOT EXISTS client_comment TEXT,
  ADD COLUMN IF NOT EXISTS admin_comment TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE leads
SET
  client_name = COALESCE(client_name, name),
  client_phone = COALESCE(client_phone, phone),
  car_brand = COALESCE(car_brand, NULLIF(car, '')),
  problem_description = COALESCE(problem_description, NULLIF(message, '')),
  updated_at = COALESCE(updated_at, created_at, NOW());

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_preferred_date_time ON leads (preferred_date, preferred_time);
