import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { publicRouter } from "./routes/public.js";

export function createApp() {
  const app = express();
  const origins = (process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim());

  app.use(
    cors({
      origin: origins,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/api/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/public", publicRouter);
  app.use("/api/admin", adminRouter);

  app.use((req, res) => {
    res.status(404).json({ message: "Маршрут не найден" });
  });

  app.use((error, req, res, next) => {
    const status = error.status || 500;
    const message = status === 500 ? "Ошибка сервера" : error.message;

    if (status === 500) {
      console.error(error);
    }

    res.status(status).json({ message });
  });

  return app;
}
