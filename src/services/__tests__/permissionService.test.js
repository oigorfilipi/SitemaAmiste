import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSION_RESOURCES,
  getRolePermissions,
  resetRolePermissionOverrides,
  updateRolePermission,
} from "../permissionService.js";

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
});
