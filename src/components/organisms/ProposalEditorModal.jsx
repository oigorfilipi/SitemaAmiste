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
  COMMERCIAL_MODALITIES,
  PROPOSAL_STATUSES,
  buildMachineConfigOptions,
  buildOptions,
  buildProposalHistoryOptions,
  buildProposalInitialForm,
  buildProposalPayload,
  buildProposalProductRows,
  calculateProposalValues,
  findRecord,
  formatCurrency,
} from "../../services/documentEditorService.js";
import { downloadDocumentPdf } from "../../services/documentService.js";

const FORM_ID = "proposal-editor-form";

export default function ProposalEditorModal({ editingRecord, open, snapshot, onClose, onSubmit }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState(buildProposalInitialForm(editingRecord || {}));
  const [targetId, setTargetId] = useState("");
  const selectedMachine = findRecord(snapshot, "machines", form.machineId);
  const machineConfigOptions = useMemo(
    () => buildMachineConfigOptions(snapshot, form.machineId),
    [form.machineId, snapshot]
  );
  const historyOptions = useMemo(
    () => buildProposalHistoryOptions(snapshot, form.clientId, editingRecord?.id),
    [editingRecord?.id, form.clientId, snapshot]
  );
  const productRows = useMemo(() => buildProposalProductRows(snapshot, form), [form, snapshot]);
  const values = calculateProposalValues(form);
  const previewRecord = useMemo(
    () => ({
      ...buildProposalPayload(form, snapshot),
      id: targetId || editingRecord?.id,
    }),
    [editingRecord?.id, form, snapshot, targetId]
  );
  const saveLabel = targetId ? "Salvar Alteracao" : "Salvar Nova Proposta";

  useEffect(() => {
    if (open) {
      setForm(buildProposalInitialForm(editingRecord || {}));
      setTargetId(editingRecord?.id || "");
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
    setTargetId(editingRecord?.id || "");
    setForm((currentForm) => ({
      ...currentForm,
      clientId,
      historyProposalId: "",
    }));
  }

  function handleMachineChange(machineId) {
    const machine = findRecord(snapshot, "machines", machineId);
    const configs = buildMachineConfigOptions(snapshot, machineId);

    setForm((currentForm) => ({
      ...currentForm,
      machineConfigId: configs.length === 1 ? configs[0].value : "",
      machineId,
      proposalText: currentForm.proposalText || machine?.defaultProposalText || machine?.description || "",
      totalValue: currentForm.totalValue || machine?.priceSale || "",
      videoUrl: currentForm.videoUrl || machine?.videoUrl || "",
    }));
  }

  function handleHistoryChange(proposalId) {
    const proposal = findRecord(snapshot, "proposals", proposalId);

    if (!proposal) {
      setTargetId(editingRecord?.id || "");
      updateField("historyProposalId", "");
      return;
    }

    setTargetId(proposal.id);
    setForm({
      ...buildProposalInitialForm(proposal),
      historyProposalId: proposal.id,
    });
  }

  function updateProductOverride(rowId, value) {
    setForm((currentForm) => ({
      ...currentForm,
      productOverrides: {
        ...currentForm.productOverrides,
        [rowId]: value,
      },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    if (!form.clientId || !form.machineId) {
      setErrorMessage("Selecione cliente e maquina para salvar a proposta.");
      return;
    }

    await onSubmit(buildProposalPayload(form, snapshot), { targetId });
  }

  function handleDownloadPdf() {
    downloadDocumentPdf("proposal", previewRecord, snapshot);
  }

  const headerActions = (
    <>
      <Button form={FORM_ID} icon="fileText" type="submit">
        {saveLabel}
      </Button>
      <Button icon="download" variant="secondary" onClick={handleDownloadPdf}>
        Baixar PDF
      </Button>
    </>
  );

  return (
    <Modal
      bodyClassName="overflow-hidden p-0"
      description={selectedMachine?.name || "Selecione uma maquina para carregar modelo, texto e valores."}
      headerActions={headerActions}
      open={open}
      size="fullscreen"
      title="Editor de Proposta"
      onClose={onClose}
    >
      <div className="grid h-[calc(94vh-89px)] grid-cols-1 overflow-hidden xl:grid-cols-[minmax(420px,0.9fr)_minmax(520px,1.1fr)]">
        <form id={FORM_ID} className="min-h-0 space-y-4 overflow-y-auto bg-zinc-50 p-5" onSubmit={handleSubmit}>
          {/* --- SECAO: STATUS E HISTORICO --- */}
          <FormSection eyebrow="1" title="Status e historico">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormField label="Status da negociacao">
                <SelectInput value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  {PROPOSAL_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              <FormField label="Controle de versao">
                <SelectInput
                  value={form.historyProposalId}
                  onChange={(event) => handleHistoryChange(event.target.value)}
                >
                  <option value="">Proposta atual / nova</option>
                  {historyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
            </div>
          </FormSection>

          {/* --- SECAO: CONFIGURACAO BASICA --- */}
          <FormSection eyebrow="2" title="Configuracao basica">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormField required label="Maquina">
                <SelectInput required value={form.machineId} onChange={(event) => handleMachineChange(event.target.value)}>
                  <option value="">Selecione</option>
                  {buildOptions(snapshot.machines).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              {machineConfigOptions.length > 1 ? (
                <FormField label="Modelo exato">
                  <SelectInput
                    value={form.machineConfigId}
                    onChange={(event) => updateField("machineConfigId", event.target.value)}
                  >
                    <option value="">Selecione</option>
                    {machineConfigOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
              ) : null}

              <FormField required label="Cliente">
                <SelectInput required value={form.clientId} onChange={(event) => handleClientChange(event.target.value)}>
                  <option value="">Selecione</option>
                  {buildOptions(snapshot.clients).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              <FormField label="Link de video">
                <TextInput
                  placeholder="https://..."
                  value={form.videoUrl}
                  onChange={(event) => updateField("videoUrl", event.target.value)}
                />
              </FormField>
            </div>
          </FormSection>

          {/* --- SECAO: VALORES E CONDICOES --- */}
          <FormSection eyebrow="3" title="Valores e condicoes">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormField label="Modalidade">
                <SelectInput value={form.modality} onChange={(event) => updateField("modality", event.target.value)}>
                  {COMMERCIAL_MODALITIES.map((modality) => (
                    <option key={modality.value} value={modality.value}>
                      {modality.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              {form.modality === "Venda" ? (
                <>
                  <FormField label="Valor total">
                    <TextInput
                      min="0"
                      type="number"
                      value={form.totalValue}
                      onChange={(event) => updateField("totalValue", event.target.value)}
                    />
                  </FormField>
                  <FormField label="Condicoes de pagamento">
                    <TextInput
                      placeholder="Ex: entrada + boleto"
                      value={form.paymentTerms}
                      onChange={(event) => updateField("paymentTerms", event.target.value)}
                    />
                  </FormField>
                  <FormField label="Parcelas">
                    <TextInput
                      max="48"
                      min="1"
                      type="number"
                      value={form.installments}
                      onChange={(event) => updateField("installments", event.target.value)}
                    />
                  </FormField>
                </>
              ) : (
                <>
                  <FormField label="Valor mensal">
                    <TextInput
                      disabled={form.modality === "Comodato" && !form.minimumConsumptionEnabled}
                      min="0"
                      type="number"
                      value={form.chargeValue}
                      onChange={(event) => updateField("chargeValue", event.target.value)}
                    />
                  </FormField>

                  {form.modality === "Comodato" ? (
                    <>
                      <button
                        className="flex h-10 items-center justify-between rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-bold text-amiste-gray"
                        type="button"
                        onClick={() => updateField("minimumConsumptionEnabled", !form.minimumConsumptionEnabled)}
                      >
                        <span>Valor fixo minimo de consumo?</span>
                        <strong className={form.minimumConsumptionEnabled ? "text-amiste-green" : "text-amiste-red"}>
                          {form.minimumConsumptionEnabled ? "Sim" : "Nao"}
                        </strong>
                      </button>
                      {form.minimumConsumptionEnabled ? (
                        <FormField label="Valor minimo">
                          <TextInput
                            min="0"
                            type="number"
                            value={form.minimumConsumptionValue}
                            onChange={(event) => updateField("minimumConsumptionValue", event.target.value)}
                          />
                        </FormField>
                      ) : null}
                    </>
                  ) : null}
                </>
              )}
            </div>

            {form.modality === "Comodato" ? (
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-amiste-gray/60">Modulo de insumos</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`rounded-md border px-3 py-2 text-sm font-black ${form.supplyMode === "predetermined" ? "border-amiste-red bg-amiste-red text-white" : "border-zinc-200 bg-white text-amiste-gray"}`}
                    type="button"
                    onClick={() => updateField("supplyMode", "predetermined")}
                  >
                    Produtos predeterminados
                  </button>
                  <button
                    className={`rounded-md border px-3 py-2 text-sm font-black ${form.supplyMode === "free" ? "border-amiste-red bg-amiste-red text-white" : "border-zinc-200 bg-white text-amiste-gray"}`}
                    type="button"
                    onClick={() => updateField("supplyMode", "free")}
                  >
                    Livre escolha
                  </button>
                </div>
                <div className="grid gap-2">
                  {productRows.map((row) => (
                    <div className="grid grid-cols-[1fr_120px] items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2" key={row.id}>
                      <div className="min-w-0">
                        <strong className="block truncate text-sm font-black text-amiste-black">{row.name}</strong>
                        <span className="text-xs font-semibold text-amiste-gray/60">Base {formatCurrency(row.baseValue)}</span>
                      </div>
                      <TextInput
                        min="0"
                        placeholder="Valor"
                        type="number"
                        value={form.productOverrides?.[row.id] || ""}
                        onChange={(event) => updateProductOverride(row.id, event.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <FormField label="Texto da proposta">
              <TextArea
                className="min-h-36"
                value={form.proposalText}
                onChange={(event) => updateField("proposalText", event.target.value)}
              />
            </FormField>

            <FormField label="Observacoes gerais">
              <TextArea
                placeholder="Regras contratuais, prazos, condicoes comerciais."
                value={form.generalNotes}
                onChange={(event) => updateField("generalNotes", event.target.value)}
              />
            </FormField>
          </FormSection>

          {/* --- SECAO: VALOR FINAL --- */}
          <FormSection eyebrow="4" title="Valor final">
            <div className="rounded-md bg-amiste-black p-5 text-white">
              <span className="text-xs font-black uppercase text-white/55">Valor total da negociacao</span>
              <strong className="mt-2 block font-display text-4xl font-black text-amiste-green">
                {formatCurrency(values.totalNegotiation)}
              </strong>
              <p className="mt-2 text-sm font-bold text-white/70">
                {form.modality === "Venda"
                  ? `${values.installments}x de ${formatCurrency(values.installmentValue)}`
                  : `Mensalidade ${formatCurrency(values.monthlyValue)}`}
              </p>
            </div>
          </FormSection>

          {errorMessage ? (
            <div className="rounded-md border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
              {errorMessage}
            </div>
          ) : null}
        </form>

        <DocumentLivePreviewPanel documentType="proposal" record={previewRecord} snapshot={snapshot} />
      </div>
    </Modal>
  );
}
