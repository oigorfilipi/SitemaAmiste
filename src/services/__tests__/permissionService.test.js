import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSION_RESOURCES,
  getRolePermissions,
  isDevPermissionLocked,
  resetRolePermissionOverrides,
  updateRolePermission,
} from "../permissionService.js";
import { buildRoleMatrixByScope } from "../accountService.js";

describe("permissionService action matrix", () => {
  it("exposes upload, download and print as configurable action resources", () => {
    expect(ALL_PERMISSION_RESOURCES).toContain("action:upload");
    expect(ALL_PERMISSION_RESOURCES).toContain("action:download");
    expect(ALL_PERMISSION_RESOURCES).toContain("action:print");
    expect(getRolePermissions("DEV")["action:download"]).toBe("AC");
    expect(getRolePermissions("VEN")["action:download"]).toBe("UP");
  });

  it("persists and resets action permission overrides", () => {
    expect(updateRolePermission("VEN", "action:upload", "OC")["action:upload"]).toBe("OC");
    expect(getRolePermissions("VEN")["action:upload"]).toBe("OC");

    resetRolePermissionOverrides();

    expect(getRolePermissions("VEN")["action:upload"]).toBe("UP");
  });

  it("keeps DEV permissions locked to prevent losing system access", () => {
    expect(isDevPermissionLocked("DEV", "accounts")).toBe(true);
    expect(updateRolePermission("DEV", "accounts", "OC").accounts).toBe("AC");
    expect(getRolePermissions("DEV").accounts).toBe("AC");
  });

  it("separates granular section and field permissions from the base matrix", () => {
    expect(ALL_PERMISSION_RESOURCES).toContain("section:insumos.cadastro");
    expect(ALL_PERMISSION_RESOURCES).toContain("field:insumos.custo");
    expect(buildRoleMatrixByScope("granular").some((row) => row.pageId === "section:insumos.cadastro")).toBe(true);
    expect(buildRoleMatrixByScope("base").some((row) => row.pageId === "section:insumos.cadastro")).toBe(false);
  });
});
