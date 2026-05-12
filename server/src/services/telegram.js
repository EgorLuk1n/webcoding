import https from "node:https";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { logError, logInfo, logWarn, maskSecret } from "../utils/logger.js";

const telegramStatus = {
  telegramReachable: false,
  currentProxy: null,
  fallbackUsed: false,
  lastError: null,
  responseTimeMs: null,
  checkedAt: null,
};

export function getTelegramStatus() {
  return { ...telegramStatus };
}

export async function notifyAdmin(message) {
  sendTelegramMessage(message).catch((error) => {
    logError("telegram_async_failed", { error: error.message });
  });
}

export async function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    const error = new Error("Telegram env is not configured");
    error.code = "TELEGRAM_NOT_CONFIGURED";
    updateStatus(false, null, false, error, null);
    throw error;
  }

  const attempts = buildTelegramAttempts();
  let lastError;

  for (const [index, attempt] of attempts.entries()) {
    for (let retry = 0; retry < 3; retry += 1) {
      const started = Date.now();

      try {
        const response = await telegramRequest(token, "sendMessage", {
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }, attempt.proxy);
        const responseTimeMs = Date.now() - started;

        if (!response.ok) {
          throw new Error(`Telegram HTTP ${response.status}: ${response.body.slice(0, 300)}`);
        }

        updateStatus(true, attempt.proxy, index > 0, null, responseTimeMs);
        logInfo("telegram_sent", {
          proxy: maskSecret(attempt.proxy || "direct"),
          fallbackUsed: index > 0,
          responseTimeMs,
        });
        return { ok: true, proxy: attempt.proxy, fallbackUsed: index > 0, responseTimeMs };
      } catch (error) {
        lastError = error;
        updateStatus(false, attempt.proxy, index > 0, error, Date.now() - started);
        logWarn("telegram_attempt_failed", {
          proxy: maskSecret(attempt.proxy || "direct"),
          retry,
          error: error.message,
        });
        await sleep(250 * 2 ** retry);
      }
    }
  }

  logError("telegram_all_attempts_failed", { error: lastError?.message });
  throw lastError || new Error("Telegram unavailable");
}

export async function checkTelegramHealth() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    updateStatus(false, null, false, new Error("TELEGRAM_BOT_TOKEN is missing"), null);
    return getTelegramStatus();
  }

  const attempts = buildTelegramAttempts();
  let lastError;

  for (const [index, attempt] of attempts.entries()) {
    const started = Date.now();
    try {
      const response = await telegramRequest(token, "getMe", {}, attempt.proxy);
      const responseTimeMs = Date.now() - started;

      if (!response.ok) {
        throw new Error(`Telegram getMe HTTP ${response.status}`);
      }

      updateStatus(true, attempt.proxy, index > 0, null, responseTimeMs);
      return getTelegramStatus();
    } catch (error) {
      lastError = error;
      updateStatus(false, attempt.proxy, index > 0, error, Date.now() - started);
    }
  }

  logWarn("telegram_health_failed", { error: lastError?.message });
  return getTelegramStatus();
}

export function startTelegramHealthCheck() {
  const intervalMs = Number.parseInt(process.env.TELEGRAM_HEALTH_INTERVAL_MS || "300000", 10);
  checkTelegramHealth().catch(() => {});
  const timer = setInterval(() => checkTelegramHealth().catch(() => {}), intervalMs);
  timer.unref?.();
}

export function formatLeadNotification(title, lead) {
  const car = [lead.car_brand, lead.car_model, lead.car_year].filter(Boolean).join(" ");
  const dateTime = [formatDate(lead.preferred_date), String(lead.preferred_time || "").slice(0, 5)]
    .filter(Boolean)
    .join(" ");

  return [
    `<b>${escapeHtml(title)}</b>`,
    `Клиент: ${escapeHtml(lead.client_name || lead.name || "-")}`,
    `Телефон: ${escapeHtml(lead.client_phone || lead.phone || "-")}`,
    car ? `Авто: ${escapeHtml(car)}` : "",
    lead.service_type ? `Услуга: ${escapeHtml(lead.service_type)}` : "",
    dateTime ? `Желаемое время: ${escapeHtml(dateTime)}` : "",
    lead.problem_description ? `Проблема: ${escapeHtml(lead.problem_description)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildTelegramAttempts() {
  const proxies = [
    process.env.TELEGRAM_PROXY_URL,
    process.env.TELEGRAM_PROXY_URL_2,
    process.env.TELEGRAM_PROXY_URL_3,
  ].filter(Boolean);
  const rotation = process.env.TELEGRAM_PROXY_ROTATION !== "false";
  const orderedProxies = rotation ? proxies : proxies.slice(0, 1);
  return orderedProxies.length > 0
    ? orderedProxies.map((proxy) => ({ proxy }))
    : [{ proxy: null }];
}

function telegramRequest(token, method, payload, proxy) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      method: "POST",
      hostname: "api.telegram.org",
      path: `/bot${token}/${method}`,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 8000,
      agent: proxy ? createProxyAgent(proxy) : undefined,
    };

    const req = https.request(options, (res) => {
      let responseBody = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        responseBody += chunk;
      });
      res.on("end", () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          body: responseBody,
        });
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error("Telegram request timeout"));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function createProxyAgent(proxy) {
  if (/^socks5h?:\/\//i.test(proxy)) {
    return new SocksProxyAgent(proxy);
  }

  if (/^https?:\/\//i.test(proxy)) {
    return new HttpsProxyAgent(proxy);
  }

  throw new Error("Unsupported Telegram proxy protocol");
}

function updateStatus(reachable, proxy, fallbackUsed, error, responseTimeMs) {
  telegramStatus.telegramReachable = reachable;
  telegramStatus.currentProxy = proxy ? maskSecret(proxy) : null;
  telegramStatus.fallbackUsed = fallbackUsed;
  telegramStatus.lastError = error ? maskSecret(error.message) : null;
  telegramStatus.responseTimeMs = responseTimeMs;
  telegramStatus.checkedAt = new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
