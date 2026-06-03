import AppIcon from "./AppIcon.jsx";
import { cn } from "../../utils/cn.js";

export default function IconButton({ icon, label, active = false, className = "", ...props }) {
  return (
    <button
      aria-label={label}
      className={cn(
        "grid size-10 place-items-center rounded-md border text-amiste-gray transition duration-200 hover:-translate-y-0.5 hover:border-amiste-red hover:text-amiste-red focus:outline-none focus:ring-2 focus:ring-amiste-red/30",
        active ? "border-amiste-red bg-amiste-red text-white hover:text-white" : "border-zinc-200 bg-white",
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
