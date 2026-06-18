import BrandMark from "../atoms/BrandMark.jsx";
import Button from "../atoms/Button.jsx";
import IconButton from "../atoms/IconButton.jsx";
import UserTag from "../atoms/UserTag.jsx";
import SidebarNavItem from "../molecules/SidebarNavItem.jsx";
import { cn } from "../../utils/cn.js";

export default function AppSidebar({
  collapsed,
  navigation,
  activePage,
  user,
  realUser,
  previewUser,
  sidebarUsers,
  onPreviewUser,
  onSelectPage,
  onToggle,
}) {
  const canManageAccounts = realUser?.role === "DEV" || realUser?.role === "CEO";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col bg-amiste-black px-3 py-4 shadow-2xl transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[264px]"
      )}
    >
      {/* --- SECAO: MARCA E CONTROLE --- */}
      <div className="flex items-center justify-between gap-3 px-1">
        <BrandMark compact={collapsed} onClick={() => onSelectPage("home")} />
        {!collapsed ? (
          <IconButton
            className="border-white/10 bg-white/5 text-white hover:bg-white hover:text-amiste-red"
            icon="chevronLeft"
            label="Ocultar menu"
            onClick={onToggle}
          />
        ) : null}
      </div>

      {collapsed ? (
        <IconButton
          className="mx-auto mt-4 border-white/10 bg-white/5 text-white hover:bg-white hover:text-amiste-red"
          icon="chevronRight"
          label="Mostrar menu"
          onClick={onToggle}
        />
      ) : null}

      {/* --- SECAO: ROTAS PRINCIPAIS --- */}
      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {navigation.map((item) => (
          <SidebarNavItem
            key={item.id}
            active={activePage === item.id}
            collapsed={collapsed}
            item={item}
            onSelect={onSelectPage}
          />
        ))}
      </nav>

      {/* --- SECAO: AREA ADMINISTRATIVA --- */}
      <div className="border-t border-white/10 pt-4">
        {!collapsed && canManageAccounts ? (
          <div className="mb-4 grid grid-cols-2 gap-2">
            <Button className="h-8 px-2 text-[11px]" icon="userPlus" variant="secondary" onClick={() => onSelectPage("accounts")}>
              Equipe
            </Button>
            <Button className="h-8 px-2 text-[11px]" icon="archive" variant="secondary" onClick={() => onSelectPage("accounts")}>
              Desligadas
            </Button>
          </div>
        ) : null}

        {canManageAccounts ? <div className="space-y-2">
          {sidebarUsers.map((user) => (
            <button
              className={cn(
                "flex h-10 w-full items-center gap-2 rounded-xl px-2 text-left transition hover:bg-white/10",
                previewUser?.id === user.id ? "bg-white/12" : "",
                collapsed ? "justify-center" : ""
              )}
              key={user.id}
              title={collapsed ? user.displayName : undefined}
              type="button"
              onClick={() => onPreviewUser(user.id)}
            >
              <span className="grid size-7 place-items-center overflow-hidden rounded-full bg-white/12 text-[11px] font-black text-white">
                {user.profilePhotoDataUrl || user.profilePhotoUrl ? (
                  <img alt={user.displayName} className="h-full w-full object-cover" src={user.profilePhotoDataUrl || user.profilePhotoUrl} />
                ) : user.avatarInitials}
              </span>
              {!collapsed ? (
                <>
                  <span className="min-w-0 flex-1 truncate text-xs font-bold text-white/70">
                    {user.displayName}
                  </span>
                  <UserTag role={user.role} />
                </>
              ) : null}
            </button>
          ))}
        </div> : null}
      </div>
    </aside>
  );
}
