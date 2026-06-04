export default function FormField({ children, className = "", label, required = false }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">
        {label}
        {required ? <span className="text-amiste-red"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
