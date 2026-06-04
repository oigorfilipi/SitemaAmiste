import { Suspense, useEffect, useMemo, useState } from "react";
import AppShell from "./layouts/AppShell.jsx";
import { useCurrentUser } from "./hooks/useCurrentUser.js";
import { useNavigation } from "./hooks/useNavigation.js";
import FirstLoginPage from "./pages/login/FirstLoginPage.jsx";
import LoginPage from "./pages/login/LoginPage.jsx";
import { pageRegistry } from "./pages/pageRegistry.jsx";
import {
  canAccessPage,
  filterNavigationByRole,
  filterQuickAccessByRole,
  getPageAccess,
} from "./services/permissionService.js";

export default function App() {
  const [activePage, setActivePage] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [previewUserId, setPreviewUserId] = useState("");
  const {
    completeFirstAccess,
    data: userContext,
    isLoading: isUserLoading,
    login,
    logout,
    requestAccess,
  } = useCurrentUser();
  const { data: navigation } = useNavigation();

  const activeUser = useMemo(() => {
    if (!previewUserId) {
      return userContext.user;
    }

    return userContext.sidebarUsers.find((user) => user.id === previewUserId) || userContext.user;
  }, [previewUserId, userContext.sidebarUsers, userContext.user]);

  const activeRole = activeUser?.role || "VEN";
  const filteredNavigation = useMemo(
    () => filterNavigationByRole(navigation.primary, activeRole),
    [activeRole, navigation.primary]
  );
  const filteredShortcuts = useMemo(
    () => filterNavigationByRole(navigation.header, activeRole),
    [activeRole, navigation.header]
  );
  const filteredQuickAccess = useMemo(
    () => filterQuickAccessByRole(navigation.quickAccess, activeRole),
    [activeRole, navigation.quickAccess]
  );
  const CurrentPage = useMemo(() => pageRegistry[activePage] || pageRegistry.home, [activePage]);
  const activeAccessLevel = getPageAccess(activeRole, activePage);

  useEffect(() => {
    if (!canAccessPage(activeRole, activePage)) {
      setActivePage("home");
    }
  }, [activePage, activeRole]);

  /* --- SECAO: ESTADO DE NAVEGACAO ---
   * Esta troca simples mantem o projeto leve no inicio. Quando entrar React Router,
   * o registro de paginas pode virar uma tabela de rotas sem alterar a sidebar.
   */
  function handleSelectPage(pageId) {
    if (!canAccessPage(activeRole, pageId)) {
      setActivePage("home");
      return;
    }

    setActivePage(pageId);
  }

  function handlePreviewUser(userId) {
    setPreviewUserId(userId === userContext.user?.id ? "" : userId);
  }

  async function handleLogout() {
    setPreviewUserId("");
    setActivePage("home");
    await logout();
  }

  if (!userContext.user) {
    return (
      <LoginPage
        accounts={userContext.loginAccounts}
        isLoading={isUserLoading}
        onLogin={login}
        onRequestAccess={requestAccess}
      />
    );
  }

  if (userContext.user.mustChangePassword) {
    return (
      <FirstLoginPage
        isLoading={isUserLoading}
        user={userContext.user}
        onComplete={completeFirstAccess}
        onLogout={logout}
      />
    );
  }

  return (
    <AppShell
      activePage={activePage}
      activeAccessLevel={activeAccessLevel}
      collapsed={sidebarCollapsed}
      navigation={filteredNavigation}
      previewUser={previewUserId ? activeUser : null}
      shortcuts={filteredShortcuts}
      sidebarUsers={userContext.sidebarUsers}
      user={activeUser}
      realUser={userContext.user}
      onExitPreview={() => setPreviewUserId("")}
      onPreviewUser={handlePreviewUser}
      onSelectPage={handleSelectPage}
      onLogout={handleLogout}
      onToggleSidebar={() => setSidebarCollapsed((currentState) => !currentState)}
    >
      <Suspense
        fallback={(
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-amiste-gray shadow-sm">
            Carregando modulo...
          </div>
        )}
      >
        <CurrentPage
          accessLevel={activeAccessLevel}
          previewUser={previewUserId ? activeUser : null}
          quickAccess={filteredQuickAccess}
          realUser={userContext.user}
          user={activeUser}
          onSelectPage={handleSelectPage}
        />
      </Suspense>
    </AppShell>
  );
}
