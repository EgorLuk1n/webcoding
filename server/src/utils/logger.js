const secretPatterns = [
  process.env.TELEGRAM_BOT_TOKEN,
  process.env.JWT_SECRET,
].filter(Boolean);

export function logInfo(message, meta = {}) {
  console.log(JSON.stringify({ level: "info", message, ...sanitizeMeta(meta), ts: new Date().toISOString() }));
}

export function logWarn(message, meta = {}) {
  console.warn(JSON.stringify({ level: "warn", message, ...sanitizeMeta(meta), ts: new Date().toISOString() }));
}

export function logError(message, meta = {}) {
  console.error(JSON.stringify({ level: "error", message, ...sanitizeMeta(meta), ts: new Date().toISOString() }));
}

export function maskSecret(value) {
  if (!value) {
    return value;
  }

  return String(value).replace(/(https?:\/\/|socks5:\/\/)([^:/?#]+):([^@]+)@/i, "$1$2:***@");
}

function sanitizeMeta(meta) {
  return JSON.parse(JSON.stringify(meta, (_, value) => {
    if (typeof value !== "string") {
      return value;
    }

    return secretPatterns.reduce((text, secret) => text.replaceAll(secret, "***"), maskSecret(value));
  }));
}
