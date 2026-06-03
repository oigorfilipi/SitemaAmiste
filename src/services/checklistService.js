import { createEntity, updateEntity } from "./erpService.js";
import { exportRecordsToCsv } from "./exportService.js";

export const CHECKLIST_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "open", label: "Abertos" },
  { id: "finalizado", label: "Finalizados" },
  { id: "risk", label: "Risco" },
];

const CHECKLIST_EXPORT_COLUMNS = [
  { key: "code", label: "Numero" },
  { key: "clientName", label: "Cliente" },
  { key: "machineName", label: "Maquina" },
  { key: "serviceType", label: "Servico" },
  { key: "technician", label: "Tecnico" },
  { key: "date", label: "Data" },
  { key: "compatibilityLabel", label: "Compatibilidade" },
  { key: "value", label: "Valor", type: "currency" },
  { key: "status", label: "Status" },
];

function asNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(asNumber(value));
}

function resolveName(snapshot, collection, id) {
  return snapshot[collection]?.find((record) => record.id === id)?.name || "-";
}

function resolveMachine(snapshot, machineId) {
  return snapshot.machines?.find((machine) => machine.id === machineId) || null;
}

function resolveNextStockStatus(machine, nextStock) {
  if (nextStock <= asNumber(machine.minStock)) {
    return "pedir";
  }

  return machine.status === "pedir" ? "ativo" : machine.status;
}

export function evaluateChecklistCompatibility(record, snapshot) {
  const machine = resolveMachine(snapshot, record.machineId);

  if (!machine) {
    return {
      amperageOk: false,
      compatible: false,
      compatibilityLabel: "Maquina nao encontrada",
      issues: ["Maquina nao encontrada no catalogo."],
      waterOk: false,
    };
  }

  const amperageOk = asNumber(record.outletAmperage) >= asNumber(machine.amperage);
  const waterOk = machine.hydraulic !== "Sim" || record.waterOk === "Sim";
  const issues = [
    amperageOk ? "" : `${machine.name} exige ${machine.amperage}A, local informou ${record.outletAmperage || 0}A.`,
    waterOk ? "" : `${machine.name} exige rede hidrica marcada como disponivel.`,
  ].filter(Boolean);

  return {
    amperageOk,
    compatible: !issues.length,
    compatibilityLabel: issues.length ? "Falsa equivalencia" : "Compativel",
    issues,
    machine,
    waterOk,
  };
}

export function validateChecklistPayload(payload, snapshot) {
  const compatibility = evaluateChecklistCompatibility(payload, snapshot);

  if (payload.status === "finalizado" && !compatibility.compatible) {
    return `Falsa equivalencia: ${compatibility.issues.join(" ")}`;
  }

  return "";
}

export function buildChecklistRows(records, snapshot) {
  return records.map((record) => {
    const compatibility = evaluateChecklistCompatibility(record, snapshot);

    return {
      ...record,
      ...compatibility,
      clientName: resolveName(snapshot, "clients", record.clientId),
      machineName: resolveName(snapshot, "machines", record.machineId),
      open: record.status !== "finalizado",
    };
  });
}

export function filterChecklistRows(rows, filterId) {
  if (filterId === "open") {
    return rows.filter((row) => row.status !== "finalizado");
  }

  if (filterId === "finalizado") {
    return rows.filter((row) => row.status === "finalizado");
  }

  if (filterId === "risk") {
    return rows.filter((row) => !row.compatible);
  }

  return rows;
}

export function buildChecklistMetrics(rows) {
  const openRows = rows.filter((row) => row.status !== "finalizado");
  const riskRows = rows.filter((row) => !row.compatible);
  const finalizedValue = rows
    .filter((row) => row.status === "finalizado")
    .reduce((total, row) => total + asNumber(row.value), 0);

  return [
    {
      id: "total",
      icon: "checkSquare",
      label: "Checklists",
      value: rows.length,
      detail: `${openRows.length} abertos`,
      tone: "blue",
    },
    {
      id: "risk",
      icon: "shield",
      label: "Falsa equivalencia",
      value: riskRows.length,
      detail: "bloqueios tecnicos",
      tone: riskRows.length ? "red" : "green",
    },
    {
      id: "finalized",
      icon: "gauge",
      label: "Finalizados",
      value: rows.filter((row) => row.status === "finalizado").length,
      detail: "integrados a operacao",
      tone: "green",
    },
    {
      id: "value",
      icon: "money",
      label: "Valor finalizado",
      value: formatCurrency(finalizedValue),
      detail: "base faturavel",
      tone: "yellow",
    },
  ];
}

export async function finalizeChecklist(row, snapshot) {
  const compatibility = evaluateChecklistCompatibility(row, snapshot);

  if (!compatibility.compatible) {
    throw new Error(`Falsa equivalencia: ${compatibility.issues.join(" ")}`);
  }

  if (row.status === "finalizado") {
    return row;
  }

  const machine = compatibility.machine;
  const nextStock = Math.max(0, asNumber(machine.stock) - asNumber(row.quantity || 1));

  await updateEntity(
    "checklists",
    row.id,
    {
      status: "finalizado",
    },
    {
      action: "Finalizou",
      details: `Checklist integrado: estoque e financeiro avaliados | Valor: ${formatCurrency(row.value)}`,
      module: "Checklists",
      title: row.code,
    }
  );

  await updateEntity(
    "machines",
    machine.id,
    {
      stock: nextStock,
      status: resolveNextStockStatus(machine, nextStock),
    },
    {
      action: "Baixa Checklist",
      details: `${row.code}: ${machine.name} | Estoque ${machine.stock} -> ${nextStock}`,
      module: "Estoque",
      title: machine.name,
    }
  );

  if (asNumber(row.value) > 0) {
    const origin = `Checklist ${row.code}`;
    const receivableExists = snapshot.receivables?.some((receivable) => receivable.origin === origin);

    if (!receivableExists) {
      await createEntity("receivables", {
        origin,
        clientId: row.clientId,
        dueDate: row.date,
        value: asNumber(row.value),
        status: "pendente",
        notes: "Cobranca gerada automaticamente pela finalizacao do checklist.",
      });
    }
  }

  return {
    ...row,
    status: "finalizado",
  };
}

export function exportChecklistRows(rows, snapshot) {
  exportRecordsToCsv({
    columns: CHECKLIST_EXPORT_COLUMNS,
    filename: "checklists-operacionais",
    records: rows,
    snapshot,
  });
}
