import { useEffect, useMemo, useState } from "react";
import Button from "../atoms/Button.jsx";
import SelectInput from "../atoms/SelectInput.jsx";
import TextArea from "../atoms/TextArea.jsx";
import TextInput from "../atoms/TextInput.jsx";
import FormField from "../molecules/FormField.jsx";
import FormSection from "../molecules/FormSection.jsx";
import Modal from "../molecules/Modal.jsx";
import DocumentLivePreviewPanel from "./DocumentLivePreviewPanel.jsx";
import {
  SERVICE_SHEET_STATUSES,
  SERVICE_SHEET_TYPES,
  applyChecklistToServiceSheet,
  buildChecklistOptionsForClient,
  buildOptions,
  buildServiceSheetInitialForm,
  buildServiceSheetPayload,
  findRecord,
} from "../../services/documentEditorService.js";
import { downloadDocumentPdf } from "../../services/documentService.js";

const FORM_ID = "service-sheet-editor-form";

function ToggleCheck({ checked, label, onChange }) {
  return (
    <button
      className={`rounded-md border px-3 py-2 text-sm font-black ${checked ? "border-amiste-green bg-amiste-green text-white" : "border-zinc-200 bg-white text-amiste-gray"}`}
      type="button"
      onClick={() => onChange(!checked)}
    >
      {label}
    </button>
  );
}

export default function ServiceSheetEditorModal({ canDownload = true, editingRecord, open, snapshot, onClose, onSubmit }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState(buildServiceSheetInitialForm(editingRecord || {}));
  const checklistOptions = useMemo(
    () => buildChecklistOptionsForClient(snapshot, form.clientId),
    [form.clientId, snapshot]
  );
  const selectedMachine = findRecord(snapshot, "machines", form.machineId);
  const selectedClient = findRecord(snapshot, "clients", form.clientId);
  const previewRecord = useMemo(
    () => ({
      ...buildServiceSheetPayload(form),
      id: editingRecord?.id,
    }),
    [editingRecord?.id, form]
  );
  const modalTitle = form.sheetType === "Retirada" ? "Nova Ficha de Retirada" : "Nova Ficha de Instalacao";

  useEffect(() => {
    if (open) {
      setForm(buildServiceSheetInitialForm(editingRecord || {}));
      setErrorMessage("");
    }
  }, [editingRecord, open]);

  function updateField(fieldName, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
  }

  function handleClientChange(clientId) {
    const client = findRecord(snapshot, "clients", clientId);

    setForm((currentForm) => ({
      ...currentForm,
      chargeType: currentForm.chargeType || client?.contractType || "",
      clientId,
      machineId: currentForm.machineId || client?.machineId || "",
      rentalValue: currentForm.rentalValue || client?.contractValue || "",
    }));
  }

  function handleMachineChange(machineId) {
    const machine = findRecord(snapshot, "machines", machineId);

    setForm((currentForm) => ({
      ...currentForm,
      machineId,
      serviceMode: currentForm.serviceMode || (machine?.hydraulic === "Sim" ? "Hidrica" : "Galao"),
    }));
  }

  function handleChecklistChange(checklistId) {
    const checklist = findRecord(snapshot, "checklists", checklistId);

    setForm((currentForm) => ({
      ...applyChecklistToServiceSheet(currentForm, checklist, snapshot),
      checklistId,
    }));
  }

  async function submitWithStatus(status) {
    setErrorMessage("");

    if (!form.clientId || !form.machineId) {
      setErrorMessage("Selecione cliente e maquina para salvar a ficha.");
      return;
    }

    try {
      await onSubmit(buildServiceSheetPayload({ ...form, status }));
    } catch (error) {
      setErrorMessage(error.message || "Nao foi possivel salvar a ficha.");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await submitWithStatus(form.status);
  }

  function handleDownloadPdf() {
    if (!canDownload) {
      return;
    }

    downloadDocumentPdf("serviceSheet", previewRecord, snapshot);
  }

  const headerActions = (
    <>
      <Button icon="fileClock" variant="secondary" onClick={() => submitWithStatus("rascunho")}>
        Salvar Rascunho
      </Button>
      <Button form={FORM_ID} icon="fileText" type="submit">
        Salvar Ficha
      </Button>
      <Button disabled={!canDownload} icon="printer" variant="secondary" onClick={handleDownloadPdf}>
        Baixar/Imprimir PDF
      </Button>
    </>
  );

  return (
    <Modal
      bodyClassName="overflow-hidden p-0"
      description={`${selectedClient?.name || "Cliente nao selecionado"} | ${selectedMachine?.name || "Maquina nao selecionada"}`}
      headerActions={headerActions}
      open={open}
      size="fullscreen"
      title={modalTitle}
      onClose={onClose}
    >
      <div className="grid h-[calc(94vh-89px)] grid-cols-1 overflow-hidden xl:grid-cols-[minmax(420px,0.9fr)_minmax(520px,1.1fr)]">
        <form id={FORM_ID} className="min-h-0 space-y-4 overflow-y-auto bg-zinc-50 p-5" onSubmit={handleSubmit}>
          {/* --- SECAO: VINCULOS PRINCIPAIS --- */}
          <FormSection eyebrow="1" title="Vinculos principais">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormField label="Tipo de ficha">
                <SelectInput value={form.sheetType} onChange={(event) => updateField("sheetType", event.target.value)}>
                  {SERVICE_SHEET_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              <FormField label="Status">
                <SelectInput value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  {SERVICE_SHEET_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              <FormField required label="Selecionar cliente">
                <SelectInput required value={form.clientId} onChange={(event) => handleClientChange(event.target.value)}>
                  <option value="">Selecione</option>
                  {buildOptions(snapshot.clients).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              <FormField required label="Selecionar maquina no estoque">
                <SelectInput required value={form.machineId} onChange={(event) => handleMachineChange(event.target.value)}>
                  <option value="">Selecione</option>
                  {buildOptions(snapshot.machines).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              <FormField className="lg:col-span-2" label="Vincular checklist finalizado">
                <SelectInput value={form.checklistId} onChange={(event) => handleChecklistChange(event.target.value)}>
                  <option value="">Sem checklist vinculado</option>
                  {checklistOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
            </div>
          </FormSection>

          {/* --- SECAO: AJUSTES MANUAIS --- */}
          <FormSection eyebrow="2" title="Ajustes manuais">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormField label={form.sheetType === "Retirada" ? "Data da retirada" : "Data"}>
                <TextInput type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} />
              </FormField>

              <FormField label="Horario">
                <TextInput value={form.time} onChange={(event) => updateField("time", event.target.value)} />
              </FormField>

              <FormField label="Tecnico">
                <TextInput value={form.technician} onChange={(event) => updateField("technician", event.target.value)} />
              </FormField>

              <FormField label="Valor locacao">
                <TextInput
                  min="0"
                  type="number"
                  value={form.rentalValue}
                  onChange={(event) => updateField("rentalValue", event.target.value)}
                />
              </FormField>

              <FormField label="Tipo de cobranca">
                <TextInput value={form.chargeType} onChange={(event) => updateField("chargeType", event.target.value)} />
              </FormField>

              <FormField label="Meio de instalacao">
                <SelectInput value={form.serviceMode} onChange={(event) => updateField("serviceMode", event.target.value)}>
                  <option value="">Selecione</option>
                  <option value="Hidrica">Hidrica</option>
                  <option value="Galao">Galao</option>
                </SelectInput>
              </FormField>

              <FormField label="Leitura da maquina">
                <TextInput
                  value={form.machineReading}
                  onChange={(event) => updateField("machineReading", event.target.value)}
                />
              </FormField>

              <FormField label="Programacao de bebidas">
                <TextInput
                  placeholder="Ex: Expresso 40ml, Cafe 120ml"
                  value={form.drinkProgramming}
                  onChange={(event) => updateField("drinkProgramming", event.target.value)}
                />
              </FormField>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-black uppercase text-amiste-gray/60">Checklist tecnico interno</span>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <ToggleCheck checked={form.testMachine} label="Testada" onChange={(value) => updateField("testMachine", value)} />
                <ToggleCheck checked={form.testMill} label="Moinho" onChange={(value) => updateField("testMill", value)} />
                <ToggleCheck checked={form.testPump} label="Bomba" onChange={(value) => updateField("testPump", value)} />
                <ToggleCheck checked={form.testTransformer} label="Transformador" onChange={(value) => updateField("testTransformer", value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormField label="Pecas defeituosas">
                <TextArea value={form.defectiveParts} onChange={(event) => updateField("defectiveParts", event.target.value)} />
              </FormField>

              <FormField label="Observacoes e leitura">
                <TextArea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
              </FormField>

              <FormField label="Perifericos">
                <TextArea value={form.peripherals} onChange={(event) => updateField("peripherals", event.target.value)} />
              </FormField>

              <FormField label="Danos">
                <TextArea value={form.damages} onChange={(event) => updateField("damages", event.target.value)} />
              </FormField>
            </div>
          </FormSection>

          {/* --- SECAO: PRODUTOS E DOCUMENTOS --- */}
          <FormSection eyebrow="3" title="Produtos, documentos e aceite">
            <div className="grid grid-cols-2 gap-2">
              <ToggleCheck checked={form.contractDocument} label="Contrato" onChange={(value) => updateField("contractDocument", value)} />
              <ToggleCheck checked={form.nfDocument} label="NF" onChange={(value) => updateField("nfDocument", value)} />
            </div>

            <FormField label="Produtos / insumos deixados ou retirados">
              <TextArea
                className="min-h-36"
                value={form.products}
                onChange={(event) => updateField("products", event.target.value)}
              />
            </FormField>
          </FormSection>

          {errorMessage ? (
            <div className="rounded-md border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
              {errorMessage}
            </div>
          ) : null}
        </form>

        <DocumentLivePreviewPanel documentType="serviceSheet" record={previewRecord} snapshot={snapshot} />
      </div>
    </Modal>
  );
}
