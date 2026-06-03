export default function DocumentInfoRow({ label, value }) {
  return (
    <div className="border-b border-zinc-200 py-2">
      <span className="block text-[11px] font-black uppercase text-amiste-gray/50">{label}</span>
      <strong className="mt-1 block text-sm font-bold text-amiste-black">{value || "-"}</strong>
    </div>
  );
}
