import AppIcon from "../components/atoms/AppIcon.jsx";
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
  canGoBack,
  theme,
  user,
  realUser,
  previewUser,
  sidebarUsers,
  onExitPreview,
  onBackPage,
  onLogout,
  onPreviewUser,
  onSelectPage,
  onToggleTheme,
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
        onToggleTheme={onToggleTheme}
        theme={theme}
      />

      {/* --- SECAO: AREA DE CONTEUDO --- */}
      <main
        className={cn(
          "min-h-screen pt-14 transition-all duration-300",
          collapsed ? "ml-[72px]" : "ml-[264px]"
        )}
      >
        <div className="p-5 2xl:p-6">
          {previewUser ? (
            <div className="mb-5 flex items-center justify-between rounded-2xl border border-amiste-yellow/70 bg-amiste-yellow/25 px-4 py-3 shadow-sm">
              <div>
                <strong className="block text-sm font-black text-amiste-black">
                  Modo visualizacao ativo: {previewUser.displayName}
                </strong>
                <span className="text-xs font-semibold text-amiste-gray">
                  Cargo simulado: {previewUser.role} | Permissao nesta tela: {activeAccessLevel}
                </span>
              </div>
              <button className="text-sm font-black text-amiste-red transition hover:text-amiste-black" type="button" onClick={onExitPreview}>
                Sair do modo visualizacao
              </button>
            </div>
          ) : null}
          {canGoBack ? (
            <button
              className="mb-4 inline-flex h-8 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-black text-amiste-gray shadow-sm transition hover:-translate-y-px hover:border-amiste-red/30 hover:bg-amiste-red/10 hover:text-amiste-red"
              type="button"
              onClick={onBackPage}
            >
              <AppIcon name="chevronLeft" size={15} />
              Voltar
            </button>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
