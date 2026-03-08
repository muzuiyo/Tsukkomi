'use client'
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
  visible: boolean;
}

const Toast = ({ message, type = 'info', duration = 3000, onClose, visible }: ToastProps) => {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#4caf50', color: '#fff' };
      case 'error':
        return { backgroundColor: '#f44336', color: '#fff' };
      case 'warning':
        return { backgroundColor: '#ff9800', color: '#fff' };
      case 'info':
      default:
        return { backgroundColor: '#2196f3', color: '#fff' };
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    minWidth: '200px',
    maxWidth: 'calc(100vw - 40px)',
    padding: '12px 20px',
    borderRadius: '4px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    zIndex: 9999,
    wordBreak: 'break-word',
    lineHeight: 1.5,
    animation: 'slideDown 0.3s ease', // 替换为 slideDown
    ...getTypeStyles(),
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    fontSize: '18px',
    cursor: 'pointer',
    opacity: 0.8,
    flexShrink: 0,
  };

  return (
    <div style={containerStyle} role="alert">
      <span style={{ flex: 1 }}>{message}</span>
      <button style={closeButtonStyle} onClick={onClose} aria-label="关闭">
        &times;
      </button>
    </div>
  );
};

export default Toast;