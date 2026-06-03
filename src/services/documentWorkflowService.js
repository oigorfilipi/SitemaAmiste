import { createEntity, updateEntity } from "./erpService.js";

const CLOSED_PROPOSAL_STATUSES = ["concluido", "cancelado", "abandonado"];

function asNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function addDays(dateLike, days) {
  const date = dateLike ? new Date(dateLike) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function documentCode(prefix, id) {
  return `${prefix}-${String(id || "").slice(-5).toUpperCase()}`;
}

function resolveClient(snapshot, clientId) {
  return snapshot.clients?.find((client) => client.id === clientId) || {};
}

function resolveMachine(snapshot, machineId) {
  return snapshot.machines?.find((machine) => machine.id === machineId) || {};
}

function hasProposalReceivable(snapshot, proposal) {
  const origin = `Proposta ${documentCode("PROP", proposal.id)}`;
  return (snapshot.receivables || []).some((receivable) => receivable.origin === origin);
}

function hasProposalSheet(snapshot, proposal) {
  return (snapshot.serviceSheets || []).some((sheet) => sheet.proposalId === proposal.id);
}

function hasSheetReceivable(snapshot, sheet) {
  const origin = `Ficha ${documentCode("FICHA", sheet.id)}`;
  return (snapshot.receivables || []).some((receivable) => receivable.origin === origin);
}

function hasSheetFinancialCoverage(snapshot, sheet) {
  if (hasSheetReceivable(snapshot, sheet)) {
    return true;
  }

  const proposal = (snapshot.proposals || []).find((record) => record.id === sheet.proposalId);
  return proposal ? hasProposalReceivable(snapshot, proposal) : false;
}

function buildProposalSheetPayload(proposal, snapshot) {
  const machine = resolveMachine(snapshot, proposal.machineId);

  return {
    chargeType: proposal.modality,
    clientId: proposal.clientId,
    date: proposal.createdDate || new Date().toISOString().slice(0, 10),
    machineId: proposal.machineId,
    machineReading: "",
    notes: `Ficha gerada automaticamente a partir da proposta ${documentCode("PROP", proposal.id)}.`,
    products: "",
    proposalId: proposal.id,
    rentalValue: asNumber(proposal.totalValue),
    serviceMode: machine.hydraulic === "Sim" ? "Hidrica" : "Galao",
    sheetType: "Instalacao",
    status: "rascunho",
    technicalTests: "",
    technician: "",
    time: "",
  };
}

function buildProposalReceivablePayload(proposal, snapshot) {
  const client = resolveClient(snapshot, proposal.clientId);

  return {
    clientId: proposal.clientId,
    dueDate: addDays(proposal.createdDate, 7),
    notes: `Cobranca gerada pela conclusao da proposta de ${client.name || "cliente"}.`,
    origin: `Proposta ${documentCode("PROP", proposal.id)}`,
    status: "pendente",
    value: asNumber(proposal.totalValue),
  };
}

function buildSheetReceivablePayload(sheet, snapshot) {
  const client = resolveClient(snapshot, sheet.clientId);

  return {
    clientId: sheet.clientId,
    dueDate: sheet.date || new Date().toISOString().slice(0, 10),
    notes: `Cobranca gerada pela assinatura da ficha de ${client.name || "cliente"}.`,
    origin: `Ficha ${documentCode("FICHA", sheet.id)}`,
    status: "pendente",
    value: asNumber(sheet.rentalValue),
  };
}

export function buildDocumentWorkflow(snapshot) {
  const proposals = snapshot.proposals || [];
  const serviceSheets = snapshot.serviceSheets || [];
  const actionableProposals = proposals
    .filter((proposal) => !CLOSED_PROPOSAL_STATUSES.includes(proposal.status))
    .map((proposal) => ({
      ...proposal,
      clientName: resolveClient(snapshot, proposal.clientId).name || "-",
      documentCode: documentCode("PROP", proposal.id),
      hasReceivable: hasProposalReceivable(snapshot, proposal),
      hasSheet: hasProposalSheet(snapshot, proposal),
      machineName: resolveMachine(snapshot, proposal.machineId).name || "-",
    }));
  const unsignedSheets = serviceSheets
    .filter((sheet) => sheet.status === "rascunho")
    .map((sheet) => ({
      ...sheet,
      clientName: resolveClient(snapshot, sheet.clientId).name || "-",
      documentCode: documentCode("FICHA", sheet.id),
      hasReceivable: hasSheetFinancialCoverage(snapshot, sheet),
      machineName: resolveMachine(snapshot, sheet.machineId).name || "-",
    }));

  return {
    actionableProposals,
    pendingCount: actionableProposals.length + unsignedSheets.length,
    unsignedSheets,
  };
}

export async function completeProposalWorkflow(proposal, snapshot) {
  await updateEntity(
    "proposals",
    proposal.id,
    { status: "concluido" },
    {
      action: "Concluiu",
      details: "Proposta aceita e encaminhada para operacao.",
      module: "Portfolios",
      title: documentCode("PROP", proposal.id),
    }
  );

  /* --- SECAO: INTEGRACAO COM FINANCEIRO E OPERACAO ---
   * A proposta aceita vira cobranca e ficha operacional no MVP local.
   * As duplicidades sao bloqueadas pelo vinculo direto da proposta.
   */
  if (asNumber(proposal.totalValue) > 0 && !hasProposalReceivable(snapshot, proposal)) {
    await createEntity("receivables", buildProposalReceivablePayload(proposal, snapshot));
  }

  if (!hasProposalSheet(snapshot, proposal)) {
    await createEntity("serviceSheets", buildProposalSheetPayload(proposal, snapshot));
  }
}

export async function signServiceSheetWorkflow(sheet, snapshot) {
  await updateEntity(
    "serviceSheets",
    sheet.id,
    { status: "assinado" },
    {
      action: "Assinou",
      details: "Ficha operacional assinada pelo fluxo documental.",
      module: "Fichas Operacionais",
      title: documentCode("FICHA", sheet.id),
    }
  );

  if (!sheet.proposalId && asNumber(sheet.rentalValue) > 0 && !hasSheetReceivable(snapshot, sheet)) {
    await createEntity("receivables", buildSheetReceivablePayload(sheet, snapshot));
  }
}
