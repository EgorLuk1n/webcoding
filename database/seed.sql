INSERT INTO admins (email, password_hash)
VALUES ('admin@bercar.local', crypt('admin123', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;

INSERT INTO content_blocks (section, title, subtitle, body, sort_order, is_active)
VALUES
  (
    'hero',
    'Ber Car',
    'VAG сервис в Калуге',
    'Спокойный, точный и аккуратный ремонт Volkswagen, Audi, Skoda и SEAT. Без лишних работ, догадок и суеты.',
    10,
    TRUE
  ),
  (
    'statement',
    'Сервис, который работает как точная система',
    NULL,
    'Диагностика, понятная смета, подбор деталей и ремонт с вниманием к каждому узлу.',
    20,
    TRUE
  ),
  (
    'parts',
    'Оригинал или качественный аналог. Под задачу и бюджет.',
    'Запчасти',
    'Подбираем детали без переплаты и объясняем разницу между вариантами. Клиент видит, за что платит, и понимает ресурс решения.',
    30,
    TRUE
  )
ON CONFLICT (section) DO NOTHING;

INSERT INTO services (title, description, icon, sort_order, is_active)
VALUES
  ('Диагностика VAG', 'Ошибки, пропуски, датчики, адаптации и скрытые причины.', 'gauge', 10, TRUE),
  ('Техническое обслуживание', 'Масла, фильтры, регламенты и честный осмотр машины.', 'wrench', 20, TRUE),
  ('Двигатель', 'Потеря мощности, расход масла, цепи, ГРМ и навесное.', 'settings', 30, TRUE),
  ('DSG и трансмиссия', 'Рывки, пинки, задержки, адаптация и ремонт узлов.', 'car', 40, TRUE),
  ('Подвеска', 'Стуки, люфты, сайлентблоки, амортизаторы и геометрия.', 'shield', 50, TRUE),
  ('Электрика', 'Питание, проводка, блоки, аккумулятор и нестабильные ошибки.', 'battery', 60, TRUE),
  ('Тормоза', 'Диски, колодки, суппорты, жидкости и точная проверка.', 'gauge', 70, TRUE),
  ('Прочие работы', 'Разберемся с нестандартной задачей и предложим решение.', 'plug', 80, TRUE)
ON CONFLICT (title) DO NOTHING;

INSERT INTO problems (title, sort_order, is_active)
VALUES
  ('Машина троит или работает нестабильно', 10, TRUE),
  ('Загорелись ошибки на приборке', 20, TRUE),
  ('DSG дергается, пинается или думает перед стартом', 30, TRUE),
  ('Стуки в подвеске и вибрации на скорости', 40, TRUE),
  ('Повышенный расход масла или топлива', 50, TRUE),
  ('Машина перестала ехать как раньше', 60, TRUE)
ON CONFLICT (title) DO NOTHING;

INSERT INTO contacts (label, value, type, href, sort_order, is_active)
VALUES
  ('Калуга', 'Калуга', 'location', NULL, 10, TRUE),
  ('Телефон', '+7 000 000-00-00', 'phone', 'tel:+70000000000', 20, TRUE),
  ('График', 'Ежедневно: 9:00-20:00', 'hours', NULL, 30, TRUE)
ON CONFLICT (type, label) DO NOTHING;
