// 用户信息相关
import { Hono } from "hono";
import type { Env } from "../../types/env";
import type { AuthUser } from "../../types/user";
import { Resend } from "resend";
import { AuthPasswordService } from "../../services/auth/password";
import { validateEmail, validatePassword } from "../../utils/validators";

type AppBindings = Env;
type AppVariables = {
  user: AuthUser;
};

const passwordApp = new Hono<{
  Bindings: AppBindings;
  Variables: AppVariables;
}>();

passwordApp.post("/password/forget", async (c) => {
  const { email } = await c.req.json();
  const authPasswordService = new AuthPasswordService(c.env.MEMO_DB);
  const token = await authPasswordService.createPasswordResetToken(email);

  if(!validateEmail(email)) {
    return c.json({ success: false, error: "Invalid email format", code: 400 }, 400);
  }

  if(!token) {
    return c.json({
        success: true,
        message: "If the email exists, a reset link has been send, please check the Trash or Junk Box in your e-mail, the link will expire in 5 minutes."
    });
  }
  const resetURL = c.env.FRONT_URL + `/auth/forgot?token=${token}`;
  // 使用第三方 RESEND API 发送邮件 
  const resend = new Resend(c.env.RESEND_API_KEY);
  await resend.emails.send({
    from: c.env.NOREPLY_EMAIL,
    to: email,
    subject: "TSUKKOMI | Reset your password",
    html: `
        <p>Click the link below to reset your password:</p>
        <a href="${resetURL}">${resetURL}</a>
        <p>This link will expire in 5 minutes.</p>
    `
  });
  return c.json({
    success: true,
    message: "If the email exists, a reset link has been send, please check the Trash or Junk Box in your e-mail, the link will expire in 5 minutes."
  })
});

passwordApp.post("/password/reset", async (c) => {
  const { token, newPassword } = await c.req.json();
  if (!token || !newPassword) {
    return c.json(
      { error: "Invalid request" },
      400
    );
  }
  if (!validatePassword(newPassword)) {
    return c.json({
        success: false, 
        error: "Invalid password format" 
      },
      400
    );
  }
  const service = new AuthPasswordService(c.env.MEMO_DB);
  try {
    await service.resetPassword(token, newPassword);
    return c.json({
      success: true,
      message: "Password reset successful"
    });
  } catch (err) {
    return c.json({  
      success: false,
      error: "Invalid or expired token"
    },
      400
    );
  }
});

export default passwordApp;