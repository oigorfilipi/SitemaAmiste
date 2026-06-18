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
import { THEMES, applyTheme, getStoredTheme, saveStoredTheme, toggleTheme } from "./services/themeService.js";

export default function App() {
  const [activePage, setActivePage] = useState("home");
  const [pageHistory, setPageHistory] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [previewUserId, setPreviewUserId] = useState("");
  const [theme, setTheme] = useState(THEMES.LIGHT);
  const {
    completeFirstAccess,
    data: userContext,
    isLoading: isUserLoading,
    login,
    logout,
    requestAccess,
    updatePassword,
  } = useCurrentUser();
  const { data: navigation } = useNavigation();

  const activeUser = useMemo(() => {
    if (!previewUserId) {
      return userContext.user;
    }

    return userContext.sidebarUsers.find((user) => user.id === previewUserId) || userContext.user;
  }, [previewUserId, userContext.sidebarUsers, userContext.user]);
  const previewableSidebarUsers = useMemo(() => {
    if (userContext.user?.role === "DEV") {
      return userContext.sidebarUsers;
    }

    if (userContext.user?.role === "DON" || userContext.user?.role === "CEO") {
      return userContext.sidebarUsers.filter((sidebarUser) => sidebarUser.role !== "DEV");
    }

    return [];
  }, [userContext.sidebarUsers, userContext.user]);

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
  const activePageAllowed = canAccessPage(activeRole, activePage);
  const safeActivePage = activePageAllowed ? activePage : "home";
  const CurrentPage = useMemo(() => pageRegistry[safeActivePage] || pageRegistry.home, [safeActivePage]);
  const activeAccessLevel = getPageAccess(activeRole, safeActivePage);

  useEffect(() => {
    if (!activePageAllowed) {
      setActivePage("home");
    }
  }, [activePageAllowed]);

  useEffect(() => {
    if (!userContext.user) {
      setTheme(THEMES.LIGHT);
      applyTheme(THEMES.LIGHT);
      return;
    }

    const nextTheme = getStoredTheme(userContext.user);
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, [userContext.user]);

  useEffect(() => {
    if (previewUserId && !previewableSidebarUsers.some((sidebarUser) => sidebarUser.id === previewUserId)) {
      setPreviewUserId("");
    }
  }, [previewUserId, previewableSidebarUsers]);

  /* --- SECAO: ESTADO DE NAVEGACAO ---
   * Esta troca simples mantem o projeto leve no inicio. Quando entrar React Router,
   * o registro de paginas pode virar uma tabela de rotas sem alterar a sidebar.
   */
  function handleSelectPage(pageId) {
    if (!canAccessPage(activeRole, pageId)) {
      setActivePage("home");
      setPageHistory([]);
      return;
    }

    const currentSafePage = canAccessPage(activeRole, activePage) ? activePage : "home";

    if (pageId !== currentSafePage) {
      setPageHistory((currentHistory) => [...currentHistory.slice(-18), currentSafePage]);
    }

    setActivePage(pageId);
  }

  function handleBackPage() {
    const previousPage = pageHistory[pageHistory.length - 1];

    setPageHistory((currentHistory) => currentHistory.slice(0, -1));
    setActivePage(previousPage && canAccessPage(activeRole, previousPage) ? previousPage : "home");
  }

  function handlePreviewUser(userId) {
    const realUser = userContext.user;
    const targetUser = userContext.sidebarUsers.find((sidebarUser) => sidebarUser.id === userId);

    if (!realUser || !targetUser || userId === realUser.id) {
      setPreviewUserId("");
      return;
    }

    if (!["DEV", "DON", "CEO"].includes(realUser.role)) {
      return;
    }

    if ((realUser.role === "DON" || realUser.role === "CEO") && targetUser.role === "DEV") {
      setPreviewUserId("");
      return;
    }

    setPreviewUserId(userId);
  }

  async function handleLogout() {
    setPreviewUserId("");
    setActivePage("home");
    setPageHistory([]);
    await logout();
  }

  function handleToggleTheme() {
    const nextTheme = toggleTheme(theme);

    setTheme(nextTheme);
    saveStoredTheme(userContext.user, nextTheme);
    applyTheme(nextTheme);
  }

  if (!userContext.user) {
    return (
      <LoginPage
        accounts={userContext.loginAccounts}
        isLoading={isUserLoading}
        onLogin={login}
        onChangePassword={updatePassword}
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
      activePage={safeActivePage}
      activeAccessLevel={activeAccessLevel}
      collapsed={sidebarCollapsed}
      navigation={filteredNavigation}
      previewUser={previewUserId ? activeUser : null}
      shortcuts={filteredShortcuts}
      sidebarUsers={previewableSidebarUsers}
      theme={theme}
      user={activeUser}
      realUser={userContext.user}
      onExitPreview={() => setPreviewUserId("")}
      onBackPage={handleBackPage}
      onPreviewUser={handlePreviewUser}
      onSelectPage={handleSelectPage}
      onLogout={handleLogout}
      onToggleTheme={handleToggleTheme}
      onToggleSidebar={() => setSidebarCollapsed((currentState) => !currentState)}
      canGoBack={pageHistory.length > 0 && safeActivePage !== "home"}
    >
      <Suspense
        fallback={(
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-amiste-gray shadow-sm">
            Carregando modulo...
          </div>
        )}
      >
        <CurrentPage
          accessLevel={activeAccessLevel}
          navigation={navigation}
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
