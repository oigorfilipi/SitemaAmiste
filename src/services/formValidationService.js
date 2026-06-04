function asNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function hasDuplicate(snapshot, collectionName, editingRecord, matcher) {
  return (snapshot[collectionName] || []).some((record) => {
    if (editingRecord?.id && record.id === editingRecord.id) {
      return false;
    }

    return matcher(record);
  });
}

function isInvalidEmail(value) {
  return Boolean(value) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
}

export function validateMachinePayload(payload, snapshot, editingRecord) {
  if (!payload.name?.trim()) {
    return "Informe o nome da maquina.";
  }

  if (hasDuplicate(snapshot, "machines", editingRecord, (machine) => normalizeText(machine.name) === normalizeText(payload.name))) {
    return "Ja existe uma maquina cadastrada com este nome.";
  }

  if (asNumber(payload.stock) < 0 || asNumber(payload.minStock) < 0) {
    return "Estoque e estoque minimo nao podem ser negativos.";
  }

  if (asNumber(payload.minStock) > asNumber(payload.stock) && payload.status === "ativo") {
    return "Estoque minimo maior que estoque atual: ajuste o status para Pedir ou revise os valores.";
  }

  if (payload.paymentSystem === "Sim" && !payload.paymentSystemName?.trim()) {
    return "Informe qual sistema de pagamento a maquina utiliza.";
  }

  if (asNumber(payload.priceSale) < asNumber(payload.priceRent)) {
    return "Valor de venda menor que aluguel base. Revise a precificacao.";
  }

  return "";
}

export function validateClientPayload(payload, snapshot, editingRecord) {
  if (!payload.name?.trim()) {
    return "Informe o nome do cliente.";
  }

  if (hasDuplicate(snapshot, "clients", editingRecord, (client) => normalizeText(client.name) === normalizeText(payload.name))) {
    return "Ja existe um cliente cadastrado com este nome.";
  }

  if (isInvalidEmail(payload.email)) {
    return "Informe um email valido.";
  }

  if (["Aluguel", "Comodato", "Venda"].includes(payload.contractType) && !payload.machineId) {
    return "Vincule uma maquina para contratos de aluguel, comodato ou venda.";
  }

  if (asNumber(payload.contractValue) < 0) {
    return "Valor de contrato nao pode ser negativo.";
  }

  return "";
}

export function validateSupplyPayload(payload, snapshot, editingRecord) {
  if (!payload.name?.trim()) {
    return "Informe o nome do insumo.";
  }

  if (hasDuplicate(snapshot, "supplies", editingRecord, (supply) => normalizeText(supply.name) === normalizeText(payload.name))) {
    return "Ja existe um insumo cadastrado com este nome.";
  }

  if (asNumber(payload.stock) < 0 || asNumber(payload.minStock) < 0) {
    return "Estoque e estoque minimo nao podem ser negativos.";
  }

  if (asNumber(payload.price) > 0 && asNumber(payload.cost) > 0 && asNumber(payload.price) <= asNumber(payload.cost)) {
    return "Preco de venda deve ser maior que o custo para manter margem.";
  }

  return "";
}

export function validateAccessoryPayload(payload, snapshot, editingRecord) {
  if (!payload.name?.trim()) {
    return "Informe o nome do acessorio.";
  }

  if (hasDuplicate(snapshot, "accessories", editingRecord, (accessory) => normalizeText(accessory.name) === normalizeText(payload.name))) {
    return "Ja existe um acessorio cadastrado com este nome.";
  }

  if (asNumber(payload.stock) < 0 || asNumber(payload.minStock) < 0) {
    return "Estoque e estoque minimo nao podem ser negativos.";
  }

  if (asNumber(payload.price) > 0 && asNumber(payload.cost) > 0 && asNumber(payload.price) <= asNumber(payload.cost)) {
    return "Preco de venda deve ser maior que o custo para manter margem.";
  }

  return "";
}

export function validateOptionPayload(payload, snapshot, editingRecord) {
  if (!payload.group || !payload.name?.trim() || !payload.value?.trim()) {
    return "Informe grupo, nome e valor da opcao.";
  }

  const duplicate = hasDuplicate(snapshot, "options", editingRecord, (option) =>
    normalizeText(option.group) === normalizeText(payload.group) &&
    normalizeText(option.value) === normalizeText(payload.value)
  );

  return duplicate ? "Ja existe uma opcao com este valor dentro do mesmo grupo." : "";
}
