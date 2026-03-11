// components/ui/index.jsx
// All reusable UI components

export function StatusBadge({ status }) {
  const label = status?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide badge-${status} transition-all duration-200`}>
      {label}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  type = "button",
  className = ""
}) {

  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-sm"
  };

  const variants = {
    primary:
      "text-white shadow-sm hover:shadow-md hover:-translate-y-[1px]",
    secondary:
      "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300",
    danger:
      "bg-red-500 text-white hover:bg-red-600 hover:shadow-md",
    ghost:
      "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      style={
        variant === "primary"
          ? { background: "linear-gradient(135deg,#f97316,#ea580c)" }
          : {}
      }
    >
      {children}
    </button>
  );
}

export function Modal({ isOpen, onClose, title, children, size = "md" }) {

  if (!isOpen) return null;

  const widths = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl"
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      style={{
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(6px)"
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >

      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[90vh] overflow-y-auto animate-scaleIn`}
      >

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">

          <h2 className="text-base font-bold text-slate-800 font-display">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

        </div>

        <div className="px-6 py-5">
          {children}
        </div>

      </div>
    </div>
  );
}

export function FormField({ label, children, required, hint }) {

  return (
    <div>

      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>

      {children}

      {hint && (
        <p className="text-xs text-slate-400 mt-1">
          {hint}
        </p>
      )}

    </div>
  );
}

export function Input({ className = "", ...props }) {

  return (
    <input
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm bg-white transition-all
      focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400
      hover:border-slate-300
      ${className}`}
    />
  );
}

export function Select({ children, className = "", ...props }) {

  return (
    <select
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm bg-white transition-all
      focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400
      hover:border-slate-300
      ${className}`}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {

  return (
    <textarea
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm bg-white resize-none transition-all
      focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400
      hover:border-slate-300
      ${className}`}
    />
  );
}

export function PageHeader({ title, subtitle, action }) {

  return (
    <div className="flex items-start justify-between mb-7">

      <div>

        <h1 className="text-2xl font-bold text-slate-800 font-display">
          {title}
        </h1>

        {subtitle && (
          <p className="text-slate-500 text-sm mt-1">
            {subtitle}
          </p>
        )}

      </div>

      {action}

    </div>
  );
}

export function StatCard({ label, value, icon, color = "#f97316", sub }) {

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-lg hover:-translate-y-[2px]">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-slate-500 text-sm font-medium">
            {label}
          </p>

          <p className="text-3xl font-bold text-slate-800 mt-1 font-display">
            {value}
          </p>

          {sub && (
            <p className="text-xs text-slate-400 mt-1">
              {sub}
            </p>
          )}

        </div>

        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            background: `${color}18`,
            color
          }}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

export function EmptyState({ message }) {

  return (
    <div className="text-center py-16 text-slate-400">

      <svg
        className="mx-auto mb-3 opacity-25"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>

      <p className="text-sm">
        {message}
      </p>

    </div>
  );
}

export function Spinner() {

  return (
    <div className="flex items-center justify-center py-20">

      <div className="w-8 h-8 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin"/>

    </div>
  );
}

export function Avatar({ name, color = "#f97316", size = "md" }) {

  const sizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base"
  };

  return (
    <div
      className={`${sizes[size]} rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}cc)`
      }}
    >
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}