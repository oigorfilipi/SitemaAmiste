import { describe, expect, it } from "vitest";
import { normalizeAccountPayload, validateAccountPayload } from "../accountService.js";

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
        temporaryPassword: "Senha123",
      },
      null,
    );

    expect(normalizedPayload.password).toBe("Senha123");
    expect(normalizedPayload.mustChangePassword).toBe(true);
  });

  it("rejects weak temporary passwords", () => {
    expect(validateAccountPayload(
      {
        cpfDocument: "123",
        displayName: "Novo Usuario",
        email: "novo@amistecafe.local",
        fullName: "Novo Usuario",
        role: "VEN",
        temporaryPassword: "1234",
      },
      { accounts: [] },
      null,
    )).toContain("A senha deve ter pelo menos 8 caracteres");
  });

  it("does not generate a default password for invalid new collaborator payloads", () => {
    const normalizedPayload = normalizeAccountPayload(
      {
        displayName: "Sem Senha",
        email: "sem-senha@amistecafe.local",
        fullName: "Sem Senha",
        role: "VEN",
      },
      null,
    );

    expect(normalizedPayload.password).toBeUndefined();
  });
});
