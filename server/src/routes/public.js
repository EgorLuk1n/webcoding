import { Router } from "express";
import { query } from "../db/pool.js";
import { formatLeadNotification, notifyAdmin } from "../services/telegram.js";

export const publicRouter = Router();

const serviceTypes = new Set([
  "Диагностика",
  "ТО",
  "Ремонт двигателя",
  "Ремонт DSG",
  "Подвеска",
  "Тормозная система",
  "Электрика",
  "Другое",
]);

const bookingTimes = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

publicRouter.get("/site", async (req, res, next) => {
  try {
    const [contentBlocks, services, problems, contacts] = await Promise.all([
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
    ]);

    return res.json({ contentBlocks, services, problems, contacts });
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

    const slots = bookingTimes.map((time) => {
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

publicRouter.post("/leads", async (req, res, next) => {
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

    const busy = await isSlotBusy(lead.preferred_date, lead.preferred_time);

    if (busy) {
      return res.status(409).json({ message: "Это время уже занято. Пожалуйста, выберите другое время." });
    }

    const [created] = await query(
      `INSERT INTO leads (
         name, phone, car, message,
         client_name, client_phone, car_brand, car_model, car_year,
         license_plate, mileage, service_type, problem_description,
         preferred_date, preferred_time, client_comment, duration_minutes
       )
       VALUES (
         $1, $2, $3, $4,
         $5, $6, $7, $8, $9,
         $10, $11, $12, $13,
         $14, $15, $16, $17
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
    personal_data_agreement: Boolean(body.personal_data_agreement || body.personalDataAgreement),
  };
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
