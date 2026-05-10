import jwt from "jsonwebtoken";

const cookieName = process.env.ADMIN_COOKIE_NAME || "ber_car_admin";

export function requireAdmin(req, res, next) {
  const token = req.cookies?.[cookieName];

  if (!token) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: "Сессия истекла" });
  }
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: "/",
  };
}

export { cookieName };
