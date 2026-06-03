import AppIcon from "../atoms/AppIcon.jsx";
import { cn } from "../../utils/cn.js";

export default function SidebarNavItem({ item, active, collapsed, onSelect }) {
  return (
    <button
      className={cn(
        "group relative flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition duration-200",
        active
          ? "bg-white text-amiste-red shadow-sm"
          : "text-white/68 hover:bg-white/8 hover:text-white"
      )}
      title={collapsed ? item.label : undefined}
      type="button"
      onClick={() => onSelect(item.id)}
    >
      <AppIcon name={item.icon} size={19} className={active ? "text-amiste-red" : "text-white/68"} />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
      {active ? <span className="absolute right-0 h-6 w-1 rounded-l bg-amiste-red" /> : null}
    </button>
  );
}
