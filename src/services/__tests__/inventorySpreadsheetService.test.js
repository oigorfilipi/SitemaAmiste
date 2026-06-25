import { describe, expect, it } from "vitest";
import { spreadsheetRowsToInventoryRows } from "../inventorySpreadsheetService.js";

describe("inventorySpreadsheetService", () => {
  it("converte linhas retornadas diretamente pelo leitor", () => {
    expect(
      spreadsheetRowsToInventoryRows([
        ["Nome do Produto", "Quantidade/Qtd"],
        ["Tomate", 45],
      ])
    ).toEqual([{ name: "Tomate", quantity: 45 }]);
  });

  it("converte o formato de planilha agrupado em sheet e data", () => {
    expect(
      spreadsheetRowsToInventoryRows([
        {
          sheet: "Planilha2",
          data: [
            ["Nome do Produto", "Quantidade/Qtd"],
            ["Maçã Verde Vora", 9],
            ["Cappuccino Trad", 82],
          ],
        },
      ])
    ).toEqual([
      { name: "Maçã Verde Vora", quantity: 9 },
      { name: "Cappuccino Trad", quantity: 82 },
    ]);
  });
});
