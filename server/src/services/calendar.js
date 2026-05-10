export function buildLeadIcs(lead) {
  const start = new Date(lead.scheduled_start_at);
  const end = new Date(lead.scheduled_end_at);
  const title = `Ber Car: ${[lead.car_brand, lead.car_model].filter(Boolean).join(" ")} — ${lead.service_type || "Запись"}`;
  const description = [
    `Клиент: ${lead.client_name || lead.name || ""}`,
    `Телефон: ${lead.client_phone || lead.phone || ""}`,
    `Авто: ${[lead.car_brand, lead.car_model, lead.car_year].filter(Boolean).join(" ")}`,
    lead.license_plate ? `Госномер: ${lead.license_plate}` : "",
    lead.mileage ? `Пробег: ${lead.mileage}` : "",
    lead.problem_description ? `Проблема: ${lead.problem_description}` : "",
    lead.client_comment ? `Комментарий клиента: ${lead.client_comment}` : "",
    lead.admin_comment ? `Комментарий администратора: ${lead.admin_comment}` : "",
  ]
    .filter(Boolean)
    .join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ber Car//Booking//RU",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:ber-car-lead-${lead.id}@ber-car`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    "LOCATION:Ber Car, Калуга",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function toIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value) {
  return String(value || "")
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "");
}
