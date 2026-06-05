import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDatabaseSnapshot, getLocalDatabaseInfo, resetLocalDatabase, setCollection } from "../localDatabase.js";

beforeEach(async () => {
  await resetLocalDatabase();
});

describe("localDatabase storage safety", () => {
  it("compacts old history entries when localStorage quota is exceeded", async () => {
    const originalSetItem = Storage.prototype.setItem;

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItemWithQuota(key, value) {
      if (String(key).includes("amiste_erp_local_database_v1") && String(value).length > 180000) {
        const quotaError = new Error("quota exceeded");

        quotaError.name = "QuotaExceededError";
        quotaError.code = 22;
        throw quotaError;
      }

      return originalSetItem.call(this, key, value);
    });

    const largeHistory = Array.from({ length: 160 }).map((_, index) => ({
      action: "Editou",
      date: "2026-06-05",
      details: "x".repeat(1200),
      id: `hist_${index}`,
      module: "Teste",
      title: `Registro ${index}`,
    }));

    await setCollection("history", largeHistory);

    const snapshot = getDatabaseSnapshot();
    const info = getLocalDatabaseInfo();

    expect(snapshot.history).toHaveLength(info.storageCompactHistoryLimit);
    expect(info.storageBytes).toBeGreaterThan(0);
  });
});
