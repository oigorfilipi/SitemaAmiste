import AppIcon from "./AppIcon.jsx";
import { cn } from "../../utils/cn.js";

export default function TextInput({ icon, className = "", ...props }) {
  return (
    <div className={cn("relative block", className)}>
      {icon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-amiste-red/55">
          <AppIcon name={icon} size={16} />
        </span>
      ) : null}
      <input
        className={cn(
          "h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[13px] font-semibold text-amiste-black shadow-sm outline-none transition duration-200 hover:border-zinc-300 focus:border-amiste-red/70 focus:bg-white focus:ring-4 focus:ring-amiste-red/10 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-amiste-gray/55",
          icon ? "pl-10" : ""
        )}
        {...props}
      />
    </div>
  );
}
