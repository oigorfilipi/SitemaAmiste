function asNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeIdentifier(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "");
}

function hasDuplicate(snapshot, collectionName, editingRecord, matcher) {
  return (snapshot[collectionName] || []).some((record) => {
    if (editingRecord?.id && record.id === editingRecord.id) {
      return false;
    }

    return matcher(record);
  });
}

function hasDuplicateField(snapshot, collectionName, editingRecord, fieldName, value, normalizer = normalizeText) {
  const normalizedValue = normalizer(value);

  if (!normalizedValue) {
    return false;
  }

  return hasDuplicate(snapshot, collectionName, editingRecord, (record) =>
    normalizer(record[fieldName]) === normalizedValue
  );
}

function recordExists(snapshot, collectionName, id) {
  if (!id) {
    return false;
  }

  return (snapshot[collectionName] || []).some((record) => record.id === id);
}

function isInvalidEmail(value) {
  return Boolean(value) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
}

const FIXED_MACHINE_CATEGORIES = new Set(["Multibebidas", "Profissional", "Snacks", "Coado", "Expresso"]);
const VALID_MACHINE_VOLTAGES = new Set(["110v", "220v", "Bivolt"]);

export function validateMachinePayload(payload, snapshot, editingRecord) {
  if (!payload.name?.trim()) {
    return "Informe o nome da maquina.";
  }

  if (hasDuplicate(snapshot, "machines", editingRecord, (machine) => normalizeText(machine.name) === normalizeText(payload.name))) {
    return "Ja existe uma maquina cadastrada com este nome.";
  }

  if (payload.category && !FIXED_MACHINE_CATEGORIES.has(payload.category)) {
    return "Selecione uma categoria nativa valida para a maquina.";
  }

  if (payload.voltage && !VALID_MACHINE_VOLTAGES.has(payload.voltage)) {
    return "Selecione uma voltagem valida para a maquina.";
  }

  if (asNumber(payload.amperage) <= 0) {
    return "Informe uma amperagem maior que zero.";
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

  if (payload.hasSupplyReservoirs && asNumber(payload.reservoirCount) <= 0) {
    return "Informe a quantidade de reservatorios da maquina.";
  }

  if (asNumber(payload.maxDrinkCount) < 0) {
    return "Maximo de bebidas nao pode ser negativo.";
  }

  if (asNumber(payload.priceSale) < asNumber(payload.priceRent)) {
    return "Valor de venda menor que aluguel base. Revise a precificacao.";
  }

  if (payload.hasModelVariants) {
    const variants = Array.isArray(payload.modelVariants) ? payload.modelVariants : [];
    const variantNames = variants.map((variant) => normalizeText(variant.name)).filter(Boolean);
    const variantCount = asNumber(payload.modelVariantCount);

    if (variantCount <= 0) {
      return "Informe a quantidade de modelos/versoes da maquina ou desmarque multiplos modelos.";
    }

    if (new Set(variantNames).size !== variantNames.length) {
      return "Nao cadastre versoes de maquina com nomes repetidos.";
    }

    const invalidVariantVoltage = variants.find((variant) =>
      variant.voltage && !VALID_MACHINE_VOLTAGES.has(variant.voltage)
    );

    if (invalidVariantVoltage) {
      return `A versao ${invalidVariantVoltage.name} possui voltagem invalida.`;
    }

    const invalidVariantAmperage = variants.find((variant) =>
      variant.amperage && asNumber(variant.amperage) <= 0
    );

    if (invalidVariantAmperage) {
      return `A versao ${invalidVariantAmperage.name} possui amperagem invalida.`;
    }
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

  if (hasDuplicateField(snapshot, "clients", editingRecord, "companyDocument", payload.companyDocument, normalizeIdentifier)) {
    return "Ja existe um cliente cadastrado com este CNPJ/CPF.";
  }

  if (isInvalidEmail(payload.email)) {
    return "Informe um email valido.";
  }

  if (hasDuplicateField(snapshot, "clients", editingRecord, "email", payload.email)) {
    return "Ja existe um cliente cadastrado com este email.";
  }

  if (hasDuplicateField(snapshot, "clients", editingRecord, "contractNumber", payload.contractNumber)) {
    return "Ja existe um cliente cadastrado com este numero de contrato.";
  }

  if (["Aluguel", "Comodato", "Venda"].includes(payload.contractType) && !payload.machineId) {
    return "Vincule uma maquina para contratos de aluguel, comodato ou venda.";
  }

  if (payload.machineId && !recordExists(snapshot, "machines", payload.machineId)) {
    return "Maquina vinculada nao encontrada. Selecione uma maquina valida.";
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

  if (hasDuplicateField(snapshot, "supplies", editingRecord, "sku", payload.sku)) {
    return "Ja existe um insumo cadastrado com este SKU.";
  }

  if (asNumber(payload.stock) < 0 || asNumber(payload.minStock) < 0) {
    return "Estoque e estoque minimo nao podem ser negativos.";
  }

  if (asNumber(payload.leadTimeDays) < 0) {
    return "Prazo de reposicao nao pode ser negativo.";
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

  if (hasDuplicateField(snapshot, "accessories", editingRecord, "sku", payload.sku)) {
    return "Ja existe um acessorio cadastrado com este SKU.";
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
  const optionValue = String(payload.value || payload.name || "").trim();

  if (!payload.group || !payload.name?.trim() || !optionValue) {
    return "Informe grupo e nome da opcao.";
  }

  const duplicate = hasDuplicate(snapshot, "options", editingRecord, (option) =>
    normalizeText(option.group) === normalizeText(payload.group) &&
    normalizeText(option.value) === normalizeText(optionValue)
  );

  if (duplicate) {
    return "Ja existe uma opcao com este valor dentro do mesmo grupo.";
  }

  if (asNumber(payload.requiredQuantity) < 0 || asNumber(payload.defaultMl) < 0) {
    return "Quantidades padrao nao podem ser negativas.";
  }

  return "";
}
