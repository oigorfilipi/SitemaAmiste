export default function FormField({ children, className = "", label, required = false }) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">
        {label}
        {required ? <span className="text-amiste-red"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
