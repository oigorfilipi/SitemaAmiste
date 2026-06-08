import { useEffect, useRef } from "react";
import { cn } from "../../utils/cn.js";

export default function TextArea({ className = "", onInput, ...props }) {
  const textareaRef = useRef(null);

  function resizeTextarea() {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 220 ? "auto" : "hidden";
  }

  useEffect(() => {
    resizeTextarea();
  }, [props.value]);

  return (
    <textarea
      ref={textareaRef}
      className={cn(
        "min-h-24 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-[13px] font-semibold leading-6 text-amiste-black shadow-sm outline-none transition duration-200 hover:border-zinc-300 focus:border-amiste-red/70 focus:bg-white focus:ring-4 focus:ring-amiste-red/10 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-amiste-gray/55",
        className
      )}
      onInput={(event) => {
        resizeTextarea();
        onInput?.(event);
      }}
      {...props}
    />
  );
}
