import { describe, expect, it } from "vitest";
import { normalizeAccountPayload } from "../accountService.js";

describe("accountService collaborator payload normalization", () => {
  it("does not inject a default password when editing an existing collaborator without password changes", () => {
    const normalizedPayload = normalizeAccountPayload(
      {
        displayName: "Igor",
        email: "igor@amistecafe.local",
        fullName: "Igor Filipi",
        role: "DEV",
        status: "ativo",
      },
      {
        displayName: "Igor",
        email: "igor@amistecafe.local",
        fullName: "Igor Filipi",
        id: "usr_igor",
        mustChangePassword: false,
        role: "DEV",
        status: "ativo",
      },
    );

    expect(normalizedPayload.password).toBeUndefined();
    expect(normalizedPayload.mustChangePassword).toBe(false);
  });

  it("marks first login as required when a temporary password is explicitly provided", () => {
    const normalizedPayload = normalizeAccountPayload(
      {
        displayName: "Novo Usuario",
        email: "novo@amistecafe.local",
        fullName: "Novo Usuario",
        role: "VEN",
        status: "ativo",
        temporaryPassword: "senha-provisoria",
      },
      null,
    );

    expect(normalizedPayload.password).toBe("senha-provisoria");
    expect(normalizedPayload.mustChangePassword).toBe(true);
  });
});
