import { useCallback, useEffect, useState } from "react";
import {
  changePassword,
  completeFirstLogin,
  getCurrentUser,
  getLoginAccounts,
  getSidebarUsers,
  loginWithUser,
  logoutCurrentUser,
  requestAccountAccess,
} from "../services/authService.js";

export function useCurrentUser() {
  const [data, setData] = useState({ loginAccounts: [], user: null, sidebarUsers: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUserContext = useCallback(async () => {
    const [user, sidebarUsers, loginAccounts] = await Promise.all([
      getCurrentUser(),
      getSidebarUsers(),
      getLoginAccounts(),
    ]);

    return { loginAccounts, user, sidebarUsers };
  }, []);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setData(await loadUserContext());
      setError(null);
    } catch (userError) {
      setError(userError);
    } finally {
      setIsLoading(false);
    }
  }, [loadUserContext]);

  useEffect(() => {
    refresh();

    /* --- SECAO: SINCRONIZACAO DO PERFIL ---
     * O header usa esse hook. Ao editar a propria conta, o badge precisa refletir
     * nome e iniciais sem depender de refresh manual da pagina.
     */
    window.addEventListener("amiste-db-change", refresh);

    return () => {
      window.removeEventListener("amiste-db-change", refresh);
    };
  }, [refresh]);

  const login = useCallback(async (credentials) => {
    await loginWithUser(credentials);
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await logoutCurrentUser();
    await refresh();
  }, [refresh]);

  const completeFirstAccess = useCallback(async (payload) => {
    if (!data.user?.id) {
      return;
    }

    await completeFirstLogin(data.user.id, payload);
    await refresh();
  }, [data.user?.id, refresh]);

  const requestAccess = useCallback(async (payload) => {
    await requestAccountAccess(payload);
  }, []);

  const updatePassword = useCallback(async (payload) => {
    return changePassword(payload);
  }, []);

  return { completeFirstAccess, data, error, isLoading, login, logout, refresh, requestAccess, updatePassword };
}
