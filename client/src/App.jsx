import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BatteryCharging,
  Car,
  Check,
  CircleGauge,
  Clock,
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
  const [lead, setLead] = useState({ name: "", phone: "", car: "", message: "" });
  const [leadStatus, setLeadStatus] = useState({ type: "", text: "" });

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

  const submitLead = async (event) => {
    event.preventDefault();
    setLeadStatus({ type: "info", text: "Отправляем заявку..." });

    try {
      await api.submitLead(lead);
      setLead({ name: "", phone: "", car: "", message: "" });
      setLeadStatus({ type: "success", text: "Заявка отправлена. Мы свяжемся с вами." });
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
            <div className="hero-orbit">
              <img src={berCarLogo} alt="" />
              <span className="hero-badge top">VAG only</span>
              <span className="hero-badge bottom">Диагностика сначала</span>
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
              Ваше имя
              <input
                type="text"
                placeholder="Иван"
                value={lead.name}
                onChange={(event) => setLead({ ...lead, name: event.target.value })}
                required
              />
            </label>
            <label>
              Телефон
              <input
                type="tel"
                placeholder="+7"
                value={lead.phone}
                onChange={(event) => setLead({ ...lead, phone: event.target.value })}
                required
              />
            </label>
            <label>
              Автомобиль
              <input
                type="text"
                placeholder="Audi A6, 2.0 TFSI"
                value={lead.car}
                onChange={(event) => setLead({ ...lead, car: event.target.value })}
              />
            </label>
            <label>
              Что беспокоит
              <textarea
                placeholder="Опишите симптомы, ошибки или недавний ремонт"
                value={lead.message}
                onChange={(event) => setLead({ ...lead, message: event.target.value })}
              />
            </label>
            <button type="submit" className="button button-primary">
              Отправить заявку
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

  const load = async () => {
    const payload = await api.listLeads();
    setLeads(payload.items);
  };

  useEffect(() => {
    load().catch((error) => setStatus({ type: "error", text: error.message }));
  }, []);

  const updateStatus = async (id, nextStatus) => {
    try {
      setStatus({ type: "info", text: "Обновляем статус..." });
      await api.updateLeadStatus(id, nextStatus);
      await load();
      setStatus({ type: "success", text: "Статус обновлен" });
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
        <button
          type="button"
          className="admin-ghost-button"
          onClick={() => load().catch((error) => setStatus({ type: "error", text: error.message }))}
        >
          <RefreshCw size={17} aria-hidden="true" />
          Обновить
        </button>
      </div>

      {status.text ? <p className={`admin-message ${status.type}`}>{status.text}</p> : null}

      <div className="leads-list">
        {leads.map((lead) => (
          <article key={lead.id}>
            <div className="lead-person">
              <strong>{lead.name}</strong>
              <span>{formatDate(lead.created_at)}</span>
            </div>
            <a href={`tel:${lead.phone}`}>{lead.phone}</a>
            <p>{lead.car || "Автомобиль не указан"}</p>
            <p>{lead.message || "Без сообщения"}</p>
            <select
              value={lead.status}
              onChange={(event) => updateStatus(lead.id, event.target.value)}
            >
              <option value="new">Новая</option>
              <option value="in_progress">В работе</option>
              <option value="done">Готово</option>
            </select>
          </article>
        ))}
      </div>
    </section>
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

function formatDate(value) {
  return new Date(value).toLocaleString("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default App;
