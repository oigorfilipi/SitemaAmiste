import logoUrl from "../../assets/Logo.png";
import { cn } from "../../utils/cn.js";

export default function BrandMark({ compact = false, onClick }) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      aria-label={onClick ? "Ir para Home" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-2xl text-left transition duration-200",
        onClick ? "cursor-pointer hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20" : "",
        compact ? "justify-center p-1" : "px-1 py-1"
      )}
      type={onClick ? "button" : undefined}
      onClick={onClick}
    >
      <span className="grid size-10 place-items-center overflow-hidden rounded-2xl bg-white/8 shadow-lg shadow-amiste-red/20">
        <img alt="Amiste Cafe" className="h-full w-full object-cover" src={logoUrl} />
      </span>
      {!compact ? (
        <span className="leading-tight">
          <strong className="block font-display text-base font-black uppercase text-white">Amiste</strong>
          <span className="text-xs font-semibold uppercase text-white/55">Cafe ERP</span>
        </span>
      ) : null}
    </Wrapper>
  );
}
