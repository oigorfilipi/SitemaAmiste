import { describe, expect, it } from "vitest";
import { normalizeProfilePayload, validateProfilePayload } from "../profileService.js";

describe("profileService security normalization", () => {
  it("does not include a password when profile data changes without a password change", () => {
    const payload = normalizeProfilePayload(
      {
        activeSessions: [],
        avatarInitials: "IF",
        displayName: "Igor",
        fullName: "Igor Filipi",
        phone: "(11) 99999-9999",
        profilePhotoDataUrl: "",
        profilePhotoUrl: "",
        securityConfirmPassword: "",
        securityNewPassword: "",
      },
      {
        displayName: "Igor",
        email: "igor@amistecafe.local",
        id: "usr_igor",
        role: "DEV",
        status: "ativo",
      },
    );

    expect(payload.password).toBeUndefined();
  });

  it("validates password confirmation and strength", () => {
    expect(validateProfilePayload({
      securityConfirmPassword: "Senha123",
      securityNewPassword: "Senha124",
    })).toBe("As senhas nao conferem.");

    expect(validateProfilePayload({
      securityConfirmPassword: "1234",
      securityNewPassword: "1234",
    })).toContain("A senha deve ter pelo menos 8 caracteres");
  });
});
