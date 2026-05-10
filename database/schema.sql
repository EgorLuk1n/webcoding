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
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_blocks_active_order ON content_blocks (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_services_active_order ON services (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_problems_active_order ON problems (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_contacts_active_order ON contacts (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_blocks_section_unique ON content_blocks (section);
CREATE UNIQUE INDEX IF NOT EXISTS idx_services_title_unique ON services (title);
CREATE UNIQUE INDEX IF NOT EXISTS idx_problems_title_unique ON problems (title);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_type_label_unique ON contacts (type, label);
