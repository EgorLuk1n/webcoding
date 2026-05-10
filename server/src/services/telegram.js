import { logError, logInfo, logWarn, maskSecret } from "../utils/logger.js";

const telegramStatus = {
  telegramReachable: false,
  currentProxy: null,
  fallbackUsed: false,
  lastError: null,
  responseTimeMs: null,
  checkedAt: null,
};

let ProxyAgentClass;

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
    updateStatus(false, null, false, error, null);
    throw error;
  }

  const attempts = buildTelegramAttempts();
  let lastError;

  for (const [index, attempt] of attempts.entries()) {
    for (let retry = 0; retry < 3; retry += 1) {
      const started = Date.now();

      try {
        const response = await telegramFetch(token, "sendMessage", {
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }, attempt.proxy);
        const responseTimeMs = Date.now() - started;

        if (!response.ok) {
          const payload = await response.text();
          throw new Error(`Telegram HTTP ${response.status}: ${payload.slice(0, 300)}`);
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
      const response = await telegramFetch(token, "getMe", {}, attempt.proxy);
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
  return [{ proxy: null }, ...orderedProxies.map((proxy) => ({ proxy }))];
}

async function telegramFetch(token, method, payload, proxy) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: controller.signal,
  };

  try {
    if (proxy) {
      const agent = await createProxyAgent(proxy);
      if (agent) {
        options.dispatcher = agent;
      } else {
        throw new Error("Proxy support requires undici package in production dependencies");
      }
    }

    return await fetch(`https://api.telegram.org/bot${token}/${method}`, options);
  } finally {
    clearTimeout(timer);
  }
}

async function createProxyAgent(proxy) {
  if (!ProxyAgentClass) {
    try {
      const undici = await import("undici");
      ProxyAgentClass = undici.ProxyAgent;
    } catch {
      return null;
    }
  }

  return new ProxyAgentClass(proxy);
}

function updateStatus(reachable, proxy, fallbackUsed, error, responseTimeMs) {
  telegramStatus.telegramReachable = reachable;
  telegramStatus.currentProxy = proxy ? maskSecret(proxy) : null;
  telegramStatus.fallbackUsed = fallbackUsed;
  telegramStatus.lastError = error ? error.message : null;
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
