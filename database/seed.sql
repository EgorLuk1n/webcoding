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
