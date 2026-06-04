export const PROPOSAL_STATUSES = [
  { label: "Aguardando", value: "aguardando" },
  { label: "Concluido", value: "concluido" },
  { label: "Cancelado", value: "cancelado" },
  { label: "Rascunho", value: "rascunho" },
  { label: "Abandonado", value: "abandonado" },
];

export const COMMERCIAL_MODALITIES = [
  { label: "Venda", value: "Venda" },
  { label: "Aluguel", value: "Aluguel" },
  { label: "Comodato", value: "Comodato" },
];

export const SERVICE_SHEET_STATUSES = [
  { label: "Rascunho", value: "rascunho" },
  { label: "Assinado", value: "assinado" },
  { label: "Cancelado", value: "cancelado" },
];

export const SERVICE_SHEET_TYPES = [
  { label: "Instalacao", value: "Instalacao" },
  { label: "Retirada", value: "Retirada" },
];

function asNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function splitTextList(value = "") {
  return String(value)
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(asNumber(value));
}

export function findRecord(snapshot, collection, id) {
  return snapshot[collection]?.find((record) => record.id === id) || null;
}

export function buildOptions(records = [], labelKey = "name") {
  return records.map((record) => ({
    label: record[labelKey] || record.name || record.code || record.id,
    value: record.id,
  }));
}

export function resolveProposalStatus(record = {}) {
  const status = record.status || "rascunho";

  if (["concluido", "cancelado", "abandonado"].includes(status)) {
    return status;
  }

  const referenceDate = new Date(record.updatedAt || record.createdAt || record.createdDate || Date.now());
  const inactivityDays = (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);

  return inactivityDays > 30 ? "abandonado" : status;
}

export function buildProposalInitialForm(record = {}) {
  const modality = record.modality || "Venda";

  return {
    chargeValue: record.chargeValue ?? record.totalValue ?? "",
    clientId: record.clientId || "",
    createdDate: record.createdDate || today(),
    generalNotes: record.generalNotes ?? record.notes ?? "",
    historyProposalId: "",
    installments: record.installments || 1,
    machineConfigId: record.machineConfigId || "",
    machineId: record.machineId || "",
    minimumConsumptionEnabled: Boolean(record.minimumConsumptionEnabled),
    minimumConsumptionValue: record.minimumConsumptionValue || "",
    modality,
    paymentTerms: record.paymentTerms || "",
    productOverrides: record.productOverrides || {},
    proposalText: record.proposalText || record.notes || "",
    status: resolveProposalStatus(record),
    supplyMode: record.supplyMode || "predetermined",
    totalValue: record.totalValue || "",
    videoUrl: record.videoUrl || "",
  };
}

export function calculateProposalValues(form = {}) {
  const modality = form.modality || "Venda";
  const installments = Math.min(Math.max(asNumber(form.installments) || 1, 1), 48);
  const saleTotal = asNumber(form.totalValue);
  const recurringValue = asNumber(form.chargeValue || form.totalValue);
  const minimumValue = form.minimumConsumptionEnabled ? asNumber(form.minimumConsumptionValue) : 0;
  const totalNegotiation = modality === "Venda" ? saleTotal : modality === "Comodato" ? minimumValue : recurringValue;
  const installmentValue = modality === "Venda" ? totalNegotiation / installments : totalNegotiation;

  return {
    installmentValue,
    installments,
    monthlyValue: modality === "Venda" ? 0 : totalNegotiation,
    totalNegotiation,
  };
}

export function buildProposalHistoryOptions(snapshot, clientId, currentId = "") {
  if (!clientId) {
    return [];
  }

  return (snapshot.proposals || [])
    .filter((proposal) => proposal.clientId === clientId && proposal.id !== currentId)
    .map((proposal) => {
      const machine = findRecord(snapshot, "machines", proposal.machineId);
      const date = proposal.createdDate || proposal.createdAt?.slice(0, 10) || "-";

      return {
        label: `${date} - ${machine?.name || "Maquina"} (${formatCurrency(proposal.totalValue)})`,
        value: proposal.id,
      };
    });
}

export function buildMachineConfigOptions(snapshot, machineId) {
  return (snapshot.machineConfigs || [])
    .filter((config) => config.machineId === machineId)
    .map((config) => ({
      label: config.name,
      value: config.id,
    }));
}

export function buildProposalProductRows(snapshot, form) {
  if (form.supplyMode === "free") {
    return (snapshot.supplies || []).map((supply) => ({
      baseValue: asNumber(supply.price),
      id: supply.id,
      name: supply.name,
      source: "supplies",
    }));
  }

  const machineConfig = findRecord(snapshot, "machineConfigs", form.machineConfigId);
  const requiredNames = splitTextList(`${machineConfig?.reservoirs || ""},${machineConfig?.drinks || ""}`);

  if (!requiredNames.length) {
    return (snapshot.supplies || []).slice(0, 3).map((supply) => ({
      baseValue: asNumber(supply.price),
      id: supply.id,
      name: supply.name,
      source: "supplies",
    }));
  }

  return requiredNames.map((name, index) => {
    const matchedSupply = (snapshot.supplies || []).find((supply) =>
      name.toLowerCase().includes(String(supply.name || "").toLowerCase())
    );

    return {
      baseValue: asNumber(matchedSupply?.price),
      id: matchedSupply?.id || `required_${index}`,
      name,
      source: matchedSupply ? "supplies" : "manual",
    };
  });
}

export function buildProposalPayload(form = {}, snapshot) {
  const machine = findRecord(snapshot, "machines", form.machineId);
  const values = calculateProposalValues(form);

  return {
    chargeValue: values.monthlyValue,
    clientId: form.clientId,
    createdDate: form.createdDate || today(),
    generalNotes: form.generalNotes,
    installments: values.installments,
    installmentValue: values.installmentValue,
    machineConfigId: form.machineConfigId,
    machineId: form.machineId,
    minimumConsumptionEnabled: Boolean(form.minimumConsumptionEnabled),
    minimumConsumptionValue: asNumber(form.minimumConsumptionValue),
    modality: form.modality,
    notes: form.generalNotes || form.proposalText || machine?.description || "",
    paymentTerms: form.paymentTerms,
    productOverrides: form.productOverrides || {},
    proposalText: form.proposalText || machine?.description || "",
    status: form.status || "rascunho",
    supplyMode: form.supplyMode || "predetermined",
    totalValue: values.totalNegotiation,
    videoUrl: form.videoUrl,
  };
}

export function buildServiceSheetInitialForm(record = {}) {
  return {
    chargeType: record.chargeType || "",
    checklistId: record.checklistId || "",
    clientId: record.clientId || "",
    contractDocument: Boolean(record.contractDocument),
    damages: record.damages || "",
    date: record.date || today(),
    defectiveParts: record.defectiveParts || "",
    drinkProgramming: record.drinkProgramming || "",
    machineId: record.machineId || "",
    machineReading: record.machineReading || "",
    nfDocument: Boolean(record.nfDocument),
    notes: record.notes || "",
    peripherals: record.peripherals || "",
    products: record.products || "",
    rentalValue: record.rentalValue || "",
    serviceMode: record.serviceMode || "",
    sheetType: record.sheetType || "Instalacao",
    status: record.status || "rascunho",
    technicalTests: record.technicalTests || "",
    technician: record.technician || "",
    testMachine: record.testMachine ?? String(record.technicalTests || "").toLowerCase().includes("testada"),
    testMill: record.testMill ?? String(record.technicalTests || "").toLowerCase().includes("moinho"),
    testPump: record.testPump ?? String(record.technicalTests || "").toLowerCase().includes("bomba"),
    testTransformer: record.testTransformer ?? String(record.technicalTests || "").toLowerCase().includes("transformador"),
    time: record.time || "",
  };
}

export function buildChecklistOptionsForClient(snapshot, clientId) {
  return (snapshot.checklists || [])
    .filter((checklist) => !clientId || checklist.clientId === clientId)
    .map((checklist) => ({
      label: `${checklist.code} - ${checklist.serviceType || "Servico"} (${checklist.status})`,
      value: checklist.id,
    }));
}

export function buildServiceSheetPayload(form = {}) {
  const tests = [
    form.testMachine ? "Testada" : "",
    form.testMill ? "Moinho" : "",
    form.testPump ? "Bomba" : "",
    form.testTransformer ? "Transformador" : "",
  ].filter(Boolean);

  return {
    chargeType: form.chargeType,
    checklistId: form.checklistId,
    clientId: form.clientId,
    contractDocument: Boolean(form.contractDocument),
    damages: form.damages,
    date: form.date,
    defectiveParts: form.defectiveParts,
    drinkProgramming: form.drinkProgramming,
    machineId: form.machineId,
    machineReading: form.machineReading,
    nfDocument: Boolean(form.nfDocument),
    notes: form.notes,
    peripherals: form.peripherals,
    products: form.products,
    rentalValue: asNumber(form.rentalValue),
    serviceMode: form.serviceMode,
    sheetType: form.sheetType,
    status: form.status || "rascunho",
    technicalTests: tests.join(", ") || form.technicalTests,
    technician: form.technician,
    testMachine: Boolean(form.testMachine),
    testMill: Boolean(form.testMill),
    testPump: Boolean(form.testPump),
    testTransformer: Boolean(form.testTransformer),
    time: form.time,
  };
}

export function applyChecklistToServiceSheet(form, checklist, snapshot) {
  if (!checklist) {
    return form;
  }

  const client = findRecord(snapshot, "clients", checklist.clientId);

  return {
    ...form,
    chargeType: form.chargeType || client?.contractType || "",
    clientId: checklist.clientId || form.clientId,
    date: checklist.date || form.date,
    machineId: checklist.machineId || form.machineId,
    products: form.products || checklist.notes || "",
    rentalValue: form.rentalValue || checklist.value || client?.contractValue || "",
    serviceMode: form.serviceMode || (checklist.waterOk === "Sim" ? "Hidrica" : "Galao"),
    sheetType: checklist.serviceType === "Retirada" ? "Retirada" : form.sheetType,
    technician: checklist.technician || form.technician,
  };
}
