import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

import type { Env } from "../../types/env";
import type { AuthUser, PublicUser } from "../../types/user";

import { AuthLoginService } from "../../services/auth/login";
import { SessionService } from "../../services/session";
import { setCookie } from "hono/cookie";
import { validateEmail, validatePassword } from "../../utils/validators";

type AppBindings = Env;
type AppVariables = {
  user: AuthUser;
};

const loginApp = new Hono<{
  Bindings: AppBindings;
  Variables: AppVariables;
}>();

loginApp.post("/login", async (c) => {
  const { email, password } = await c.req.json();

  // 检查必填字段
  if (!email || !password) {
    return c.json({ success: false, error: "Missing email or password", code: 400 }, 400);
  }

  const loginService = new AuthLoginService(c.env.MEMO_DB);

  // 邮箱校验
  if(!validateEmail(email)) {
    return c.json({ success: false, error: "Invalid email format", code: 400 }, 400);
  }

  // password 格式校验
  if(!validatePassword(password)) {
    return c.json({ success: false, error: "Invalid password format", code: 400 }, 400);
  }

  const user = await loginService.getUserByEmail(email);
  // 验证用户存在和密码匹配
  if (!user || user.is_deleted === 1) {
    return c.json({ success: false, error: "Invalid credentials", code: 401 }, 401);
  } else {
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return c.json({ success: false, error: "Invalid credentials", code: 401 }, 401);
    }
  }

  const sessionId = nanoid();
  // 365天过期
  const expiresAt =new Date((Date.now() + 365 * 24 * 60 * 60 * 1000)).toISOString().substring(0, 19);
  const sessionService = new SessionService(c.env.MEMO_DB);
  await sessionService.setSession(sessionId, user.id, expiresAt.replace("T", " ").replace("Z", ""));

  const isProd = c.env.IS_PRODUCTION === true;
  
  setCookie(c, "sessionId", sessionId, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: isProd ? "None" : "Lax",
    secure: isProd,
  });

  const publicUser: PublicUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.created_at,
  };
  return c.json({
    success: true,
    data: publicUser,
    code: 200,
  });
});

export default loginApp;
