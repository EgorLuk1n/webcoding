import { Router } from "express";
import { query } from "../db/pool.js";

export const publicRouter = Router();

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

publicRouter.post("/leads", async (req, res, next) => {
  try {
    const lead = {
      name: String(req.body.name || "").trim(),
      phone: String(req.body.phone || "").trim(),
      car: String(req.body.car || "").trim(),
      message: String(req.body.message || "").trim(),
    };

    if (!lead.name || !lead.phone) {
      return res.status(400).json({ message: "Имя и телефон обязательны" });
    }

    const [created] = await query(
      `INSERT INTO leads (name, phone, car, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [lead.name, lead.phone, lead.car, lead.message],
    );

    return res.status(201).json({ lead: created });
  } catch (error) {
    return next(error);
  }
});
