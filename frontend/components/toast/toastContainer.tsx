'use client'
import { useToast } from "@/contexts/toastContext";
import Toast from "./toast";

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000 }}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          visible={true}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;