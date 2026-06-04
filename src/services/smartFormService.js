function asNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getDefaultValue(field) {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  if (field.type === "number" || field.type === "currency") {
    return "";
  }

  if (field.type === "checkbox") {
    return false;
  }

  return "";
}

export function isFieldVisible(field, formData, snapshot) {
  if (!field.visibleWhen) {
    return true;
  }

  return Boolean(field.visibleWhen(formData, snapshot));
}

export function buildInitialSmartFormData(fields, editingRecord, snapshot) {
  const initialData = fields.reduce((data, field) => {
    if (field.type === "inventoryItem" && editingRecord?.productCollection && editingRecord?.productId) {
      data[field.name] = `${editingRecord.productCollection}:${editingRecord.productId}`;
      return data;
    }

    data[field.name] = editingRecord?.[field.name] ?? getDefaultValue(field);
    return data;
  }, {});

  return applySmartAutofill(fields, initialData, snapshot, editingRecord);
}

export function applySmartAutofill(fields, formData, snapshot, editingRecord, options = {}) {
  return fields.reduce((nextData, field) => {
    if (!field.autoFill) {
      return nextData;
    }

    const autoValue = field.autoFill(nextData, snapshot, editingRecord);
    const dependencyChanged = field.autoFillDependencies?.includes(options.changedFieldName);
    const canWrite =
      options.forceReadOnly ||
      dependencyChanged ||
      field.autoFillMode === "always" ||
      field.readOnly ||
      nextData[field.name] === "" ||
      nextData[field.name] === undefined ||
      nextData[field.name] === null;

    if (!canWrite || autoValue === undefined || autoValue === null) {
      return nextData;
    }

    return {
      ...nextData,
      [field.name]: autoValue,
    };
  }, formData);
}

export function normalizeSmartPayload(fields, formData, snapshot) {
  return fields.reduce((payload, field) => {
    const visible = isFieldVisible(field, formData, snapshot);

    if (field.readOnly && !field.persistReadOnly) {
      return payload;
    }

    if (!visible && field.clearWhenHidden !== false) {
      payload[field.name] = getDefaultValue(field);
      return payload;
    }

    const value = formData[field.name];

    if (field.type === "checkbox") {
      payload[field.name] = Boolean(value);
      return payload;
    }

    payload[field.name] =
      field.type === "number" || field.type === "currency" ? asNumber(value) : value;

    return payload;
  }, {});
}

export function groupSmartFields(fields, formData, snapshot) {
  const visibleFields = fields.filter((field) => isFieldVisible(field, formData, snapshot));
  const groups = [];

  visibleFields.forEach((field) => {
    const section = field.section || {
      id: "dados",
      title: "Dados do cadastro",
      eyebrow: "Formulario",
    };
    const sectionId = typeof section === "string" ? section : section.id || section.title;
    const currentGroup = groups.find((group) => group.id === sectionId);
    const normalizedSection = typeof section === "string"
      ? { eyebrow: "", id: sectionId, title: section }
      : section;

    if (currentGroup) {
      currentGroup.fields.push(field);
      return;
    }

    groups.push({
      ...normalizedSection,
      id: sectionId,
      fields: [field],
    });
  });

  return groups;
}

export function buildSmartFormInsights(fields, formData, snapshot) {
  return fields
    .filter((field) => isFieldVisible(field, formData, snapshot))
    .flatMap((field) => {
      const insights = [];

      if (field.helpText) {
        insights.push({
          id: `${field.name}-help`,
          tone: "blue",
          title: field.label,
          text: typeof field.helpText === "function" ? field.helpText(formData, snapshot) : field.helpText,
        });
      }

      if (field.warningWhen?.(formData, snapshot)) {
        insights.push({
          id: `${field.name}-warning`,
          tone: "red",
          title: field.label,
          text: field.warningText?.(formData, snapshot) || "Verifique este campo antes de salvar.",
        });
      }

      return insights;
    })
    .filter((insight) => Boolean(insight.text));
}
