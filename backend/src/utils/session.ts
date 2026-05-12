import { nanoid } from "nanoid";
import { setCookie } from "hono/cookie";
import type { AppContext } from "../types/hono";
import { SessionService } from "../services/session";

export async function createSessionAndSetCookie(
  c: AppContext,
  userId: string,
): Promise<string> {
  const sessionId = nanoid();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .substring(0, 19)
    .replace("T", " ");

  const sessionService = new SessionService(c.env.MEMO_DB);
  await sessionService.setSession(sessionId, userId, expiresAt);

  const isProd = c.env.IS_PRODUCTION === true;
  setCookie(c, "sessionId", sessionId, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: isProd ? "None" : "Lax",
    secure: isProd,
    ...(isProd ? { domain: ".tsukkomi.lain.today" } : {}),
  });

  return sessionId;
}
