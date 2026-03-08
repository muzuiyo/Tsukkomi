'use client'
import { useSearchParams, useRouter } from "next/navigation";
import ResetForm from "@/components/resetForm";
import "../auth.page.css";
import { authResetPassword } from "@/lib/api/auth";

const ForgotPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 从 URL 获取 token
  const token = searchParams.get("token") || "";

  const handleResetPassword = async (password: string) => {
    if (!token) {
      throw new Error("缺少重置密码的 token，请检查链接");
    }
    await authResetPassword({ token, newPassword: password });
    // 重置成功后跳转到登录页
    router.push("/auth");
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">💬 TSUKKOMI</h1>
          <span className="auth-mode">重置密码</span>
        </div>
        <ResetForm onSubmit={handleResetPassword} />
      </div>
    </div>
  );
};

export default ForgotPage;