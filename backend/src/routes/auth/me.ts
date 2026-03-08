// 用户信息相关
import { Hono } from "hono";
import { requireAuth } from "../../middleware/auth";
import type { Env } from "../../types/env";
import type { AuthUser, PublicUser } from "../../types/user";
import { AuthMeService } from "../../services/auth/me";

type AppBindings = Env;
type AppVariables = {
  user: AuthUser;
};

const meApp = new Hono<{
  Bindings: AppBindings;
  Variables: AppVariables;
}>();

meApp.get("/me", requireAuth, async (c) => {
  // 在中间件中已经验证了用户并将用户信息存储在上下文中
  const user = c.get("user");
  const publicUser: PublicUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
  }
  return c.json({
    success: true,
    data: publicUser,
    code: 200,
  });
});

meApp.get("/username/:username", async (c) => {
  const username = c.req.param("username");
  const authMeService = new AuthMeService(c.env.MEMO_DB);
  const user = await authMeService.getUserByUsername(username);
  if(user) {
    const publicUser: PublicUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.created_at,
    }
    return c.json({
      success: true,
      data: publicUser,
      code: 200,
    }, 200);
  }
  else {
    return c.json({
      success: false,
      error: "Invalid username",
      code: 404
    }, 404)
  }
})

export default meApp;