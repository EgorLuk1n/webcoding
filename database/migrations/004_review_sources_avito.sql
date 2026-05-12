ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS review_text TEXT,
  ADD COLUMN IF NOT EXISTS service_type TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_source_check;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_source_check
  CHECK (source IN ('avito', 'yandex', '2gis', 'manual', 'other'));

UPDATE reviews
SET review_text = COALESCE(review_text, text)
WHERE review_text IS NULL;

UPDATE reviews
SET source = 'manual'
WHERE source IS NULL OR source = '';

ALTER TABLE reviews
  ALTER COLUMN source SET DEFAULT 'manual';

CREATE TABLE IF NOT EXISTS review_sources (
  id SERIAL PRIMARY KEY,
  source TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  rating NUMERIC(2, 1),
  reviews_count INTEGER NOT NULL DEFAULT 0,
  profile_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_source_active ON reviews (source, is_active);
CREATE INDEX IF NOT EXISTS idx_reviews_featured_order ON reviews (is_featured, sort_order);

INSERT INTO review_sources (source, title, rating, reviews_count, profile_url, is_active)
VALUES (
  'avito',
  'Авито',
  4.9,
  36,
  'https://www.avito.ru/brands/i215092804/all/predlozheniya_uslug?ysclid=mp31imxgav615450812&sellerId=89bf7d4f81745d02ee0d74285196d7e9',
  TRUE
)
ON CONFLICT (source) DO UPDATE SET
  title = EXCLUDED.title,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count,
  profile_url = EXCLUDED.profile_url,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
