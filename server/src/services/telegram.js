export async function notifyAdmin(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const payload = await response.text();
      console.error(`Telegram notification failed: ${response.status} ${payload}`);
    }
  } catch (error) {
    console.error("Telegram notification failed:", error);
  }
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
