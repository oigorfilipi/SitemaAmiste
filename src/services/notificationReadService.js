const NOTIFICATION_READS_KEY = "amiste_erp_notification_reads_v1";

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readNotificationReads() {
  if (!canUseLocalStorage()) {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(NOTIFICATION_READS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeNotificationReads(reads) {
  if (canUseLocalStorage()) {
    window.localStorage.setItem(NOTIFICATION_READS_KEY, JSON.stringify(reads));
  }
}

export function clearNotificationReads() {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(NOTIFICATION_READS_KEY);
  }
}

function buildAlertReadKey(alert = {}) {
  return [
    alert.id,
    alert.type,
    alert.pageId,
    alert.title,
    alert.description,
  ].filter(Boolean).join("|");
}

export function buildNotificationScope(user) {
  return `${user?.id || "anonymous"}:${user?.role || "VEN"}`;
}

export function getUnreadAlerts(alerts = [], scopeKey = "anonymous:VEN") {
  const scopeReads = readNotificationReads()[scopeKey] || {};

  return alerts.filter((alert) => !scopeReads[buildAlertReadKey(alert)]);
}

export function markAlertsAsViewed(alerts = [], scopeKey = "anonymous:VEN") {
  if (!canUseLocalStorage()) {
    return false;
  }

  const reads = readNotificationReads();
  const activeReadKeys = new Set(alerts.map(buildAlertReadKey));
  const currentScopeReads = reads[scopeKey] || {};
  const nextScopeReads = {};
  let changed = false;

  /* --- SESSAO: SINCRONIA DE ALERTAS ATIVOS ---
   * Mantemos somente marcacoes dos alertas ainda ativos. Assim, se uma condicao
   * sumir e voltar depois com outro texto/estado, ela pode aparecer como nova.
   */
  activeReadKeys.forEach((readKey) => {
    nextScopeReads[readKey] = currentScopeReads[readKey] || new Date().toISOString();

    if (!currentScopeReads[readKey]) {
      changed = true;
    }
  });

  if (Object.keys(currentScopeReads).length !== Object.keys(nextScopeReads).length) {
    changed = true;
  }

  if (!changed) {
    return false;
  }

  reads[scopeKey] = nextScopeReads;
  writeNotificationReads(reads);

  return true;
}
