import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BatteryCharging,
  Car,
  Calendar,
  Check,
  CircleGauge,
  Clock,
  Copy,
  ExternalLink,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  PlugZap,
  RefreshCw,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { api } from "./api.js";
import berCarLogo from "./assets/ber-car-logo-transparent.png";
import "./App.css";

const iconMap = {
  battery: BatteryCharging,
  car: Car,
  gauge: CircleGauge,
  plug: PlugZap,
  settings: Settings,
  shield: ShieldCheck,
  wrench: Wrench,
};

const serviceFallbacks = [
  "Точная диагностика электронных систем, ошибок и скрытых причин.",
  "Регламентные работы, масла, фильтры и спокойный осмотр без спешки.",
  "Цепи, ГРМ, расход масла, потеря мощности и навесное оборудование.",
  "Рывки, пинки, задержки, адаптация и ремонт узлов DSG.",
  "Стуки, люфты, сайлентблоки, амортизаторы и проверка ходовой.",
  "Диски, колодки, суппорты, жидкости и уверенное торможение.",
  "Проводка, питание, блоки, датчики и нестабильные ошибки.",
  "Разберемся с нестандартной задачей и предложим честное решение.",
];

const defaultServices = [
  "Диагностика",
  "Техническое обслуживание",
  "Ремонт двигателя",
  "Ремонт DSG",
  "Подвеска",
  "Тормозная система",
  "Электрика",
  "Прочие работы",
].map((title, index) => ({
  id: `default-service-${index}`,
  title,
  description: serviceFallbacks[index],
  icon: ["gauge", "wrench", "settings", "car", "shield", "gauge", "battery", "plug"][index],
}));

const defaultProblems = [
  "Машина троит или работает нестабильно",
  "Загорелись ошибки на приборке",
  "Проблемы с DSG: рывки, пинки, задержки",
  "Стуки в подвеске",
  "Повышенный расход масла",
  "Потеря мощности",
  "Не могут найти причину в других сервисах",
].map((title, index) => ({ id: `default-problem-${index}`, title }));

const heroBenefits = [
  "Узкая специализация на VAG",
  "Оригинальные запчасти и аналоги",
  "Без навязанных работ",
  "Прямое общение с мастером",
];

const whyPoints = [
  "Работаем с Volkswagen, Audi, Škoda, SEAT",
  "Находим причину, а не просто симптомы",
  "Внимательно относимся к каждой машине",
  "Ремонт без временных решений",
];

const bookingServiceTypes = [
  "Диагностика",
  "ТО",
  "Ремонт двигателя",
  "Ремонт DSG",
  "Подвеска",
  "Тормозная система",
  "Электрика",
  "Другое",
];

const initialLead = {
  client_name: "",
  client_phone: "",
  car_brand: "",
  car_model: "",
  car_year: "",
  license_plate: "",
  mileage: "",
  service_type: "Диагностика",
  problem_description: "",
  preferred_date: getTodayDate(),
  preferred_time: "",
  client_comment: "",
  personal_data_agreement: false,
};

const resourceConfig = {
  "content-blocks": {
    title: "Блоки контента",
    hint: "Hero, тексты секций и порядок отображения на сайте.",
    fields: [
      { name: "section", label: "Секция" },
      { name: "title", label: "Заголовок" },
      { name: "subtitle", label: "Подзаголовок" },
      { name: "body", label: "Текст", type: "textarea" },
      { name: "sort_order", label: "Порядок", type: "number" },
      { name: "is_active", label: "Активен", type: "checkbox" },
    ],
  },
  services: {
    title: "Услуги",
    hint: "Карточки услуг публичного сайта.",
    fields: [
      { name: "title", label: "Название" },
      { name: "description", label: "Описание", type: "textarea" },
      { name: "icon", label: "Иконка" },
      { name: "sort_order", label: "Порядок", type: "number" },
      { name: "is_active", label: "Активна", type: "checkbox" },
    ],
  },
  problems: {
    title: "Проблемы",
    hint: "Симптомы и частые обращения клиентов.",
    fields: [
      { name: "title", label: "Текст" },
      { name: "sort_order", label: "Порядок", type: "number" },
      { name: "is_active", label: "Активна", type: "checkbox" },
    ],
  },
  contacts: {
    title: "Контакты",
    hint: "Телефон, адрес, график и ссылки.",
    fields: [
      { name: "label", label: "Название" },
      { name: "value", label: "Значение" },
      { name: "type", label: "Тип" },
      { name: "href", label: "Ссылка" },
      { name: "sort_order", label: "Порядок", type: "number" },
      { name: "is_active", label: "Активен", type: "checkbox" },
    ],
  },
};

const resourceKeys = Object.keys(resourceConfig);

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (nextPath) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (path === "/admin/login") {
    return <LoginPage navigate={navigate} />;
  }

  if (path === "/admin/dashboard") {
    return <AdminDashboard navigate={navigate} />;
  }

  return <PublicLanding navigate={navigate} />;
}

function PublicLanding({ navigate }) {
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [lead, setLead] = useState(initialLead);
  const [leadStatus, setLeadStatus] = useState({ type: "", text: "" });
  const [slots, setSlots] = useState([]);
  const [slotsStatus, setSlotsStatus] = useState("");

  useEffect(() => {
    api
      .getSite()
      .then((payload) => {
        setSite(payload);
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const blocks = useMemo(() => {
    return Object.fromEntries((site?.contentBlocks || []).map((block) => [block.section, block]));
  }, [site]);

  const contacts = site?.contacts || [];
  const services = (site?.services?.length ? site.services : defaultServices).map((service, index) => ({
    ...service,
    title: normalizeServiceTitle(service.title, index),
    description: service.description || serviceFallbacks[index] || serviceFallbacks.at(-1),
  }));
  const problems = site?.problems?.length ? site.problems : defaultProblems;
  const phoneHref = findContactHref(contacts, "phone");

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!lead.preferred_date) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    setSlotsStatus("Проверяем доступное время...");

    api
      .getBookingSlots(lead.preferred_date)
      .then((payload) => {
        if (!cancelled) {
          setSlots(payload.slots || []);
          setSlotsStatus("");
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setSlots([]);
          setSlotsStatus(requestError.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [lead.preferred_date]);

  const submitLead = async (event) => {
    event.preventDefault();

    if (!lead.preferred_time) {
      setLeadStatus({ type: "error", text: "Выберите желаемое время визита." });
      return;
    }

    setLeadStatus({ type: "info", text: "Отправляем заявку..." });

    try {
      await api.submitLead(lead);
      setLead({ ...initialLead, preferred_date: lead.preferred_date });
      setLeadStatus({
        type: "success",
        text: "Заявка отправлена. Администратор свяжется с вами для подтверждения.",
      });
    } catch (requestError) {
      setLeadStatus({ type: "error", text: requestError.message });
    }
  };

  if (loading) {
    return <LoadingScreen text="Загружаем Ber Car" />;
  }

  return (
    <main className="page">
      <header className="site-header">
        <div className="container nav">
          <a href="#top" className="brand" aria-label="Ber Car" onClick={closeMenu}>
            <img src={berCarLogo} alt="" />
            <span>Ber Car</span>
          </a>

          <nav className={`nav-links ${menuOpen ? "is-open" : ""}`} aria-label="Основная навигация">
            <a href="#services" onClick={closeMenu}>Услуги</a>
            <a href="#approach" onClick={closeMenu}>Подход</a>
            <a href="#problems" onClick={closeMenu}>Проблемы</a>
            <a href="#contacts" onClick={closeMenu}>Контакты</a>
            <button type="button" onClick={() => navigate("/admin/login")}>Админка</button>
          </nav>

          <div className="nav-actions">
            <a href={phoneHref} className="nav-phone">
              <Phone size={17} aria-hidden="true" />
              Позвонить
            </a>
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>

      {error ? <div className="api-warning">API: {error}</div> : null}

      <section className="hero" id="top">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">VAG сервис в Калуге</p>
            <h1>Профессиональный ремонт VAG автомобилей в Калуге</h1>
            <p className="hero-subtitle">Решаем сложные неисправности и делаем как для себя</p>
            <p className="hero-lead">
              Volkswagen, Audi, Škoda, SEAT — точная диагностика, качественный ремонт и подбор
              запчастей без лишних работ.
            </p>

            <div className="hero-actions" aria-label="Основные действия">
              <a href="#contacts" className="button button-primary">
                Записаться
                <ArrowRight size={18} aria-hidden="true" />
              </a>
              <a href="#services" className="button button-secondary">Смотреть услуги</a>
            </div>

            <div className="hero-benefits">
              {heroBenefits.map((benefit) => (
                <span key={benefit}>
                  <Check size={16} aria-hidden="true" />
                  {benefit}
                </span>
              ))}
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-car-scene">
              <div className="hero-car-card">
                <img src={berCarLogo} alt="" />
                <div className="hero-card-copy">
                  <span>Ber Car workshop</span>
                  <strong>VAG diagnostics</strong>
                </div>
              </div>
              <div className="hero-tech-card">
                <span>Слот сегодня</span>
                <strong>60 мин</strong>
              </div>
              <span className="hero-badge top">Volkswagen / Audi</span>
              <span className="hero-badge bottom">Запись по слотам</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section why" id="why">
        <div className="container why-grid">
          <div>
            <p className="eyebrow">Почему Ber Car</p>
            <h2>Почему владельцы VAG выбирают Ber Car</h2>
          </div>
          <div className="why-card">
            <p>
              Мы не большой потоковый сервис — у нас вы общаетесь напрямую с мастером, который
              разбирается в VAG и отвечает за результат.
            </p>
            <div className="why-points">
              {whyPoints.map((point) => (
                <span key={point}>
                  <Check size={17} aria-hidden="true" />
                  {point}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section services" id="services">
        <div className="container">
          <SectionHeading
            eyebrow="Услуги"
            title="Все важное для Volkswagen, Audi, Škoda и SEAT"
            text="Работаем аккуратно, объясняем варианты и не превращаем ремонт в список лишних замен."
          />

          <div className="services-grid">
            {services.map((service, index) => {
              const Icon = iconMap[service.icon] || Wrench;

              return (
                <article className="service-card" key={service.id || service.title}>
                  <span className="service-index">{String(index + 1).padStart(2, "0")}</span>
                  <Icon size={28} strokeWidth={1.9} aria-hidden="true" />
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section approach" id="approach">
        <div className="container approach-grid">
          <div className="approach-copy">
            <p className="eyebrow">Подход</p>
            <h2>Сначала причина. Потом ремонт.</h2>
            <p>
              Слушаем симптомы, проверяем данные, показываем найденную причину и согласуем работы
              до начала ремонта. Без догадок, спешки и временных решений.
            </p>
          </div>

          <div className="steps">
            {["Разговор с мастером", "Диагностика и проверка", "Понятная смета", "Качественный ремонт"].map(
              (step, index) => (
                <div className="step" key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{step}</p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="section problems" id="problems">
        <div className="container problems-grid">
          <div>
            <p className="eyebrow">Какие проблемы решаем</p>
            <h2>Когда машина подает знак, лучше не ждать.</h2>
          </div>

          <ul className="problem-list">
            {problems.map((problem) => (
              <li key={problem.id || problem.title}>
                <Sparkles size={18} aria-hidden="true" />
                {normalizeProblemTitle(problem.title)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section parts">
        <div className="container parts-inner">
          <p className="eyebrow">{blocks.parts?.subtitle || "Запчасти"}</p>
          <h2>{blocks.parts?.title || "Оригинальные запчасти и качественные аналоги"}</h2>
          <p>
            {blocks.parts?.body ||
              "Работаем с оригинальными запчастями и качественными аналогами. Подбираем оптимальный вариант под задачу и бюджет."}
          </p>
        </div>
      </section>

      <section className="section contacts" id="contacts">
        <div className="container contact-grid">
          <div className="contact-copy">
            <p className="eyebrow">Заявка</p>
            <h2>Опишите задачу — мастер подскажет следующий шаг.</h2>
            <p>Оставьте контакты, модель автомобиля и симптомы. Мы свяжемся с вами и сориентируем по диагностике.</p>

            <div className="contact-items">
              {contacts.map((contact) => (
                <a href={contact.href || "#contacts"} key={contact.id}>
                  {contactIcon(contact.type)}
                  <span>
                    <small>{contact.label}</small>
                    {contact.value}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <form className="lead-form" onSubmit={submitLead}>
            <label>
              Имя клиента
              <input
                type="text"
                placeholder="Иван"
                value={lead.client_name}
                onChange={(event) => setLead({ ...lead, client_name: event.target.value })}
                required
              />
            </label>
            <label>
              Телефон клиента
              <input
                type="tel"
                placeholder="+7"
                value={lead.client_phone}
                onChange={(event) => setLead({ ...lead, client_phone: event.target.value })}
                required
              />
            </label>
            <label>
              Марка авто
              <input
                type="text"
                placeholder="Audi"
                value={lead.car_brand}
                onChange={(event) => setLead({ ...lead, car_brand: event.target.value })}
                required
              />
            </label>
            <label>
              Модель авто
              <input
                type="text"
                placeholder="A6"
                value={lead.car_model}
                onChange={(event) => setLead({ ...lead, car_model: event.target.value })}
                required
              />
            </label>
            <label>
              Год выпуска
              <input
                type="number"
                min="1980"
                max="2035"
                placeholder="2018"
                value={lead.car_year}
                onChange={(event) => setLead({ ...lead, car_year: event.target.value })}
                required
              />
            </label>
            <label>
              Госномер
              <input
                type="text"
                placeholder="А123ВС40"
                value={lead.license_plate}
                onChange={(event) => setLead({ ...lead, license_plate: event.target.value })}
              />
            </label>
            <label>
              Пробег
              <input
                type="number"
                min="0"
                placeholder="120000"
                value={lead.mileage}
                onChange={(event) => setLead({ ...lead, mileage: event.target.value })}
              />
            </label>
            <label>
              Тип услуги
              <select
                value={lead.service_type}
                onChange={(event) => setLead({ ...lead, service_type: event.target.value })}
                required
              >
                {bookingServiceTypes.map((type) => (
                  <option value={type} key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="lead-form-wide">
              Описание проблемы
              <textarea
                placeholder="Опишите симптомы, ошибки, звуки или недавний ремонт"
                value={lead.problem_description}
                onChange={(event) => setLead({ ...lead, problem_description: event.target.value })}
                required
              />
            </label>
            <label>
              Желаемая дата визита
              <input
                type="date"
                min={getTodayDate()}
                value={lead.preferred_date}
                onChange={(event) => setLead({ ...lead, preferred_date: event.target.value, preferred_time: "" })}
                required
              />
            </label>
            <div className="slot-picker">
              <span>Желаемое время визита</span>
              <div className="slot-grid">
                {slots.map((slot) => (
                  <button
                    type="button"
                    className={lead.preferred_time === slot.time ? "is-selected" : ""}
                    disabled={slot.isBusy}
                    key={slot.time}
                    onClick={() => setLead({ ...lead, preferred_time: slot.time })}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
              {slotsStatus ? <small>{slotsStatus}</small> : null}
              <input type="hidden" value={lead.preferred_time} required />
            </div>
            <label className="lead-form-wide">
              Комментарий клиента
              <textarea
                placeholder="Удобное время для звонка, дополнительные пожелания"
                value={lead.client_comment}
                onChange={(event) => setLead({ ...lead, client_comment: event.target.value })}
              />
            </label>
            <label className="agreement-field lead-form-wide">
              <input
                type="checkbox"
                checked={lead.personal_data_agreement}
                onChange={(event) => setLead({ ...lead, personal_data_agreement: event.target.checked })}
                required
              />
              <span>Согласен на обработку персональных данных</span>
            </label>
            <button type="submit" className="button button-primary">
              Отправить заявку на запись
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            {leadStatus.text ? <p className={`form-status ${leadStatus.type}`}>{leadStatus.text}</p> : null}
          </form>
        </div>
      </section>

      <section className="final-cta">
        <div className="container final-cta-inner">
          <div>
            <p className="eyebrow">Не откладывайте ремонт</p>
            <h2>Чем раньше найдена проблема — тем дешевле её решить.</h2>
          </div>
          <a href="#contacts" className="button button-primary">
            Записаться на диагностику
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </div>
      </section>
    </main>
  );
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

function LoginPage({ navigate }) {
  const [form, setForm] = useState({ email: "admin@bercar.local", password: "admin123" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.login(form);
      navigate("/admin/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-shell login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">
          <img src={berCarLogo} alt="Ber Car" />
        </div>
        <p className="admin-kicker">Ber Car CMS</p>
        <h1>Вход в админку</h1>
        <p>Управление лендингом, контактами, услугами и заявками.</p>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="admin@bercar.local"
            required
          />
        </label>
        <label>
          Пароль
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            placeholder="Пароль"
            required
          />
        </label>
        <button type="submit" className="admin-primary-button" disabled={loading}>
          {loading ? <LoaderCircle size={17} aria-hidden="true" /> : <Save size={17} aria-hidden="true" />}
          {loading ? "Входим..." : "Войти"}
        </button>
        {error ? <span className="admin-message error">{error}</span> : null}
        <button type="button" className="admin-ghost-button" onClick={() => navigate("/")}>
          <ExternalLink size={17} aria-hidden="true" />
          На сайт
        </button>
      </form>
    </main>
  );
}

function AdminDashboard({ navigate }) {
  const [admin, setAdmin] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeResource, setActiveResource] = useState("content-blocks");

  useEffect(() => {
    api
      .me()
      .then((payload) => setAdmin(payload.admin))
      .catch(() => navigate("/admin/login"))
      .finally(() => setAuthLoading(false));
  }, [navigate]);

  const logout = async () => {
    await api.logout();
    navigate("/admin/login");
  };

  if (authLoading) {
    return <LoadingScreen text="Проверяем доступ" />;
  }

  if (!admin) {
    return null;
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src={berCarLogo} alt="" />
          <div>
            <strong>Ber Car</strong>
            <span>CMS</span>
          </div>
        </div>

        <nav aria-label="Разделы админки">
          {resourceKeys.map((key) => (
            <button
              type="button"
              className={key === activeResource ? "is-active" : ""}
              key={key}
              onClick={() => setActiveResource(key)}
            >
              {resourceConfig[key].title}
            </button>
          ))}
          <a href="#leads">Заявки</a>
        </nav>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div>
            <span>Администратор</span>
            <strong>{admin.email}</strong>
          </div>
          <nav>
            <button type="button" className="admin-ghost-button" onClick={() => navigate("/")}>
              <ExternalLink size={17} aria-hidden="true" />
              Сайт
            </button>
            <button type="button" className="admin-dark-button" onClick={logout}>
              <LogOut size={17} aria-hidden="true" />
              Выйти
            </button>
          </nav>
        </header>

        <div className="admin-content">
          <ResourceCrud resource={activeResource} />
          <LeadsPanel />
        </div>
      </section>
    </main>
  );
}

function ResourceCrud({ resource }) {
  const config = resourceConfig[resource];
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm(config));
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: "", text: "" });

  const load = async () => {
    const payload = await api.listResource(resource);
    setItems(payload.items);
  };

  useEffect(() => {
    setForm(emptyForm(config));
    setEditingId(null);
    setStatus({ type: "", text: "" });
    load().catch((error) => setStatus({ type: "error", text: error.message }));
  }, [resource]);

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ type: "info", text: "Сохраняем..." });

    try {
      const payload = serializeForm(config, form);

      if (editingId) {
        await api.updateResource(resource, editingId, payload);
      } else {
        await api.createResource(resource, payload);
      }

      await load();
      setForm(emptyForm(config));
      setEditingId(null);
      setStatus({ type: "success", text: "Сохранено" });
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    }
  };

  const edit = (item) => {
    setEditingId(item.id);
    setForm(
      Object.fromEntries(
        config.fields.map((field) => [
          field.name,
          field.type === "checkbox" ? Boolean(item[field.name]) : item[field.name] ?? "",
        ]),
      ),
    );
    setStatus({ type: "info", text: `Редактирование записи #${item.id}` });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    const confirmed = window.confirm("Удалить запись? Это действие нельзя отменить.");
    if (!confirmed) {
      return;
    }

    try {
      setStatus({ type: "info", text: "Удаляем..." });
      await api.deleteResource(resource, id);
      await load();
      setStatus({ type: "success", text: "Удалено" });
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm(config));
    setStatus({ type: "", text: "" });
  };

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <p className="admin-kicker">{editingId ? `Запись #${editingId}` : "Редактор"}</p>
          <h2>{config.title}</h2>
          <span>{config.hint}</span>
        </div>
        <button type="button" className="admin-ghost-button" onClick={resetForm}>
          Новая запись
        </button>
      </div>

      <form className="admin-form" onSubmit={submit}>
        {config.fields.map((field) => (
          <label className={field.type === "checkbox" ? "checkbox-field" : ""} key={field.name}>
            <span>{field.label}</span>
            {renderField(field, form, setForm)}
          </label>
        ))}
        <div className="admin-form-actions">
          <button type="submit" className="admin-primary-button">
            <Save size={17} aria-hidden="true" />
            {editingId ? "Сохранить" : "Создать"}
          </button>
          {status.text ? <p className={`admin-message ${status.type}`}>{status.text}</p> : null}
        </div>
      </form>

      <div className="records-list">
        {items.map((item) => (
          <article key={item.id}>
            <button type="button" className="record-main" onClick={() => edit(item)}>
              <strong>{item.title || item.label || item.section}</strong>
              <span>{item.subtitle || item.value || item.section || `#${item.id}`}</span>
            </button>
            <div className="record-actions">
              <button type="button" onClick={() => edit(item)}>Изменить</button>
              <button type="button" className="danger-button" aria-label="Удалить" onClick={() => remove(item.id)}>
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LeadsPanel() {
  const [leads, setLeads] = useState([]);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [drafts, setDrafts] = useState({});

  const load = async () => {
    const payload = await api.listLeads();
    setLeads(payload.items);
    setDrafts(
      Object.fromEntries(
        payload.items.map((lead) => [
          lead.id,
          {
            preferred_date: formatInputDate(lead.scheduled_start_at || lead.preferred_date),
            preferred_time: formatInputTime(lead.scheduled_start_at || lead.preferred_time),
            admin_comment: lead.admin_comment || "",
            cancel_reason: lead.cancel_reason || "",
            duration_minutes: lead.duration_minutes || 60,
          },
        ]),
      ),
    );
  };

  useEffect(() => {
    load().catch((error) => setStatus({ type: "error", text: error.message }));
  }, []);

  const updateLead = async (id, payload, successText) => {
    try {
      setStatus({ type: "info", text: "Обновляем заявку..." });
      await api.updateLead(id, payload);
      await load();
      setStatus({ type: "success", text: successText });
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    }
  };

  const removeLead = async (id) => {
    const confirmed = window.confirm("Удалить заявку? Это действие нельзя отменить.");
    if (!confirmed) {
      return;
    }

    try {
      await api.deleteLead(id);
      await load();
      setStatus({ type: "success", text: "Заявка удалена" });
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    }
  };

  const copyLead = async (lead) => {
    const text = formatLeadText(lead);
    await navigator.clipboard.writeText(text);
    setStatus({ type: "success", text: "Заявка скопирована" });
  };

  const copyPhone = async (phone) => {
    await navigator.clipboard.writeText(phone);
    setStatus({ type: "success", text: "Телефон скопирован" });
  };

  const testTelegram = async () => {
    try {
      await api.testTelegramNotification();
      setStatus({ type: "success", text: "Тестовое уведомление отправлено" });
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    }
  };

  return (
    <section className="admin-panel leads-panel" id="leads">
      <div className="panel-heading">
        <div>
          <p className="admin-kicker">CRM</p>
          <h2>Заявки</h2>
          <span>Новые обращения с формы сайта.</span>
        </div>
        <div className="panel-actions">
          <button
            type="button"
            className="admin-ghost-button"
            onClick={testTelegram}
          >
            <Send size={17} aria-hidden="true" />
            Telegram
          </button>
          <button
            type="button"
            className="admin-ghost-button"
            onClick={() => load().catch((error) => setStatus({ type: "error", text: error.message }))}
          >
            <RefreshCw size={17} aria-hidden="true" />
            Обновить
          </button>
        </div>
      </div>

      {status.text ? <p className={`admin-message ${status.type}`}>{status.text}</p> : null}

      <div className="leads-list">
        {leads.length === 0 ? <div className="empty-state">Заявок пока нет</div> : null}
        {leads.map((lead) => {
          const draft = drafts[lead.id] || {};
          const phone = lead.client_phone || lead.phone || "";
          const telegramHref = `https://t.me/${phone.replace(/[^\d]/g, "")}`;

          return (
            <article className={`lead-card status-${lead.status}`} key={lead.id}>
              <div className="lead-card-header">
                <div>
                  <span className={`status-pill ${lead.status}`}>{leadStatusLabel(lead.status)}</span>
                  <h3>{lead.client_name || lead.name}</h3>
                  <p>{formatDate(lead.created_at)} · обновлено {formatDate(lead.updated_at || lead.created_at)}</p>
                </div>
                <select
                  value={lead.status}
                  onChange={(event) => updateLead(lead.id, { status: event.target.value }, "Статус обновлен")}
                >
                  <option value="new">Новая</option>
                  <option value="contacted">Связались</option>
                  <option value="confirmed">Подтверждена</option>
                  <option value="rescheduled">Перенесена</option>
                  <option value="in_progress">В работе</option>
                  <option value="done">Готово</option>
                  <option value="cancelled">Отменена</option>
                </select>
              </div>

              <div className="lead-info-grid">
                <LeadInfo title="Клиент" items={[
                  ["Имя", lead.client_name || lead.name],
                  ["Телефон", phone],
                ]} />
                <LeadInfo title="Авто" items={[
                  ["Марка", lead.car_brand],
                  ["Модель", lead.car_model],
                  ["Год", lead.car_year],
                  ["Госномер", lead.license_plate],
                  ["Пробег", lead.mileage ? `${lead.mileage} км` : ""],
                ]} />
                <LeadInfo title="Запись" items={[
                  ["Услуга", lead.service_type],
                  ["Желаемая дата", formatShortDate(lead.preferred_date)],
                  ["Желаемое время", formatShortTime(lead.preferred_time)],
                  ["Подтверждено", formatDate(lead.scheduled_start_at)],
                ]} />
                <LeadInfo title="Проблема" items={[
                  ["Описание", lead.problem_description || lead.message],
                  ["Комментарий клиента", lead.client_comment],
                  ["Комментарий администратора", lead.admin_comment],
                ]} />
              </div>

              <div className="lead-actions">
                <a href={`tel:${phone}`} className="admin-ghost-button">
                  <Phone size={16} aria-hidden="true" />
                  Позвонить
                </a>
                <a href={telegramHref} target="_blank" rel="noreferrer" className="admin-ghost-button">
                  <Send size={16} aria-hidden="true" />
                  Telegram
                </a>
                <button type="button" className="admin-ghost-button" onClick={() => copyPhone(phone)}>
                  <Copy size={16} aria-hidden="true" />
                  Телефон
                </button>
                <button type="button" className="admin-ghost-button" onClick={() => copyLead(lead)}>
                  <Copy size={16} aria-hidden="true" />
                  Заявку
                </button>
              </div>

              <div className="lead-schedule">
                <label>
                  Дата
                  <input
                    type="date"
                    value={draft.preferred_date || ""}
                    onChange={(event) => setDrafts({
                      ...drafts,
                      [lead.id]: { ...draft, preferred_date: event.target.value },
                    })}
                  />
                </label>
                <label>
                  Время
                  <input
                    type="time"
                    value={draft.preferred_time || ""}
                    onChange={(event) => setDrafts({
                      ...drafts,
                      [lead.id]: { ...draft, preferred_time: event.target.value },
                    })}
                  />
                </label>
                <label>
                  Длительность
                  <input
                    type="number"
                    min="30"
                    step="15"
                    value={draft.duration_minutes || 60}
                    onChange={(event) => setDrafts({
                      ...drafts,
                      [lead.id]: { ...draft, duration_minutes: event.target.value },
                    })}
                  />
                </label>
                <label>
                  Комментарий администратора
                  <input
                    type="text"
                    value={draft.admin_comment || ""}
                    onChange={(event) => setDrafts({
                      ...drafts,
                      [lead.id]: { ...draft, admin_comment: event.target.value },
                    })}
                  />
                </label>
              </div>

              <div className="lead-actions lead-actions-primary">
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => updateLead(lead.id, { ...draft, action: "confirm" }, "Запись подтверждена")}
                >
                  Подтвердить запись
                </button>
                <button
                  type="button"
                  className="admin-dark-button"
                  onClick={() => updateLead(lead.id, { ...draft, action: "reschedule" }, "Запись перенесена")}
                >
                  Перенести
                </button>
                <button
                  type="button"
                  className="admin-ghost-button"
                  onClick={() => updateLead(lead.id, {
                    action: "cancel",
                    cancel_reason: draft.cancel_reason || window.prompt("Причина отмены") || "",
                  }, "Запись отменена")}
                >
                  Отменить
                </button>
                <a href={`/api/admin/leads/${lead.id}/calendar.ics`} className="admin-ghost-button">
                  <Calendar size={16} aria-hidden="true" />
                  Скачать .ics
                </a>
                <a href={`/api/admin/leads/${lead.id}/calendar.ics`} className="admin-ghost-button">
                  <Calendar size={16} aria-hidden="true" />
                  В календарь
                </a>
                <button type="button" className="danger-text-button" onClick={() => removeLead(lead.id)}>
                  <Trash2 size={16} aria-hidden="true" />
                  Удалить
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function LeadInfo({ title, items }) {
  return (
    <div className="lead-info">
      <h4>{title}</h4>
      {items.map(([label, value]) => (
        value ? (
          <p key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </p>
        ) : null
      ))}
    </div>
  );
}

function LoadingScreen({ text }) {
  return (
    <main className="loading-screen">
      <LoaderCircle size={32} aria-hidden="true" />
      <p>{text}</p>
    </main>
  );
}

function emptyForm(config) {
  return Object.fromEntries(
    config.fields.map((field) => [
      field.name,
      field.type === "checkbox" ? true : field.type === "number" ? 0 : "",
    ]),
  );
}

function serializeForm(config, form) {
  return Object.fromEntries(
    config.fields.map((field) => {
      const value = form[field.name];

      if (field.type === "number") {
        return [field.name, Number.parseInt(value || 0, 10)];
      }

      return [field.name, value];
    }),
  );
}

function renderField(field, form, setForm) {
  const value = form[field.name];

  if (field.type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
      />
    );
  }

  if (field.type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={value}
        onChange={(event) => setForm({ ...form, [field.name]: event.target.checked })}
      />
    );
  }

  return (
    <input
      type={field.type || "text"}
      value={value}
      onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
    />
  );
}

function normalizeServiceTitle(title, index) {
  const replacements = {
    "Диагностика VAG": "Диагностика",
    "Двигатель": "Ремонт двигателя",
    "DSG и трансмиссия": "Ремонт DSG",
    "Тормоза": "Тормозная система",
  };

  return replacements[title] || title || defaultServices[index]?.title || "Услуга";
}

function normalizeProblemTitle(title) {
  const replacements = {
    "DSG дергается, пинается или думает перед стартом": "Проблемы с DSG: рывки, пинки, задержки",
    "Стуки в подвеске и вибрации на скорости": "Стуки в подвеске",
    "Повышенный расход масла или топлива": "Повышенный расход масла",
    "Машина перестала ехать как раньше": "Потеря мощности",
  };

  return replacements[title] || title;
}

function findContactHref(contacts, type) {
  const contact = contacts.find((item) => item.type === type);
  return contact?.href || "#contacts";
}

function contactIcon(type) {
  if (type === "phone") {
    return <Phone size={21} aria-hidden="true" />;
  }

  if (type === "hours") {
    return <Clock size={21} aria-hidden="true" />;
  }

  if (type === "email") {
    return <Mail size={21} aria-hidden="true" />;
  }

  return <MapPin size={21} aria-hidden="true" />;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatInputDate(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

function formatInputTime(value) {
  if (!value) {
    return "";
  }

  if (String(value).includes("T")) {
    return new Date(value).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return String(value).slice(0, 5);
}

function formatShortDate(value) {
  if (!value) {
    return "";
  }

  return new Date(String(value).slice(0, 10)).toLocaleDateString("ru-RU");
}

function formatShortTime(value) {
  return value ? String(value).slice(0, 5) : "";
}

function leadStatusLabel(status) {
  const labels = {
    new: "Новая",
    contacted: "Связались",
    confirmed: "Подтверждена",
    rescheduled: "Перенесена",
    in_progress: "В работе",
    done: "Готово",
    cancelled: "Отменена",
  };

  return labels[status] || status;
}

function formatLeadText(lead) {
  return [
    `Заявка #${lead.id}`,
    `Клиент: ${lead.client_name || lead.name || ""}`,
    `Телефон: ${lead.client_phone || lead.phone || ""}`,
    `Авто: ${[lead.car_brand, lead.car_model, lead.car_year].filter(Boolean).join(" ")}`,
    lead.license_plate ? `Госномер: ${lead.license_plate}` : "",
    lead.mileage ? `Пробег: ${lead.mileage} км` : "",
    `Услуга: ${lead.service_type || ""}`,
    `Желаемое время: ${formatShortDate(lead.preferred_date)} ${formatShortTime(lead.preferred_time)}`,
    `Статус: ${leadStatusLabel(lead.status)}`,
    lead.problem_description ? `Проблема: ${lead.problem_description}` : "",
    lead.client_comment ? `Комментарий клиента: ${lead.client_comment}` : "",
    lead.admin_comment ? `Комментарий администратора: ${lead.admin_comment}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default App;
