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
});
