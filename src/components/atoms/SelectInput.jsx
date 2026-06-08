import { cn } from "../../utils/cn.js";

export default function SelectInput({ className = "", children, ...props }) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[13px] font-semibold text-amiste-black shadow-sm outline-none transition duration-200 hover:border-zinc-300 focus:border-amiste-red/70 focus:bg-white focus:ring-4 focus:ring-amiste-red/10 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-amiste-gray/55",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
