import { describe, expect, it } from "vitest";
import { buildOptionGroups } from "../optionCenterService.js";

describe("optionCenterService", () => {
  it("hides legacy machine category option groups from the option center", () => {
    const groups = buildOptionGroups([
      { id: "legacy_machine_category", group: "Categorias de Maquinas", name: "Graos", value: "Graos" },
      { id: "legacy_tool_item", group: "Ferramentas e Itens", name: "Filtro", value: "Filtro" },
      { id: "admin_group", group: "Grupos de Opcoes", name: "Grupo", value: "Grupo" },
      { id: "supply_category", group: "Categorias de Insumos", name: "Cafe", value: "Cafe" },
    ]);

    expect(groups.map((group) => group.id)).not.toContain("Categorias de Maquinas");
    expect(groups.map((group) => group.id)).not.toContain("Ferramentas e Itens");
    expect(groups.map((group) => group.id)).not.toContain("Grupos de Opcoes");
    expect(groups.map((group) => group.id)).toContain("Categorias de Insumos");
  });
});
