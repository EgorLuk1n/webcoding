import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { query } from "../db/pool.js";
import { adminCookieOptions, cookieName, requireAdmin } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Укажите email и пароль" });
    }

    const [admin] = await query(
      "SELECT id, email, password_hash FROM admins WHERE email = $1",
      [email],
    );

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET не настроен" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    res.cookie(cookieName, token, adminCookieOptions());
    return res.json({ admin: { id: admin.id, email: admin.email } });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie(cookieName, adminCookieOptions());
  return res.status(204).send();
});

authRouter.get("/me", requireAdmin, (req, res) => {
  return res.json({ admin: req.admin });
});
