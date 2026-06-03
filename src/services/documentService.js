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

  return {
    badge: "Proposta Comercial",
    client,
    clientName: client.name || "-",
    contact: client.contact || "-",
    documentCode: `PROP-${String(record.id || "").slice(-5).toUpperCase()}`,
    documentTitle: machine.name || "Maquina",
    footerLabel: "Validade comercial de 7 dias",
    machine,
    primaryValue: formatCurrency(record.totalValue),
    record,
    rows: [
      { label: "Cliente", value: client.name },
      { label: "Contato", value: client.contact },
      { label: "Modalidade", value: record.modality },
      { label: "Data", value: record.createdDate },
      { label: "Maquina", value: machine.name },
      { label: "Status", value: record.status },
    ],
    status: record.status,
    summary: machine.description || record.notes,
    tone: "red",
  };
}

export function buildServiceSheetDocument(record, snapshot) {
  const client = findById(snapshot, "clients", record.clientId);
  const machine = findById(snapshot, "machines", record.machineId);
  const checklist = findById(snapshot, "checklists", record.checklistId);

  return {
    badge: "Ficha Operacional",
    checklist,
    client,
    clientName: client.name || "-",
    documentCode: checklist.code || `FICHA-${String(record.id || "").slice(-5).toUpperCase()}`,
    documentTitle: `${record.sheetType || "Ficha"} - ${machine.name || "Maquina"}`,
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

export function buildDocumentHtml(documentType, record, snapshot) {
  const model = buildDocumentModel(documentType, record, snapshot);
  const accent = model.tone === "red" ? "#b91c1c" : "#111111";
  const bodyBlocks = documentType === "proposal"
    ? `<p>${escapeHtml(model.record.notes)}</p>`
    : `
      <section class="block">
        <span>Testes Tecnicos</span>
        <p>${escapeHtml(model.record.technicalTests)}</p>
      </section>
      <section class="block">
        <span>Produtos / Insumos</span>
        <p>${escapeHtml(model.record.products)}</p>
      </section>
      <section class="signature-grid">
        <span>Assinatura Cliente</span>
        <span>Assinatura Tecnico</span>
      </section>`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(model.documentTitle)}</title>
  <style>
    body { background: #f4f4f5; color: #111; font-family: Arial, sans-serif; margin: 0; padding: 32px; }
    main { background: #fff; border: 1px solid #e4e4e7; border-radius: 12px; margin: 0 auto; max-width: 920px; overflow: hidden; }
    header { background: ${accent}; color: #fff; padding: 32px; }
    header span { display: block; font-size: 12px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; opacity: .75; }
    header h1 { font-size: 34px; margin: 12px 0 4px; }
    header p { margin: 0; opacity: .8; }
    .content { padding: 32px; }
    .summary { color: #52525b; font-size: 15px; line-height: 1.7; margin: 0 0 24px; }
    .grid { display: grid; gap: 14px; grid-template-columns: repeat(3, 1fr); }
    .info-row { border-bottom: 1px solid #e4e4e7; padding: 8px 0; }
    .info-row span, .block span { color: #71717a; display: block; font-size: 11px; font-weight: 900; text-transform: uppercase; }
    .info-row strong { display: block; font-size: 14px; margin-top: 6px; }
    .value { background: #f4f4f5; border-radius: 10px; margin-top: 24px; padding: 20px; }
    .value strong { display: block; font-size: 30px; margin-top: 8px; }
    .block { background: #f4f4f5; border-radius: 10px; margin-top: 18px; padding: 18px; }
    .block p { font-size: 14px; line-height: 1.7; margin: 8px 0 0; }
    .signature-grid { display: grid; gap: 48px; grid-template-columns: 1fr 1fr; margin-top: 56px; text-align: center; }
    .signature-grid span { border-top: 1px solid #71717a; color: #71717a; font-size: 11px; font-weight: 900; padding-top: 12px; text-transform: uppercase; }
  </style>
</head>
<body>
  <main>
    <header>
      <span>${escapeHtml(model.badge)} | ${escapeHtml(model.documentCode)}</span>
      <h1>${escapeHtml(model.documentTitle)}</h1>
      <p>Amiste Cafe - ${escapeHtml(model.footerLabel)}</p>
    </header>
    <section class="content">
      <p class="summary">${escapeHtml(model.summary)}</p>
      <section class="grid">${renderHtmlRows(model.rows)}</section>
      <section class="value">
        <span>Valor principal</span>
        <strong>${escapeHtml(model.primaryValue)}</strong>
      </section>
      ${bodyBlocks}
    </section>
  </main>
</body>
</html>`;
}

export function downloadDocumentHtml(documentType, record, snapshot) {
  const model = buildDocumentModel(documentType, record, snapshot);
  const prefix = documentType === "proposal" ? "proposta" : "ficha";
  const filename = `${prefix}-${sanitizeFilename(model.clientName)}-${new Date().toISOString().slice(0, 10)}.html`;

  downloadBlob(filename, buildDocumentHtml(documentType, record, snapshot), "text/html;charset=utf-8");
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
