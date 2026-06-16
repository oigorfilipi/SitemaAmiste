import { describe, expect, it } from "vitest";
import {
  REQUEST_STATUSES,
  filterRequestsForUser,
  groupSimilarRequests,
  resolveRequestStatus,
} from "../requestService.js";

describe("requestService", () => {
  it("filters requests by manager and regular user visibility", () => {
    const requests = [
      { id: "own", requesterId: "usr_1", status: REQUEST_STATUSES.OPEN },
      { id: "general", isGeneral: true, requesterId: "usr_2", status: REQUEST_STATUSES.OPEN },
      { id: "other", requesterId: "usr_2", status: REQUEST_STATUSES.OPEN },
    ];

    expect(filterRequestsForUser(requests, { id: "usr_1", role: "VEN" }).map((request) => request.id)).toEqual(["own", "general"]);
    expect(filterRequestsForUser(requests, { id: "dev", role: "DEV" })).toHaveLength(3);
  });

  it("groups similar requests and counts repeated occurrences", () => {
    const groups = groupSimilarRequests([
      { id: "a", description: "Erro ao salvar etiqueta", pageId: "etiquetas", category: "Erro", problemType: "Tela", occurrenceCount: 2 },
      { id: "b", description: "Erro ao salvar etiqueta", pageId: "etiquetas", category: "Erro", problemType: "Tela", occurrenceCount: 1 },
      { id: "c", description: "Maquina sem foto", pageId: "machines", category: "Correcao", problemType: "Cadastro", occurrenceCount: 1 },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.find((group) => group.key.includes("etiquetas")).count).toBe(3);
  });

  it("auto closes active low and medium priority requests after seven days", () => {
    const oldDate = new Date(Date.now() - 8 * 86400000).toISOString();

    expect(resolveRequestStatus({
      createdAt: oldDate,
      priority: "Baixa",
      status: REQUEST_STATUSES.OPEN,
    })).toBe(REQUEST_STATUSES.CLOSED);
  });
});
