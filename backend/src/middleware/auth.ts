import { getCookie } from "hono/cookie";
import type { Next } from "hono";
import type { AppContext } from "../types/hono";
import type { AuthUser } from "../types/user";
import { AuthMeService } from "../services/auth/me";
import { SessionService } from "../services/session";

async function resolveAuthUser(c: AppContext): Promise<AuthUser | null> {
  const sessionId = getCookie(c, "sessionId");
  if (!sessionId) return null;

  const sessionService = new SessionService(c.env.MEMO_DB);
  const session = await sessionService.getSessionById(sessionId);
  if (!session) return null;

  // 过期 — 仅忽略，不主动清理（避免每次请求触发写操作）
  if (Date.now() > new Date(session.expires_at.replace(" ", "T") + "Z").getTime()) {
    return null;
  }

  const meService = new AuthMeService(c.env.MEMO_DB);
  const user = await meService.getUserByUserId(session.user_id);
  if (!user || user.is_deleted === 1) return null;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    isDeleted: Boolean(user.is_deleted),
    createdAt: user.created_at,
    deletedAt: user.deleted_at,
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