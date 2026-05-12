'use client'
import { useState } from "react";
import { validatePassword } from "@/lib/validators";
import "./resetForm.css";

interface ResetFormProps {
  onSubmit: (password: string, confirmPassword: string) => Promise<void>;
}

const ResetForm = ({ onSubmit }: ResetFormProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validatePassword(password)) {
      setError("密码必须 6~20 个字符，允许大小写字母、数字和 !@#$%^&*");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await onSubmit(password, confirmPassword);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "操作失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-form-container">
      <form onSubmit={handleSubmit} className="reset-form">

        <input
          type="password"
          placeholder="新密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="确认新密码"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <div className="reset-error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "提交中..." : "设置新密码"}
        </button>

      </form>
    </div>
  );
};

export default ResetForm;