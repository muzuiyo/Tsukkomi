import { Hono } from "hono";
import { nanoid } from "nanoid";

import type { Env } from "../../types/env";
import type { AuthUser, } from "../../types/user";

import { AuthRegisterService } from "../../services/auth/register";
import { SessionService } from "../../services/session";
import { setCookie } from "hono/cookie";
import { validateEmail, validatePassword, validateUsername } from "../../utils/validators";

type AppBindings = Env;
type AppVariables = {
  user: AuthUser;
};

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

  // 检查邮箱是否已存在
  if (await registerService.isEmailExists(email)) {
    return c.json(
      {
        success: false,
        error: "Email already exists",
        code: 400,
      },
      400,
    );
  }

  // 检查用户名是否已存在
  if (await registerService.isUsernameExists(username)) {
    return c.json(
      {
        success: false,
        error: "Username already exists",
        code: 400,
      },
      400,
    );
  }

  // 创建用户
  const id = nanoid();
  await registerService.createUser(id, username, email, password);

  // 响应头返回 Session
  const sessionId = nanoid();
  const expiresAt =new Date((Date.now() + 365 * 24 * 60 * 60 * 1000)).toISOString().substring(0, 19);
  const sessionService = new SessionService(c.env.MEMO_DB);
  await sessionService.setSession(sessionId, id, expiresAt.replace("T", " ").replace("Z", ""));
  const isProd = c.env.IS_PRODUCTION === true;

  setCookie(c, "sessionId", sessionId, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: isProd ? "None" : "Lax",
    secure: isProd,
  });

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
