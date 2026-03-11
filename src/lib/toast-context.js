"use client";
import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-2), { id, message, type, leaving: false }]);

    setTimeout(() => {
      setToasts(t => t.map(x => x.id === id ? { ...x, leaving: true } : x));
      setTimeout(() => {
        setToasts(t => t.filter(x => x.id !== id));
      }, 300);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(t => t.map(x => x.id === id ? { ...x, leaving: true } : x));
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 300);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Bottom-right toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast}/>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }) {
  const config = {
    success: { icon:"✅", bar:"#C8974A",  border:"#D4B483", title:"Success", titleColor:"#8B6914" },
    error:   { icon:"❌", bar:"#C0392B",  border:"#E8A89C", title:"Error",   titleColor:"#C0392B" },
    warning: { icon:"⚠️", bar:"#D4A017",  border:"#E8D08A", title:"Warning", titleColor:"#B7770D" },
    info:    { icon:"ℹ️", bar:"#1565C0",  border:"#90B8E8", title:"Info",    titleColor:"#1565C0" },
  };
  const c = config[toast.type] || config.success;

  return (
    <div className={`pointer-events-auto w-80 rounded-2xl bg-white overflow-hidden
      ${toast.leaving ? "toast-out" : "toast-in"}`}
      style={{
        border:`1px solid ${c.border}`,
        boxShadow:"0 8px 30px rgba(44,26,14,0.15)"
      }}>

      {/* Progress bar */}
      <div className="h-1 w-full"
        style={{
          background: c.bar,
          animation: toast.leaving ? "none" : "shrink 4s linear forwards"
        }}/>

      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className="text-lg flex-shrink-0 mt-0.5">{c.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color:c.titleColor }}>{c.title}</p>
          <p className="text-sm text-[#5C3D1E] mt-0.5 leading-snug">{toast.message}</p>
        </div>
        <button onClick={() => onRemove(toast.id)}
          className="text-[#C4A882] hover:text-[#5C3D1E] transition-colors flex-shrink-0 mt-0.5 text-lg leading-none">
          ×
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}