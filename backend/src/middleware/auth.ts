import { getCookie } from "hono/cookie";
import type { Next } from "hono";
import type { AppContext } from "../types/hono";
import type { AuthUser } from "../types/user";

interface SessionUserRow {
  user_id: string;
  expires_at: string;
  id: string;
  email: string;
  username: string;
  role: string;
  is_deleted: 0 | 1;
  created_at: string;
  deleted_at: string | null;
}

async function resolveAuthUser(c: AppContext): Promise<AuthUser | null> {
  const sessionId = getCookie(c, "sessionId");
  if (!sessionId) return null;

  // 单次 JOIN 查询：session + user
  const row = await c.env.MEMO_DB
    .prepare(
      `SELECT s.user_id, s.expires_at,
              u.id, u.email, u.username, u.role, u.is_deleted, u.created_at, u.deleted_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`
    )
    .bind(sessionId)
    .first<SessionUserRow>();

  if (!row) return null;

  // 过期 — 仅忽略，不主动清理（避免每次请求触发写操作）
  if (Date.now() > new Date(row.expires_at.replace(" ", "T") + "Z").getTime()) {
    return null;
  }

  if (row.is_deleted === 1) return null;

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role as "user" | "admin",
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  };
}

export async function optionalAuth(c: AppContext, next: Next) {
  const user = await resolveAuthUser(c);
  if (user) {
    c.set("user", user);
  }
  return await next();
}

export async function requireAuth(c: AppContext, next: Next) {
  const user = await resolveAuthUser(c);

  if (!user) {
    return c.json(
      { success: false, error: "Unauthorized", code: 401 },
      401
    );
  }

  c.set("user", user);
  return await next();
}