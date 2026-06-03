import { useEffect, useMemo, useState } from "react";
import Button from "../atoms/Button.jsx";
import SelectInput from "../atoms/SelectInput.jsx";
import TextArea from "../atoms/TextArea.jsx";
import TextInput from "../atoms/TextInput.jsx";
import Modal from "../molecules/Modal.jsx";
import DocumentLivePreviewPanel from "./DocumentLivePreviewPanel.jsx";
import { buildSelectOptionsFromGroup } from "../../services/optionService.js";

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

function buildOptions(field, snapshot) {
  if (field.type === "inventoryItem") {
    return [
      ...(snapshot.supplies || []).map((item) => ({
        label: `Insumo: ${item.name}`,
        value: `supplies:${item.id}`,
      })),
      ...(snapshot.accessories || []).map((item) => ({
        label: `Acessorio: ${item.name}`,
        value: `accessories:${item.id}`,
      })),
    ];
  }

  if (field.source) {
    return (snapshot[field.source] || []).map((item) => ({
      label: item[field.sourceLabel || "name"],
      value: item.id,
    }));
  }

  if (field.optionGroup) {
    return buildSelectOptionsFromGroup(snapshot, field.optionGroup, field.options || []);
  }

  return field.options || [];
}

function normalizePayload(fields, formData) {
  return fields.reduce((payload, field) => {
    if (field.readOnly) {
      return payload;
    }

    const value = formData[field.name];

    if (field.type === "checkbox") {
      payload[field.name] = Boolean(value);
      return payload;
    }

    payload[field.name] =
      field.type === "number" || field.type === "currency" ? Number(value || 0) : value;

    return payload;
  }, {});
}

export default function EntityFormModal({
  fields,
  title,
  description,
  open,
  editingRecord,
  livePreviewDocumentType,
  snapshot,
  validate,
  onClose,
  onSubmit,
}) {
  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  const modalTitle = editingRecord ? `Editar ${title}` : title;
  const hasLivePreview = Boolean(livePreviewDocumentType);

  const initialData = useMemo(() => {
    return fields.reduce((data, field) => {
      if (field.type === "inventoryItem" && editingRecord?.productCollection && editingRecord?.productId) {
        data[field.name] = `${editingRecord.productCollection}:${editingRecord.productId}`;
        return data;
      }

      data[field.name] = editingRecord?.[field.name] ?? getDefaultValue(field);
      return data;
    }, {});
  }, [editingRecord, fields]);

  useEffect(() => {
    if (open) {
      setFormData(initialData);
      setErrorMessage("");
    }
  }, [initialData, open]);

  function updateField(fieldName, value) {
    setFormData((currentData) => ({
      ...currentData,
      [fieldName]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = normalizePayload(fields, formData);
    const validationMessage = validate?.(payload, snapshot);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    await onSubmit(payload);
  }

  const previewRecord = useMemo(() => {
    return {
      ...(editingRecord || {}),
      ...normalizePayload(fields, formData),
    };
  }, [editingRecord, fields, formData]);

  const formContent = (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* --- SECAO: CAMPOS DO FORMULARIO --- */}
      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => {
          const options = buildOptions(field, snapshot);
          const isTextarea = field.type === "textarea";
          const isCheckbox = field.type === "checkbox";
          const isSelect =
            field.type === "select" || field.source || field.optionGroup || field.type === "inventoryItem";

          return (
            <label className={field.full ? "col-span-2" : ""} key={field.name}>
              <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">
                {field.label}
                {field.required ? <span className="text-amiste-red"> *</span> : null}
              </span>
              {isCheckbox ? (
                <button
                  className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-bold text-amiste-gray transition hover:border-amiste-red"
                  type="button"
                  onClick={() => updateField(field.name, !formData[field.name])}
                >
                  <span>{formData[field.name] ? "Sim" : "Nao"}</span>
                  <span className={formData[field.name] ? "text-amiste-green" : "text-amiste-red"}>
                    {formData[field.name] ? "Ativo" : "Inativo"}
                  </span>
                </button>
              ) : isTextarea ? (
                <TextArea
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={(event) => updateField(field.name, event.target.value)}
                />
              ) : isSelect ? (
                <SelectInput
                  required={field.required}
                  value={formData[field.name] || ""}
                  onChange={(event) => updateField(field.name, event.target.value)}
                >
                  <option value="">Selecione</option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              ) : (
                <TextInput
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                  required={field.required}
                  type={field.type === "date" ? "date" : field.type === "currency" ? "number" : field.type || "text"}
                  value={formData[field.name] || ""}
                  onChange={(event) => updateField(field.name, event.target.value)}
                />
              )}
            </label>
          );
        })}
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
          {errorMessage}
        </div>
      ) : null}

      {/* --- SECAO: ACOES DO FORMULARIO --- */}
      <footer className="flex justify-end gap-3 border-t border-zinc-100 pt-5">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button icon="plus" type="submit">
          Salvar
        </Button>
      </footer>
    </form>
  );

  return (
    <Modal description={description} open={open} size={hasLivePreview ? "wide" : "default"} title={modalTitle} onClose={onClose}>
      {hasLivePreview ? (
        <div className="grid max-h-[calc(88vh-132px)] grid-cols-1 gap-5 overflow-hidden xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
          <div className="min-h-0 overflow-y-auto pr-1">{formContent}</div>
          <DocumentLivePreviewPanel
            documentType={livePreviewDocumentType}
            record={previewRecord}
            snapshot={snapshot}
          />
        </div>
      ) : formContent}
    </Modal>
  );
}
