ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'form',
  ADD COLUMN IF NOT EXISTS quiz_data JSONB;

CREATE INDEX IF NOT EXISTS idx_leads_source ON leads (source);

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

INSERT INTO cases (car, car_year, mileage, problem, work_done, result, service, sort_order, is_active)
SELECT *
FROM (VALUES
  ('Audi A4 2.0 TFSI', 2016, 148000, 'Потеря мощности, ошибки по наддуву', 'Провели диагностику, нашли причину и устранили неисправность.', 'Автомобиль снова едет стабильно.', 'Диагностика VAG', 10, true),
  ('Volkswagen Tiguan', 2018, 121000, 'Пинки DSG', 'Проверили ошибки коробки, выполнили диагностику и адаптацию.', 'Переключения стали мягче, клиент получил рекомендации.', 'Ремонт DSG', 20, true),
  ('Škoda Octavia', 2017, 132000, 'Стуки в подвеске', 'Провели диагностику ходовой и выявили изношенные элементы.', 'Посторонние звуки устранены.', 'Подвеска', 30, true)
) AS seed(car, car_year, mileage, problem, work_done, result, service, sort_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM cases WHERE cases.car = seed.car AND cases.problem = seed.problem
);

INSERT INTO reviews (client_name, car, text, rating, source, review_date, sort_order, is_active)
SELECT *
FROM (VALUES
  ('Алексей', 'Volkswagen Tiguan', 'Приехал с рывками коробки. Сначала сделали диагностику, объяснили варианты, лишнего не навязывали.', 5, 'Сайт', CURRENT_DATE, 10, true),
  ('Марина', 'Audi A4', 'Понравилось, что перед ремонтом спокойно показали причину ошибки и согласовали стоимость.', 5, 'Клиент', CURRENT_DATE, 20, true),
  ('Игорь', 'Škoda Octavia', 'Нашли стук, который в другом сервисе не могли поймать. Машина стала тише.', 5, 'Сайт', CURRENT_DATE, 30, true)
) AS seed(client_name, car, text, rating, source, review_date, sort_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM reviews WHERE reviews.client_name = seed.client_name AND reviews.car = seed.car AND reviews.text = seed.text
);
