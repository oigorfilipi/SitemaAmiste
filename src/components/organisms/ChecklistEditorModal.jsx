import { useEffect, useMemo, useState } from "react";
import Button from "../atoms/Button.jsx";
import SelectInput from "../atoms/SelectInput.jsx";
import TextArea from "../atoms/TextArea.jsx";
import TextInput from "../atoms/TextInput.jsx";
import FormField from "../molecules/FormField.jsx";
import FormSection from "../molecules/FormSection.jsx";
import Modal from "../molecules/Modal.jsx";
import {
  CHECKLIST_CLIENT_SERVICE_TYPES,
  CHECKLIST_SERVICE_SCOPES,
  CHECKLIST_STATUS_OPTIONS,
  buildChecklistInitialForm,
  buildChecklistOptionLists,
  buildChecklistPayload,
  buildMachineUnits,
  calculateChecklistValues,
  calculateEventDays,
  evaluateEditorCompatibility,
  formatChecklistCurrency,
  groupSuppliesByCategory,
  resolveMachineTechnical,
  validateChecklistEditorForm,
} from "../../services/checklistEditorService.js";

const FORM_ID = "checklist-editor-form";

function ToggleButton({ active, children, onClick }) {
  return (
    <button
      className={`h-10 rounded-md border px-3 text-sm font-black transition ${active ? "border-amiste-red bg-amiste-red text-white" : "border-zinc-200 bg-white text-amiste-gray hover:border-amiste-red hover:text-amiste-red"}`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function YesNoSelect({ value, onChange }) {
  return (
    <SelectInput value={value || "Nao"} onChange={(event) => onChange(event.target.value)}>
      <option value="Sim">Sim</option>
      <option value="Nao">Nao</option>
    </SelectInput>
  );
}

function TechnicalReadout({ label, value }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
      <span className="text-xs font-black uppercase text-amiste-gray/50">{label}</span>
      <strong className="mt-1 block text-sm font-black text-amiste-black">{value || "-"}</strong>
    </div>
  );
}

function SelectionQuantityRow({ checked, detail, name, quantity, unitLabel = "Qtd", onQuantityChange, onToggle }) {
  return (
    <div className="grid grid-cols-[1fr_92px] items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2">
      <button
        className="flex min-w-0 items-center gap-3 text-left"
        type="button"
        onClick={() => onToggle(!checked)}
      >
        <span className={`grid size-5 shrink-0 place-items-center rounded border text-xs font-black ${checked ? "border-amiste-red bg-amiste-red text-white" : "border-zinc-300 bg-white text-transparent"}`}>
          X
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-sm font-black text-amiste-black">{name}</strong>
          {detail ? <span className="text-xs font-semibold text-amiste-gray/60">{detail}</span> : null}
        </span>
      </button>
      <TextInput
        disabled={!checked}
        min="0"
        placeholder={unitLabel}
        type="number"
        value={quantity || ""}
        onChange={(event) => onQuantityChange(event.target.value)}
      />
    </div>
  );
}

export default function ChecklistEditorModal({ editingRecord, open, snapshot, onClose, onSubmit }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState(buildChecklistInitialForm(editingRecord || {}));
  const selectedClient = useMemo(
    () => snapshot.clients?.find((client) => client.id === form.clientId) || null,
    [form.clientId, snapshot.clients]
  );
  const selectedMachine = useMemo(
    () => snapshot.machines?.find((machine) => machine.id === form.machineId) || null,
    [form.machineId, snapshot.machines]
  );
  const technical = useMemo(() => resolveMachineTechnical(selectedMachine || {}), [selectedMachine]);
  const optionLists = useMemo(() => buildChecklistOptionLists(snapshot), [snapshot]);
  const supplyGroups = useMemo(() => groupSuppliesByCategory(snapshot), [snapshot]);
  const compatibility = useMemo(() => evaluateEditorCompatibility(form, snapshot), [form, snapshot]);
  const values = useMemo(() => calculateChecklistValues(form, snapshot), [form, snapshot]);

  useEffect(() => {
    if (open) {
      setForm(buildChecklistInitialForm(editingRecord || {}));
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
    const client = snapshot.clients?.find((record) => record.id === clientId);
    const serviceType = CHECKLIST_CLIENT_SERVICE_TYPES.some((type) => type.value === client?.contractType)
      ? client.contractType
      : "Aluguel";

    setForm((currentForm) => ({
      ...currentForm,
      clientId,
      contractNumber: currentForm.contractNumber || client?.id || "",
      machineId: currentForm.machineId || client?.machineId || "",
      serviceType,
    }));
  }

  function handleMachineChange(machineId) {
    const machine = snapshot.machines?.find((record) => record.id === machineId);
    const machineTechnical = resolveMachineTechnical(machine || {});

    setForm((currentForm) => ({
      ...currentForm,
      localSewerOk: machineTechnical.sewer,
      localWaterOk: machineTechnical.hydraulic,
      machineId,
      machineUnits: buildMachineUnits(currentForm.machineQuantity, currentForm.machineUnits),
      outletAmperage: machineTechnical.amperage,
      paymentSystemName: currentForm.paymentSystemName || machineTechnical.paymentSystemName,
      waterGallon: machineTechnical.hydraulic === "Nao" ? currentForm.waterGallon : "Nao",
    }));
  }

  function handleQuantityChange(quantity) {
    setForm((currentForm) => ({
      ...currentForm,
      machineQuantity: quantity,
      machineUnits: buildMachineUnits(quantity, currentForm.machineUnits),
    }));
  }

  function updateMachineUnit(index, fieldName, value) {
    setForm((currentForm) => {
      const machineUnits = buildMachineUnits(currentForm.machineQuantity, currentForm.machineUnits);

      machineUnits[index] = {
        ...machineUnits[index],
        [fieldName]: value,
      };

      return {
        ...currentForm,
        machineUnits,
      };
    });
  }

  function updateSelection(collectionName, itemId, updates) {
    setForm((currentForm) => ({
      ...currentForm,
      [collectionName]: {
        ...currentForm[collectionName],
        [itemId]: {
          ...(currentForm[collectionName]?.[itemId] || {}),
          ...updates,
        },
      },
    }));
  }

  function handleDatetimeChange(fieldName, value) {
    setForm((currentForm) => {
      const nextForm = {
        ...currentForm,
        [fieldName]: value,
      };

      return {
        ...nextForm,
        eventDays: calculateEventDays(nextForm.installationDateTime, nextForm.removalDateTime),
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    const validationMessage = validateChecklistEditorForm(form, snapshot);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    try {
      await onSubmit(buildChecklistPayload(form, snapshot, editingRecord || {}));
    } catch (error) {
      setErrorMessage(error.message || "Nao foi possivel salvar o checklist.");
    }
  }

  const headerActions = (
    <Button form={FORM_ID} icon="checkSquare" type="submit">
      {editingRecord ? "Salvar Checklist" : "Criar Checklist"}
    </Button>
  );

  return (
    <Modal
      bodyClassName="overflow-hidden p-0"
      description="Formulario integrado com clientes, maquinas, opcoes, insumos, acessorios e precos."
      headerActions={headerActions}
      open={open}
      size="fullscreen"
      title={editingRecord ? `Editar Checklist ${editingRecord.code}` : "Novo Checklist Inteligente"}
      onClose={onClose}
    >
      <form id={FORM_ID} className="h-[calc(94vh-89px)] overflow-y-auto bg-zinc-50 p-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {/* --- SECAO: DADOS GERAIS --- */}
            <FormSection eyebrow="1" title="Dados gerais">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <FormField label="Tipo de servico">
                  <SelectInput value={form.serviceScope} onChange={(event) => updateField("serviceScope", event.target.value)}>
                    {CHECKLIST_SERVICE_SCOPES.map((scope) => (
                      <option key={scope.value} value={scope.value}>
                        {scope.label}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>

                <FormField label="Status">
                  <SelectInput value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                    {CHECKLIST_STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>

                {form.serviceScope === "Cliente" ? (
                  <FormField label="Tipo comercial">
                    <SelectInput value={form.serviceType} onChange={(event) => updateField("serviceType", event.target.value)}>
                      {CHECKLIST_CLIENT_SERVICE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                ) : null}
              </div>

              {form.serviceScope === "Cliente" ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <FormField required label="Nome do cliente">
                    <SelectInput required value={form.clientId} onChange={(event) => handleClientChange(event.target.value)}>
                      <option value="">Selecione</option>
                      {(snapshot.clients || []).map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                  <FormField label="Data da instalacao">
                    <TextInput type="date" value={form.installationDate} onChange={(event) => updateField("installationDate", event.target.value)} />
                  </FormField>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <FormField required label="Nome do evento">
                      <TextInput value={form.eventName} onChange={(event) => updateField("eventName", event.target.value)} />
                    </FormField>
                    <FormField label="Evento de cliente?">
                      <YesNoSelect value={form.eventLinkedToClient ? "Sim" : "Nao"} onChange={(value) => updateField("eventLinkedToClient", value === "Sim")} />
                    </FormField>
                    {form.eventLinkedToClient ? (
                      <FormField required label="Selecionar cliente">
                        <SelectInput required value={form.clientId} onChange={(event) => handleClientChange(event.target.value)}>
                          <option value="">Selecione</option>
                          {(snapshot.clients || []).map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name}
                            </option>
                          ))}
                        </SelectInput>
                      </FormField>
                    ) : (
                      <FormField required label="Empresa ou cliente">
                        <TextInput value={form.eventCompanyName} onChange={(event) => updateField("eventCompanyName", event.target.value)} />
                      </FormField>
                    )}
                    <FormField label="Data e hora da instalacao">
                      <TextInput type="datetime-local" value={form.installationDateTime} onChange={(event) => handleDatetimeChange("installationDateTime", event.target.value)} />
                    </FormField>
                    <FormField label="Data e hora da retirada">
                      <TextInput type="datetime-local" value={form.removalDateTime} onChange={(event) => handleDatetimeChange("removalDateTime", event.target.value)} />
                    </FormField>
                    <FormField label="Quantidade de dias">
                      <TextInput readOnly value={form.eventDays || 0} />
                    </FormField>
                  </div>
                </div>
              )}
            </FormSection>

            {/* --- SECAO: EQUIPAMENTO --- */}
            <FormSection eyebrow="2" title="Equipamento">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FormField required label="Modelo da maquina">
                  <SelectInput required value={form.machineId} onChange={(event) => handleMachineChange(event.target.value)}>
                    <option value="">Selecione</option>
                    {(snapshot.machines || []).map((machine) => (
                      <option key={machine.id} value={machine.id}>
                        {machine.name}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField label="Quantidade de maquinas">
                  <TextInput min="1" type="number" value={form.machineQuantity} onChange={(event) => handleQuantityChange(event.target.value)} />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <TechnicalReadout label="Voltagem" value={technical.voltage} />
                <TechnicalReadout label="Amperagem" value={`${technical.amperage}A`} />
                <TechnicalReadout label="Rede hidrica" value={technical.hydraulic} />
                <TechnicalReadout label="Esgoto" value={technical.sewer} />
                <TechnicalReadout label="Vapor" value={technical.steam} />
                <TechnicalReadout label="Sistema pagamento" value={technical.paymentSystem} />
                {technical.paymentSystem === "Sim" ? (
                  <FormField className="lg:col-span-2" label="Qual sistema?">
                    <TextInput value={form.paymentSystemName} onChange={(event) => updateField("paymentSystemName", event.target.value)} />
                  </FormField>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {buildMachineUnits(form.machineQuantity, form.machineUnits).map((unit, index) => (
                  <div className="grid grid-cols-2 gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3" key={`machine-unit-${index + 1}`}>
                    <strong className="col-span-2 text-xs font-black uppercase text-amiste-gray/60">
                      Maquina {index + 1}
                    </strong>
                    <TextInput
                      placeholder="Numero de serie"
                      value={unit.serialNumber}
                      onChange={(event) => updateMachineUnit(index, "serialNumber", event.target.value)}
                    />
                    <TextInput
                      placeholder="Patrimonio"
                      value={unit.assetTag}
                      onChange={(event) => updateMachineUnit(index, "assetTag", event.target.value)}
                    />
                  </div>
                ))}
              </div>
            </FormSection>

            {/* --- SECAO: PREPARACAO E TESTES --- */}
            <FormSection eyebrow="3" title="Preparacao e testes">
              <div className="grid grid-cols-2 gap-2 lg:w-96">
                <ToggleButton active={form.configured} onClick={() => updateField("configured", !form.configured)}>
                  Configurado
                </ToggleButton>
                <ToggleButton active={form.tested} onClick={() => updateField("tested", !form.tested)}>
                  Testado
                </ToggleButton>
              </div>

              <div>
                <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Ferramentas necessarias</span>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {optionLists.tools.map((tool) => (
                    <SelectionQuantityRow
                      checked={Boolean(form.tools?.[tool.id]?.selected)}
                      detail={`Qtd configurada: ${tool.requiredQuantity}`}
                      key={tool.id}
                      name={tool.name}
                      quantity={form.tools?.[tool.id]?.quantity}
                      onQuantityChange={(quantity) => updateSelection("tools", tool.id, { quantity })}
                      onToggle={(selected) => updateSelection("tools", tool.id, { quantity: tool.requiredQuantity, selected })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Coisas necessarias</span>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {technical.hydraulic === "Nao" ? (
                    <div className="grid grid-cols-[1fr_120px] items-center gap-2 rounded-md border border-amiste-red/30 bg-amiste-red/5 p-2">
                      <FormField label="Galao de agua">
                        <YesNoSelect value={form.waterGallon} onChange={(value) => updateField("waterGallon", value)} />
                      </FormField>
                      <FormField label="Quantidade">
                        <TextInput disabled={form.waterGallon !== "Sim"} min="0" type="number" value={form.waterGallonQuantity} onChange={(event) => updateField("waterGallonQuantity", event.target.value)} />
                      </FormField>
                    </div>
                  ) : null}
                  {optionLists.necessaryThings.map((thing) => (
                    <SelectionQuantityRow
                      checked={Boolean(form.things?.[thing.id]?.selected)}
                      key={thing.id}
                      name={thing.name}
                      quantity={form.things?.[thing.id]?.quantity}
                      onQuantityChange={(quantity) => updateSelection("things", thing.id, { quantity })}
                      onToggle={(selected) => updateSelection("things", thing.id, { quantity: thing.requiredQuantity, selected })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Bebidas habilitadas</span>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {optionLists.drinks.map((drink) => (
                    <SelectionQuantityRow
                      checked={Boolean(form.drinks?.[drink.id]?.selected)}
                      key={drink.id}
                      name={drink.name}
                      quantity={form.drinks?.[drink.id]?.ml}
                      unitLabel="ML"
                      onQuantityChange={(ml) => updateSelection("drinks", drink.id, { ml })}
                      onToggle={(selected) => updateSelection("drinks", drink.id, { ml: 40, selected })}
                    />
                  ))}
                </div>
              </div>
            </FormSection>

            {/* --- SECAO: INSUMOS E ACESSORIOS --- */}
            <FormSection eyebrow="4" title="Insumos e acessorios">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div>
                  <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Insumos por categoria</span>
                  <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                    {supplyGroups.map((group) => (
                      <section className="rounded-md border border-zinc-200 bg-white p-3" key={group.category}>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="size-3 rounded-full bg-[#A82020]" />
                          <strong className="text-sm font-black text-amiste-black">{group.category}</strong>
                        </div>
                        <div className="space-y-2">
                          {group.items.map((supply) => (
                            <SelectionQuantityRow
                              checked={Boolean(form.supplies?.[supply.id]?.selected)}
                              detail={formatChecklistCurrency(supply.price)}
                              key={supply.id}
                              name={supply.name}
                              quantity={form.supplies?.[supply.id]?.quantity}
                              onQuantityChange={(quantity) => updateSelection("supplies", supply.id, { quantity })}
                              onToggle={(selected) => updateSelection("supplies", supply.id, { quantity: 1, selected })}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Acessorios</span>
                  <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                    {(snapshot.accessories || []).map((accessory) => (
                      <SelectionQuantityRow
                        checked={Boolean(form.accessories?.[accessory.id]?.selected)}
                        detail={formatChecklistCurrency(accessory.price)}
                        key={accessory.id}
                        name={accessory.name}
                        quantity={form.accessories?.[accessory.id]?.quantity}
                        onQuantityChange={(quantity) => updateSelection("accessories", accessory.id, { quantity })}
                        onToggle={(selected) => updateSelection("accessories", accessory.id, { quantity: 1, selected })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </FormSection>

            {/* --- SECAO: LOCAL DE INSTALACAO --- */}
            <FormSection eyebrow="5" title="Local de instalacao">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <FormField label="Tomada">
                  <SelectInput value={form.outletAmperage} onChange={(event) => updateField("outletAmperage", event.target.value)}>
                    <option value="10">10A</option>
                    <option value="20">20A</option>
                  </SelectInput>
                </FormField>
                <FormField label="Agua">
                  <YesNoSelect value={form.localWaterOk} onChange={(value) => updateField("localWaterOk", value)} />
                </FormField>
                <FormField label="Esgoto">
                  <YesNoSelect value={form.localSewerOk} onChange={(value) => updateField("localSewerOk", value)} />
                </FormField>
                <FormField label="Treinamento">
                  <YesNoSelect value={form.training} onChange={(value) => updateField("training", value)} />
                </FormField>
                {form.training === "Sim" ? (
                  <FormField label="Quantidade de pessoas">
                    <TextInput min="0" type="number" value={form.trainingPeople} onChange={(event) => updateField("trainingPeople", event.target.value)} />
                  </FormField>
                ) : null}
              </div>

              <div className={`rounded-md border px-4 py-3 text-sm font-bold ${compatibility.compatible ? "border-amiste-green/25 bg-amiste-green/10 text-amiste-green" : "border-amiste-red/25 bg-amiste-red/10 text-amiste-red"}`}>
                {compatibility.compatible ? "Compatibilidade OK" : `Falsa Equivalencia: ${compatibility.issues.join(" ")}`}
              </div>
            </FormSection>

            {/* --- SECAO: FINALIZACAO --- */}
            <FormSection eyebrow="6" title="Finalizacao">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FormField label="Numero do contrato">
                  <TextInput value={form.contractNumber} onChange={(event) => updateField("contractNumber", event.target.value)} />
                </FormField>
                <FormField label="Cliente integrado">
                  <TextInput readOnly value={selectedClient?.name || "-"} />
                </FormField>
              </div>
              <FormField label="Observacoes">
                <TextArea className="min-h-36" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
              </FormField>
            </FormSection>
          </div>

          {/* --- SECAO: VALORES TOTAIS --- */}
          <aside className="sticky top-0 h-fit rounded-md bg-amiste-black p-5 text-white shadow-xl">
            <span className="text-xs font-black uppercase text-white/55">7. Valores totais</span>
            <h3 className="mt-1 font-display text-2xl font-black">Resumo financeiro</h3>

            <div className="mt-5 space-y-3">
              <TechnicalReadout label="Valor da maquina" value={formatChecklistCurrency(values.machineValue)} />
              <TechnicalReadout label="Valor dos insumos" value={formatChecklistCurrency(values.suppliesValue)} />
              <FormField label="Valor do servico">
                <TextInput min="0" type="number" value={form.serviceValue} onChange={(event) => updateField("serviceValue", event.target.value)} />
              </FormField>
              <TechnicalReadout label="Valor dos acessorios" value={formatChecklistCurrency(values.accessoriesValue)} />
              <FormField label="Valor dos extras">
                <TextInput min="0" type="number" value={form.extraValueManual} onChange={(event) => updateField("extraValueManual", event.target.value)} />
              </FormField>
            </div>

            <div className="mt-5 rounded-md bg-white/10 p-4">
              <span className="text-xs font-black uppercase text-white/55">Valor total</span>
              <strong className="mt-2 block font-display text-4xl font-black text-amiste-green">
                {formatChecklistCurrency(values.totalValue)}
              </strong>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-md border border-amiste-red/30 bg-amiste-red/15 px-4 py-3 text-sm font-bold text-red-100">
                {errorMessage}
              </div>
            ) : null}
          </aside>
        </div>
      </form>
    </Modal>
  );
}
