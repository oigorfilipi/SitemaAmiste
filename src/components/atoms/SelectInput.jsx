import { cn } from "../../utils/cn.js";

export default function SelectInput({ className = "", children, ...props }) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm text-amiste-black outline-none transition focus:border-amiste-red focus:bg-white focus:ring-2 focus:ring-amiste-red/10",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
