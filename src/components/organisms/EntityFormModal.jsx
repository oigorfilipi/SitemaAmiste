import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../atoms/Button.jsx";
import PasswordInput from "../atoms/PasswordInput.jsx";
import SelectInput from "../atoms/SelectInput.jsx";
import TextArea from "../atoms/TextArea.jsx";
import TextInput from "../atoms/TextInput.jsx";
import FormSection from "../molecules/FormSection.jsx";
import Modal from "../molecules/Modal.jsx";
import PasswordStrengthMeter from "../molecules/PasswordStrengthMeter.jsx";
import DocumentLivePreviewPanel from "./DocumentLivePreviewPanel.jsx";
import { getLabelFile, saveLabelFile } from "../../services/labelFileStorageService.js";
import { formatFileSize, resolveFileFormat } from "../../services/labelService.js";
import { assertInlineImageFile } from "../../services/imageUploadValidationService.js";
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

function resolveFieldPlaceholder(field) {
  if (field.placeholder) {
    return field.placeholder;
  }

  const label = String(field.label || field.name || "campo").toLowerCase();
  const fieldType = field.type || "";

  if (fieldType === "email" || label.includes("email")) return "nome@empresa.com";
  if (fieldType === "password" || label.includes("senha")) return "Min. 8 caracteres";
  if (fieldType === "url" || label.includes("url") || label.includes("link")) return "https://...";
  if (fieldType === "currency" || label.includes("valor") || label.includes("preco") || label.includes("custo")) return "R$ 0,00";
  if (fieldType === "date" || label.includes("data")) return "dd/mm/aaaa";
  if (label.includes("horario") || label.includes("hora")) return "08:30";
  if (label.includes("telefone") || label.includes("phone")) return "(11) 99999-9999";
  if (label.includes("cnpj")) return "00.000.000/0000-00";
  if (label.includes("cpf")) return "000.000.000-00";
  if (label.includes("cep")) return "00000-000";
  if (label.includes("sku") || label.includes("codigo")) return "Ex: AMI-001";
  if (label.includes("endereco")) return "Rua, numero, bairro, cidade";
  if (label.includes("nome")) return "Ex: Cafe Central";
  if (label.includes("contato")) return "Ex: Ana Souza";
  if (label.includes("maquina") || label.includes("modelo")) return "Ex: Lio 2C";
  if (label.includes("serie")) return "Ex: SN-2026-001";
  if (label.includes("patrimonio")) return "Ex: PAT-001";
  if (label.includes("voltagem")) return "Ex: 220v";
  if (label.includes("amperagem")) return "Ex: 20A";
  if (label.includes("potencia")) return "Ex: 1500W";
  if (label.includes("litragem")) return "Ex: 2L";
  if (label.includes("quantidade") || label.includes("estoque")) return "0";
  if (label.includes("fornecedor")) return "Ex: Fornecedor principal";
  if (label.includes("descricao")) return "Descreva os pontos principais deste cadastro.";
  if (label.includes("observacao") || label.includes("observacoes")) return "Inclua observacoes relevantes para a equipe.";

  if (fieldType === "number") return "0";
  if (fieldType === "textarea") return "Digite as informacoes importantes.";

  return `Informe ${label}`;
}

function readFileAsDataUrl(file) {
  assertInlineImageFile(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Nao foi possivel ler o arquivo.")));
    reader.readAsDataURL(file);
  });
}

function ImageUploadControl({ disabled = false, field, formData, onChange }) {
  const [uploadError, setUploadError] = useState("");
  const previewUrl = formData[field.name] || formData[field.fallbackUrlField] || "";
  const compactAvatar = field.previewVariant === "avatar";
  const compactCatalog = field.previewVariant === "catalog";

  async function handleFileChange(event) {
    if (disabled) {
      return;
    }

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      onChange(field.name, await readFileAsDataUrl(file));
      setUploadError("");
    } catch (error) {
      setUploadError(error.message || "Nao foi possivel carregar a imagem.");
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <div className={compactAvatar
          ? "mx-auto grid size-28 place-items-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100"
          : compactCatalog
            ? "grid h-28 w-full max-w-sm place-items-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50"
            : "grid h-40 place-items-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"}
        >
          <img alt="Preview" className={compactAvatar ? "h-full w-full object-cover" : "h-full w-full object-contain"} src={previewUrl} />
        </div>
      ) : (
        <div className={compactAvatar
          ? "mx-auto grid size-28 place-items-center rounded-full border border-dashed border-zinc-300 bg-zinc-50 px-4 text-center text-xs font-bold text-amiste-gray/55"
          : compactCatalog
            ? "grid h-24 w-full max-w-sm place-items-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-sm font-bold text-amiste-gray/55"
            : "grid h-28 place-items-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-sm font-bold text-amiste-gray/55"}
        >
          Nenhuma imagem selecionada
        </div>
      )}
      <input
        accept="image/*"
        className="block h-9 w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[13px] font-semibold text-amiste-gray file:mr-4 file:rounded-xl file:border-0 file:bg-amiste-black file:px-3 file:py-1 file:text-xs file:font-black file:text-white focus:border-amiste-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-amiste-red/10 disabled:opacity-50"
        disabled={disabled}
        type="file"
        onChange={handleFileChange}
      />
      {uploadError ? (
        <div className="rounded-2xl border border-amiste-red/20 bg-amiste-red/10 px-3 py-2 text-xs font-bold text-amiste-red">
          {uploadError}
        </div>
      ) : null}
    </div>
  );
}

function FileUploadControl({ disabled = false, field, formData, onChange }) {
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
    if (disabled) {
      return;
    }

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
        <div className="grid h-40 place-items-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
          <img alt={fileValue.originalFileName || "Arquivo"} className="h-full w-full object-contain" src={previewUrl} />
        </div>
      ) : null}
      {previewUrl && canPreviewVideo ? (
        <video className="h-44 w-full rounded-2xl border border-zinc-200 bg-amiste-black" controls src={previewUrl} />
      ) : null}
      {fileValue.originalFileName ? (
        <div className="grid grid-cols-1 gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs md:grid-cols-3">
          <span className="truncate font-black text-amiste-black">{fileValue.originalFileName}</span>
          <span className="font-bold text-amiste-gray">{fileValue.format || resolveFileFormat(fileValue)}</span>
          <span className="font-bold text-amiste-gray">{formatFileSize(fileValue.fileSize)}</span>
        </div>
      ) : (
        <div className="grid h-24 place-items-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-sm font-bold text-amiste-gray/55">
          Nenhum arquivo selecionado
        </div>
      )}
      <input
        accept={field.accept || "*/*"}
        className="block h-9 w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[13px] font-semibold text-amiste-gray file:mr-4 file:rounded-xl file:border-0 file:bg-amiste-black file:px-3 file:py-1 file:text-xs file:font-black file:text-white focus:border-amiste-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-amiste-red/10 disabled:opacity-50"
        disabled={disabled}
        type="file"
        onChange={handleFileChange}
      />
    </div>
  );
}

const MACHINE_VARIANT_DEFAULTS = {
  acquisitionCost: "",
  amperage: "",
  brand: "",
  category: "",
  defaultProposalText: "",
  description: "",
  doublePortafilterCount: "",
  extraSteamer: false,
  filterType: "",
  groupCount: "",
  hasIntegratedGrinder: false,
  hasPortafilter: false,
  hasSupplyReservoirs: false,
  hydraulic: "",
  imageUrl: "",
  litreCapacity: "",
  maxDrinkCount: "",
  minStock: "",
  name: "",
  paymentSystem: "",
  paymentSystemName: "",
  photoDataUrl: "",
  power: "",
  priceRent: "",
  priceSale: "",
  reservoirCapacity: "",
  reservoirCount: "",
  sewer: "",
  singlePortafilterCount: "",
  solubleOnly: false,
  springsPerTray: "",
  status: "",
  steam: "",
  stock: "",
  trayCount: "",
  usesBeans: false,
  videoUrl: "",
  voltage: "",
  weight: "",
};

const MACHINE_VARIANT_OPTIONS = {
  category: [
    { label: "Multibebidas", value: "Multibebidas" },
    { label: "Profissional", value: "Profissional" },
    { label: "Snacks", value: "Snacks" },
    { label: "Coado", value: "Coado" },
    { label: "Expresso", value: "Expresso" },
  ],
  groupCount: [
    { label: "1 Grupo", value: "1 Grupo" },
    { label: "2 Grupos", value: "2 Grupos" },
    { label: "3 Grupos", value: "3 Grupos" },
  ],
  status: [
    { label: "Ativo", value: "ativo" },
    { label: "Pedir", value: "pedir" },
    { label: "Manutencao", value: "manutencao" },
    { label: "Cancelado", value: "cancelado" },
  ],
  filterType: [
    { label: "Papel", value: "Papel" },
    { label: "Plastico", value: "Plastico" },
    { label: "Pano", value: "Pano" },
  ],
  voltage: [
    { label: "110v", value: "110v" },
    { label: "220v", value: "220v" },
    { label: "Bivolt", value: "Bivolt" },
  ],
  yesNo: [
    { label: "Sim", value: "Sim" },
    { label: "Nao", value: "Nao" },
  ],
};

function buildVariant(defaults = {}) {
  return {
    ...MACHINE_VARIANT_DEFAULTS,
    ...defaults,
  };
}

function getVariantCount(formData, field, variants) {
  const rawCount = field.countField ? formData[field.countField] : variants.length;
  const numericCount = Number(rawCount);

  if (!Number.isFinite(numericCount) || numericCount < 0) {
    return 0;
  }

  return Math.min(50, Math.floor(numericCount));
}

function VariantTextField({ label, placeholder, type = "text", value, onChange }) {
  return (
    <label>
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">{label}</span>
      <TextInput placeholder={placeholder} type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function VariantSelectField({ label, options, value, onChange }) {
  return (
    <label>
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">{label}</span>
      <SelectInput value={value || ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">Nao informado</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </SelectInput>
    </label>
  );
}

function VariantCheckboxField({ label, value, onChange }) {
  return (
    <button
      className="flex h-9 w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 text-[13px] font-bold text-amiste-gray transition hover:border-amiste-red"
      type="button"
      onClick={() => onChange(!value)}
    >
      <span>{label}</span>
      <span className={value ? "text-amiste-green" : "text-amiste-red"}>{value ? "Sim" : "Nao"}</span>
    </button>
  );
}

function VariantTextareaField({ label, placeholder, value, onChange }) {
  return (
    <label className="md:col-span-2">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">{label}</span>
      <TextArea placeholder={placeholder} value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function VariantListControl({ canUpload = true, field, formData, onChange }) {
  const [uploadError, setUploadError] = useState("");
  const variants = Array.isArray(formData[field.name]) ? formData[field.name] : [];
  const requestedCount = getVariantCount(formData, field, variants);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!field.countField || requestedCount === variants.length) {
      return;
    }

    if (requestedCount > variants.length) {
      onChange(field.name, [
        ...variants.map((variant) => buildVariant(variant)),
        ...Array.from({ length: requestedCount - variants.length }).map(() => buildVariant()),
      ]);
      return;
    }

    onChange(field.name, variants.slice(0, requestedCount).map((variant) => buildVariant(variant)));
  }, [field.countField, field.name, onChange, requestedCount, variants]);

  useEffect(() => {
    if (activeIndex >= variants.length) {
      setActiveIndex(Math.max(0, variants.length - 1));
    }
  }, [activeIndex, variants.length]);

  function updateVariant(index, key, value) {
    const nextVariants = variants.map((variant, variantIndex) =>
      variantIndex === index ? buildVariant({ ...variant, [key]: value }) : buildVariant(variant)
    );

    onChange(field.name, nextVariants);
  }

  async function updateVariantImage(index, file) {
    if (!canUpload || !file) {
      return;
    }

    try {
      updateVariant(index, "photoDataUrl", await readFileAsDataUrl(file));
      setUploadError("");
    } catch (error) {
      setUploadError(error.message || "Nao foi possivel carregar a imagem.");
    }
  }

  function addVariant() {
    onChange(field.name, [
      ...variants.map((variant) => buildVariant(variant)),
      buildVariant(),
    ]);
  }

  function removeVariant(index) {
    onChange(field.name, variants.filter((_, variantIndex) => variantIndex !== index));
  }

  return (
    <div className="space-y-3">
      {requestedCount === 0 && !variants.length ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm font-semibold leading-6 text-amiste-gray/65">
          Informe a quantidade de modelos/versoes para abrir as paginas de preenchimento.
        </div>
      ) : null}

      {variants.length ? (
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
          {/* --- SECAO: NAVEGACAO DAS VERSOES --- */}
          <header className="flex flex-col gap-3 border-b border-zinc-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wide text-amiste-red">Versoes da maquina</span>
                <h4 className="font-display text-base font-black text-amiste-black">
                  Pagina {activeIndex + 1} de {variants.length}
                </h4>
              </div>
              {!field.countField ? (
                <Button className="h-8 px-3 text-xs" icon="plus" variant="secondary" onClick={addVariant}>
                  Adicionar
                </Button>
              ) : null}
            </div>
            <nav className="flex flex-wrap gap-2">
              {variants.map((variant, index) => (
                <button
                  className={`h-8 min-w-8 rounded-xl border px-3 text-xs font-black transition ${
                    activeIndex === index
                      ? "border-amiste-red bg-amiste-red text-white"
                      : "border-zinc-200 bg-zinc-50 text-amiste-gray hover:border-amiste-red/40 hover:text-amiste-red"
                  }`}
                  key={`variant-page-${index + 1}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                >
                  {index + 1}
                </button>
              ))}
            </nav>
          </header>

          {/* --- SECAO: DADOS DA VERSAO ATIVA --- */}
          {variants.map((rawVariant, index) => {
            if (index !== activeIndex) {
              return null;
            }

            const variant = buildVariant(rawVariant);
            const category = variant.category;
            const previewUrl = variant.photoDataUrl || variant.imageUrl || "";

            return (
              <div className="space-y-4 p-4" key={`variant-form-${index + 1}`}>
                <div className="flex items-center justify-between gap-3">
                  <strong className="font-display text-sm font-black text-amiste-black">
                    {variant.name || `Versao ${index + 1}`}
                  </strong>
                  {!field.countField ? (
                    <Button className="h-8 px-3 text-xs" icon="trash" variant="secondary" onClick={() => removeVariant(index)}>
                      Remover
                    </Button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <VariantTextField label="Nome do modelo" placeholder="Ex: Lio 2C Plus" value={variant.name} onChange={(value) => updateVariant(index, "name", value)} />
                  <VariantTextField label="Marca" placeholder="Ex: Rheavendors" value={variant.brand} onChange={(value) => updateVariant(index, "brand", value)} />
                  <VariantSelectField label="Categoria" options={MACHINE_VARIANT_OPTIONS.category} value={variant.category} onChange={(value) => updateVariant(index, "category", value)} />
                  <VariantSelectField label="Status" options={MACHINE_VARIANT_OPTIONS.status} value={variant.status} onChange={(value) => updateVariant(index, "status", value)} />
                  <VariantSelectField label="Voltagem" options={MACHINE_VARIANT_OPTIONS.voltage} value={variant.voltage} onChange={(value) => updateVariant(index, "voltage", value)} />
                  <VariantTextField label="Amperagem" placeholder="Ex: 20" type="number" value={variant.amperage} onChange={(value) => updateVariant(index, "amperage", value)} />
                  <VariantTextField label="Potencia" placeholder="Ex: 1500W" value={variant.power} onChange={(value) => updateVariant(index, "power", value)} />
                  <VariantTextField label="Litragem" placeholder="Ex: 2L" value={variant.litreCapacity} onChange={(value) => updateVariant(index, "litreCapacity", value)} />
                  <VariantTextField label="Peso" placeholder="Ex: 18kg" value={variant.weight} onChange={(value) => updateVariant(index, "weight", value)} />
                  <VariantTextField label="Maximo de bebidas" placeholder="Ex: 26" type="number" value={variant.maxDrinkCount} onChange={(value) => updateVariant(index, "maxDrinkCount", value)} />
                  <VariantSelectField label="Rede hidrica" options={MACHINE_VARIANT_OPTIONS.yesNo} value={variant.hydraulic} onChange={(value) => updateVariant(index, "hydraulic", value)} />
                  <VariantSelectField label="Esgoto" options={MACHINE_VARIANT_OPTIONS.yesNo} value={variant.sewer} onChange={(value) => updateVariant(index, "sewer", value)} />
                  <VariantSelectField label="Vapor" options={MACHINE_VARIANT_OPTIONS.yesNo} value={variant.steam} onChange={(value) => updateVariant(index, "steam", value)} />
                  <VariantSelectField label="Sistema de pagamento" options={MACHINE_VARIANT_OPTIONS.yesNo} value={variant.paymentSystem} onChange={(value) => updateVariant(index, "paymentSystem", value)} />
                  {variant.paymentSystem === "Sim" ? (
                    <VariantTextField label="Qual sistema?" placeholder="Ex: Nayax" value={variant.paymentSystemName} onChange={(value) => updateVariant(index, "paymentSystemName", value)} />
                  ) : null}
                </div>

                {category === "Multibebidas" ? (
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-200 bg-white p-3 md:grid-cols-2">
                    <VariantCheckboxField label="Possui reservatorios?" value={variant.hasSupplyReservoirs} onChange={(value) => updateVariant(index, "hasSupplyReservoirs", value)} />
                    {variant.hasSupplyReservoirs ? (
                      <>
                        <VariantTextField label="Quantidade de reservatorios" placeholder="Ex: 5" type="number" value={variant.reservoirCount} onChange={(value) => updateVariant(index, "reservoirCount", value)} />
                        <VariantTextField label="Capacidade de cada reservatorio" placeholder="Ex: 1kg" value={variant.reservoirCapacity} onChange={(value) => updateVariant(index, "reservoirCapacity", value)} />
                      </>
                    ) : null}
                    <VariantCheckboxField label="Moinho integrado" value={variant.hasIntegratedGrinder} onChange={(value) => updateVariant(index, "hasIntegratedGrinder", value)} />
                    <VariantCheckboxField label="Utiliza grao" value={variant.usesBeans} onChange={(value) => updateVariant(index, "usesBeans", value)} />
                    <VariantCheckboxField label="100% soluvel" value={variant.solubleOnly} onChange={(value) => updateVariant(index, "solubleOnly", value)} />
                  </div>
                ) : null}

                {category === "Profissional" ? (
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-200 bg-white p-3 md:grid-cols-2">
                    <VariantSelectField label="Quantidade de grupos" options={MACHINE_VARIANT_OPTIONS.groupCount} value={variant.groupCount} onChange={(value) => updateVariant(index, "groupCount", value)} />
                    <VariantCheckboxField label="Possui porta-filtro" value={variant.hasPortafilter} onChange={(value) => updateVariant(index, "hasPortafilter", value)} />
                    {variant.hasPortafilter ? (
                      <>
                        <VariantTextField label="Porta-filtros simples" placeholder="Ex: 1" type="number" value={variant.singlePortafilterCount} onChange={(value) => updateVariant(index, "singlePortafilterCount", value)} />
                        <VariantTextField label="Porta-filtros duplos" placeholder="Ex: 2" type="number" value={variant.doublePortafilterCount} onChange={(value) => updateVariant(index, "doublePortafilterCount", value)} />
                      </>
                    ) : null}
                    <VariantCheckboxField label="Vaporizador extra" value={variant.extraSteamer} onChange={(value) => updateVariant(index, "extraSteamer", value)} />
                  </div>
                ) : null}

                {category === "Snacks" ? (
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-200 bg-white p-3 md:grid-cols-2">
                    <VariantTextField label="Quantidade de bandejas" placeholder="Ex: 6" type="number" value={variant.trayCount} onChange={(value) => updateVariant(index, "trayCount", value)} />
                    <VariantTextField label="Molas por bandeja" placeholder="Ex: 10" type="number" value={variant.springsPerTray} onChange={(value) => updateVariant(index, "springsPerTray", value)} />
                  </div>
                ) : null}

                {category === "Coado" ? (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <VariantSelectField label="Tipo de filtro suportado" options={MACHINE_VARIANT_OPTIONS.filterType} value={variant.filterType} onChange={(value) => updateVariant(index, "filterType", value)} />
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <VariantTextField label="Estoque atual" placeholder="0" type="number" value={variant.stock} onChange={(value) => updateVariant(index, "stock", value)} />
                  <VariantTextField label="Estoque minimo" placeholder="0" type="number" value={variant.minStock} onChange={(value) => updateVariant(index, "minStock", value)} />
                  <VariantTextField label="Valor aluguel" placeholder="R$ 0,00" type="number" value={variant.priceRent} onChange={(value) => updateVariant(index, "priceRent", value)} />
                  <VariantTextField label="Valor venda" placeholder="R$ 0,00" type="number" value={variant.priceSale} onChange={(value) => updateVariant(index, "priceSale", value)} />
                  <VariantTextField label="Custo aquisicao" placeholder="R$ 0,00" type="number" value={variant.acquisitionCost} onChange={(value) => updateVariant(index, "acquisitionCost", value)} />
                  <VariantTextField label="Link de video" placeholder="https://..." value={variant.videoUrl} onChange={(value) => updateVariant(index, "videoUrl", value)} />
                  <VariantTextField label="URL da foto" placeholder="https://..." value={variant.imageUrl} onChange={(value) => updateVariant(index, "imageUrl", value)} />
                  <label>
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Upload de foto</span>
                    <input
                      accept="image/*"
                      className="block h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-amiste-gray file:mr-4 file:rounded-xl file:border-0 file:bg-amiste-black file:px-3 file:py-1 file:text-xs file:font-black file:text-white disabled:opacity-50"
                      disabled={!canUpload}
                      type="file"
                      onChange={(event) => updateVariantImage(index, event.target.files?.[0])}
                    />
                  </label>
                  {previewUrl ? (
                    <div className="grid h-28 place-items-center overflow-hidden rounded-2xl border border-zinc-200 bg-white md:col-span-2">
                      <img alt={variant.name || `Versao ${index + 1}`} className="h-full w-full object-contain" src={previewUrl} />
                    </div>
                  ) : null}
                  <VariantTextareaField label="Texto padrao de proposta" placeholder="Texto comercial especifico desta versao." value={variant.defaultProposalText} onChange={(value) => updateVariant(index, "defaultProposalText", value)} />
                  <VariantTextareaField label="Descricao tecnica" placeholder="Descricao tecnica especifica desta versao." value={variant.description} onChange={(value) => updateVariant(index, "description", value)} />
                </div>
              </div>
            );
          })}
        </section>
      ) : null}
      {uploadError ? (
        <div className="rounded-2xl border border-amiste-red/20 bg-amiste-red/10 px-3 py-2 text-xs font-bold text-amiste-red">
          {uploadError}
        </div>
      ) : null}
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
    <aside className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
      {/* --- SECAO: INTELIGENCIA DO FORMULARIO --- */}
      <div>
        <span className="text-xs font-black uppercase text-amiste-gray/50">Automacoes e validacoes</span>
        <h3 className="mt-1 font-display text-lg font-black text-amiste-black">Resumo inteligente</h3>
      </div>

      {smartSummary ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-sm font-semibold leading-6 text-amiste-gray">
          {smartSummary(previewRecord)}
        </div>
      ) : null}

      {insights.slice(0, 8).map((insight) => (
        <div
          className={`rounded-2xl border p-3 ${
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

function FieldControl({ canUpload, field, formData, snapshot, onChange }) {
  const options = buildOptions(field, snapshot);
  const isTextarea = field.type === "textarea";
  const isCheckbox = field.type === "checkbox";
  const isPassword = field.type === "password";
  const isSelect = field.type === "select" || field.source || field.optionGroup || field.type === "inventoryItem";
  const disabled = Boolean(field.disabled || field.readOnly);

  if (field.type === "imageUpload") {
    return <ImageUploadControl disabled={disabled || !canUpload} field={field} formData={formData} onChange={onChange} />;
  }

  if (field.type === "fileUpload") {
    return <FileUploadControl disabled={disabled || !canUpload} field={field} formData={formData} onChange={onChange} />;
  }

  if (field.type === "variantList") {
    return <VariantListControl canUpload={!disabled && canUpload} field={field} formData={formData} onChange={onChange} />;
  }

  if (field.type === "dynamicTextList") {
    return <DynamicTextListControl field={field} formData={formData} onChange={onChange} />;
  }

  if (isCheckbox) {
    return (
      <button
        className="flex h-9 w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-[13px] font-bold text-amiste-gray transition hover:border-amiste-red disabled:cursor-not-allowed disabled:opacity-60"
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
        placeholder={resolveFieldPlaceholder(field)}
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
        <option value="">{`Selecione ${String(field.label || "uma opcao").toLowerCase()}`}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectInput>
    );
  }

  if (isPassword) {
    return (
      <>
        <PasswordInput
          disabled={disabled}
          maxLength={field.maxLength}
          placeholder={resolveFieldPlaceholder(field)}
          required={field.required}
          value={formData[field.name] || ""}
          onChange={(event) => onChange(field.name, event.target.value)}
        />
        {field.showStrength ? <PasswordStrengthMeter password={formData[field.name] || ""} /> : null}
      </>
    );
  }

  return (
    <TextInput
      disabled={disabled}
      max={field.max}
      maxLength={field.maxLength}
      min={field.min}
      placeholder={resolveFieldPlaceholder(field)}
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
  canUpload = true,
  primaryStepLabel = "Dados",
  secondaryStepContent,
  secondaryStepDescription,
  secondaryStepLabel = "Permissoes",
  size,
  onClose,
  onSubmit,
}) {
  const hasSecondaryStep = Boolean(secondaryStepContent);
  const [activeStep, setActiveStep] = useState("primary");
  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previousOpenRef = useRef(false);
  const previousRecordKeyRef = useRef("");

  const modalTitle = editingRecord ? `Editar ${title}` : title;
  const recordKey = editingRecord?.id || (editingRecord ? "__editing__" : "__new__");
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

  useEffect(() => {
    const isOpening = open && !previousOpenRef.current;
    const recordChanged = open && previousRecordKeyRef.current !== recordKey;

    if (isOpening || recordChanged) {
      setActiveStep("primary");
      setFormData(buildInitialSmartFormData(fields, editingRecord, snapshot));
      setErrorMessage("");
    }

    previousOpenRef.current = open;
    previousRecordKeyRef.current = open ? recordKey : "";
  }, [editingRecord, fields, open, recordKey, snapshot]);

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

  function validateCurrentPayload() {
    const payload = normalizeSmartPayload(fields, formData, snapshot);
    const validationMessage = validate?.(payload, snapshot, editingRecord);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return null;
    }

    return payload;
  }

  function handleAdvanceStep() {
    const payload = validateCurrentPayload();

    if (!payload) {
      return;
    }

    setErrorMessage("");
    setActiveStep("secondary");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (hasSecondaryStep && activeStep === "primary") {
      handleAdvanceStep();
      return;
    }

    const payload = validateCurrentPayload();

    if (!payload) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(payload);
    } catch (error) {
      setErrorMessage(error.message || "Nao foi possivel salvar o registro.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const stepHeader = hasSecondaryStep ? (
    <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: "primary", label: primaryStepLabel },
          { id: "secondary", label: secondaryStepLabel },
        ].map((step, index) => (
          <button
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${
              activeStep === step.id
                ? "bg-amiste-red text-white"
                : "bg-zinc-50 text-amiste-gray hover:bg-zinc-100"
            }`}
            key={step.id}
            type="button"
            onClick={() => {
              if (step.id === "primary") {
                setActiveStep("primary");
                return;
              }

              handleAdvanceStep();
            }}
          >
            <span className="grid size-5 place-items-center rounded-full bg-white/20 text-[10px]">{index + 1}</span>
            {step.label}
          </button>
        ))}
      </div>
      {activeStep === "secondary" && secondaryStepDescription ? (
        <p className="mt-3 text-xs font-semibold leading-5 text-amiste-gray/65">{secondaryStepDescription}</p>
      ) : null}
    </div>
  ) : null;

  const formContent = (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {stepHeader}

      {activeStep === "primary" ? (
        <>
          {/* --- SECAO: CAMPOS AGRUPADOS DO FORMULARIO --- */}
          {fieldGroups.map((group) => (
            <FormSection eyebrow={group.eyebrow} key={group.id} title={group.title}>
              {group.description ? (
                <p className="-mt-2 text-sm font-semibold leading-6 text-amiste-gray/65">{group.description}</p>
              ) : null}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {group.fields.map((field) => (
                  <label className={field.full ? "md:col-span-2" : ""} key={field.name}>
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">
                      {field.label}
                      {field.required ? <span className="text-amiste-red"> *</span> : null}
                    </span>
                    <FieldControl
                      canUpload={canUpload}
                      field={field}
                      formData={formData}
                      snapshot={snapshot}
                      onChange={updateField}
                    />
                  </label>
                ))}
              </div>
            </FormSection>
          ))}
        </>
      ) : (
        secondaryStepContent?.({
          formData,
          previewRecord,
          updateField,
        })
      )}

      {errorMessage ? (
        <div className="rounded-2xl border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
          {errorMessage}
        </div>
      ) : null}

      {/* --- SECAO: ACOES DO FORMULARIO --- */}
      <footer className="flex min-h-14 justify-end gap-3 border-t border-zinc-100 pt-4">
        {activeStep === "secondary" ? (
          <Button disabled={isSubmitting} icon="chevronLeft" variant="secondary" onClick={() => setActiveStep("primary")}>
            Voltar
          </Button>
        ) : (
          <Button disabled={isSubmitting} variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        )}
        <Button icon={hasSecondaryStep && activeStep === "primary" ? "chevronRight" : "plus"} loading={isSubmitting} type="submit">
          {hasSecondaryStep && activeStep === "primary" ? "Avancar" : "Salvar"}
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
