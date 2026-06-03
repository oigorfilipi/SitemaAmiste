import { cn } from "../../utils/cn.js";

export default function TextArea({ className = "", ...props }) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-md border border-zinc-200 bg-zinc-100 px-3 py-3 text-sm text-amiste-black outline-none transition focus:border-amiste-red focus:bg-white focus:ring-2 focus:ring-amiste-red/10",
        className
      )}
      {...props}
    />
  );
}
