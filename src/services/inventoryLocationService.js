const PRODUCT_COLLECTION_LABELS = {
  accessories: "Acessorio",
  supplies: "Insumo",
};

function asNumber(value, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function positiveQuantity(value, fallback = 1) {
  return Math.max(1, asNumber(value, fallback));
}

function findById(records = [], id) {
  return records.find((record) => record.id === id) || null;
}

function parseProductRef(productRef = "") {
  const [collectionName, productId] = String(productRef).split(":");

  return {
    collectionName,
    productId,
  };
}

function buildProductRef(product = {}) {
  return product.productCollection && product.productId
    ? `${product.productCollection}:${product.productId}`
    : "";
}

export function buildEmptyInventoryLocationForm() {
  return {
    machineId: "",
    machineQuantity: 1,
    name: "",
    notes: "",
    products: [{ productRef: "", quantity: 1 }],
  };
}

export function buildInventoryLocationForm(record = {}) {
  return {
    machineId: record.machineId || "",
    machineQuantity: positiveQuantity(record.machineQuantity),
    name: record.name || "",
    notes: record.notes || "",
    products: Array.isArray(record.products) && record.products.length
      ? record.products.map((product) => ({
        productRef: buildProductRef(product),
        quantity: positiveQuantity(product.quantity),
      }))
      : [{ productRef: "", quantity: 1 }],
  };
}

export function buildInventoryLocationProductOptions(snapshot) {
  return [
    ...(snapshot.supplies || []).map((item) => ({
      collectionName: "supplies",
      item,
      label: `${item.name} | Insumo`,
      value: `supplies:${item.id}`,
    })),
    ...(snapshot.accessories || []).map((item) => ({
      collectionName: "accessories",
      item,
      label: `${item.name} | Acessorio`,
      value: `accessories:${item.id}`,
    })),
  ].sort((first, second) => first.label.localeCompare(second.label));
}

export function validateInventoryLocationForm(formData) {
  if (!String(formData.name || "").trim()) {
    return "Informe o nome do estoque.";
  }

  if (!formData.machineId) {
    return "Selecione a maquina vinculada a este estoque.";
  }

  if (positiveQuantity(formData.machineQuantity) <= 0) {
    return "Informe a quantidade de maquinas vinculadas.";
  }

  const selectedProducts = (formData.products || []).filter((product) => product.productRef);

  if (!selectedProducts.length) {
    return "Adicione pelo menos um produto ao estoque.";
  }

  const invalidProduct = selectedProducts.find((product) => positiveQuantity(product.quantity) <= 0);

  if (invalidProduct) {
    return "As quantidades dos produtos devem ser maiores que zero.";
  }

  return "";
}

export function buildInventoryLocationPayload(formData, snapshot) {
  const productOptionsByRef = new Map(
    buildInventoryLocationProductOptions(snapshot).map((option) => [option.value, option])
  );
  const productsByRef = new Map();

  (formData.products || []).forEach((productRow) => {
    if (!productRow.productRef) {
      return;
    }

    const option = productOptionsByRef.get(productRow.productRef);
    const parsedProduct = parseProductRef(productRow.productRef);
    const currentProduct = productsByRef.get(productRow.productRef);
    const quantity = positiveQuantity(productRow.quantity);

    productsByRef.set(productRow.productRef, {
      productCollection: parsedProduct.collectionName,
      productId: parsedProduct.productId,
      productName: option?.item?.name || currentProduct?.productName || "Produto removido",
      productType: PRODUCT_COLLECTION_LABELS[parsedProduct.collectionName] || "Produto",
      quantity: (currentProduct?.quantity || 0) + quantity,
    });
  });

  return {
    machineId: formData.machineId,
    machineName: findById(snapshot.machines || [], formData.machineId)?.name || "Maquina removida",
    machineQuantity: positiveQuantity(formData.machineQuantity),
    name: String(formData.name || "").trim(),
    notes: String(formData.notes || "").trim(),
    products: Array.from(productsByRef.values()),
  };
}

export function buildInventoryLocationCards(records = [], snapshot) {
  return records.map((record) => {
    const machine = findById(snapshot.machines || [], record.machineId);
    const products = (record.products || []).map((product) => {
      const sourceRecord = findById(snapshot[product.productCollection] || [], product.productId);

      return {
        ...product,
        productName: sourceRecord?.name || product.productName || "Produto removido",
        productType: PRODUCT_COLLECTION_LABELS[product.productCollection] || product.productType || "Produto",
        quantity: positiveQuantity(product.quantity),
      };
    });

    return {
      ...record,
      machineName: machine?.name || record.machineName || "Maquina removida",
      machineQuantity: positiveQuantity(record.machineQuantity),
      productCount: products.length,
      products,
      totalProductQuantity: products.reduce((total, product) => total + positiveQuantity(product.quantity), 0),
    };
  });
}
