import { Hono } from "hono";
import { nanoid } from "nanoid";

import type { AppBindings, AppVariables } from "../../types/hono";

import { AuthRegisterService } from "../../services/auth/register";
import { createSessionAndSetCookie } from "../../utils/session";
import { validateEmail, validatePassword, validateUsername } from "../../utils/validators";

const registerApp = new Hono<{
  Bindings: AppBindings;
  Variables: AppVariables;
}>();

registerApp.post("/register", async (c) => {
  const { email, username, password } = await c.req.json();
  // 检查必填字段
  const registerService = new AuthRegisterService(c.env.MEMO_DB);
  if (registerService.isMissingFields(username, email, password)) {
    return c.json(
      {
        success: false,
        error: "Missing required fields",
        code: 400,
      },
      400,
    );
  }
  // 字段校验
  if(!validateEmail(email)) {
    return c.json({ success: false, error: "Invalid email format", code: 400 }, 400);
  }

  if(!validateUsername(username)) {
    return c.json({ success: false, error: "Invalid username format", code: 400 }, 400);
  }

  if(!validatePassword(password)) {
    return c.json({ success: false, error: "Invalid password format", code: 400 }, 400);
  }

  // 注册功能开关
  if(!c.env.ALLOW_REGISTER || c.env.ALLOW_REGISTER.toString() !== "true") {
    return c.json(
      {
        success: false,
        error: "Registration is disabled",
        code: 403,
      },
      403,
    );
  }

  // 检查邮箱或用户名是否已存在（并行查询）
  const [emailExists, usernameExists] = await Promise.all([
    registerService.isEmailExists(email),
    registerService.isUsernameExists(username),
  ]);
  if (emailExists || usernameExists) {
    return c.json(
      {
        success: false,
        error: "Email or username already exists",
        code: 400,
      },
      400,
    );
  }

  // 创建用户
  const id = nanoid();
  await registerService.createUser(id, username, email, password);

  // 响应头返回 Session
  await createSessionAndSetCookie(c, id);

  return c.json(
    {
      success: true,
      data: {
        id,
        username,
        role: "user",
      },
      code: 200,
    },
    200,
  );
});

export default registerApp;
