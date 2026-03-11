// lib/auth.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getToken(request) {
  try {
    // Try Authorization header first
    const auth = request.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      return auth.slice(7);
    }
    // Try cookie
    const cookie = request.headers.get("cookie");
    if (cookie) {
      const match = cookie.match(/token=([^;]+)/);
      if (match) return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

export function getUser(request) {
  try {
    const token = getToken(request);
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}