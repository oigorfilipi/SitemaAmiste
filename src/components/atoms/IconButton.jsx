import AppIcon from "./AppIcon.jsx";
import { cn } from "../../utils/cn.js";

export default function IconButton({ icon, label, active = false, className = "", ...props }) {
  return (
    <button
      aria-label={label}
      className={cn(
        "grid size-9 place-items-center rounded-xl border text-amiste-gray shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-amiste-red/50 hover:bg-amiste-red/5 hover:text-amiste-red focus:outline-none focus:ring-2 focus:ring-amiste-red/20 active:translate-y-0 active:scale-[0.98]",
        active ? "border-amiste-red bg-amiste-red text-white hover:bg-amiste-red hover:text-white" : "border-zinc-200 bg-white",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:border-zinc-200 disabled:hover:text-amiste-gray",
        className
      )}
      title={label}
      type="button"
      {...props}
    >
      <AppIcon name={icon} size={18} />
    </button>
  );
}
