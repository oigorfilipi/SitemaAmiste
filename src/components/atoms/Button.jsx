import AppIcon from "./AppIcon.jsx";
import { cn } from "../../utils/cn.js";

const VARIANTS = {
  primary: "border-amiste-red bg-amiste-red text-white shadow-amiste-red/10 hover:border-red-800 hover:bg-red-800",
  secondary: "border-zinc-200 bg-white text-amiste-gray hover:border-amiste-red/40 hover:bg-amiste-red/5 hover:text-amiste-red",
  success: "border-amiste-green bg-amiste-green text-white hover:border-green-800 hover:bg-green-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100",
  danger: "border-amiste-red bg-amiste-red text-white hover:border-red-900 hover:bg-red-900",
  dark: "border-amiste-black bg-amiste-black text-white hover:bg-amiste-gray",
};

export default function Button({
  children,
  disabled = false,
  icon,
  loading = false,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <button
      aria-busy={loading ? "true" : undefined}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-xl border px-3.5 text-[13px] font-bold shadow-sm transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amiste-red/20 active:translate-y-0 active:scale-[0.99]",
        VARIANTS[variant],
        isDisabled ? "cursor-not-allowed opacity-45 hover:translate-y-0" : "",
        className
      )}
      disabled={isDisabled}
      type={type}
      {...props}
    >
      {loading ? <AppIcon className="animate-spin" name="loader" size={17} /> : icon ? <AppIcon name={icon} size={17} /> : null}
      <span>{children}</span>
    </button>
  );
}
