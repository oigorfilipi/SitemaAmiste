import { useEffect, useMemo, useState } from "react";
import Button from "../atoms/Button.jsx";
import SelectInput from "../atoms/SelectInput.jsx";
import TextArea from "../atoms/TextArea.jsx";
import TextInput from "../atoms/TextInput.jsx";
import FormSection from "../molecules/FormSection.jsx";
import Modal from "../molecules/Modal.jsx";
import DocumentLivePreviewPanel from "./DocumentLivePreviewPanel.jsx";
import { buildSelectOptionsFromGroup } from "../../services/optionService.js";
import {
  applySmartAutofill,
  buildInitialSmartFormData,
  buildSmartFormInsights,
  groupSmartFields,
  normalizeSmartPayload,
} from "../../services/smartFormService.js";

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

function resolveInputType(field) {
  if (field.type === "date") {
    return "date";
  }

  if (field.type === "currency" || field.type === "number") {
    return "number";
  }

  return field.type || "text";
}

function SmartInsightPanel({ insights, previewRecord, smartSummary }) {
  if (!smartSummary && !insights.length) {
    return null;
  }

  return (
    <aside className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-4">
      {/* --- SECAO: INTELIGENCIA DO FORMULARIO --- */}
      <div>
        <span className="text-xs font-black uppercase text-amiste-gray/50">Automacoes e validacoes</span>
        <h3 className="mt-1 font-display text-lg font-black text-amiste-black">Resumo inteligente</h3>
      </div>

      {smartSummary ? (
        <div className="rounded-md border border-zinc-200 bg-white p-3 text-sm font-semibold leading-6 text-amiste-gray">
          {smartSummary(previewRecord)}
        </div>
      ) : null}

      {insights.slice(0, 8).map((insight) => (
        <div
          className={`rounded-md border p-3 ${
            insight.tone === "red"
              ? "border-amiste-red/25 bg-amiste-red/10 text-amiste-red"
              : "border-zinc-200 bg-white text-amiste-gray"
          }`}
          key={insight.id}
        >
          <strong className="block text-xs font-black uppercase">{insight.title}</strong>
          <span className="mt-1 block text-sm font-semibold leading-5">{insight.text}</span>
        </div>
      ))}
    </aside>
  );
}

function FieldControl({ field, formData, snapshot, onChange }) {
  const options = buildOptions(field, snapshot);
  const isTextarea = field.type === "textarea";
  const isCheckbox = field.type === "checkbox";
  const isSelect = field.type === "select" || field.source || field.optionGroup || field.type === "inventoryItem";
  const disabled = Boolean(field.disabled || field.readOnly);

  if (isCheckbox) {
    return (
      <button
        className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-bold text-amiste-gray transition hover:border-amiste-red disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        type="button"
        onClick={() => onChange(field.name, !formData[field.name])}
      >
        <span>{formData[field.name] ? "Sim" : "Nao"}</span>
        <span className={formData[field.name] ? "text-amiste-green" : "text-amiste-red"}>
          {formData[field.name] ? field.trueLabel || "Ativo" : field.falseLabel || "Inativo"}
        </span>
      </button>
    );
  }

  if (isTextarea) {
    return (
      <TextArea
        disabled={disabled}
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        value={formData[field.name] || ""}
        onChange={(event) => onChange(field.name, event.target.value)}
      />
    );
  }

  if (isSelect) {
    return (
      <SelectInput
        disabled={disabled}
        required={field.required}
        value={formData[field.name] || ""}
        onChange={(event) => onChange(field.name, event.target.value)}
      >
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectInput>
    );
  }

  return (
    <TextInput
      disabled={disabled}
      max={field.max}
      maxLength={field.maxLength}
      min={field.min}
      placeholder={field.placeholder}
      readOnly={field.readOnly}
      required={field.required}
      step={field.step || (field.type === "currency" ? "0.01" : undefined)}
      type={resolveInputType(field)}
      value={formData[field.name] || ""}
      onChange={(event) => onChange(field.name, event.target.value)}
    />
  );
}

export default function EntityFormModal({
  fields,
  title,
  description,
  open,
  editingRecord,
  livePreviewDocumentType,
  smartSummary,
  snapshot,
  validate,
  onClose,
  onSubmit,
}) {
  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  const modalTitle = editingRecord ? `Editar ${title}` : title;
  const hasLivePreview = Boolean(livePreviewDocumentType);
  const fieldGroups = useMemo(() => groupSmartFields(fields, formData, snapshot), [fields, formData, snapshot]);
  const previewRecord = useMemo(() => {
    return {
      ...(editingRecord || {}),
      ...normalizeSmartPayload(fields, formData, snapshot),
    };
  }, [editingRecord, fields, formData, snapshot]);
  const insights = useMemo(
    () => buildSmartFormInsights(fields, formData, snapshot),
    [fields, formData, snapshot]
  );
  const hasSmartSidePanel = Boolean(smartSummary || insights.length);

  const initialData = useMemo(
    () => buildInitialSmartFormData(fields, editingRecord, snapshot),
    [editingRecord, fields, snapshot]
  );

  useEffect(() => {
    if (open) {
      setFormData(initialData);
      setErrorMessage("");
    }
  }, [initialData, open]);

  function updateField(fieldName, value) {
    setFormData((currentData) => {
      const nextData = {
        ...currentData,
        [fieldName]: value,
      };

      return applySmartAutofill(fields, nextData, snapshot, editingRecord, {
        changedFieldName: fieldName,
      });
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = normalizeSmartPayload(fields, formData, snapshot);
    const validationMessage = validate?.(payload, snapshot, editingRecord);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    await onSubmit(payload);
  }

  const formContent = (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* --- SECAO: CAMPOS AGRUPADOS DO FORMULARIO --- */}
      {fieldGroups.map((group) => (
        <FormSection eyebrow={group.eyebrow} key={group.id} title={group.title}>
          {group.description ? (
            <p className="-mt-2 text-sm font-semibold leading-6 text-amiste-gray/65">{group.description}</p>
          ) : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {group.fields.map((field) => (
              <label className={field.full ? "md:col-span-2" : ""} key={field.name}>
                <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">
                  {field.label}
                  {field.required ? <span className="text-amiste-red"> *</span> : null}
                </span>
                <FieldControl field={field} formData={formData} snapshot={snapshot} onChange={updateField} />
              </label>
            ))}
          </div>
        </FormSection>
      ))}

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

  const modalSize = hasLivePreview || hasSmartSidePanel ? "wide" : "default";

  return (
    <Modal description={description} open={open} size={modalSize} title={modalTitle} onClose={onClose}>
      {hasLivePreview ? (
        <div className="grid max-h-[calc(88vh-132px)] grid-cols-1 gap-5 overflow-hidden xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
          <div className="min-h-0 overflow-y-auto pr-1">{formContent}</div>
          <DocumentLivePreviewPanel
            documentType={livePreviewDocumentType}
            record={previewRecord}
            snapshot={snapshot}
          />
        </div>
      ) : hasSmartSidePanel ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          {formContent}
          <SmartInsightPanel insights={insights} previewRecord={previewRecord} smartSummary={smartSummary} />
        </div>
      ) : (
        formContent
      )}
    </Modal>
  );
}
