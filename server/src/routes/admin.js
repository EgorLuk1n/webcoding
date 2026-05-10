import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAdmin } from "../middleware/auth.js";

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

adminRouter.get("/leads", async (req, res, next) => {
  try {
    const leads = await query(
      "SELECT id, name, phone, car, message, status, created_at FROM leads ORDER BY created_at DESC",
    );
    return res.json({ items: leads });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/leads/:id", async (req, res, next) => {
  try {
    const status = String(req.body.status || "new").trim();
    const [lead] = await query(
      "UPDATE leads SET status = $1 WHERE id = $2 RETURNING id, name, phone, car, message, status, created_at",
      [status, req.params.id],
    );

    if (!lead) {
      return res.status(404).json({ message: "Заявка не найдена" });
    }

    return res.json({ item: lead });
  } catch (error) {
    return next(error);
  }
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
