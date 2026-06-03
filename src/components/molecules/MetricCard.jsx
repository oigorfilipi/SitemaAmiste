import AppIcon from "../atoms/AppIcon.jsx";
import { cn } from "../../utils/cn.js";

const TONES = {
  red: "bg-amiste-red text-white",
  yellow: "bg-amiste-yellow text-amiste-black",
  green: "bg-amiste-green text-white",
  blue: "bg-amiste-blue text-white",
};

export default function MetricCard({ metric }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-amiste">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-amiste-gray/55">{metric.label}</p>
          <strong className="mt-3 block font-display text-3xl font-black text-amiste-black">
            {metric.value}
          </strong>
          <span className="mt-1 block text-sm font-medium text-amiste-gray/70">{metric.detail}</span>
        </div>
        <span className={cn("grid size-11 place-items-center rounded-md", TONES[metric.tone])}>
          <AppIcon name={metric.icon} size={22} />
        </span>
      </div>
    </article>
  );
}
