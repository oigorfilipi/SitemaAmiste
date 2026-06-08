import AppIcon from "../atoms/AppIcon.jsx";
import { cn } from "../../utils/cn.js";

export default function SidebarNavItem({ item, active, collapsed, onSelect }) {
  return (
    <button
      className={cn(
        "group relative flex h-10 w-full items-center gap-3 rounded-2xl px-3 text-left text-[13px] font-bold transition duration-200",
        active
          ? "bg-white text-amiste-red shadow-sm"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      )}
      title={collapsed ? item.label : undefined}
      type="button"
      onClick={() => onSelect(item.id)}
    >
      <AppIcon name={item.icon} size={19} className={active ? "text-amiste-red" : "text-white/70"} />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
      {active ? <span className="absolute right-1.5 h-5 w-1 rounded-full bg-amiste-red" /> : null}
    </button>
  );
}
