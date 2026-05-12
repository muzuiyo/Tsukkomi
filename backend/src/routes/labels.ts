import { Hono } from "hono";
import { optionalAuth } from "../middleware/auth";

import type { Env } from "../types/env";
import type { AuthUser } from "../types/user";

import { LabelsService } from "../services/labels";
import { AuthMeService } from "../services/auth/me";

type AppBindings = Env;
type AppVariables = {
  user: AuthUser;
};

const labelsApp = new Hono<{
  Bindings: AppBindings;
  Variables: AppVariables;
}>();

labelsApp.get("/", optionalAuth, async (c) => {
  const loginUser = c.get("user");  // 当前登录用户
  const username = c.req.query("username"); // URL 参数，查询哪个用户

  if (!username) {
    return c.json({ success: false, error: "username is required", code: 400 }, 400);
  }
  const labelsService = new LabelsService(c.env.MEMO_DB);
  const authMeService = new AuthMeService(c.env.MEMO_DB);
  // 获取用户信息
  const user = await authMeService.getUserByUsername(username);
  if (!user) {
    return c.json({ success: false, error: "User not found", code: 404 }, 404);
  }

  const onlyPublic = !loginUser || loginUser.username !== username;
  const labelsCountData = await labelsService.getLabelCountByUserId(user.id, onlyPublic);
  return c.json({ success: true, data: labelsCountData, code: 200 }, 200);
});

export default labelsApp;