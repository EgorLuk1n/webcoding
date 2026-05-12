import crypto from "node:crypto";
import { logInfo, logWarn } from "../utils/logger.js";

const loginAttempts = new Map();
const publicLeadAttempts = new Map();

export function requestLogger(req, res, next) {
  const started = Date.now();
  req.id = crypto.randomUUID();

  res.on("finish", () => {
    logInfo("request", {
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - started,
      ip: req.ip,
    });
  });

  next();
}

export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  );
  next();
}

export function loginRateLimit(req, res, next) {
  const key = `${req.ip}:${String(req.body?.email || "").toLowerCase()}`;
  const now = Date.now();
  const entry = loginAttempts.get(key) || { count: 0, lockedUntil: 0, firstAt: now };

  if (entry.lockedUntil > now) {
    return res.status(429).json({ message: "Слишком много попыток входа. Попробуйте позже." });
  }

  req.loginAttemptKey = key;
  req.loginAttemptEntry = entry;
  return next();
}

export function publicLeadRateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const entry = publicLeadAttempts.get(key) || { count: 0, firstAt: now };
  const nextEntry = now - entry.firstAt > windowMs
    ? { count: 1, firstAt: now }
    : { ...entry, count: entry.count + 1 };

  publicLeadAttempts.set(key, nextEntry);

  if (nextEntry.count > 8) {
    logWarn("public_lead_rate_limited", { ip: req.ip });
    return res.status(429).json({ message: "Слишком много заявок. Попробуйте позже." });
  }

  return next();
}

export function recordLoginFailure(req) {
  const key = req.loginAttemptKey;
  if (!key) {
    return;
  }

  const now = Date.now();
  const entry = req.loginAttemptEntry || { count: 0, lockedUntil: 0, firstAt: now };
  const windowExpired = now - entry.firstAt > 15 * 60 * 1000;
  const nextEntry = windowExpired ? { count: 1, firstAt: now, lockedUntil: 0 } : { ...entry, count: entry.count + 1 };

  if (nextEntry.count >= 5) {
    nextEntry.lockedUntil = now + 10 * 60 * 1000;
    logWarn("login_cooldown", { ip: req.ip, email: req.body?.email });
  }

  loginAttempts.set(key, nextEntry);
}

export function recordLoginSuccess(req) {
  if (req.loginAttemptKey) {
    loginAttempts.delete(req.loginAttemptKey);
  }
}

export function audit(req, action, meta = {}) {
  logInfo("audit", {
    action,
    adminId: req.admin?.id,
    adminEmail: req.admin?.email,
    ip: req.ip,
    ...meta,
  });
}
