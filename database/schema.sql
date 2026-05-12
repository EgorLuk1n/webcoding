CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_blocks (
  id SERIAL PRIMARY KEY,
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  body TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'wrench',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS problems (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  href TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  car TEXT,
  message TEXT,
  client_name TEXT,
  client_phone TEXT,
  car_brand TEXT,
  car_model TEXT,
  car_year INTEGER,
  license_plate TEXT,
  mileage INTEGER,
  service_type TEXT,
  problem_description TEXT,
  preferred_date DATE,
  preferred_time TIME,
  scheduled_start_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  client_comment TEXT,
  admin_comment TEXT,
  source TEXT NOT NULL DEFAULT 'form',
  quiz_data JSONB,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'confirmed', 'rescheduled', 'in_progress', 'done', 'cancelled')),
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  rescheduled_at TIMESTAMPTZ,
  previous_scheduled_start_at TIMESTAMPTZ,
  previous_scheduled_end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_blocks_active_order ON content_blocks (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_services_active_order ON services (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_problems_active_order ON problems (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_contacts_active_order ON contacts (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_preferred_date_time ON leads (preferred_date, preferred_time);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads (source);
CREATE INDEX IF NOT EXISTS idx_leads_scheduled_range
  ON leads (scheduled_start_at, scheduled_end_at)
  WHERE status IN ('confirmed', 'in_progress');

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_blocks_section_unique ON content_blocks (section);
CREATE UNIQUE INDEX IF NOT EXISTS idx_services_title_unique ON services (title);
CREATE UNIQUE INDEX IF NOT EXISTS idx_problems_title_unique ON problems (title);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_type_label_unique ON contacts (type, label);

CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  car TEXT NOT NULL,
  car_year INTEGER,
  mileage INTEGER,
  problem TEXT NOT NULL,
  work_done TEXT NOT NULL,
  result TEXT NOT NULL,
  service TEXT,
  image_url TEXT,
  completed_at DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,
  car TEXT,
  text TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  source TEXT,
  review_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_active_order ON cases (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_reviews_active_order ON reviews (is_active, sort_order);
