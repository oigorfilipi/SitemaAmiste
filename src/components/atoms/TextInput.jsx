import AppIcon from "./AppIcon.jsx";
import { cn } from "../../utils/cn.js";

export default function TextInput({ icon, className = "", ...props }) {
  return (
    <div className={cn("relative block", className)}>
      {icon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
          <AppIcon name={icon} size={17} />
        </span>
      ) : null}
      <input
        className={cn(
          "h-10 w-full rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm text-amiste-black outline-none transition focus:border-amiste-red focus:bg-white focus:ring-2 focus:ring-amiste-red/10",
          icon ? "pl-10" : ""
        )}
        {...props}
      />
    </div>
  );
}
