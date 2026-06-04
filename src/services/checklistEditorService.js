export const CHECKLIST_SERVICE_SCOPES = [
  { label: "Cliente", value: "Cliente" },
  { label: "Evento", value: "Evento" },
];

export const CHECKLIST_CLIENT_SERVICE_TYPES = [
  { label: "Comodato", value: "Comodato" },
  { label: "Aluguel", value: "Aluguel" },
  { label: "Venda", value: "Venda" },
];

export const CHECKLIST_STATUS_OPTIONS = [
  { label: "Pendente", value: "pendente" },
  { label: "Rascunho", value: "rascunho" },
  { label: "Finalizado", value: "finalizado" },
  { label: "Abandonado", value: "abandonado" },
];

const FALLBACK_TOOLS = ["Filtro de agua", "Kit de mangueiras", "Chave Philips", "Extensao 20A"];
const FALLBACK_NECESSARY_THINGS = ["Copo para teste", "Produto de limpeza", "Papel toalha"];
const FALLBACK_DRINKS = ["Expresso", "Americano", "Cappuccino", "Chocolate"];

function asNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowDatetimeLocal() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;

  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function addDaysDatetimeLocal(days) {
  const date = new Date();

  date.setDate(date.getDate() + days);

  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function normalizeYesNo(value, fallback = "Nao") {
  return value === "Sim" || value === true ? "Sim" : value === "Nao" || value === false ? "Nao" : fallback;
}

function findById(snapshot, collection, id) {
  return snapshot[collection]?.find((record) => record.id === id) || null;
}

function getSelectedQuantity(selection) {
  if (!selection?.selected) {
    return 0;
  }

  return Math.max(1, asNumber(selection.quantity) || 1);
}

function findDuplicateFilledValue(items, fieldName) {
  const filledValues = items
    .map((item) => String(item[fieldName] || "").trim().toLowerCase())
    .filter(Boolean);

  return filledValues.find((value, index) => filledValues.indexOf(value) !== index) || "";
}

function validateEditorInventorySelection(selectionMap = {}, snapshot, collectionName, label, shouldCheckStock) {
  for (const [recordId, selection] of Object.entries(selectionMap)) {
    const quantity = getSelectedQuantity(selection);

    if (!quantity) {
      continue;
    }

    const record = findById(snapshot, collectionName, recordId);

    if (!record) {
      return `${label} selecionado nao existe mais no cadastro. Revise a selecao.`;
    }

    if (shouldCheckStock && quantity > asNumber(record.stock)) {
      return `Estoque insuficiente: ${record.name} possui ${asNumber(record.stock)} unidade(s) disponiveis.`;
    }
  }

  return "";
}

function readOptions(snapshot, groupName, fallbackNames = []) {
  const dynamicOptions = (snapshot.options || [])
    .filter((option) => option.group === groupName)
    .map((option) => option.name || option.value)
    .filter(Boolean);
  const names = [...dynamicOptions, ...fallbackNames];

  return Array.from(new Set(names)).map((name) => ({
    id: String(name).toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    name,
    requiredQuantity: 1,
  }));
}

function buildNextChecklistCode(snapshot) {
  const maxCode = (snapshot.checklists || []).reduce((maxValue, checklist) => {
    const numericCode = Number(String(checklist.code || "").replace(/\D/g, ""));

    return Number.isFinite(numericCode) ? Math.max(maxValue, numericCode) : maxValue;
  }, 1042);

  return `#${maxCode + 1}`;
}

export function formatChecklistCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(asNumber(value));
}

export function calculateEventDays(installationDateTime, removalDateTime) {
  if (!installationDateTime || !removalDateTime) {
    return 0;
  }

  const start = new Date(installationDateTime).getTime();
  const end = new Date(removalDateTime).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }

  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
}

export function resolveMachineTechnical(machine = {}) {
  return {
    amperage: asNumber(machine.amperage) || 10,
    hydraulic: normalizeYesNo(machine.hydraulic, "Nao"),
    paymentSystem: normalizeYesNo(machine.paymentSystem, "Nao"),
    paymentSystemName: machine.paymentSystemName || "",
    sewer: normalizeYesNo(machine.sewer || machine.drain, "Nao"),
    steam: normalizeYesNo(machine.steam, "Nao"),
    voltage: machine.voltage || "Bivolt",
  };
}

export function buildChecklistInitialForm(record = {}) {
  const installationDateTime = record.installationDateTime || nowDatetimeLocal();
  const removalDateTime = record.removalDateTime || addDaysDatetimeLocal(1);

  return {
    accessories: record.accessories || {},
    configured: Boolean(record.configured),
    contractNumber: record.contractNumber || "",
    drinks: record.drinks || {},
    eventCompanyName: record.eventCompanyName || "",
    eventDays: record.eventDays || calculateEventDays(installationDateTime, removalDateTime),
    eventLinkedToClient: record.eventLinkedToClient ?? true,
    eventName: record.eventName || "",
    extraValueManual: record.extraValueManual || 0,
    installationDate: record.installationDate || record.date || today(),
    installationDateTime,
    localSewerOk: record.localSewerOk || "Nao",
    localWaterOk: record.localWaterOk || record.waterOk || "Nao",
    machineId: record.machineId || "",
    machineQuantity: record.machineQuantity || record.quantity || 1,
    machineUnits: record.machineUnits || [],
    notes: record.notes || "",
    outletAmperage: record.outletAmperage || 10,
    paymentSystemName: record.paymentSystemName || "",
    removalDateTime,
    serviceScope: record.serviceScope || "Cliente",
    serviceType: record.serviceType || "Aluguel",
    serviceValue: record.serviceValue || 0,
    status: record.status || "rascunho",
    supplies: record.supplies || {},
    tested: Boolean(record.tested),
    things: record.things || {},
    tools: record.tools || {},
    training: record.training || "Nao",
    trainingPeople: record.trainingPeople || 0,
    waterGallon: record.waterGallon || "Nao",
    waterGallonQuantity: record.waterGallonQuantity || 0,
    clientId: record.clientId || "",
  };
}

export function buildMachineUnits(quantity, currentUnits = []) {
  return Array.from({ length: Math.max(1, asNumber(quantity) || 1) }).map((_, index) => ({
    assetTag: currentUnits[index]?.assetTag || "",
    serialNumber: currentUnits[index]?.serialNumber || "",
  }));
}

export function buildChecklistOptionLists(snapshot) {
  return {
    drinks: readOptions(snapshot, "Bebidas da Maquina", FALLBACK_DRINKS),
    necessaryThings: readOptions(snapshot, "Coisas Necessarias", FALLBACK_NECESSARY_THINGS),
    tools: readOptions(snapshot, "Ferramentas Necessarias", FALLBACK_TOOLS),
  };
}

export function groupSuppliesByCategory(snapshot) {
  const groups = (snapshot.supplies || []).reduce((categoryMap, supply) => {
    const category = supply.category || "Sem categoria";

    return {
      ...categoryMap,
      [category]: [...(categoryMap[category] || []), supply],
    };
  }, {});

  return Object.entries(groups).map(([category, items]) => ({ category, items }));
}

export function calculateChecklistValues(form, snapshot) {
  const machine = findById(snapshot, "machines", form.machineId);
  const quantity = Math.max(1, asNumber(form.machineQuantity) || 1);
  const machineUnitValue = form.serviceType === "Venda"
    ? asNumber(machine?.priceSale)
    : asNumber(machine?.priceRent);
  const machineValue = machineUnitValue * quantity;
  const suppliesValue = Object.entries(form.supplies || {}).reduce((total, [supplyId, selection]) => {
    if (!selection?.selected) {
      return total;
    }

    const supply = findById(snapshot, "supplies", supplyId);
    return total + asNumber(supply?.price) * Math.max(1, asNumber(selection.quantity) || 1);
  }, 0);
  const accessoriesValue = Object.entries(form.accessories || {}).reduce((total, [accessoryId, selection]) => {
    if (!selection?.selected) {
      return total;
    }

    const accessory = findById(snapshot, "accessories", accessoryId);
    return total + asNumber(accessory?.price) * Math.max(1, asNumber(selection.quantity) || 1);
  }, 0);
  const serviceValue = asNumber(form.serviceValue);
  const extrasValue = accessoriesValue + asNumber(form.extraValueManual);

  return {
    accessoriesValue,
    extrasValue,
    machineValue,
    serviceValue,
    suppliesValue,
    totalValue: machineValue + suppliesValue + serviceValue + extrasValue,
  };
}

export function evaluateEditorCompatibility(form, snapshot) {
  const machine = findById(snapshot, "machines", form.machineId);

  if (!machine) {
    return {
      compatible: false,
      issues: ["Selecione uma maquina para validar o local."],
    };
  }

  const technical = resolveMachineTechnical(machine);
  const amperageOk = asNumber(form.outletAmperage) >= technical.amperage;
  const waterOk = technical.hydraulic !== "Sim" || form.localWaterOk === "Sim";
  const sewerOk = technical.sewer !== "Sim" || form.localSewerOk === "Sim";
  const issues = [
    amperageOk ? "" : `Tomada local ${form.outletAmperage || 0}A abaixo dos ${technical.amperage}A exigidos.`,
    waterOk ? "" : "Maquina exige agua no local.",
    sewerOk ? "" : "Maquina exige esgoto no local.",
  ].filter(Boolean);

  return {
    amperageOk,
    compatible: !issues.length,
    issues,
    sewerOk,
    waterOk,
  };
}

export function buildChecklistPayload(form, snapshot, editingRecord = {}) {
  const values = calculateChecklistValues(form, snapshot);
  const machine = findById(snapshot, "machines", form.machineId);
  const technical = resolveMachineTechnical(machine || {});
  const client = findById(snapshot, "clients", form.clientId);
  const installationDate = form.serviceScope === "Evento"
    ? String(form.installationDateTime || "").slice(0, 10)
    : form.installationDate;

  return {
    accessories: form.accessories,
    code: editingRecord.code || buildNextChecklistCode(snapshot),
    configured: Boolean(form.configured),
    contractNumber: form.contractNumber || client?.id || "",
    date: installationDate || today(),
    drinks: form.drinks,
    eventCompanyName: form.eventCompanyName,
    eventDays: calculateEventDays(form.installationDateTime, form.removalDateTime),
    eventLinkedToClient: Boolean(form.eventLinkedToClient),
    eventName: form.eventName,
    extraValueManual: asNumber(form.extraValueManual),
    installationDate: form.installationDate,
    installationDateTime: form.installationDateTime,
    localSewerOk: form.localSewerOk,
    localWaterOk: form.localWaterOk,
    machineId: form.machineId,
    machineQuantity: Math.max(1, asNumber(form.machineQuantity) || 1),
    machineTechnical: technical,
    machineUnits: buildMachineUnits(form.machineQuantity, form.machineUnits),
    notes: form.notes,
    outletAmperage: asNumber(form.outletAmperage),
    paymentSystemName: technical.paymentSystem === "Sim" ? form.paymentSystemName || technical.paymentSystemName : "",
    quantity: Math.max(1, asNumber(form.machineQuantity) || 1),
    removalDateTime: form.removalDateTime,
    serviceScope: form.serviceScope,
    serviceType: form.serviceScope === "Evento" ? "Evento" : form.serviceType,
    serviceValue: values.serviceValue,
    status: form.status,
    supplies: form.supplies,
    tested: Boolean(form.tested),
    things: form.things,
    tools: form.tools,
    training: form.training,
    trainingPeople: form.training === "Sim" ? asNumber(form.trainingPeople) : 0,
    value: values.totalValue,
    valueBreakdown: values,
    waterGallon: technical.hydraulic === "Nao" ? form.waterGallon : "Nao",
    waterGallonQuantity: technical.hydraulic === "Nao" && form.waterGallon === "Sim"
      ? asNumber(form.waterGallonQuantity)
      : 0,
    waterOk: form.localWaterOk,
    clientId: form.serviceScope === "Evento" && !form.eventLinkedToClient ? "" : form.clientId,
  };
}

export function validateChecklistEditorForm(form, snapshot) {
  const selectedClient = findById(snapshot, "clients", form.clientId);
  const selectedMachine = findById(snapshot, "machines", form.machineId);
  const machineQuantity = asNumber(form.machineQuantity ?? 1);
  const isFinalized = form.status === "finalizado";

  if (form.serviceScope === "Cliente" && !form.clientId) {
    return "Selecione o cliente.";
  }

  if (form.clientId && !selectedClient) {
    return "Cliente selecionado nao encontrado. Selecione um cliente valido.";
  }

  if (form.serviceScope === "Evento" && !form.eventName?.trim()) {
    return "Informe o nome do evento.";
  }

  if (form.serviceScope === "Evento" && form.eventLinkedToClient && !form.clientId) {
    return "Selecione o cliente vinculado ao evento.";
  }

  if (form.serviceScope === "Evento" && !form.eventLinkedToClient && !form.eventCompanyName?.trim()) {
    return "Informe o nome da empresa ou cliente do evento.";
  }

  if (!form.machineId) {
    return "Selecione o modelo da maquina.";
  }

  if (!selectedMachine) {
    return "Maquina selecionada nao encontrada. Selecione uma maquina valida.";
  }

  if (machineQuantity <= 0) {
    return "Informe uma quantidade de maquinas maior que zero.";
  }

  if (isFinalized && machineQuantity > asNumber(selectedMachine.stock)) {
    return `Estoque insuficiente: ${selectedMachine.name} possui ${asNumber(selectedMachine.stock)} unidade(s) disponiveis.`;
  }

  if (isFinalized) {
    const units = buildMachineUnits(machineQuantity, form.machineUnits);
    const missingUnit = units.find((unit) => !unit.serialNumber?.trim() || !unit.assetTag?.trim());

    if (missingUnit) {
      return "Preencha numero de serie e patrimonio de todas as maquinas antes de finalizar.";
    }

    if (findDuplicateFilledValue(units, "serialNumber")) {
      return "Nao repita numero de serie nas maquinas do checklist.";
    }

    if (findDuplicateFilledValue(units, "assetTag")) {
      return "Nao repita patrimonio nas maquinas do checklist.";
    }
  }

  const suppliesError = validateEditorInventorySelection(form.supplies, snapshot, "supplies", "Insumo", isFinalized);

  if (suppliesError) {
    return suppliesError;
  }

  const accessoriesError = validateEditorInventorySelection(form.accessories, snapshot, "accessories", "Acessorio", isFinalized);

  if (accessoriesError) {
    return accessoriesError;
  }

  const compatibility = evaluateEditorCompatibility(form, snapshot);

  if (isFinalized && !compatibility.compatible) {
    return `Falsa equivalencia: ${compatibility.issues.join(" ")}`;
  }

  return "";
}
