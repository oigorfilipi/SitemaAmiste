import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EntityFormModal from "../EntityFormModal.jsx";

const fields = [
  {
    label: "Nome completo",
    name: "fullName",
    required: true,
    section: {
      eyebrow: "Dados",
      id: "personal",
      title: "Dados pessoais",
    },
  },
];

describe("EntityFormModal form state stability", () => {
  it("keeps typed values when parent rerenders with a new snapshot object", () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <EntityFormModal
        description="Cadastro de teste"
        editingRecord={null}
        fields={fields}
        open
        snapshot={{ accounts: [] }}
        title="Registro"
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: "Maria Teste" },
    });

    rerender(
      <EntityFormModal
        description="Cadastro de teste"
        editingRecord={null}
        fields={fields}
        open
        snapshot={{ accounts: [{ id: "usr_1" }] }}
        title="Registro"
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByLabelText(/nome completo/i)).toHaveValue("Maria Teste");
  });
});
