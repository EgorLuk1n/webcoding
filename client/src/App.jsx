import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
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
  "Регламентные работы и спокойный осмотр автомобиля без спешки.",
  "Нестабильная работа, расход масла, цепи, ГРМ и потеря мощности.",
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
  "Запчасти",
].map((title, index) => ({
  id: `default-service-${index}`,
  title,
  description: serviceFallbacks[index],
  icon: ["gauge", "wrench", "settings", "car", "shield", "gauge", "battery", "plug"][index],
}));

const serviceDetails = {
  "Диагностика": {
    points: ["Компьютерная проверка", "Поиск причины", "План ремонта"],
    featured: true,
    badge: "часто выбирают",
  },
  "Техническое обслуживание": {
    points: ["Масла и фильтры", "Проверка узлов", "Рекомендации"],
    featured: true,
  },
  "Ремонт двигателя": {
    points: ["Диагностика мотора", "Поиск неисправности", "Согласование ремонта"],
    featured: true,
  },
  "Ремонт DSG": {
    points: ["Проверка ошибок", "Адаптация", "Рекомендации"],
    featured: true,
    badge: "DSG",
  },
  "Подвеска": {
    points: ["Диагностика ходовой", "Поиск стуков", "Замена деталей"],
  },
  "Тормозная система": {
    points: ["Осмотр тормозов", "Замена расходников", "Проверка безопасности"],
  },
  "Электрика": {
    points: ["Поиск ошибок", "Проверка датчиков", "Диагностика цепей"],
  },
  "Запчасти": {
    points: ["Подбор вариантов", "Проверенные бренды", "Без лишних переплат"],
  },
};

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
  "Диагностика перед ремонтом",
  "Запчасти под бюджет",
  "Без навязанных работ",
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
  source: "form",
  quiz_data: null,
  personal_data_agreement: false,
};

const servicePageData = {
  "/services/dsg": {
    eyebrow: "DSG",
    title: "Ремонт и диагностика DSG в Калуге",
    subtitle: "Пинки, рывки, задержки переключений, ошибки коробки — проведём диагностику и предложим решение без лишних работ.",
    symptoms: ["Коробка пинается при переключениях", "Есть рывки при старте", "Задержка включения D/R", "Вибрации при разгоне", "Ошибки по коробке", "Пробуксовки", "Машина плохо трогается", "После замены масла стало хуже"],
    work: ["Диагностика DSG", "Проверка ошибок", "Адаптация DSG", "Замена масла", "Проверка мехатроника", "Проверка сцепления", "Подбор решения после диагностики"],
    steps: ["Опрос клиента", "Компьютерная диагностика", "Тест-драйв при необходимости", "Анализ ошибок и поведения коробки", "Объяснение результата", "Согласование ремонта"],
    cta: "Записаться на диагностику DSG",
  },
  "/services/diagnostics": {
    eyebrow: "Диагностика",
    title: "Диагностика VAG в Калуге",
    subtitle: "Компьютерная и механическая проверка Volkswagen, Audi, Škoda, SEAT перед ремонтом.",
    symptoms: ["Горит Check Engine", "Плавающая ошибка", "Потеря тяги", "Нестабильная работа", "Шумы и вибрации", "Проверка перед покупкой"],
    work: ["Чтение ошибок", "Проверка параметров", "Осмотр узлов", "Поиск причины", "Рекомендации по ремонту"],
    steps: ["Собираем симптомы", "Подключаем диагностику", "Проверяем механику", "Объясняем выводы", "Согласуем следующий шаг"],
    cta: "Записаться на диагностику",
  },
  "/services/maintenance": {
    eyebrow: "ТО",
    title: "Техническое обслуживание VAG",
    subtitle: "Регламентное обслуживание и проверка основных узлов без лишних замен.",
    symptoms: ["Подошёл срок ТО", "Нужна замена масла", "Проверка перед поездкой", "Неясная история обслуживания"],
    work: ["Масло и фильтры", "Жидкости", "Осмотр подвески", "Проверка тормозов", "Рекомендации по состоянию"],
    steps: ["Проверяем историю", "Подбираем расходники", "Выполняем ТО", "Осматриваем авто", "Отдаём рекомендации"],
    cta: "Записаться на ТО",
  },
  "/services/engine": {
    eyebrow: "Двигатель",
    title: "Ремонт двигателя VAG в Калуге",
    subtitle: "Диагностика троения, расхода масла, потери мощности и ошибок двигателя.",
    symptoms: ["Троит двигатель", "Расход масла", "Потеря мощности", "Плохой запуск", "Ошибки по смеси", "Посторонние звуки"],
    work: ["Диагностика двигателя", "Проверка параметров", "Поиск подсоса", "Проверка навесного", "Согласование ремонта"],
    steps: ["Фиксируем жалобу", "Читаем ошибки", "Проверяем параметры", "Находим причину", "Объясняем варианты"],
    cta: "Записаться по двигателю",
  },
  "/services/electric": {
    eyebrow: "Электрика",
    title: "Электрика VAG в Калуге",
    subtitle: "Ошибки, датчики, проводка, блоки управления и нестабильная работа электроники.",
    symptoms: ["Плавающие ошибки", "Не работает оборудование", "Проблемы с датчиками", "Разряжается АКБ", "Ошибки после ремонта"],
    work: ["Компьютерная диагностика", "Проверка питания", "Проверка проводки", "Поиск нестабильных ошибок", "Ремонт по согласованию"],
    steps: ["Собираем симптомы", "Проверяем ошибки", "Ищем причину", "Показываем результат", "Согласуем ремонт"],
    cta: "Записаться к электрику",
  },
};

const brandPages = {
  "/remont-volkswagen-kaluga": {
    brand: "Volkswagen",
    text: "Ber Car обслуживает и ремонтирует автомобили Volkswagen: диагностика, ТО, двигатель, DSG, подвеска, электрика и тормозная система.",
    problems: ["DSG пинается", "Горит Check Engine", "Потеря тяги", "Стуки в подвеске", "Ошибки по электрике"],
  },
  "/remont-audi-kaluga": {
    brand: "Audi",
    text: "Работаем с Audi аккуратно и по делу: сначала диагностика, затем понятный план ремонта и подбор запчастей под задачу.",
    problems: ["Ошибки по наддуву", "Нестабильная работа двигателя", "Рывки коробки", "Повышенный расход масла", "Электронные ошибки"],
  },
  "/remont-skoda-kaluga": {
    brand: "Škoda",
    text: "Помогаем владельцам Škoda с обслуживанием, диагностикой и ремонтом типовых VAG-узлов без лишних работ.",
    problems: ["Стуки ходовой", "Проблемы DSG", "Ошибки двигателя", "ТО после покупки", "Проверка перед дальней поездкой"],
  },
  "/remont-seat-kaluga": {
    brand: "SEAT",
    text: "Берёмся за SEAT на той же VAG-базе: диагностика, обслуживание, двигатель, коробка и электрика.",
    problems: ["Потеря мощности", "Ошибки по датчикам", "Рывки коробки", "Стуки подвески", "Проблемы после покупки"],
  },
};

const fallbackCases = [
  { id: "case-a4", car: "Audi A4 2.0 TFSI", car_year: 2016, mileage: 148000, problem: "Потеря мощности, ошибки по наддуву", work_done: "Диагностика, нашли причину, устранили неисправность.", result: "Автомобиль снова едет стабильно.", service: "Диагностика VAG" },
  { id: "case-tiguan", car: "Volkswagen Tiguan", car_year: 2018, mileage: 121000, problem: "Пинки DSG", work_done: "Диагностика коробки, проверка ошибок, адаптация.", result: "Переключения стали мягче, клиент получил рекомендации.", service: "Ремонт DSG" },
  { id: "case-octavia", car: "Škoda Octavia", car_year: 2017, mileage: 132000, problem: "Стуки в подвеске", work_done: "Диагностика ходовой, выявили изношенные элементы.", result: "Посторонние звуки устранены.", service: "Подвеска" },
];

const fallbackReviews = [
  { id: "review-1", client_name: "Алексей", car: "Volkswagen Tiguan", text: "Сначала сделали диагностику, объяснили варианты, лишнего не навязывали.", rating: 5 },
  { id: "review-2", client_name: "Марина", car: "Audi A4", text: "Спокойно показали причину ошибки и согласовали стоимость до ремонта.", rating: 5 },
  { id: "review-3", client_name: "Игорь", car: "Škoda Octavia", text: "Нашли стук, который долго не могли поймать. Машина стала тише.", rating: 5 },
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
  cases: {
    title: "Кейсы",
    hint: "Истории ремонтов для доверия на сайте.",
    fields: [
      { name: "car", label: "Автомобиль" },
      { name: "car_year", label: "Год", type: "number" },
      { name: "mileage", label: "Пробег", type: "number" },
      { name: "problem", label: "Проблема", type: "textarea" },
      { name: "work_done", label: "Что сделали", type: "textarea" },
      { name: "result", label: "Результат", type: "textarea" },
      { name: "service", label: "Услуга" },
      { name: "image_url", label: "Фото URL" },
      { name: "completed_at", label: "Дата", type: "date" },
      { name: "sort_order", label: "Порядок", type: "number" },
      { name: "is_active", label: "Активен", type: "checkbox" },
    ],
  },
  reviews: {
    title: "Отзывы",
    hint: "Отзывы клиентов для главной и страницы отзывов.",
    fields: [
      { name: "client_name", label: "Имя клиента" },
      { name: "car", label: "Автомобиль" },
      { name: "text", label: "Текст", type: "textarea" },
      { name: "rating", label: "Оценка", type: "number" },
      { name: "source", label: "Источник" },
      { name: "review_date", label: "Дата", type: "date" },
      { name: "sort_order", label: "Порядок", type: "number" },
      { name: "is_active", label: "Активен", type: "checkbox" },
    ],
  },
};

const resourceKeys = Object.keys(resourceConfig);

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const path = location.pathname;

  const navigate = (nextPath) => {
    routerNavigate(nextPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (path === "/bercar-control/login") {
    return <LoginPage navigate={navigate} />;
  }

  if (path === "/admin/login") {
    return <LegacyAdminRedirect navigate={navigate} />;
  }

  if (path.startsWith("/bercar-control/")) {
    return <AdminDashboard navigate={navigate} />;
  }

  return <PublicLanding navigate={navigate} path={path} />;
}

function PublicLanding({ navigate, path }) {
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [lead, setLead] = useState(initialLead);
  const [leadStatus, setLeadStatus] = useState({ type: "", text: "" });
  const [slots, setSlots] = useState([]);
  const [slotsStatus, setSlotsStatus] = useState("");
  const [logoClicks, setLogoClicks] = useState(0);
  const [quiz, setQuiz] = useState({
    brand: "Volkswagen",
    area: "DSG / коробка",
    symptom: "Пинки/рывки",
  });

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
  const cases = site?.cases?.length ? site.cases : fallbackCases;
  const reviews = site?.reviews?.length ? site.reviews : fallbackReviews;
  const services = (site?.services?.length ? site.services : defaultServices).map((service, index) => ({
    ...service,
    title: normalizeServiceTitle(service.title, index),
    description: service.description || serviceFallbacks[index] || serviceFallbacks.at(-1),
  }));
  const problems = site?.problems?.length ? site.problems : defaultProblems;
  const phoneHref = findContactHref(contacts, "phone");
  const visibleSlots = slots.filter((slot) => !slot.isPast);
  const hasSlots = !slotsStatus && visibleSlots.length > 0;
  const noSlotsToday = !slotsStatus && lead.preferred_date === getTodayDate() && visibleSlots.length === 0;
  const leadReady = isLeadReady(lead);
  const isHome = path === "/";
  const isServicesPage = path === "/services";
  const isBookingPage = path === "/booking";
  const isContactsPage = path === "/contacts";
  const isCasesPage = path === "/cases";
  const isReviewsPage = path === "/reviews";
  const servicePage = servicePageData[path];
  const brandPage = brandPages[path];

  useEffect(() => {
    const titles = {
      "/": "Ber Car — ремонт VAG автомобилей в Калуге",
      "/services": "Услуги Ber Car — VAG сервис в Калуге",
      "/services/dsg": "Ремонт DSG в Калуге — диагностика Volkswagen, Audi, Škoda, SEAT",
      "/cases": "Кейсы Ber Car — ремонт VAG в Калуге",
      "/reviews": "Отзывы Ber Car — VAG сервис в Калуге",
      "/contacts": "Контакты Ber Car в Калуге",
      "/booking": "Запись в Ber Car — диагностика и ремонт VAG",
    };
    document.title = titles[path] || (brandPage ? `Ремонт ${brandPage.brand} в Калуге — Ber Car` : "Ber Car — VAG сервис в Калуге");
  }, [path, brandPage]);

  const closeMenu = () => setMenuOpen(false);
  const goToSection = (sectionId) => {
    closeMenu();
    navigate("/");
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };
  const handleLogoClick = (event) => {
    event.preventDefault();
    const nextClicks = logoClicks + 1;
    setLogoClicks(nextClicks);

    if (nextClicks >= 5) {
      setLogoClicks(0);
      navigate("/bercar-control/login");
      return;
    }

    navigate("/");
  };

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
          setSlots((payload.slots || []).map((slot) => ({
            ...slot,
            isPast: isPastPreferredSlot(lead.preferred_date, slot.time),
          })));
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
  const applyQuiz = () => {
    const serviceByArea = {
      "Двигатель": "Ремонт двигателя",
      "DSG / коробка": "Ремонт DSG",
      "Подвеска": "Подвеска",
      "Электрика": "Электрика",
      "Тормоза": "Тормозная система",
      "ТО": "ТО",
      "Не знаю": "Диагностика",
    };

    setLead({
      ...lead,
      car_brand: quiz.brand === "Другое" ? lead.car_brand : quiz.brand,
      service_type: serviceByArea[quiz.area] || "Диагностика",
      problem_description: [quiz.area, quiz.symptom].filter(Boolean).join(": "),
      source: "quiz",
      quiz_data: quiz,
    });
    setLeadStatus({ type: "info", text: "Квиз перенесён в форму. Осталось указать контакты и удобное время." });
  };

  if (loading) {
    return <LoadingScreen text="Загружаем Ber Car" />;
  }

  return (
    <main className="page">
      <header className="site-header">
        <div className="container nav">
          <a href="/" className="brand" aria-label="Ber Car" onClick={handleLogoClick}>
            <img src={berCarLogo} alt="" />
            <span>Ber Car</span>
          </a>

          <nav className={`nav-links ${menuOpen ? "is-open" : ""}`} aria-label="Основная навигация">
            <button type="button" onClick={() => { closeMenu(); navigate("/"); }}>Главная</button>
            <button type="button" onClick={() => { closeMenu(); navigate("/services"); }}>Услуги</button>
            <button type="button" onClick={() => { closeMenu(); navigate("/services/dsg"); }}>DSG</button>
            <button type="button" onClick={() => { closeMenu(); navigate("/cases"); }}>Кейсы</button>
            <button type="button" onClick={() => { closeMenu(); navigate("/booking"); }}>Запись</button>
            <button type="button" onClick={() => { closeMenu(); navigate("/contacts"); }}>Контакты</button>
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

      {servicePage ? <ServiceDetailPage page={servicePage} navigate={navigate} /> : null}
      {brandPage ? <BrandSeoPage page={brandPage} navigate={navigate} /> : null}
      {isCasesPage ? <CasesPage cases={cases} navigate={navigate} /> : null}
      {isReviewsPage ? <ReviewsPage reviews={reviews} navigate={navigate} /> : null}

      {isHome ? <section className="hero" id="top">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">VAG сервис в Калуге</p>
            <h1>
              <span className="desktop-title">Профессиональный ремонт VAG в Калуге</span>
              <span className="mobile-title">Ремонт VAG в Калуге</span>
            </h1>
            <p className="hero-subtitle">
              <span className="desktop-title">Диагностика, обслуживание и ремонт без лишних работ</span>
              <span className="mobile-title">Диагностика и ремонт без лишних работ</span>
            </p>
            <p className="hero-lead">
              <span className="desktop-title">Volkswagen, Audi, Škoda, SEAT — точная диагностика, честный ремонт и подбор запчастей под задачу и бюджет.</span>
              <span className="mobile-title">Volkswagen, Audi, Škoda и SEAT — найдём причину неисправности и предложим понятное решение.</span>
            </p>

            <div className="hero-actions" aria-label="Основные действия">
              <button type="button" className="button button-primary" onClick={() => navigate("/booking")}>
                Записаться
                <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button type="button" className="button button-secondary" onClick={() => navigate("/services")}>Смотреть услуги</button>
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
            <div className="hero-image-card">
              <img
                src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=82"
                alt=""
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section> : null}

      {isHome ? <section className="section why" id="why">
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
      </section> : null}

      {(isHome || isServicesPage) ? <section className={`section services ${isServicesPage ? "route-section" : ""}`} id="services">
        <div className="container">
          <SectionHeading
            eyebrow="Услуги"
            title="Всё для обслуживания VAG в одном месте"
            text="Диагностика, обслуживание и ремонт Volkswagen, Audi, Škoda и SEAT в Калуге — без лишних работ и случайных решений."
          />

          <div className="services-grid">
            {services.map((service, index) => {
              const Icon = iconMap[service.icon] || Wrench;
              const detail = serviceDetails[service.title] || {};
              const detailPath = serviceDetailPath(service.title);

              return (
                <article className={`service-card ${detail.featured ? "is-featured" : ""}`} key={service.id || service.title}>
                  <div className="service-card-top">
                    <span className="service-icon"><Icon size={24} strokeWidth={1.9} aria-hidden="true" /></span>
                    <span className="service-index">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  {detail.badge ? <span className="service-badge">{detail.badge}</span> : null}
                  <div className="service-card-body">
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <ul>
                      {(detail.points || []).map((point) => <li key={point}>{point}</li>)}
                    </ul>
                  </div>
                  <div className="service-actions">
                    <button type="button" onClick={() => navigate("/booking")}>Записаться</button>
                    {detailPath ? (
                      <button type="button" className="service-more" onClick={() => navigate(detailPath)}>Подробнее →</button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section> : null}

      {(isHome || isServicesPage) ? <section className="section approach" id="approach">
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
            {["Заявка", "Созвон", "Диагностика", "Согласование", "Ремонт", "Выдача авто"].map(
              (step, index) => (
                <div className="step" key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{step}</p>
                </div>
              ),
            )}
          </div>
        </div>
      </section> : null}

      {isHome ? <section className="section problems" id="problems">
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
      </section> : null}

      {isHome ? <section className="section dsg-feature">
        <div className="container feature-grid">
          <div>
            <p className="eyebrow">DSG</p>
            <h2>Рывки и пинки коробки не лечатся догадками.</h2>
            <p>Сначала проводим диагностику, смотрим ошибки и поведение коробки, затем объясняем варианты решения.</p>
          </div>
          <button type="button" className="button button-primary" onClick={() => navigate("/services/dsg")}>
            Подробнее про DSG
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section> : null}

      {isHome ? <CasesPreview cases={cases.slice(0, 3)} navigate={navigate} /> : null}
      {isHome ? <ReviewsPreview reviews={reviews.slice(0, 3)} navigate={navigate} /> : null}

      {isHome ? <section className="section parts">
        <div className="container parts-inner">
          <p className="eyebrow">{blocks.parts?.subtitle || "Запчасти"}</p>
          <h2>{blocks.parts?.title || "Оригинальные запчасти и качественные аналоги"}</h2>
          <p>
            {blocks.parts?.body ||
              "Работаем с оригинальными запчастями и качественными аналогами. Подбираем оптимальный вариант под задачу и бюджет."}
          </p>
        </div>
      </section> : null}

      {isHome ? <section className="section faq">
        <div className="container faq-grid">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>Частые вопросы владельцев VAG</h2>
          </div>
          <div className="faq-list">
            {[
              ["Можно приехать только на диагностику?", "Да. Сначала находим причину, затем обсуждаем ремонт и запчасти."],
              ["Вы ставите аналоги?", "Да, если аналог качественный и подходит под задачу. Всегда объясняем разницу."],
              ["Слот на сайте точно подтвержден?", "Нет. Вы выбираете желаемое время, администратор подтверждает запись после звонка."],
              ["Беретесь за сложные ошибки?", "Да. Мы специализируемся на VAG и работаем с нестабильными, плавающими неисправностями."],
            ].map(([question, answer]) => (
              <article key={question}>
                <h3>{question}</h3>
                <p>{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section> : null}

      {(isHome || isBookingPage || isContactsPage || servicePage || brandPage) ? <section className={`section contacts ${(isBookingPage || isContactsPage || servicePage || brandPage) ? "route-section" : ""}`} id="contacts">
        <div className="container contact-grid">
          <div className="contact-copy">
            <p className="eyebrow">{isContactsPage ? "Контакты" : "Запись"}</p>
            <h2>{isContactsPage ? "Ber Car в Калуге" : "Выберите удобное время для диагностики или ремонта."}</h2>
            <p>{isContactsPage ? "Свяжитесь с мастером напрямую или оставьте заявку на отдельной странице записи." : "Вы выбираете желаемое время. Администратор подтвердит запись после звонка."}</p>

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

          {!isContactsPage ? <form className="lead-form" onSubmit={submitLead}>
            <div className="quiz-box">
              <div>
                <p className="eyebrow">Квиз</p>
                <h3>Что случилось с машиной?</h3>
                <span>Ответьте на три вопроса — мы подставим услугу и описание в заявку.</span>
              </div>
              <label>
                Марка
                <select value={quiz.brand} onChange={(event) => setQuiz({ ...quiz, brand: event.target.value })}>
                  {["Volkswagen", "Audi", "Škoda", "SEAT", "Другое"].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label>
                Что беспокоит
                <select value={quiz.area} onChange={(event) => setQuiz({ ...quiz, area: event.target.value })}>
                  {["Двигатель", "DSG / коробка", "Подвеска", "Электрика", "Тормоза", "ТО", "Не знаю"].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label>
                Как проявляется
                <select value={quiz.symptom} onChange={(event) => setQuiz({ ...quiz, symptom: event.target.value })}>
                  {["Горит ошибка", "Стук/шум", "Пинки/рывки", "Потеря мощности", "Течь/запах", "Другое"].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <button type="button" className="button button-secondary" onClick={applyQuiz}>Заполнить форму по квизу</button>
            </div>
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
                {visibleSlots.map((slot) => (
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
              {noSlotsToday ? <small>На сегодня свободных слотов больше нет</small> : null}
              {!slotsStatus && !noSlotsToday && !hasSlots ? <small>Свободных слотов на выбранную дату нет</small> : null}
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
            <button type="submit" className="button button-primary" disabled={!leadReady}>
              Отправить заявку на запись
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            {leadStatus.text ? <p className={`form-status ${leadStatus.type}`}>{leadStatus.text}</p> : null}
          </form> : <div className="map-placeholder">
            <MapPin size={26} aria-hidden="true" />
            <strong>Калуга</strong>
            <span>Точный адрес можно указать в контактах админки.</span>
            <button type="button" className="button button-primary" onClick={() => navigate("/booking")}>Записаться</button>
          </div>}
        </div>
      </section> : null}

      {isHome ? <section className="final-cta">
        <div className="container final-cta-inner">
          <div>
            <p className="eyebrow">Не откладывайте ремонт</p>
            <h2>Чем раньше найдена проблема — тем дешевле её решить.</h2>
          </div>
          <button type="button" className="button button-primary" onClick={() => navigate("/booking")}>
            Записаться на диагностику
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section> : null}
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

function ServiceDetailPage({ page, navigate }) {
  return (
    <section className="section route-section detail-page">
      <div className="container detail-hero">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p>{page.subtitle}</p>
        <button type="button" className="button button-primary" onClick={() => navigate("/booking")}>
          {page.cta}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="container detail-grid">
        <DetailList title="Когда стоит обратиться" items={page.symptoms} />
        <DetailList title="Что делаем" items={page.work} />
        <DetailList title="Как проходит работа" items={page.steps} ordered />
      </div>
    </section>
  );
}

function BrandSeoPage({ page, navigate }) {
  return (
    <section className="section route-section detail-page">
      <div className="container detail-hero">
        <p className="eyebrow">VAG в Калуге</p>
        <h1>Ремонт {page.brand} в Калуге</h1>
        <p>{page.text}</p>
        <button type="button" className="button button-primary" onClick={() => navigate("/booking")}>
          Записаться
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="container detail-grid">
        <DetailList title={`Частые проблемы ${page.brand}`} items={page.problems} />
        <DetailList title="Какие услуги выполняем" items={["Диагностика", "ТО", "Двигатель", "DSG", "Подвеска", "Электрика", "Тормоза"]} />
        <DetailList title="Почему Ber Car" items={heroBenefits} />
      </div>
    </section>
  );
}

function DetailList({ title, items, ordered = false }) {
  const Tag = ordered ? "ol" : "ul";

  return (
    <article className="detail-card">
      <h2>{title}</h2>
      <Tag>
        {items.map((item) => <li key={item}>{item}</li>)}
      </Tag>
    </article>
  );
}

function CasesPage({ cases, navigate }) {
  return (
    <section className="section route-section cases-page">
      <div className="container">
        <SectionHeading eyebrow="Кейсы" title="Реальные обращения в Ber Car" text="Показываем проблему, что сделали и какой результат получил владелец." />
        <CaseGrid cases={cases} />
        <button type="button" className="button button-primary" onClick={() => navigate("/booking")}>Записаться на диагностику</button>
      </div>
    </section>
  );
}

function ReviewsPage({ reviews, navigate }) {
  return (
    <section className="section route-section reviews-page">
      <div className="container">
        <SectionHeading eyebrow="Отзывы" title="Что говорят владельцы VAG" text="Спокойные реальные впечатления без лишней рекламы." />
        <ReviewGrid reviews={reviews} />
        <button type="button" className="button button-primary" onClick={() => navigate("/booking")}>Оставить заявку</button>
      </div>
    </section>
  );
}

function CasesPreview({ cases, navigate }) {
  return (
    <section className="section cases-page">
      <div className="container">
        <SectionHeading eyebrow="Кейсы" title="Как мы подходим к ремонту" text="Коротко о задачах, где сначала нужна нормальная диагностика, а потом решение." />
        <CaseGrid cases={cases} />
        <button type="button" className="button button-secondary" onClick={() => navigate("/cases")}>Все кейсы</button>
      </div>
    </section>
  );
}

function ReviewsPreview({ reviews, navigate }) {
  return (
    <section className="section reviews-page">
      <div className="container">
        <SectionHeading eyebrow="Отзывы" title="Доверие складывается из понятных деталей" text="Мы объясняем работу до ремонта и не превращаем диагностику в список лишних замен." />
        <ReviewGrid reviews={reviews} />
        <button type="button" className="button button-secondary" onClick={() => navigate("/reviews")}>Все отзывы</button>
      </div>
    </section>
  );
}

function CaseGrid({ cases }) {
  return (
    <div className="case-grid">
      {cases.map((item) => (
        <article className="case-card" key={item.id || `${item.car}-${item.problem}`}>
          <span>{item.service || "VAG сервис"}</span>
          <h3>{item.car}</h3>
          <p><strong>Проблема:</strong> {item.problem}</p>
          <p><strong>Что сделали:</strong> {item.work_done}</p>
          <p><strong>Результат:</strong> {item.result}</p>
        </article>
      ))}
    </div>
  );
}

function ReviewGrid({ reviews }) {
  return (
    <div className="review-grid">
      {reviews.map((item) => (
        <article className="review-card" key={item.id || `${item.client_name}-${item.car}`}>
          <span>{"★".repeat(Number(item.rating || 5))}</span>
          <p>{item.text}</p>
          <strong>{item.client_name}</strong>
          <small>{item.car}</small>
        </article>
      ))}
    </div>
  );
}

function LegacyAdminRedirect({ navigate }) {
  useEffect(() => {
    navigate("/bercar-control/login");
  }, [navigate]);

  return <LoadingScreen text="Открываем вход" />;
}

function LoginPage({ navigate }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.login(form);
      navigate("/bercar-control/dashboard");
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
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const section = location.pathname.split("/").at(-1) || "dashboard";
  const resourceBySection = {
    content: "content-blocks",
    services: "services",
    cases: "cases",
    reviews: "reviews",
    contacts: "contacts",
    settings: "content-blocks",
  };
  const activeResource = resourceBySection[section] || "content-blocks";

  useEffect(() => {
    api
      .me()
      .then((payload) => setAdmin(payload.admin))
      .catch(() => navigate("/bercar-control/login"))
      .finally(() => setAuthLoading(false));
  }, [navigate]);

  const logout = async () => {
    await api.logout();
    navigate("/bercar-control/login");
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
          {[
            ["dashboard", "Dashboard"],
            ["leads", "Заявки"],
            ["calendar", "Календарь"],
            ["services", "Услуги"],
            ["cases", "Кейсы"],
            ["reviews", "Отзывы"],
            ["content", "Контент"],
            ["contacts", "Контакты"],
            ["settings", "Настройки"],
          ].map(([key, label]) => (
            <button
              type="button"
              className={section === key ? "is-active" : ""}
              key={key}
              onClick={() => navigate(`/bercar-control/${key}`)}
            >
              {label}
            </button>
          ))}
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
          {section === "dashboard" ? <DashboardPanel navigate={navigate} /> : null}
          {section === "leads" ? <LeadsPanel /> : null}
          {section === "calendar" ? <CalendarPanel /> : null}
          {resourceBySection[section] ? <ResourceCrud resource={activeResource} /> : null}
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
              <strong>{item.title || item.label || item.section || item.car || item.client_name}</strong>
              <span>{item.subtitle || item.value || item.problem || item.text || item.section || `#${item.id}`}</span>
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

function DashboardPanel({ navigate }) {
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState({ type: "", text: "" });

  useEffect(() => {
    api.dashboard()
      .then(setPayload)
      .catch((error) => setStatus({ type: "error", text: error.message }));
  }, []);

  const stats = payload?.stats || {};

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <p className="admin-kicker">Обзор</p>
          <h2>Dashboard</h2>
          <span>Заявки, записи и быстрый контроль сервиса.</span>
        </div>
        <button type="button" className="admin-primary-button" onClick={() => navigate("/bercar-control/leads")}>Открыть заявки</button>
      </div>
      {status.text ? <p className={`admin-message ${status.type}`}>{status.text}</p> : null}
      <div className="stats-grid">
        <StatCard label="Новые заявки" value={stats.new_leads || 0} />
        <StatCard label="На сегодня" value={stats.today_leads || 0} />
        <StatCard label="Подтверждены" value={stats.confirmed || 0} />
        <StatCard label="Отменены" value={stats.cancelled || 0} />
      </div>
      <div className="records-list">
        {(payload?.latest || []).map((lead) => (
          <article key={lead.id}>
            <button type="button" className="record-main" onClick={() => navigate("/bercar-control/leads")}>
              <strong>{lead.client_name || lead.name}</strong>
              <span>{[lead.car_brand, lead.car_model, lead.service_type].filter(Boolean).join(" · ")}</span>
            </button>
            <span className={`status-pill ${lead.status}`}>{leadStatusLabel(lead.status)}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function CalendarPanel() {
  const [date, setDate] = useState(getTodayDate());
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState({ type: "", text: "" });

  useEffect(() => {
    api.calendar(date)
      .then((payload) => {
        setItems(payload.items || []);
        setStatus({ type: "", text: "" });
      })
      .catch((error) => setStatus({ type: "error", text: error.message }));
  }, [date]);

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <p className="admin-kicker">Календарь</p>
          <h2>Записи по дням</h2>
          <span>Занятые слоты, новые заявки и подтвержденные записи.</span>
        </div>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>
      {status.text ? <p className={`admin-message ${status.type}`}>{status.text}</p> : null}
      <div className="calendar-list">
        {items.length === 0 ? <div className="empty-state">На выбранный день записей нет</div> : null}
        {items.map((lead) => (
          <article key={lead.id} className={`calendar-item status-${lead.status}`}>
            <strong>{formatShortTime(lead.preferred_time)} · {lead.client_name || lead.name}</strong>
            <span>{[lead.car_brand, lead.car_model, lead.service_type].filter(Boolean).join(" · ")}</span>
            <small>{leadStatusLabel(lead.status)} · {lead.source || "form"}</small>
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
  const [filters, setFilters] = useState({ search: "", status: "", date: "", service: "" });

  const load = async () => {
    const payload = await api.listLeads(filters);
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
  }, [filters.status, filters.date, filters.service]);

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

      <div className="lead-filters">
        <input
          type="search"
          placeholder="Поиск по клиенту, телефону или авто"
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              load().catch((error) => setStatus({ type: "error", text: error.message }));
            }
          }}
        />
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">Все статусы</option>
          <option value="new">Новые</option>
          <option value="contacted">Связались</option>
          <option value="confirmed">Подтверждены</option>
          <option value="in_progress">В работе</option>
          <option value="done">Готово</option>
          <option value="cancelled">Отменены</option>
        </select>
        <input type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
        <select value={filters.service} onChange={(event) => setFilters({ ...filters, service: event.target.value })}>
          <option value="">Все услуги</option>
          {bookingServiceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <button type="button" className="admin-ghost-button" onClick={() => load().catch((error) => setStatus({ type: "error", text: error.message }))}>Найти</button>
      </div>

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
                  ["Источник", lead.source || "form"],
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

function serviceDetailPath(title) {
  const normalized = String(title || "").toLowerCase();

  if (normalized.includes("dsg")) {
    return "/services/dsg";
  }
  if (normalized.includes("диагност")) {
    return "/services/diagnostics";
  }
  if (normalized.includes("то") || normalized.includes("обслуж")) {
    return "/services/maintenance";
  }
  if (normalized.includes("двиг")) {
    return "/services/engine";
  }
  if (normalized.includes("элект")) {
    return "/services/electric";
  }

  return "";
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
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isPastPreferredSlot(date, time) {
  if (!date || !time) {
    return true;
  }

  const slotStart = new Date(`${date}T${time}:00`);
  const earliest = new Date(Date.now() + 60 * 60 * 1000);
  return slotStart < earliest;
}

function isLeadReady(lead) {
  return Boolean(
    lead.client_name &&
      lead.client_phone &&
      lead.car_brand &&
      lead.car_model &&
      lead.car_year &&
      lead.service_type &&
      lead.problem_description &&
      lead.preferred_date &&
      lead.preferred_time &&
      lead.personal_data_agreement &&
      !isPastPreferredSlot(lead.preferred_date, lead.preferred_time),
  );
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
