import { describe, expect, it } from "vitest";
import {
  buildNotificationScope,
  getUnreadAlerts,
  markAlertsAsViewed,
} from "../notificationReadService.js";

const ALERTS = [
  {
    id: "stock_supplies_1",
    title: "Cafe no limite",
    description: "Estoque atual abaixo do minimo.",
    pageId: "estoque",
    type: "stock",
  },
  {
    id: "sla_order_1",
    title: "OS acima do SLA",
    description: "Ordem tecnica atrasada.",
    pageId: "serviceOrders",
    type: "maintenance",
  },
];

describe("notificationReadService", () => {
  it("marks active alerts as viewed without deleting the alert history", () => {
    const scope = buildNotificationScope({ id: "usr_ven", role: "VEN" });

    expect(getUnreadAlerts(ALERTS, scope)).toHaveLength(2);
    expect(markAlertsAsViewed(ALERTS, scope)).toBe(true);
    expect(getUnreadAlerts(ALERTS, scope)).toHaveLength(0);
    expect(markAlertsAsViewed(ALERTS, scope)).toBe(false);

    const nextAlerts = [
      ...ALERTS,
      {
        id: "finance_1",
        title: "Recebivel vencido",
        description: "Conta pendente no financeiro.",
        pageId: "financeiro",
        type: "finance",
      },
    ];

    expect(getUnreadAlerts(nextAlerts, scope)).toHaveLength(1);
  });

  it("keeps read state scoped by user and role", () => {
    const firstScope = buildNotificationScope({ id: "usr_ven", role: "VEN" });
    const secondScope = buildNotificationScope({ id: "usr_fin", role: "FIN" });

    markAlertsAsViewed(ALERTS, firstScope);

    expect(getUnreadAlerts(ALERTS, firstScope)).toHaveLength(0);
    expect(getUnreadAlerts(ALERTS, secondScope)).toHaveLength(2);
  });
});
