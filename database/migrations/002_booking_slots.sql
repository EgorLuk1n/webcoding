ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS scheduled_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS previous_scheduled_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS previous_scheduled_end_at TIMESTAMPTZ;

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'contacted', 'confirmed', 'rescheduled', 'in_progress', 'done', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_leads_scheduled_range
  ON leads (scheduled_start_at, scheduled_end_at)
  WHERE status IN ('confirmed', 'in_progress');
