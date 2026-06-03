import AppIcon from "./AppIcon.jsx";
import { cn } from "../../utils/cn.js";

export default function BrandMark({ compact = false }) {
  return (
    <div className={cn("flex items-center gap-3", compact ? "justify-center" : "")}>
      <span className="grid size-11 place-items-center rounded-md bg-amiste-red text-white shadow-lg shadow-amiste-red/20">
        <AppIcon name="coffee" size={22} />
      </span>
      {!compact ? (
        <span className="leading-tight">
          <strong className="block font-display text-base font-black uppercase text-white">Amiste</strong>
          <span className="text-xs font-semibold uppercase text-white/55">Cafe ERP</span>
        </span>
      ) : null}
    </div>
  );
}
