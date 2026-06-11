import UserTag from "../atoms/UserTag.jsx";
import { cn } from "../../utils/cn.js";

export default function LoginAccountOption({ account, active, onSelect }) {
  return (
    <button
      aria-label={`Selecionar ${account.displayName}`}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 text-left transition duration-300 hover:-translate-y-0.5 hover:border-amiste-red hover:shadow-amiste-soft",
        active ? "border-amiste-red bg-amiste-red/10" : "border-zinc-200 bg-white"
      )}
      type="button"
      onClick={() => onSelect(account.id)}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amiste-red text-sm font-black text-white">
        {account.avatarInitials}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm font-black text-amiste-black">{account.displayName}</strong>
        <span className="mt-1 block truncate text-xs font-semibold text-amiste-gray/60">{account.email}</span>
      </span>
      <UserTag role={account.role} />
    </button>
  );
}
