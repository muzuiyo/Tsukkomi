import { Hono } from "hono";
import { getCookie, deleteCookie } from "hono/cookie";

import type { Env } from "../../types/env";
import type { AuthUser } from "../../types/user";
import { AuthLogoutService } from "../../services/auth/logout";

type AppBindings = Env;
type AppVariables = {
  user: AuthUser;
};

const logoutApp = new Hono<{
  Bindings: AppBindings;
  Variables: AppVariables;
}>();

logoutApp.post("/logout", async (c) => {
  const sessionId = getCookie(c, "sessionId");
  // 理论上不触发
  if (!sessionId) {
    return c.json({ success: false, error: "No active session", code: 400 }, 400);
  }
  // 删除 session
  const logoutService = new AuthLogoutService(c.env.MEMO_DB);
  await logoutService.deleteSession(sessionId);
  deleteCookie(c, "sessionId", { path: "/" });

  return c.json({
    success: true,
    message: "Logged out successfully",
    code: 200,
  });
});

export default logoutApp;
