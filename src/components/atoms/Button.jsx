import AppIcon from "./AppIcon.jsx";
import { cn } from "../../utils/cn.js";

const VARIANTS = {
  primary: "border-amiste-red bg-amiste-red text-white hover:bg-red-800",
  secondary: "border-amiste-gray bg-white text-amiste-gray hover:border-amiste-red hover:text-amiste-red",
  success: "border-amiste-green bg-amiste-green text-white hover:bg-green-800",
  warning: "border-amiste-yellow bg-amiste-yellow text-amiste-black hover:bg-yellow-300",
  dark: "border-amiste-black bg-amiste-black text-white hover:bg-amiste-gray",
};

export default function Button({
  children,
  icon,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold shadow-sm transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amiste-red/30",
        VARIANTS[variant],
        props.disabled ? "cursor-not-allowed opacity-45 hover:translate-y-0" : "",
        className
      )}
      type={type}
      {...props}
    >
      {icon ? <AppIcon name={icon} size={17} /> : null}
      <span>{children}</span>
    </button>
  );
}
