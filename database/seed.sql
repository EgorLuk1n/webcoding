INSERT INTO admins (email, password_hash)
VALUES ('admin@bercar.local', crypt('admin123', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;

INSERT INTO content_blocks (section, title, subtitle, body, sort_order, is_active)
VALUES
  (
    'hero',
    'Профессиональный ремонт VAG автомобилей в Калуге',
    'Решаем сложные неисправности и делаем как для себя',
    'Volkswagen, Audi, Škoda, SEAT — точная диагностика, качественный ремонт и подбор запчастей без лишних работ.',
    10,
    TRUE
  ),
  (
    'statement',
    'Почему владельцы VAG выбирают Ber Car',
    NULL,
    'Мы не большой потоковый сервис — у нас вы общаетесь напрямую с мастером, который разбирается в VAG и отвечает за результат.',
    20,
    TRUE
  ),
  (
    'parts',
    'Оригинальные запчасти и качественные аналоги',
    'Запчасти',
    'Работаем с оригинальными запчастями и качественными аналогами. Подбираем оптимальный вариант под задачу и бюджет.',
    30,
    TRUE
  )
ON CONFLICT (section) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  body = EXCLUDED.body,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO services (title, description, icon, sort_order, is_active)
VALUES
  ('Диагностика VAG', 'Точная диагностика электронных систем, ошибок и скрытых причин.', 'gauge', 10, TRUE),
  ('Техническое обслуживание', 'Регламентные работы, масла, фильтры и спокойный осмотр без спешки.', 'wrench', 20, TRUE),
  ('Двигатель', 'Цепи, ГРМ, расход масла, потеря мощности и навесное оборудование.', 'settings', 30, TRUE),
  ('DSG и трансмиссия', 'Рывки, пинки, задержки, адаптация и ремонт узлов DSG.', 'car', 40, TRUE),
  ('Подвеска', 'Стуки, люфты, сайлентблоки, амортизаторы и геометрия.', 'shield', 50, TRUE),
  ('Электрика', 'Проводка, питание, блоки, датчики и нестабильные ошибки.', 'battery', 60, TRUE),
  ('Тормоза', 'Диски, колодки, суппорты, жидкости и уверенное торможение.', 'gauge', 70, TRUE),
  ('Прочие работы', 'Разберемся с нестандартной задачей и предложим решение.', 'plug', 80, TRUE)
ON CONFLICT (title) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO problems (title, sort_order, is_active)
VALUES
  ('Машина троит или работает нестабильно', 10, TRUE),
  ('Загорелись ошибки на приборке', 20, TRUE),
  ('DSG дергается, пинается или думает перед стартом', 30, TRUE),
  ('Стуки в подвеске и вибрации на скорости', 40, TRUE),
  ('Повышенный расход масла или топлива', 50, TRUE),
  ('Машина перестала ехать как раньше', 60, TRUE),
  ('Не могут найти причину в других сервисах', 70, TRUE)
ON CONFLICT (title) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO contacts (label, value, type, href, sort_order, is_active)
VALUES
  ('Калуга', 'Калуга', 'location', NULL, 10, TRUE),
  ('Телефон', '+7 000 000-00-00', 'phone', 'tel:+70000000000', 20, TRUE),
  ('График', 'Ежедневно: 9:00-20:00', 'hours', NULL, 30, TRUE)
ON CONFLICT (type, label) DO NOTHING;

INSERT INTO cases (car, car_year, mileage, problem, work_done, result, service, sort_order, is_active)
SELECT *
FROM (VALUES
  ('Audi A4 2.0 TFSI', 2016, 148000, 'Потеря мощности, ошибки по наддуву', 'Диагностика, нашли причину, устранили неисправность.', 'Автомобиль снова едет стабильно.', 'Диагностика VAG', 10, TRUE),
  ('Volkswagen Tiguan', 2018, 121000, 'Пинки DSG', 'Диагностика коробки, проверка ошибок, адаптация.', 'Переключения стали мягче, клиент получил рекомендации.', 'Ремонт DSG', 20, TRUE),
  ('Škoda Octavia', 2017, 132000, 'Стуки в подвеске', 'Диагностика ходовой, выявили изношенные элементы.', 'Посторонние звуки устранены.', 'Подвеска', 30, TRUE)
) AS seed(car, car_year, mileage, problem, work_done, result, service, sort_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM cases WHERE cases.car = seed.car AND cases.problem = seed.problem
);

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

INSERT INTO reviews (source, client_name, car, text, review_text, rating, service_type, source_url, is_featured, review_date, sort_order, is_active)
SELECT *
FROM (VALUES
  ('avito', 'Алексей', 'Volkswagen Tiguan', 'Приехал с рывками коробки. Сначала сделали диагностику, объяснили варианты, лишнего не навязывали.', 'Приехал с рывками коробки. Сначала сделали диагностику, объяснили варианты, лишнего не навязывали.', 5, 'Ремонт DSG', 'https://www.avito.ru/brands/i215092804/all/predlozheniya_uslug?ysclid=mp31imxgav615450812&sellerId=89bf7d4f81745d02ee0d74285196d7e9', TRUE, CURRENT_DATE, 10, TRUE),
  ('manual', 'Марина', 'Audi A4', 'Понравилось, что перед ремонтом спокойно показали причину ошибки и согласовали стоимость.', 'Понравилось, что перед ремонтом спокойно показали причину ошибки и согласовали стоимость.', 5, 'Диагностика', NULL, TRUE, CURRENT_DATE, 20, TRUE),
  ('manual', 'Игорь', 'Škoda Octavia', 'Нашли стук, который в другом сервисе не могли поймать. Машина стала тише.', 'Нашли стук, который в другом сервисе не могли поймать. Машина стала тише.', 5, 'Подвеска', NULL, TRUE, CURRENT_DATE, 30, TRUE)
) AS seed(source, client_name, car, text, review_text, rating, service_type, source_url, is_featured, review_date, sort_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM reviews WHERE reviews.client_name = seed.client_name AND reviews.car = seed.car AND COALESCE(reviews.review_text, reviews.text) = seed.review_text
);
