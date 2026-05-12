'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/authForm";
import siteConfig from "@/site.config";
import "./auth.page.css";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const router = useRouter();

  const isLogin = mode === "login";

  const handleSuccess = () => {
    // 前往 memos 主页
    router.push("/memos");
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">💬 TSUKKOMI</h1>
          <span className="auth-mode">
            Auth
          </span>
        </div>
          <AuthForm
            mode={mode}
            onSuccess={handleSuccess}
          />
        {
          siteConfig.allowRegister && <p className="auth-switch">
            {isLogin ? "还没有账号?" : "已拥有账号?"}
            <span onClick={() => {
              setMode(isLogin ? "register" : "login");
            }}>
              {isLogin ? " 去注册" : " 去登录"}
            </span>
          </p>
        }
      </div>
    </div>
  );
};

export default AuthPage;