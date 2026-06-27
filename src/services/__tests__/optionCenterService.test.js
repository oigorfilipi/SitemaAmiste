import { describe, expect, it } from "vitest";
import {
  buildOptionAreaTabs,
  buildOptionGroups,
  buildOptionPayload,
  filterOptionGroupsByArea,
  shouldShowOptionInternalValue,
  validateOptionPayload,
} from "../optionCenterService.js";
import { OPTION_GROUP_CHOICES } from "../optionService.js";

describe("optionCenterService", () => {
  it("hides legacy and fixed system option groups from the option center", () => {
    const groups = buildOptionGroups([
      { id: "legacy_machine_category", group: "Categorias de Maquinas", name: "Graos", value: "Graos" },
      { id: "legacy_tool_item", group: "Ferramentas e Itens", name: "Filtro", value: "Filtro" },
      { id: "admin_group", group: "Grupos de Opcoes", name: "Grupo", value: "Grupo" },
      { id: "fixed_yes_no", group: "Rede Hidrica", name: "Sim", value: "Sim" },
      { id: "fixed_status", group: "Status Catalogo", name: "Ativo", value: "ativo" },
      { id: "fixed_voltage", group: "Voltagens", name: "220v", value: "220v" },
      { id: "supply_category", group: "Categorias de Insumos", name: "Cafe", value: "Cafe" },
    ]);

    expect(groups.map((group) => group.id)).not.toContain("Categorias de Maquinas");
    expect(groups.map((group) => group.id)).not.toContain("Ferramentas e Itens");
    expect(groups.map((group) => group.id)).not.toContain("Grupos de Opcoes");
    expect(groups.map((group) => group.id)).not.toContain("Rede Hidrica");
    expect(groups.map((group) => group.id)).not.toContain("Status Catalogo");
    expect(groups.map((group) => group.id)).not.toContain("Voltagens");
    expect(groups.map((group) => group.id)).toContain("Categorias de Insumos");
  });

  it("keeps fixed system groups out of the create option selector", () => {
    const choiceValues = OPTION_GROUP_CHOICES.map((choice) => choice.value);

    expect(choiceValues).toContain("Marcas de Maquinas");
    expect(choiceValues).toContain("Ferramentas Necessarias");
    expect(choiceValues).not.toContain("Rede Hidrica");
    expect(choiceValues).not.toContain("Status Catalogo");
    expect(choiceValues).not.toContain("Prioridades de Conserto");
  });

  it("separa grupos de opcoes por areas do sistema", () => {
    const groups = buildOptionGroups([
      { id: "machine_brand", group: "Marcas de Maquinas", name: "Rheavendors", value: "Rheavendors" },
      { id: "checklist_tool", group: "Ferramentas Necessarias", name: "Chave", value: "Chave" },
      { id: "finance_charge", group: "Tipos de Cobranca", name: "Mensal", value: "Mensal" },
      { id: "legacy_group", group: "Grupo Legado", name: "Legado", value: "Legado" },
    ]);
    const tabs = buildOptionAreaTabs(groups);

    expect(filterOptionGroupsByArea(groups, "machines").map((group) => group.id)).toContain("Marcas de Maquinas");
    expect(filterOptionGroupsByArea(groups, "checklist").map((group) => group.id)).toContain("Ferramentas Necessarias");
    expect(filterOptionGroupsByArea(groups, "finance").map((group) => group.id)).toContain("Tipos de Cobranca");
    expect(filterOptionGroupsByArea(groups, "other").map((group) => group.id)).toContain("Grupo Legado");
    expect(tabs.find((tab) => tab.id === "machines")).toMatchObject({ count: expect.any(Number) });
  });

  it("preenche automaticamente o valor de grupos simples a partir do nome", () => {
    const payload = buildOptionPayload({
      group: "Marcas de Maquinas",
      name: "Rheavendors",
      value: "",
    });

    expect(shouldShowOptionInternalValue("Marcas de Maquinas")).toBe(false);
    expect(payload).toMatchObject({
      name: "Rheavendors",
      value: "Rheavendors",
    });
    expect(validateOptionPayload(payload, [], null)).toBe("");
  });

  it("mantem codigo tecnico visivel para cargos configuraveis", () => {
    expect(shouldShowOptionInternalValue("Funcoes")).toBe(true);
    expect(buildOptionPayload({
      group: "Funcoes",
      name: "Marketing",
      value: "MKT",
    })).toMatchObject({
      value: "MKT",
    });
  });

  it("preserva o valor salvo ao editar uma opcao simples existente", () => {
    const editingRecord = {
      group: "Marcas de Maquinas",
      id: "option_1",
      name: "Marca Antiga",
      value: "marca_antiga",
    };

    expect(buildOptionPayload({
      group: "Marcas de Maquinas",
      name: "Marca Nova",
      value: "marca_antiga",
    }, editingRecord)).toMatchObject({
      name: "Marca Nova",
      value: "marca_antiga",
    });
  });
});
