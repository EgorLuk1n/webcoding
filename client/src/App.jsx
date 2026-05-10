import { useEffect, useMemo, useState } from "react";
import {
  BatteryCharging,
  Car,
  ChevronRight,
  CircleGauge,
  Clock,
  LoaderCircle,
  LogOut,
  MapPin,
  Phone,
  PlugZap,
  Settings,
  ShieldCheck,
  Trash2,
  Wrench,
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

const resourceConfig = {
  "content-blocks": {
    title: "Блоки контента",
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
    fields: [
      { name: "title", label: "Текст" },
      { name: "sort_order", label: "Порядок", type: "number" },
      { name: "is_active", label: "Активна", type: "checkbox" },
    ],
  },
  contacts: {
    title: "Контакты",
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
  const [lead, setLead] = useState({ name: "", phone: "", car: "", message: "" });
  const [leadStatus, setLeadStatus] = useState("");

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

  const hero = blocks.hero || {};
  const statement = blocks.statement || {};
  const parts = blocks.parts || {};
  const contacts = site?.contacts || [];

  const submitLead = async (event) => {
    event.preventDefault();
    setLeadStatus("Отправляем заявку...");

    try {
      await api.submitLead(lead);
      setLead({ name: "", phone: "", car: "", message: "" });
      setLeadStatus("Заявка отправлена. Мы свяжемся с вами.");
    } catch (requestError) {
      setLeadStatus(requestError.message);
    }
  };

  if (loading) {
    return <LoadingScreen text="Загружаем Ber Car" />;
  }

  return (
    <main className="page">
      <header className="site-header">
        <div className="container nav">
          <a href="#top" className="brand" aria-label="Ber Car">
            <img src={berCarLogo} alt="" />
            <span>Ber Car</span>
          </a>

          <nav className="nav-links" aria-label="Основная навигация">
            <a href="#services">Услуги</a>
            <a href="#diagnostics">Подход</a>
            <a href="#contacts">Контакты</a>
            <button type="button" onClick={() => navigate("/admin/login")}>
              Админка
            </button>
          </nav>

          <a href={findContactHref(contacts, "phone")} className="nav-phone">
            <Phone size={17} aria-hidden="true" />
            Позвонить
          </a>
        </div>
      </header>

      {error ? <div className="api-warning">API: {error}</div> : null}

      <section className="hero" id="top">
        <div className="container hero-inner">
          <p className="eyebrow">{hero.subtitle || "VAG сервис в Калуге"}</p>
          <h1>{hero.title || "Ber Car"}</h1>
          <p className="hero-lead">{hero.body}</p>

          <div className="hero-actions" aria-label="Основные действия">
            <a href="#contacts" className="link-action">
              Записаться
              <ChevronRight size={19} aria-hidden="true" />
            </a>
            <a href="#services" className="link-action link-action-muted">
              Смотреть услуги
              <ChevronRight size={19} aria-hidden="true" />
            </a>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <img src={berCarLogo} alt="" />
          </div>
        </div>
      </section>

      <section className="statement">
        <div className="container statement-inner">
          <p>{statement.body || statement.title}</p>
        </div>
      </section>

      <section className="section services" id="services">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Услуги</p>
            <h2>Все важное для VAG. В одном месте.</h2>
          </div>

          <div className="services-grid">
            {(site?.services || []).map((service) => {
              const Icon = iconMap[service.icon] || Wrench;

              return (
                <article className="service-card" key={service.id}>
                  <Icon size={28} strokeWidth={1.9} aria-hidden="true" />
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section diagnostics" id="diagnostics">
        <div className="container diagnostics-grid">
          <div className="diagnostics-copy">
            <p className="eyebrow">Подход</p>
            <h2>Сначала причина. Потом ремонт.</h2>
            <p>
              Мы не меняем детали вслепую. Сначала собираем симптомы, проверяем
              факты и только потом предлагаем работу, которая действительно
              нужна машине.
            </p>
          </div>

          <div className="steps">
            {["Слушаем симптомы", "Проверяем данные", "Показываем причину", "Согласуем ремонт"].map(
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

      <section className="section problems">
        <div className="container problems-grid">
          <div>
            <p className="eyebrow">Симптомы</p>
            <h2>Если машина подает знак, лучше не ждать.</h2>
          </div>

          <ul className="problem-list">
            {(site?.problems || []).map((problem) => (
              <li key={problem.id}>{problem.title}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section parts">
        <div className="container parts-inner">
          <p className="eyebrow">{parts.subtitle || "Запчасти"}</p>
          <h2>{parts.title}</h2>
          <p>{parts.body}</p>
        </div>
      </section>

      <section className="section contacts" id="contacts">
        <div className="container contact-grid">
          <div className="contact-copy">
            <p className="eyebrow">Контакты</p>
            <h2>Запишитесь в Ber Car.</h2>
            <p>Опишите симптомы, и мы подскажем ближайший разумный шаг.</p>

            <div className="contact-items">
              {contacts.map((contact) => (
                <p key={contact.id}>
                  {contactIcon(contact.type)}
                  {contact.value}
                </p>
              ))}
            </div>
          </div>

          <form className="form" onSubmit={submitLead}>
            <input
              type="text"
              placeholder="Ваше имя"
              value={lead.name}
              onChange={(event) => setLead({ ...lead, name: event.target.value })}
              required
            />
            <input
              type="tel"
              placeholder="Телефон"
              value={lead.phone}
              onChange={(event) => setLead({ ...lead, phone: event.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Марка и модель авто"
              value={lead.car}
              onChange={(event) => setLead({ ...lead, car: event.target.value })}
            />
            <textarea
              placeholder="Что беспокоит"
              value={lead.message}
              onChange={(event) => setLead({ ...lead, message: event.target.value })}
            />
            <button type="submit">
              Отправить заявку
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            {leadStatus ? <p className="form-status">{leadStatus}</p> : null}
          </form>
        </div>
      </section>
    </main>
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
        <img src={berCarLogo} alt="Ber Car" />
        <h1>Админка Ber Car</h1>
        <p>Войдите, чтобы редактировать лендинг и смотреть заявки.</p>
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          placeholder="Пароль"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Входим..." : "Войти"}
        </button>
        {error ? <span className="admin-error">{error}</span> : null}
        <button type="button" className="ghost-button" onClick={() => navigate("/")}>
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
      <header className="admin-header">
        <div>
          <span>Ber Car CMS</span>
          <strong>{admin.email}</strong>
        </div>
        <nav>
          <button type="button" onClick={() => navigate("/")}>
            Сайт
          </button>
          <button type="button" onClick={logout}>
            <LogOut size={17} aria-hidden="true" />
            Выйти
          </button>
        </nav>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
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
        </aside>

        <section className="admin-content">
          <ResourceCrud resource={activeResource} />
          <LeadsPanel />
        </section>
      </div>
    </main>
  );
}

function ResourceCrud({ resource }) {
  const config = resourceConfig[resource];
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm(config));
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");

  const load = async () => {
    const payload = await api.listResource(resource);
    setItems(payload.items);
  };

  useEffect(() => {
    setForm(emptyForm(config));
    setEditingId(null);
    setStatus("");
    load().catch((error) => setStatus(error.message));
  }, [resource]);

  const submit = async (event) => {
    event.preventDefault();
    setStatus("Сохраняем...");

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
      setStatus("Сохранено");
    } catch (error) {
      setStatus(error.message);
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
  };

  const remove = async (id) => {
    setStatus("Удаляем...");
    await api.deleteResource(resource, id);
    await load();
    setStatus("Удалено");
  };

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <h2>{config.title}</h2>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm(config));
          }}
        >
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
        <button type="submit">{editingId ? "Обновить" : "Создать"}</button>
        {status ? <p className="admin-status">{status}</p> : null}
      </form>

      <div className="admin-table">
        {items.map((item) => (
          <article key={item.id}>
            <button type="button" onClick={() => edit(item)}>
              <strong>{item.title || item.label || item.section}</strong>
              <span>#{item.id}</span>
            </button>
            <button type="button" aria-label="Удалить" onClick={() => remove(item.id)}>
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function LeadsPanel() {
  const [leads, setLeads] = useState([]);
  const [status, setStatus] = useState("");

  const load = async () => {
    const payload = await api.listLeads();
    setLeads(payload.items);
  };

  useEffect(() => {
    load().catch((error) => setStatus(error.message));
  }, []);

  const updateStatus = async (id, nextStatus) => {
    await api.updateLeadStatus(id, nextStatus);
    await load();
  };

  return (
    <section className="admin-panel leads-panel" id="leads">
      <div className="panel-heading">
        <h2>Заявки</h2>
        <button type="button" onClick={() => load().catch((error) => setStatus(error.message))}>
          Обновить
        </button>
      </div>

      {status ? <p className="admin-status">{status}</p> : null}

      <div className="leads-list">
        {leads.map((lead) => (
          <article key={lead.id}>
            <div>
              <strong>{lead.name}</strong>
              <span>{formatDate(lead.created_at)}</span>
            </div>
            <p>{lead.phone}</p>
            <p>{lead.car}</p>
            <p>{lead.message}</p>
            <select
              value={lead.status}
              onChange={(event) => updateStatus(lead.id, event.target.value)}
            >
              <option value="new">new</option>
              <option value="in_progress">in_progress</option>
              <option value="done">done</option>
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

  return <MapPin size={21} aria-hidden="true" />;
}

function formatDate(value) {
  return new Date(value).toLocaleString("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default App;
