import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAdmin } from "../middleware/auth.js";
import { buildLeadIcs } from "../services/calendar.js";
import { formatLeadNotification, notifyAdmin } from "../services/telegram.js";

const resources = {
  "content-blocks": {
    table: "content_blocks",
    fields: ["section", "title", "subtitle", "body", "sort_order", "is_active"],
    required: ["section", "title"],
  },
  services: {
    table: "services",
    fields: ["title", "description", "icon", "sort_order", "is_active"],
    required: ["title", "description"],
  },
  problems: {
    table: "problems",
    fields: ["title", "sort_order", "is_active"],
    required: ["title"],
  },
  contacts: {
    table: "contacts",
    fields: ["label", "value", "type", "href", "sort_order", "is_active"],
    required: ["label", "value", "type"],
  },
};

export const adminRouter = Router();

adminRouter.use(requireAdmin);

const leadSelect = `
  id, name, phone, car, message,
  client_name, client_phone, car_brand, car_model, car_year,
  license_plate, mileage, service_type, problem_description,
  preferred_date, preferred_time, scheduled_start_at, scheduled_end_at,
  duration_minutes, client_comment, admin_comment, status,
  cancelled_at, cancel_reason, rescheduled_at,
  previous_scheduled_start_at, previous_scheduled_end_at,
  created_at, updated_at
`;

adminRouter.get("/leads", async (req, res, next) => {
  try {
    const leads = await query(
      `SELECT ${leadSelect} FROM leads ORDER BY created_at DESC`,
    );
    return res.json({ items: leads });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/leads/:id", async (req, res, next) => {
  try {
    const lead = await findLead(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: "Заявка не найдена" });
    }

    return res.json({ item: lead });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/leads/:id", async (req, res, next) => {
  try {
    const current = await findLead(req.params.id);

    if (!current) {
      return res.status(404).json({ message: "Заявка не найдена" });
    }

    const action = String(req.body.action || "").trim();
    const status = String(req.body.status || current.status || "new").trim();
    const adminComment = nullable(req.body.admin_comment ?? req.body.adminComment ?? current.admin_comment);
    const durationMinutes = normalizeDuration(req.body.duration_minutes ?? req.body.durationMinutes ?? current.duration_minutes);
    const updates = {
      status,
      admin_comment: adminComment,
      duration_minutes: durationMinutes,
    };

    if (action === "confirm" || status === "confirmed") {
      const start = resolveStart(req.body, current);
      const end = addMinutes(start, durationMinutes);
      const busy = await isSlotBusy(start, end, current.id);

      if (busy) {
        return res.status(409).json({ message: "Это время уже занято. Пожалуйста, выберите другое время." });
      }

      updates.status = "confirmed";
      updates.scheduled_start_at = start.toISOString();
      updates.scheduled_end_at = end.toISOString();
      updates.cancelled_at = null;
      updates.cancel_reason = null;
    }

    if (action === "reschedule" || status === "rescheduled") {
      const start = resolveStart(req.body, current);
      const end = addMinutes(start, durationMinutes);
      const busy = await isSlotBusy(start, end, current.id);

      if (busy) {
        return res.status(409).json({ message: "Это время уже занято. Пожалуйста, выберите другое время." });
      }

      updates.status = "rescheduled";
      updates.previous_scheduled_start_at = current.scheduled_start_at;
      updates.previous_scheduled_end_at = current.scheduled_end_at;
      updates.scheduled_start_at = start.toISOString();
      updates.scheduled_end_at = end.toISOString();
      updates.rescheduled_at = new Date().toISOString();
      updates.cancelled_at = null;
      updates.cancel_reason = null;
    }

    if (action === "cancel" || status === "cancelled") {
      updates.status = "cancelled";
      updates.cancelled_at = new Date().toISOString();
      updates.cancel_reason = nullable(req.body.cancel_reason ?? req.body.cancelReason);
    }

    validateLeadStatus(updates.status);

    const fields = Object.keys(updates);
    const setters = fields.map((field, index) => `${field} = $${index + 1}`);
    const values = fields.map((field) => updates[field]);
    const [lead] = await query(
      `UPDATE leads
       SET ${setters.join(", ")}, updated_at = NOW()
       WHERE id = $${fields.length + 1}
       RETURNING ${leadSelect}`,
      [...values, req.params.id],
    );

    if (updates.status === "confirmed") {
      notifyAdmin(formatLeadNotification("✅ Запись подтверждена Ber Car", lead));
    } else if (updates.status === "rescheduled") {
      notifyAdmin(formatLeadNotification("↪️ Запись перенесена Ber Car", lead));
    } else if (updates.status === "cancelled") {
      notifyAdmin(formatLeadNotification("❌ Запись отменена Ber Car", lead));
    }

    return res.json({ item: lead });
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/leads/:id", async (req, res, next) => {
  try {
    const deleted = await query("DELETE FROM leads WHERE id = $1 RETURNING id", [req.params.id]);

    if (deleted.length === 0) {
      return res.status(404).json({ message: "Заявка не найдена" });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/leads/:id/calendar.ics", async (req, res, next) => {
  try {
    const lead = await findLead(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: "Заявка не найдена" });
    }

    if (!["confirmed", "rescheduled", "in_progress"].includes(lead.status) || !lead.scheduled_start_at) {
      return res.status(400).json({ message: "Календарь доступен только для подтвержденных записей" });
    }

    const ics = buildLeadIcs(lead);
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="ber-car-lead-${lead.id}.ics"`);
    return res.send(ics);
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/test-telegram-notification", async (req, res) => {
  notifyAdmin("Тестовое уведомление Ber Car");
  return res.json({ ok: true });
});

adminRouter.get("/:resource", async (req, res, next) => {
  try {
    const config = getResource(req.params.resource);
    const items = await query(
      `SELECT * FROM ${config.table} ORDER BY sort_order, id`,
    );
    return res.json({ items });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/:resource", async (req, res, next) => {
  try {
    const config = getResource(req.params.resource);
    const payload = buildPayload(config, req.body);
    validatePayload(config, payload);

    const columns = Object.keys(payload);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const values = columns.map((field) => payload[field]);

    const [item] = await query(
      `INSERT INTO ${config.table} (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       RETURNING *`,
      values,
    );

    return res.status(201).json({ item });
  } catch (error) {
    return next(error);
  }
});

adminRouter.put("/:resource/:id", async (req, res, next) => {
  try {
    const config = getResource(req.params.resource);
    const payload = buildPayload(config, req.body);

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "Нет данных для обновления" });
    }

    validatePayload(config, payload, { partial: true });

    const fields = Object.keys(payload);
    const values = fields.map((field) => payload[field]);
    const setters = fields.map((field, index) => `${field} = $${index + 1}`);

    const [item] = await query(
      `UPDATE ${config.table}
       SET ${setters.join(", ")}, updated_at = NOW()
       WHERE id = $${fields.length + 1}
       RETURNING *`,
      [...values, req.params.id],
    );

    if (!item) {
      return res.status(404).json({ message: "Запись не найдена" });
    }

    return res.json({ item });
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/:resource/:id", async (req, res, next) => {
  try {
    const config = getResource(req.params.resource);
    const deleted = await query(
      `DELETE FROM ${config.table} WHERE id = $1 RETURNING id`,
      [req.params.id],
    );

    if (deleted.length === 0) {
      return res.status(404).json({ message: "Запись не найдена" });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

function getResource(resourceName) {
  const config = resources[resourceName];

  if (!config) {
    const error = new Error("Неизвестный ресурс");
    error.status = 404;
    throw error;
  }

  return config;
}

async function findLead(id) {
  const [lead] = await query(`SELECT ${leadSelect} FROM leads WHERE id = $1`, [id]);
  return lead;
}

async function isSlotBusy(start, end, ignoreId) {
  const rows = await query(
    `SELECT id
     FROM leads
     WHERE status IN ('confirmed', 'in_progress')
       AND scheduled_start_at IS NOT NULL
       AND scheduled_end_at IS NOT NULL
       AND id <> $3
       AND $1::timestamptz < scheduled_end_at
       AND $2::timestamptz > scheduled_start_at
     LIMIT 1`,
    [start.toISOString(), end.toISOString(), ignoreId],
  );

  return rows.length > 0;
}

function resolveStart(body, lead) {
  if (body.scheduled_start_at || body.scheduledStartAt) {
    return new Date(body.scheduled_start_at || body.scheduledStartAt);
  }

  const date = String(body.preferred_date || body.preferredDate || lead.preferred_date || "").slice(0, 10);
  const time = String(body.preferred_time || body.preferredTime || lead.preferred_time || "").slice(0, 5);

  if (!date || !time) {
    const error = new Error("Укажите дату и время записи");
    error.status = 400;
    throw error;
  }

  const start = new Date(`${date}T${time}:00+03:00`);

  if (Number.isNaN(start.getTime())) {
    const error = new Error("Некорректная дата или время записи");
    error.status = 400;
    throw error;
  }

  return start;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function normalizeDuration(value) {
  const duration = Number.parseInt(value || 60, 10);
  return Number.isFinite(duration) && duration > 0 ? duration : 60;
}

function nullable(value) {
  const text = String(value || "").trim();
  return text || null;
}

function validateLeadStatus(status) {
  const allowed = new Set([
    "new",
    "contacted",
    "confirmed",
    "rescheduled",
    "in_progress",
    "done",
    "cancelled",
  ]);

  if (!allowed.has(status)) {
    const error = new Error("Некорректный статус заявки");
    error.status = 400;
    throw error;
  }
}

function buildPayload(config, body) {
  return config.fields.reduce((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = normalizeValue(field, body[field]);
    }

    return payload;
  }, {});
}

function normalizeValue(field, value) {
  if (field === "sort_order") {
    return Number.parseInt(value || 0, 10);
  }

  if (field === "is_active") {
    return Boolean(value);
  }

  if (value === "") {
    return null;
  }

  return value;
}

function validatePayload(config, payload, options = {}) {
  if (options.partial) {
    return;
  }

  const missing = config.required.filter((field) => !payload[field]);

  if (missing.length > 0) {
    const error = new Error(`Заполните поля: ${missing.join(", ")}`);
    error.status = 400;
    throw error;
  }
}
