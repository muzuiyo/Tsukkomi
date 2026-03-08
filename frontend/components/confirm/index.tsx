"use client";
import { createContext, useContext, useState } from "react";
import "./confirm.css";
type ConfirmFn = (message: string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export const ConfirmProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<{
    message: string;
    resolve?: (v: boolean) => void;
  } | null>(null);

  const confirm: ConfirmFn = (message) => {
    return new Promise<boolean>((resolve) => {
      setState({ message, resolve });
    });
  };

  const handleClose = (result: boolean) => {
    state?.resolve?.(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {state && (
        <div className="confirm-overlay" onClick={() => handleClose(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-message">{state.message}</div>

            <div className="confirm-actions">
              <button
                className="confirm-btn ok"
                onClick={() => handleClose(true)}
              >
                确认
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => handleClose(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be inside ConfirmProvider");
  }
  return ctx;
};
