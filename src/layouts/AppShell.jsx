import AppHeader from "../components/organisms/AppHeader.jsx";
import AppSidebar from "../components/organisms/AppSidebar.jsx";
import { cn } from "../utils/cn.js";

export default function AppShell({
  children,
  collapsed,
  navigation,
  shortcuts,
  activePage,
  activeAccessLevel,
  user,
  realUser,
  previewUser,
  sidebarUsers,
  onExitPreview,
  onLogout,
  onPreviewUser,
  onSelectPage,
  onToggleSidebar,
}) {
  return (
    <div className="min-h-screen">
      {/* --- SECAO: ESTRUTURA FIXA DO APP --- */}
      <AppSidebar
        activePage={activePage}
        collapsed={collapsed}
        navigation={navigation}
        previewUser={previewUser}
        realUser={realUser}
        sidebarUsers={sidebarUsers}
        user={user}
        onPreviewUser={onPreviewUser}
        onSelectPage={onSelectPage}
        onToggle={onToggleSidebar}
      />
      <AppHeader
        activePage={activePage}
        collapsed={collapsed}
        shortcuts={shortcuts}
        user={user}
        previewUser={previewUser}
        onExitPreview={onExitPreview}
        onLogout={onLogout}
        onSelectPage={onSelectPage}
      />

      {/* --- SECAO: AREA DE CONTEUDO --- */}
      <main
        className={cn(
          "min-h-screen pt-16 transition-all duration-300",
          collapsed ? "ml-[76px]" : "ml-[280px]"
        )}
      >
        <div className="p-6">
          {previewUser ? (
            <div className="mb-5 flex items-center justify-between rounded-lg border border-amiste-yellow/70 bg-amiste-yellow/25 px-4 py-3">
              <div>
                <strong className="block text-sm font-black text-amiste-black">
                  Modo visualizacao ativo: {previewUser.displayName}
                </strong>
                <span className="text-xs font-semibold text-amiste-gray">
                  Cargo simulado: {previewUser.role} | Permissao nesta tela: {activeAccessLevel}
                </span>
              </div>
              <button className="text-sm font-black text-amiste-red" type="button" onClick={onExitPreview}>
                Sair do modo visualizacao
              </button>
            </div>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
