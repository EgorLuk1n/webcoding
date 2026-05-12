const API_URL = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = "Ошибка запроса";

    try {
      const payload = await response.json();
      message = [payload.message, payload.details].filter(Boolean).join(": ") || message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  getSite: () => request("/api/public/site"),
  getReviews: (source = "") => request(`/api/public/reviews${source ? `?source=${encodeURIComponent(source)}` : ""}`),
  getReviewSummary: () => request("/api/public/review-summary"),
  getBookingSlots: (date) => request(`/api/public/booking-slots?date=${encodeURIComponent(date)}`),
  submitLead: (payload) =>
    request("/api/public/leads", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () =>
    request("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  me: () => request("/api/auth/me"),
  listResource: (resource) => request(`/api/admin/${resource}`),
  createResource: (resource, payload) =>
    request(`/api/admin/${resource}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateResource: (resource, id, payload) =>
    request(`/api/admin/${resource}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteResource: (resource, id) =>
    request(`/api/admin/${resource}/${id}`, {
      method: "DELETE",
    }),
  listLeads: (params = {}) => {
    const search = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value),
    ).toString();
    return request(`/api/admin/leads${search ? `?${search}` : ""}`);
  },
  dashboard: () => request("/api/admin/dashboard"),
  calendar: (date) => request(`/api/admin/calendar${date ? `?date=${encodeURIComponent(date)}` : ""}`),
  getLead: (id) => request(`/api/admin/leads/${id}`),
  updateLead: (id, payload) =>
    request(`/api/admin/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  updateLeadStatus: (id, status) =>
    request(`/api/admin/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteLead: (id) =>
    request(`/api/admin/leads/${id}`, {
      method: "DELETE",
    }),
  testTelegramNotification: () =>
    request("/api/admin/test-telegram-notification", {
      method: "POST",
      body: JSON.stringify({}),
    }),
};
