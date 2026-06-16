import { useEffect, useMemo, useRef, useState } from "react";
import IconButton from "../atoms/IconButton.jsx";
import Button from "../atoms/Button.jsx";
import HeaderShortcut from "../molecules/HeaderShortcut.jsx";
import UserBadge from "../molecules/UserBadge.jsx";
import TextInput from "../atoms/TextInput.jsx";
import GlobalSearchPanel from "./GlobalSearchPanel.jsx";
import NotificationCenter from "./NotificationCenter.jsx";
import { useGlobalSearch } from "../../hooks/useGlobalSearch.js";
import { useDashboard } from "../../hooks/useDashboard.js";
import { useCollection } from "../../hooks/useCollection.js";
import {
  buildNotificationScope,
  getUnreadAlerts,
  markAlertsAsViewed,
} from "../../services/notificationReadService.js";
import { canAccessPage } from "../../services/permissionService.js";
import { filterRequestsForUser, resolveRequestStatus } from "../../services/requestService.js";
import { cn } from "../../utils/cn.js";

export default function AppHeader({
  collapsed,
  shortcuts,
  activePage,
  user,
  previewUser,
  onExitPreview,
  onLogout,
  onSelectPage,
  onToggleTheme,
  theme = "light",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [notificationReadVersion, setNotificationReadVersion] = useState(0);
  const searchCloseTimer = useRef(null);
  const { isSearching, results } = useGlobalSearch(searchTerm, user?.role || "VEN");
  const { data: dashboard } = useDashboard(user?.role || "VEN");
  const { records: requestRecords } = useCollection("accountRequests");
  const alerts = dashboard.alerts || [];
  const notificationScope = buildNotificationScope(user);
  const unreadAlerts = useMemo(
    () => getUnreadAlerts(alerts, notificationScope),
    [alerts, notificationReadVersion, notificationScope]
  );
  const searchOpen = searchFocused && searchTerm.trim().length >= 2;
  const canSeeRequests = canAccessPage(user?.role || "VEN", "solicitacoes");
  const activeRequestCount = canSeeRequests
    ? filterRequestsForUser(requestRecords, user).filter((request) =>
      ["pendente", "reativado", "atendendo", "analise", "aguardando-resposta", "transferido"].includes(resolveRequestStatus(request))
    ).length
    : 0;

  useEffect(() => {
    if (alertsOpen && markAlertsAsViewed(alerts, notificationScope)) {
      setNotificationReadVersion((currentVersion) => currentVersion + 1);
    }
  }, [alerts, alertsOpen, notificationScope]);

  function closeSearch() {
    if (searchCloseTimer.current) {
      window.clearTimeout(searchCloseTimer.current);
      searchCloseTimer.current = null;
    }

    setSearchFocused(false);
  }

  function openSearch() {
    if (searchCloseTimer.current) {
      window.clearTimeout(searchCloseTimer.current);
      searchCloseTimer.current = null;
    }

    setSearchFocused(true);
    setAlertsOpen(false);
  }

  function scheduleCloseSearch() {
    if (searchCloseTimer.current) {
      window.clearTimeout(searchCloseTimer.current);
    }

    searchCloseTimer.current = window.setTimeout(() => {
      setSearchFocused(false);
      searchCloseTimer.current = null;
    }, 120);
  }

  function handleSelectSearchResult(result) {
    setSearchTerm("");
    setSearchFocused(false);
    onSelectPage(result.pageId);
  }

  function handleToggleAlerts() {
    closeSearch();
    if (!alertsOpen && markAlertsAsViewed(alerts, notificationScope)) {
      setNotificationReadVersion((currentVersion) => currentVersion + 1);
    }

    setAlertsOpen((currentState) => !currentState);
  }

  function handleSelectAlert(alert) {
    setAlertsOpen(false);

    if (alert.pageId) {
      onSelectPage(alert.pageId);
    }
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Escape") {
      closeSearch();
    }
  }

  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
    openSearch();
  }

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-zinc-200 bg-white/95 px-5 backdrop-blur transition-all duration-300",
        collapsed ? "left-[72px]" : "left-[264px]"
      )}
    >
      {/* --- SECAO: ATALHOS HORIZONTAIS --- */}
      <nav className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-2">
        {shortcuts.map((item) => (
          <HeaderShortcut
            key={item.id}
            active={activePage === item.id}
            item={item}
            onSelect={onSelectPage}
          />
        ))}
      </nav>

      {/* --- SECAO: ACOES DO USUARIO --- */}
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="relative">
          <TextInput
            className="w-56 xl:w-64 2xl:w-72"
            icon="search"
            placeholder="Buscar no sistema"
            value={searchTerm}
            onBlur={scheduleCloseSearch}
            onChange={handleSearchChange}
            onClick={openSearch}
            onFocus={openSearch}
            onKeyDown={handleSearchKeyDown}
          />
          <GlobalSearchPanel
            isSearching={isSearching}
            open={searchOpen}
            results={results}
            term={searchTerm}
            onClose={closeSearch}
            onSelectResult={handleSelectSearchResult}
          />
        </div>
        <div className="relative">
          <IconButton active={alertsOpen} icon="bell" label="Alertas" onClick={handleToggleAlerts} />
          {unreadAlerts.length ? (
            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-amiste-red text-[10px] font-black text-white ring-2 ring-white">
              {unreadAlerts.length}
            </span>
          ) : null}
          <NotificationCenter
            alerts={alerts}
            open={alertsOpen}
            onClose={() => setAlertsOpen(false)}
            onSelectAlert={handleSelectAlert}
          />
        </div>
        {canSeeRequests ? (
          <div className="relative">
            <IconButton
              active={activePage === "solicitacoes"}
              icon="fileClock"
              label="Solicitacoes"
              onClick={() => {
                closeSearch();
                setAlertsOpen(false);
                onSelectPage("solicitacoes");
              }}
            />
            {activeRequestCount ? (
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-amiste-purple text-[10px] font-black text-white ring-2 ring-white">
                {activeRequestCount}
              </span>
            ) : null}
          </div>
        ) : null}
        <IconButton
          icon={theme === "dark" ? "sun" : "moon"}
          label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
          onClick={onToggleTheme}
        />
        {previewUser ? (
          <Button className="h-10 px-3 text-xs" icon="refresh" variant="warning" onClick={onExitPreview}>
            Visao {previewUser.role}
          </Button>
        ) : null}
        <button
          aria-label="Abrir perfil"
          className="flex items-center gap-3 rounded-2xl border border-transparent px-2 py-1 transition hover:border-zinc-200 hover:bg-zinc-50"
          type="button"
          onClick={() => onSelectPage("perfil")}
        >
          <UserBadge user={user} />
        </button>
        <IconButton icon="logOut" label="Sair" onClick={onLogout} />
      </div>
    </header>
  );
}
