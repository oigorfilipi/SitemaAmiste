export default function DocumentInfoRow({ compact = false, label, value }) {
  const wrapperClassName = compact ? "border-b border-zinc-200 py-1" : "border-b border-zinc-200 py-2";
  const labelClassName = compact
    ? "block text-[9px] font-black uppercase leading-tight text-amiste-gray/50"
    : "block text-[11px] font-black uppercase text-amiste-gray/50";
  const valueClassName = compact
    ? "mt-0.5 block text-[11px] font-bold leading-tight text-amiste-black"
    : "mt-1 block text-sm font-bold text-amiste-black";

  return (
    <div className={wrapperClassName}>
      <span className={labelClassName}>{label}</span>
      <strong className={valueClassName}>{value || "-"}</strong>
    </div>
  );
}
