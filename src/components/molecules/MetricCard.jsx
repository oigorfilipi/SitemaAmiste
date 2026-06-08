import AppIcon from "../atoms/AppIcon.jsx";
import { cn } from "../../utils/cn.js";

const TONES = {
  red: "border-amiste-red/15 bg-amiste-red/10 text-amiste-red",
  yellow: "border-amber-200 bg-amber-50 text-amber-700",
  green: "border-amiste-green/15 bg-amiste-green/10 text-amiste-green",
  blue: "border-amiste-blue/15 bg-amiste-blue/10 text-amiste-blue",
};

export default function MetricCard({ metric }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-amiste-red/25 hover:shadow-amiste-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-amiste-gray/50">{metric.label}</p>
          <strong className="mt-2 block font-display text-2xl font-black text-amiste-black">
            {metric.value}
          </strong>
          <span className="mt-1 block text-xs font-semibold text-amiste-gray/60">{metric.detail}</span>
        </div>
        <span className={cn("grid size-10 place-items-center rounded-xl border", TONES[metric.tone])}>
          <AppIcon name={metric.icon} size={20} />
        </span>
      </div>
    </article>
  );
}
