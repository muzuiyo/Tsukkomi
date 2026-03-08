'use client'
import { authLogin, authRegister, authForgotPassword } from "@/lib/api/auth";
import { useEffect, useState } from "react";
import "./authForm.css";
import { validateEmail, validateUsername, validatePassword } from "@/lib/validators";

interface AuthFormProps {
  mode: "login" | "register";
  onSuccess: () => void;
}

const AuthForm = ({ mode, onSuccess }: AuthFormProps) => {
  const [view, setView] = useState<"login" | "register" | "forgot">(mode);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const isLogin = view === "login";
  const isRegister = view === "register";
  const isForgot = view === "forgot";

  useEffect(() => {
    setView(mode);
  }, [mode]);

  useEffect(() => {
    setError("");
    setEmail("");
    setPassword("");
    setUsername("");
    setLoading(false);
    setCountdown(0);
  }, [view]);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isForgot && countdown > 0) return;

    // --- 前端校验 ---
    if (!validateEmail(email)) {
      setError("邮箱格式不正确");
      return;
    }
    if (isRegister && !validateUsername(username)) {
      setError("用户名必须 1~12 个小写字母或下划线");
      return;
    }
    if (!isForgot && !validatePassword(password)) {
      setError("密码必须 6~20 个字符，允许大小写字母、数字和 !@#$%^&*");
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await authLogin({ email, password });
        onSuccess();
      } else if (isRegister) {
        await authRegister({ email, username, password });
        onSuccess();
      } else if (isForgot) {
        await authForgotPassword({ email });
        setError("重置密码邮件已发送，请检查邮箱");
        setCountdown(60);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "操作失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <form onSubmit={handleSubmit} className="auth-form">

        {isForgot && <div className="auth-info">输入注册邮箱，我们将会发送重置密码链接</div>}

        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {isRegister && (
          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}

        {!isForgot && (
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        )}

        {error && <div className="auth-error">{error}</div>}

        {isLogin && (
          <div className="form-extra">
            <button type="button" className="forgot-link" onClick={() => setView("forgot")}>
              忘记密码
            </button>
          </div>
        )}

        {isForgot && (
          <div className="form-extra">
            <button type="button" className="forgot-link" onClick={() => setView("login")}>
              返回登录
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (isForgot && countdown > 0)}
        >
          {loading
            ? (isLogin ? "登录中..." : isRegister ? "注册中..." : "发送中...")
            : isLogin
            ? "登录"
            : isRegister
            ? "注册"
            : countdown > 0
            ? `${countdown}s 后重试`
            : "发送重置邮件"}
        </button>

      </form>
    </div>
  );
};

export default AuthForm;