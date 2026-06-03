import { cn } from "../../utils/cn.js";

const TONES = {
  brand: {
    accent: "bg-amiste-green",
    text: "text-amiste-green",
  },
  machine: {
    accent: "bg-amiste-red",
    text: "text-amiste-red",
  },
};

export default function LabelArtwork({ label, compact = false }) {
  const tone = TONES[label.previewTone] || TONES.brand;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-zinc-200 bg-amiste-black p-3 shadow-sm",
        compact ? "h-44" : "min-h-72"
      )}
    >
      <div className="flex h-full overflow-hidden rounded-md bg-white">
        <div className={cn("flex w-20 shrink-0 flex-col items-center justify-center text-white", tone.accent)}>
          <strong className="text-sm font-black uppercase">Amiste</strong>
          <span className="mt-1 text-[11px] font-bold uppercase">Cafe</span>
        </div>
        <div className="min-w-0 flex-1 p-4">
          <span className="text-[11px] font-black uppercase text-amiste-gray/55">{label.category}</span>
          <h3
            className={cn(
              "mt-3 truncate font-display font-black text-amiste-black",
              compact ? "text-lg" : "text-3xl"
            )}
          >
            {label.name}
          </h3>
          <strong className={cn("mt-3 block truncate font-black", compact ? "text-base" : "text-2xl", tone.text)}>
            {label.linkedName}
          </strong>
          <span className="mt-3 block truncate text-sm font-bold text-amiste-gray/70">{label.specLine}</span>
          {!compact ? (
            <p className="mt-5 max-w-xl text-sm leading-6 text-amiste-gray/75">{label.description}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
