import { Hono } from "hono";
import { deleteCookie } from "hono/cookie";
import { requireAuth } from "../../middleware/auth";

import type { Env } from "../../types/env";
import type { AuthUser } from "../../types/user";

import { AuthDeleteService } from "../../services/auth/delete";
import { SessionService } from "../../services/session";

type AppBindings = Env;
type AppVariables = {
  user: AuthUser;
};

const deleteApp = new Hono<{
  Bindings: AppBindings;
  Variables: AppVariables;
}>();

deleteApp.delete("/delete", requireAuth, async (c) => {
  const user = c.get("user");
  const authDeleteService = new AuthDeleteService(c.env.MEMO_DB);
  await authDeleteService.deleteUserById(user.id);
  deleteCookie(c, "sessionId", { path: "/" });

  return c.json({
    success: true,
    message: "User deleted successfully",
    code: 200,
  });
});

export default deleteApp;