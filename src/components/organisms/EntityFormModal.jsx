import { useEffect, useMemo, useState } from "react";
import Button from "../atoms/Button.jsx";
import SelectInput from "../atoms/SelectInput.jsx";
import TextArea from "../atoms/TextArea.jsx";
import TextInput from "../atoms/TextInput.jsx";
import FormSection from "../molecules/FormSection.jsx";
import Modal from "../molecules/Modal.jsx";
import DocumentLivePreviewPanel from "./DocumentLivePreviewPanel.jsx";
import { getLabelFile, saveLabelFile } from "../../services/labelFileStorageService.js";
import { formatFileSize, resolveFileFormat } from "../../services/labelService.js";
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Nao foi possivel ler o arquivo.")));
    reader.readAsDataURL(file);
  });
}

function ImageUploadControl({ field, formData, onChange }) {
  const previewUrl = formData[field.name] || formData[field.fallbackUrlField] || "";

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    onChange(field.name, await readFileAsDataUrl(file));
  }

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <div className="grid h-44 place-items-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
          <img alt="Preview" className="h-full w-full object-contain" src={previewUrl} />
        </div>
      ) : (
        <div className="grid h-32 place-items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-sm font-bold text-amiste-gray/55">
          Nenhuma imagem selecionada
        </div>
      )}
      <input
        accept="image/*"
        className="block h-11 w-full rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-semibold text-amiste-gray file:mr-4 file:rounded-md file:border-0 file:bg-amiste-black file:px-3 file:py-1.5 file:text-xs file:font-black file:text-white focus:border-amiste-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-amiste-red/10"
        type="file"
        onChange={handleFileChange}
      />
    </div>
  );
}

function FileUploadControl({ field, formData, onChange }) {
  const fileValue = typeof formData[field.name] === "object" && formData[field.name]
    ? formData[field.name]
    : {};
  const [previewUrl, setPreviewUrl] = useState("");
  const mimeType = String(fileValue.mimeType || "").toLowerCase();
  const canPreviewImage = mimeType.startsWith("image/");
  const canPreviewVideo = mimeType.startsWith("video/");

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    async function loadPreview() {
      if (!fileValue.fileStorageKey) {
        setPreviewUrl("");
        return;
      }

      const blob = await getLabelFile(fileValue.fileStorageKey);

      if (blob && active) {
        objectUrl = window.URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      }
    }

    loadPreview();

    return () => {
      active = false;

      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileValue.fileStorageKey]);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const storageKey = `${field.storageKeyPrefix || field.name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await saveLabelFile(storageKey, file);
    onChange(field.name, {
      fileSize: file.size,
      fileStorageKey: storageKey,
      format: resolveFileFormat(file),
      mimeType: file.type || "application/octet-stream",
      originalFileName: file.name,
      uploadedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="space-y-3">
      {previewUrl && canPreviewImage ? (
        <div className="grid h-44 place-items-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
          <img alt={fileValue.originalFileName || "Arquivo"} className="h-full w-full object-contain" src={previewUrl} />
        </div>
      ) : null}
      {previewUrl && canPreviewVideo ? (
        <video className="h-48 w-full rounded-md border border-zinc-200 bg-amiste-black" controls src={previewUrl} />
      ) : null}
      {fileValue.originalFileName ? (
        <div className="grid grid-cols-1 gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs md:grid-cols-3">
          <span className="truncate font-black text-amiste-black">{fileValue.originalFileName}</span>
          <span className="font-bold text-amiste-gray">{fileValue.format || resolveFileFormat(fileValue)}</span>
          <span className="font-bold text-amiste-gray">{formatFileSize(fileValue.fileSize)}</span>
        </div>
      ) : (
        <div className="grid h-24 place-items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-sm font-bold text-amiste-gray/55">
          Nenhum arquivo selecionado
        </div>
      )}
      <input
        accept={field.accept || "*/*"}
        className="block h-11 w-full rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-semibold text-amiste-gray file:mr-4 file:rounded-md file:border-0 file:bg-amiste-black file:px-3 file:py-1.5 file:text-xs file:font-black file:text-white focus:border-amiste-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-amiste-red/10"
        type="file"
        onChange={handleFileChange}
      />
    </div>
  );
}

function VariantListControl({ field, formData, onChange }) {
  const variants = Array.isArray(formData[field.name]) ? formData[field.name] : [];

  function updateVariant(index, key, value) {
    const nextVariants = variants.map((variant, variantIndex) =>
      variantIndex === index ? { ...variant, [key]: value } : variant
    );

    onChange(field.name, nextVariants);
  }

  async function updateVariantImage(index, file) {
    if (!file) {
      return;
    }

    updateVariant(index, "photoDataUrl", await readFileAsDataUrl(file));
  }

  function addVariant() {
    onChange(field.name, [
      ...variants,
      {
        amperage: "",
        litreCapacity: "",
        name: "",
        photoDataUrl: "",
        power: "",
        voltage: "",
        weight: "",
      },
    ]);
  }

  function removeVariant(index) {
    onChange(field.name, variants.filter((_, variantIndex) => variantIndex !== index));
  }

  return (
    <div className="space-y-3">
      {variants.map((variant, index) => (
        <section className="rounded-md border border-zinc-200 bg-zinc-50 p-3" key={`variant-${index + 1}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <strong className="text-sm font-black text-amiste-black">Versao {index + 1}</strong>
            <Button className="h-8 px-3 text-xs" icon="trash" variant="secondary" onClick={() => removeVariant(index)}>
              Remover
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextInput placeholder="Nome do modelo" value={variant.name || ""} onChange={(event) => updateVariant(index, "name", event.target.value)} />
            <TextInput placeholder="Peso" value={variant.weight || ""} onChange={(event) => updateVariant(index, "weight", event.target.value)} />
            <TextInput placeholder="Voltagem" value={variant.voltage || ""} onChange={(event) => updateVariant(index, "voltage", event.target.value)} />
            <TextInput placeholder="Amperagem" value={variant.amperage || ""} onChange={(event) => updateVariant(index, "amperage", event.target.value)} />
            <TextInput placeholder="Potencia" value={variant.power || ""} onChange={(event) => updateVariant(index, "power", event.target.value)} />
            <TextInput placeholder="Litragem" value={variant.litreCapacity || ""} onChange={(event) => updateVariant(index, "litreCapacity", event.target.value)} />
            <label className="md:col-span-2">
              <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Foto propria</span>
              <input
                accept="image/*"
                className="block h-11 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-amiste-gray file:mr-4 file:rounded-md file:border-0 file:bg-amiste-black file:px-3 file:py-1.5 file:text-xs file:font-black file:text-white"
                type="file"
                onChange={(event) => updateVariantImage(index, event.target.files?.[0])}
              />
            </label>
            {variant.photoDataUrl ? (
              <img alt={variant.name || `Versao ${index + 1}`} className="h-28 rounded-md border border-zinc-200 bg-white object-contain md:col-span-2" src={variant.photoDataUrl} />
            ) : null}
          </div>
        </section>
      ))}

      <Button className="w-full" icon="plus" variant="secondary" onClick={addVariant}>
        Adicionar versao
      </Button>
    </div>
  );
}

function DynamicTextListControl({ field, formData, onChange }) {
  const values = Array.isArray(formData[field.name]) ? formData[field.name] : [];
  const maxItems = Number(field.maxItems || 0);
  const hasLimit = field.maxItems !== undefined && field.maxItems !== null;
  const canAdd = !hasLimit || values.length < maxItems;

  function updateValue(index, value) {
    onChange(field.name, values.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function addValue() {
    if (canAdd) {
      onChange(field.name, [...values, ""]);
    }
  }

  function removeValue(index) {
    onChange(field.name, values.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="space-y-2">
      {values.map((value, index) => (
        <div className="grid grid-cols-[1fr_40px] gap-2" key={`${field.name}-${index + 1}`}>
          <TextInput
            placeholder={`${field.itemLabel || "Item"} ${index + 1}`}
            value={value}
            onChange={(event) => updateValue(index, event.target.value)}
          />
          <Button className="h-10 px-0" icon="trash" variant="secondary" onClick={() => removeValue(index)}>
            <span className="sr-only">Remover</span>
          </Button>
        </div>
      ))}
      {canAdd ? (
        <Button className="w-full" icon="plus" variant="secondary" onClick={addValue}>
          {field.addLabel || "Adicionar item"}
        </Button>
      ) : null}
    </div>
  );
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

  if (field.type === "imageUpload") {
    return <ImageUploadControl field={field} formData={formData} onChange={onChange} />;
  }

  if (field.type === "fileUpload") {
    return <FileUploadControl field={field} formData={formData} onChange={onChange} />;
  }

  if (field.type === "variantList") {
    return <VariantListControl field={field} formData={formData} onChange={onChange} />;
  }

  if (field.type === "dynamicTextList") {
    return <DynamicTextListControl field={field} formData={formData} onChange={onChange} />;
  }

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
  asideContent,
  size,
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

  const modalSize = size || (hasLivePreview || hasSmartSidePanel || asideContent ? "wide" : "default");

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
      ) : asideContent ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          {asideContent}
          {formContent}
        </div>
      ) : (
        formContent
      )}
    </Modal>
  );
}
