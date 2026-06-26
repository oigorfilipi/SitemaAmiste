import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearDataCache,
  readCollectionCache,
  readSnapshotCache,
  runCachedRequest,
  updateCollectionCache,
  writeCollectionCache,
  writeSnapshotCache,
} from "../dataCacheService.js";

beforeEach(() => {
  clearDataCache();
});

describe("dataCacheService", () => {
  it("alimenta o cache de colecoes ao salvar um snapshot", () => {
    const snapshot = {
      clients: [{ id: "client_1", name: "Cafe Central" }],
      machines: [{ id: "machine_1", name: "Lio" }],
    };

    writeSnapshotCache(snapshot);

    expect(readSnapshotCache()).toBe(snapshot);
    expect(readCollectionCache("clients")).toEqual(snapshot.clients);
    expect(readCollectionCache("machines")).toEqual(snapshot.machines);
  });

  it("mantem o snapshot sincronizado ao atualizar uma colecao", () => {
    writeSnapshotCache({
      clients: [{ id: "client_1", name: "Cafe Central" }],
    });

    writeCollectionCache("clients", [{ id: "client_2", name: "Padaria Alfa" }]);

    expect(readSnapshotCache().clients).toEqual([
      { id: "client_2", name: "Padaria Alfa" },
    ]);
  });

  it("permite atualizacao otimista de uma colecao em cache", () => {
    writeCollectionCache("clients", [{ id: "client_1", name: "Cafe Central" }]);

    const nextClients = updateCollectionCache("clients", (clients) => [
      { id: "client_2", name: "Padaria Alfa" },
      ...clients,
    ]);

    expect(nextClients).toHaveLength(2);
    expect(readCollectionCache("clients")[0]).toMatchObject({ id: "client_2" });
  });

  it("reaproveita a mesma requisicao quando a chave esta em andamento", async () => {
    const loader = vi.fn(async () => ["ok"]);

    const [firstResult, secondResult] = await Promise.all([
      runCachedRequest("collection:clients", loader),
      runCachedRequest("collection:clients", loader),
    ]);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(["ok"]);
    expect(secondResult).toEqual(["ok"]);
  });
});
