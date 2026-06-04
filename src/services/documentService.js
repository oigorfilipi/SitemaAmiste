function asNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeFilename(value) {
  return String(value || "documento")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(asNumber(value));
}

function findById(snapshot, collection, id) {
  return snapshot[collection]?.find((record) => record.id === id) || {};
}

function buildDocumentCode(prefix, id) {
  return id ? `${prefix}-${String(id).slice(-5).toUpperCase()}` : `${prefix}-PREVIA`;
}

function downloadBlob(filename, content, type) {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function buildProposalDocument(record, snapshot) {
  const client = findById(snapshot, "clients", record.clientId);
  const machine = findById(snapshot, "machines", record.machineId);
  const machineConfig = findById(snapshot, "machineConfigs", record.machineConfigId);
  const installments = Number(record.installments || 1);
  const installmentValue = Number(record.installmentValue || 0);
  const modality = record.modality || "Venda";
  const paymentLine = modality === "Venda"
    ? `${installments}x de ${formatCurrency(installmentValue || asNumber(record.totalValue) / Math.max(installments, 1))}`
    : `${modality} mensal: ${formatCurrency(record.chargeValue || record.totalValue)}`;

  return {
    badge: "Proposta Comercial",
    client,
    clientName: client.name || "-",
    contact: client.contact || "-",
    documentCode: buildDocumentCode("PROP", record.id),
    documentTitle: machine.name || "Maquina",
    footerLabel: "Validade comercial de 7 dias",
    installmentValue: formatCurrency(installmentValue),
    machine,
    machineConfig,
    machineImageUrl: machine.imageDataUrl || machine.imageUrl || "",
    machineModelName: machineConfig.name || machine.name || "Modelo selecionado",
    modality,
    paymentLine,
    products: record.products || "",
    primaryValue: formatCurrency(record.totalValue),
    proposalText: record.proposalText || machine.defaultProposalText || machine.description || record.notes,
    record,
    rows: [
      { label: "Cliente", value: client.name },
      { label: "Contato", value: client.contact },
      { label: "Modalidade", value: record.modality },
      { label: "Data", value: record.createdDate },
      { label: "Maquina", value: machine.name },
      { label: "Modelo", value: machineConfig.name },
      { label: "Status", value: record.status },
    ],
    secondaryValue: paymentLine,
    status: record.status,
    summary: record.proposalText || machine.description || record.notes,
    tone: "red",
    videoUrl: record.videoUrl || machine.videoUrl || "",
  };
}

export function buildServiceSheetDocument(record, snapshot) {
  const client = findById(snapshot, "clients", record.clientId);
  const machine = findById(snapshot, "machines", record.machineId);
  const checklist = findById(snapshot, "checklists", record.checklistId);
  const sheetType = record.sheetType || checklist.serviceType || "Instalacao";

  return {
    badge: "Ficha Operacional",
    checklist,
    client,
    clientName: client.name || "-",
    documentCode: checklist.code || buildDocumentCode("FICHA", record.id),
    documentTitle: `${sheetType} - ${machine.name || "Maquina"}`,
    footerLabel: "Assinaturas obrigatorias no atendimento",
    machine,
    primaryValue: formatCurrency(record.rentalValue),
    record,
    rows: [
      { label: "Cliente", value: client.name },
      { label: "Contato", value: client.contact },
      { label: "Checklist", value: checklist.code },
      { label: "Tecnico", value: record.technician },
      { label: "Maquina", value: machine.name },
      { label: "Patrimonio / Serie", value: machine.id },
      { label: "Data", value: `${record.date || ""} ${record.time || ""}`.trim() },
      { label: "Valor Locacao", value: formatCurrency(record.rentalValue) },
      { label: "Meio", value: record.serviceMode },
      { label: "Cobranca", value: record.chargeType },
      { label: "Leitura", value: record.machineReading },
      { label: "Status", value: record.status },
    ],
    serviceFlags: {
      comodato: record.chargeType === "Comodato" || client.contractType === "Comodato",
      instalacao: sheetType === "Instalacao",
      retirada: sheetType === "Retirada",
    },
    sheetType,
    status: record.status,
    summary: record.notes,
    tone: "black",
  };
}

export function buildDocumentModel(documentType, record, snapshot) {
  return documentType === "proposal"
    ? buildProposalDocument(record, snapshot)
    : buildServiceSheetDocument(record, snapshot);
}

function renderHtmlRows(rows) {
  return rows
    .map((row) => `
      <div class="info-row">
        <span>${escapeHtml(row.label)}</span>
        <strong>${escapeHtml(row.value || "-")}</strong>
      </div>`)
    .join("");
}

function renderCheck(checked, label) {
  return `<span class="check"><b>${checked ? "X" : ""}</b>${escapeHtml(label)}</span>`;
}

function renderProposalPaper(model) {
  return `
    <section class="paper proposal-paper">
      <header class="brand-header">
        <div>
          <span>${escapeHtml(model.badge)} | ${escapeHtml(model.documentCode)}</span>
          <h1>Amiste Cafe</h1>
        </div>
        <strong>${escapeHtml(model.machineModelName)}</strong>
      </header>

      <main class="proposal-content">
        <section class="hero-grid">
          <div class="machine-photo">
            ${
              model.machineImageUrl
                ? `<img src="${escapeHtml(model.machineImageUrl)}" alt="${escapeHtml(model.documentTitle)}" />`
                : `<div><strong>${escapeHtml(model.documentTitle)}</strong><span>${escapeHtml(model.machine.brand || "Maquina")}</span></div>`
            }
          </div>
          <div class="proposal-copy">
            <span>Proposta para</span>
            <h2>${escapeHtml(model.clientName)}</h2>
            <p>${escapeHtml(model.proposalText || model.summary)}</p>
            <small>${escapeHtml(model.videoUrl ? `Video: ${model.videoUrl}` : "Video: nao informado")}</small>
          </div>
        </section>

        <section class="grid three">${renderHtmlRows(model.rows.slice(0, 6))}</section>

        <section class="block">
          <span>Observacoes gerais</span>
          <p>${escapeHtml(model.record.generalNotes || model.record.notes || "-")}</p>
        </section>
      </main>

      <footer class="brand-footer">
        <div>
          <span>Valor total da negociacao</span>
          <strong>${escapeHtml(model.primaryValue)}</strong>
        </div>
        <p>${escapeHtml(model.secondaryValue)}</p>
      </footer>
    </section>`;
}

function renderServiceSheetPaper(model) {
  const record = model.record || {};
  const machine = model.machine || {};
  const client = model.client || {};

  return `
    <section class="paper service-paper">
      <header class="sheet-header">
        <div>
          <span>${escapeHtml(model.badge)} | ${escapeHtml(model.documentCode)}</span>
          <h1>${escapeHtml(model.sheetType)}</h1>
        </div>
        <strong>Amiste Cafe</strong>
      </header>

      <main class="sheet-content">
        <section class="box">
          <h2>Checklist Tecnico</h2>
          <div class="checks">
            ${renderCheck(record.testMachine, "Testada")}
            ${renderCheck(record.testMill, "Moinho")}
            ${renderCheck(record.testPump, "Bomba")}
            ${renderCheck(record.testTransformer, "Transformador")}
          </div>
          <p><b>Pecas defeituosas:</b> ${escapeHtml(record.defectiveParts || "-")}</p>
        </section>

        <section class="box">
          <h2>Tipo de Servico</h2>
          <div class="checks">
            ${renderCheck(model.serviceFlags.instalacao, "Instalacao")}
            ${renderCheck(model.serviceFlags.retirada, "Retirada")}
            ${renderCheck(model.serviceFlags.comodato, "Comodato")}
          </div>
          <div class="grid three">${renderHtmlRows([
            { label: "Tipo", value: model.sheetType },
            { label: "Cobranca", value: record.chargeType },
            { label: "Valor Locacao", value: model.primaryValue },
          ])}</div>
        </section>

        <section class="box">
          <h2>Dados do Cliente</h2>
          <div class="grid three">${renderHtmlRows([
            { label: "Empresa", value: client.name },
            { label: "Contato", value: client.contact },
            { label: "Telefone", value: client.phone },
            { label: "Endereco", value: client.address },
            { label: "OS", value: model.checklist.code },
            { label: "Status", value: record.status },
          ])}</div>
        </section>

        <section class="box">
          <h2>Dados da Maquina</h2>
          <div class="grid three">${renderHtmlRows([
            { label: "Maquina", value: machine.name },
            { label: "Voltagem", value: machine.voltage },
            { label: "Patrimonio", value: machine.assetTag || machine.id },
            { label: "Serie", value: machine.serialNumber || machine.id },
            { label: "Data", value: record.date },
            { label: "Horario", value: record.time },
          ])}</div>
        </section>

        <section class="box">
          <h2>Condicoes</h2>
          <div class="grid two">${renderHtmlRows([
            { label: "Meio de Instalacao", value: record.serviceMode },
            { label: "Leitura", value: record.machineReading },
          ])}</div>
          <p>${escapeHtml(record.notes || "-")}</p>
        </section>

        <section class="box">
          <h2>Programacao, Documentos e Danos</h2>
          <div class="grid two">${renderHtmlRows([
            { label: "Programacao", value: record.drinkProgramming },
            { label: "Perifericos", value: record.peripherals },
            { label: "Danos", value: record.damages },
          ])}</div>
          <div class="checks">
            ${renderCheck(record.contractDocument, "Contrato")}
            ${renderCheck(record.nfDocument, "NF")}
          </div>
        </section>

        <section class="box">
          <h2>Produtos / Insumos</h2>
          <p>${escapeHtml(record.products || "-")}</p>
        </section>
      </main>

      <footer class="signature-grid">
        <span>Assinatura Cliente</span>
        <span>Assinatura Tecnico</span>
      </footer>
    </section>`;
}

export function buildDocumentHtml(documentType, record, snapshot) {
  const model = buildDocumentModel(documentType, record, snapshot);
  const paper = documentType === "proposal" ? renderProposalPaper(model) : renderServiceSheetPaper(model);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(model.documentTitle)}</title>
  <style>
    @page { margin: 0; size: A4; }
    * { box-sizing: border-box; }
    body { background: #e4e4e7; color: #111; font-family: Arial, sans-serif; margin: 0; padding: 24px; }
    .paper { background: #fff; box-shadow: 0 12px 36px rgba(15, 23, 42, .18); height: 297mm; margin: 0 auto; overflow: hidden; position: relative; width: 210mm; }
    .brand-header, .brand-footer { align-items: center; background: #A82020; color: #FAFAFA; display: flex; justify-content: space-between; padding: 22px 28px; }
    .brand-header span, .sheet-header span { display: block; font-size: 11px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; opacity: .78; }
    .brand-header h1, .sheet-header h1 { font-size: 30px; margin: 6px 0 0; }
    .proposal-content, .sheet-content { padding: 26px 28px; }
    .hero-grid { display: grid; gap: 22px; grid-template-columns: 255px 1fr; }
    .machine-photo { align-items: center; background: #f4f4f5; border: 1px solid #d4d4d8; display: flex; height: 230px; justify-content: center; overflow: hidden; text-align: center; }
    .machine-photo img { height: 100%; object-fit: cover; width: 100%; }
    .machine-photo strong { display: block; font-size: 24px; }
    .machine-photo span { color: #71717a; display: block; font-size: 12px; font-weight: 900; margin-top: 8px; text-transform: uppercase; }
    .proposal-copy span, .block span { color: #A82020; display: block; font-size: 11px; font-weight: 900; text-transform: uppercase; }
    .proposal-copy h2 { font-size: 32px; margin: 6px 0 12px; }
    .proposal-copy p, .block p, .box p { color: #3f3f46; font-size: 13px; line-height: 1.55; margin: 0; }
    .proposal-copy small { color: #52525b; display: block; font-weight: 700; margin-top: 12px; }
    .grid { display: grid; gap: 12px; margin-top: 18px; }
    .grid.three { grid-template-columns: repeat(3, 1fr); }
    .grid.two { grid-template-columns: repeat(2, 1fr); }
    .info-row { border-bottom: 1px solid #e4e4e7; padding: 7px 0; }
    .info-row span { color: #71717a; display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; }
    .info-row strong { display: block; font-size: 13px; margin-top: 4px; }
    .block, .box { border: 1px solid #d4d4d8; margin-top: 16px; padding: 12px; }
    .brand-footer { bottom: 0; left: 0; position: absolute; right: 0; }
    .brand-footer span { display: block; font-size: 11px; font-weight: 900; text-transform: uppercase; }
    .brand-footer strong { display: block; font-size: 34px; margin-top: 4px; }
    .brand-footer p { font-size: 18px; font-weight: 900; margin: 0; }
    .sheet-header { align-items: center; background: #111; color: #FAFAFA; display: flex; justify-content: space-between; padding: 18px 26px; }
    .sheet-header strong { color: #22c55e; }
    .box { margin-top: 10px; padding: 9px 11px; }
    .box h2 { font-size: 12px; margin: 0 0 8px; text-transform: uppercase; }
    .checks { display: flex; flex-wrap: wrap; gap: 8px 14px; margin: 8px 0; }
    .check { align-items: center; display: inline-flex; font-size: 12px; font-weight: 800; gap: 6px; }
    .check b { border: 1px solid #111; display: inline-grid; height: 15px; place-items: center; width: 15px; }
    .signature-grid { bottom: 22px; display: grid; gap: 52px; grid-template-columns: 1fr 1fr; left: 28px; position: absolute; right: 28px; text-align: center; }
    .signature-grid span { border-top: 1px solid #71717a; color: #71717a; font-size: 11px; font-weight: 900; padding-top: 10px; text-transform: uppercase; }
    @media print {
      body { background: #fff; padding: 0; }
      .paper { box-shadow: none; margin: 0; }
    }
  </style>
</head>
<body>
  ${paper}
</body>
</html>`;
}

export function downloadDocumentHtml(documentType, record, snapshot) {
  const model = buildDocumentModel(documentType, record, snapshot);
  const prefix = documentType === "proposal" ? "proposta" : "ficha";
  const filename = `${prefix}-${sanitizeFilename(model.clientName)}-${new Date().toISOString().slice(0, 10)}.html`;

  downloadBlob(filename, buildDocumentHtml(documentType, record, snapshot), "text/html;charset=utf-8");
}

export function downloadDocumentPdf(documentType, record, snapshot) {
  if (typeof window === "undefined") {
    return;
  }

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    return;
  }

  printWindow.document.write(buildDocumentHtml(documentType, record, snapshot));
  printWindow.document.close();
  printWindow.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 500);
}

export function buildDocumentMetrics(snapshot) {
  const proposals = snapshot.proposals || [];
  const serviceSheets = snapshot.serviceSheets || [];
  const proposalValue = proposals.reduce((total, proposal) => total + asNumber(proposal.totalValue), 0);
  const signedSheets = serviceSheets.filter((sheet) => sheet.status === "assinado").length;

  return [
    {
      id: "proposals",
      icon: "briefcase",
      label: "Propostas",
      value: proposals.length,
      detail: `${proposals.filter((proposal) => proposal.status === "aguardando").length} aguardando`,
      tone: "blue",
    },
    {
      id: "value",
      icon: "money",
      label: "Valor proposto",
      value: formatCurrency(proposalValue),
      detail: "pipeline comercial",
      tone: "green",
    },
    {
      id: "sheets",
      icon: "fileText",
      label: "Fichas",
      value: serviceSheets.length,
      detail: `${signedSheets} assinadas`,
      tone: signedSheets === serviceSheets.length ? "green" : "yellow",
    },
    {
      id: "coverage",
      icon: "checkSquare",
      label: "Cobertura",
      value: serviceSheets.length ? `${Math.round((signedSheets / serviceSheets.length) * 100)}%` : "0%",
      detail: "fichas assinadas",
      tone: signedSheets ? "green" : "red",
    },
  ];
}
