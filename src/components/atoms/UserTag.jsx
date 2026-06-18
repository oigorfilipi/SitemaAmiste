import { cn } from "../../utils/cn.js";

const TAG_STYLES = {
  CEO: "bg-amiste-red text-white",
  DON: "bg-amiste-red text-white",
  DEV: "bg-amiste-purple text-white",
  VEN: "bg-amiste-green text-white",
  ADM: "bg-amiste-yellow text-amiste-black",
  TEC: "bg-amiste-blue text-white",
  FIN: "bg-amiste-orange text-white",
};

export default function UserTag({ role, className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded px-2 text-[11px] font-black uppercase tracking-normal",
        TAG_STYLES[role] || "bg-zinc-200 text-zinc-700",
        className
      )}
    >
      {role}
    </span>
  );
}
