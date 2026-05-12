import { Router } from "express";
import { query } from "../db/pool.js";
import { publicLeadRateLimit } from "../middleware/security.js";
import { formatLeadNotification, notifyAdmin } from "../services/telegram.js";

export const publicRouter = Router();

const serviceTypes = new Set([
  "Диагностика",
  "ТО",
  "Техническое обслуживание",
  "Ремонт двигателя",
  "Ремонт DSG",
  "Подвеска",
  "Тормозная система",
  "Электрика",
  "Другое",
]);

const bookingTimes = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];

publicRouter.get("/site", async (req, res, next) => {
  try {
    const [contentBlocks, services, problems, contacts, cases, reviews] = await Promise.all([
      query(
        "SELECT id, section, title, subtitle, body, sort_order FROM content_blocks WHERE is_active = true ORDER BY sort_order, id",
      ),
      query(
        "SELECT id, title, description, icon, sort_order FROM services WHERE is_active = true ORDER BY sort_order, id",
      ),
      query(
        "SELECT id, title, sort_order FROM problems WHERE is_active = true ORDER BY sort_order, id",
      ),
      query(
        "SELECT id, label, value, type, href, sort_order FROM contacts WHERE is_active = true ORDER BY sort_order, id",
      ),
      query(
        "SELECT id, car, car_year, mileage, problem, work_done, result, service, image_url, completed_at, sort_order FROM cases WHERE is_active = true ORDER BY sort_order, id",
      ),
      query(
        "SELECT id, client_name, car, text, rating, source, review_date, sort_order FROM reviews WHERE is_active = true ORDER BY sort_order, id",
      ),
    ]);

    return res.json({ contentBlocks, services, problems, contacts, cases, reviews });
  } catch (error) {
    return next(error);
  }
});

publicRouter.get("/booking-slots", async (req, res, next) => {
  try {
    const date = normalizeDate(req.query.date);

    if (!date) {
      return res.status(400).json({ message: "Укажите дату в формате YYYY-MM-DD" });
    }

    if (isPastDate(date)) {
      return res.json({ date, slots: [] });
    }

    const busy = await query(
      `SELECT id, scheduled_start_at, scheduled_end_at
       FROM leads
       WHERE status IN ('confirmed', 'in_progress')
         AND scheduled_start_at IS NOT NULL
         AND scheduled_end_at IS NOT NULL
         AND scheduled_start_at < $2::timestamptz
         AND scheduled_end_at > $1::timestamptz
       ORDER BY scheduled_start_at`,
      [toMoscowIso(date, "00:00"), toMoscowIso(date, "23:59")],
    );

    const slots = bookingTimes
      .filter((time) => !isPastSlot(date, time))
      .map((time) => {
      const start = new Date(toMoscowIso(date, time));
      const end = addMinutes(start, 60);
      const conflict = busy.find((item) => {
        const existingStart = new Date(item.scheduled_start_at);
        const existingEnd = new Date(item.scheduled_end_at);
        return start < existingEnd && end > existingStart;
      });

      return {
        time,
        isAvailable: !conflict,
        isBusy: Boolean(conflict),
      };
    });

    return res.json({ date, slots });
  } catch (error) {
    return next(error);
  }
});

publicRouter.post("/leads", publicLeadRateLimit, async (req, res, next) => {
  try {
    const lead = normalizeLead(req.body);

    const missing = [
      ["client_name", "имя клиента"],
      ["client_phone", "телефон"],
      ["car_brand", "марка авто"],
      ["car_model", "модель авто"],
      ["car_year", "год выпуска"],
      ["service_type", "тип услуги"],
      ["problem_description", "описание проблемы"],
      ["preferred_date", "дата визита"],
      ["preferred_time", "время визита"],
    ].filter(([field]) => !lead[field]);

    if (missing.length > 0) {
      return res.status(400).json({ message: `Заполните поля: ${missing.map(([, label]) => label).join(", ")}` });
    }

    if (!lead.personal_data_agreement) {
      return res.status(400).json({ message: "Нужно согласие на обработку персональных данных" });
    }

    if (!serviceTypes.has(lead.service_type)) {
      return res.status(400).json({ message: "Выберите корректный тип услуги" });
    }

    if (isPastDate(lead.preferred_date) || isPastSlot(lead.preferred_date, lead.preferred_time)) {
      return res.status(400).json({ message: "Нельзя выбрать прошедшее время." });
    }

    const busy = await isSlotBusy(lead.preferred_date, lead.preferred_time);

    if (busy) {
      return res.status(409).json({ message: "Это время уже занято. Пожалуйста, выберите другое время." });
    }

    const [created] = await query(
      `INSERT INTO leads (
         name, phone, car, message,
         client_name, client_phone, car_brand, car_model, car_year,
         license_plate, mileage, service_type, problem_description,
         preferred_date, preferred_time, client_comment, duration_minutes,
         source, quiz_data
       )
       VALUES (
         $1, $2, $3, $4,
         $5, $6, $7, $8, $9,
         $10, $11, $12, $13,
         $14, $15, $16, $17,
         $18, $19
       )
       RETURNING *`,
      [
        lead.client_name,
        lead.client_phone,
        [lead.car_brand, lead.car_model, lead.car_year].filter(Boolean).join(" "),
        lead.problem_description,
        lead.client_name,
        lead.client_phone,
        lead.car_brand,
        lead.car_model,
        lead.car_year,
        lead.license_plate,
        lead.mileage,
        lead.service_type,
        lead.problem_description,
        lead.preferred_date,
        lead.preferred_time,
        lead.client_comment,
        60,
        lead.source,
        lead.quiz_data,
      ],
    );

    notifyAdmin(formatLeadNotification("Новая заявка Ber Car", created));

    return res.status(201).json({ lead: created });
  } catch (error) {
    return next(error);
  }
});

function normalizeLead(body) {
  const carYear = Number.parseInt(body.car_year || body.carYear || "", 10);
  const mileage = Number.parseInt(body.mileage || "", 10);

  return {
    client_name: clean(body.client_name || body.clientName || body.name),
    client_phone: clean(body.client_phone || body.clientPhone || body.phone),
    car_brand: clean(body.car_brand || body.carBrand),
    car_model: clean(body.car_model || body.carModel),
    car_year: Number.isFinite(carYear) ? carYear : null,
    license_plate: clean(body.license_plate || body.licensePlate),
    mileage: Number.isFinite(mileage) ? mileage : null,
    service_type: clean(body.service_type || body.serviceType),
    problem_description: clean(body.problem_description || body.problemDescription || body.message),
    preferred_date: normalizeDate(body.preferred_date || body.preferredDate),
    preferred_time: normalizeTime(body.preferred_time || body.preferredTime),
    client_comment: clean(body.client_comment || body.clientComment),
    source: normalizeSource(body.source),
    quiz_data: normalizeQuizData(body.quiz_data || body.quizData),
    personal_data_agreement: Boolean(body.personal_data_agreement || body.personalDataAgreement),
  };
}

function normalizeSource(value) {
  const source = clean(value || "form");
  return ["form", "quiz"].includes(source) ? source : "form";
}

function normalizeQuizData(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value;
}

async function isSlotBusy(date, time, durationMinutes = 60) {
  const start = new Date(toMoscowIso(date, time));
  const end = addMinutes(start, durationMinutes);
  const rows = await query(
    `SELECT id
     FROM leads
     WHERE status IN ('confirmed', 'in_progress')
       AND scheduled_start_at IS NOT NULL
       AND scheduled_end_at IS NOT NULL
       AND $1::timestamptz < scheduled_end_at
       AND $2::timestamptz > scheduled_start_at
     LIMIT 1`,
    [start.toISOString(), end.toISOString()],
  );

  return rows.length > 0;
}

function clean(value) {
  return String(value || "").trim();
}

function normalizeDate(value) {
  const date = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

function normalizeTime(value) {
  const time = String(value || "").trim();
  const match = time.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function toMoscowIso(date, time) {
  return `${date}T${time}:00+03:00`;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function getMoscowDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function isPastDate(date) {
  return date < getMoscowDateString();
}

function isPastSlot(date, time) {
  const start = new Date(toMoscowIso(date, time));
  const earliest = addMinutes(new Date(), 60);
  return start < earliest;
}
