import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { publicRouter } from "./routes/public.js";
import { requestLogger, securityHeaders } from "./middleware/security.js";
import { logError, logWarn } from "./utils/logger.js";

const defaultOrigins = [
  "http://194.67.116.39",
  "https://194.67.116.39",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  const envOrigins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const origins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

  app.disable("x-powered-by");
  app.use(requestLogger);
  app.use(securityHeaders);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origins.includes(origin)) {
          return callback(null, true);
        }

        logWarn("cors_origin_denied", { origin });
        return callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "64kb" }));
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

    logError("request_error", {
      requestId: req.id,
      status,
      path: req.path,
      message: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });

    res.status(status).json({ message });
  });

  return app;
}
