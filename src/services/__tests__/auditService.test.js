import { describe, expect, it } from "vitest";
import { buildAuditRows } from "../auditService.js";

describe("auditService display normalization", () => {
  it("resolves technical user ids to display names and renames account module logs", () => {
    const rows = buildAuditRows(
      [{
        action: "Editou",
        date: "2026-06-18T12:00:00.000Z",
        details: "Permissao alterada.",
        id: "history_1",
        module: "Contas",
        role: "DEV",
        title: "Matriz RBAC",
        userId: "usr_igor_filipi_dev",
        userName: "usr_igor_filipi_dev",
      }],
      [{
        displayName: "Igor Filipi",
        fullName: "Igor Filipi",
        id: "usr_igor_filipi_dev",
      }],
    );

    expect(rows[0].module).toBe("Gestao de Contas");
    expect(rows[0].userName).toBe("Igor Filipi");
  });

  it("converts technical account event ids to human readable actions", () => {
    const rows = buildAuditRows(
      [{
        action: "Criou",
        date: "2026-06-18T12:00:00.000Z",
        details: "Registro criado. ID: account_1781876517813_a87e6b",
        id: "history_2",
        module: "Contas",
        role: "DEV",
        title: "account_1781876517813_a87e6b",
        userId: "usr_igor_filipi_dev",
        userName: "usr_igor_filipi_dev",
      }],
      [{
        displayName: "Igor Filipi",
        fullName: "Igor Filipi",
        id: "usr_igor_filipi_dev",
      }],
    );

    expect(rows[0].displayTitle).toBe("Criou uma conta");
    expect(rows[0].humanDetails).toContain("Registro criado com sucesso.");
    expect(rows[0].searchable).toContain("criou uma conta");
  });

  it("humanizes noisy request change details", () => {
    const rows = buildAuditRows(
      [{
        action: "Editou",
        date: "2026-06-18T12:00:00.000Z",
        details: [
          "comments: 1 item(ns) -> 2 item(ns)",
          "events: 3 item(ns) -> 4 item(ns)",
          "status: aguardando-resposta -> analise",
        ].join("\n"),
        id: "history_3",
        module: "Solicitações",
        role: "DEV",
        title: "Chamado de teste",
        userId: "usr_igor_filipi_dev",
        userName: "usr_igor_filipi_dev",
      }],
      [{
        displayName: "Igor Filipi",
        fullName: "Igor Filipi",
        id: "usr_igor_filipi_dev",
      }],
    );

    expect(rows[0].humanDetails).toContain("Comentario adicionado.");
    expect(rows[0].humanDetails).toContain("Historico interno da solicitacao atualizado.");
    expect(rows[0].humanDetails).toContain('Status alterado de "Aguardando Resposta" para "Em Analise".');
  });
});
