import { useMemo, useState } from "react";
import Button from "../../components/atoms/Button.jsx";
import SelectInput from "../../components/atoms/SelectInput.jsx";
import TextArea from "../../components/atoms/TextArea.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import TableEmptyState from "../../components/molecules/TableEmptyState.jsx";
import { useCollection } from "../../hooks/useCollection.js";
import { assertInlineImageFile, formatInlineImageLimit } from "../../services/imageUploadValidationService.js";
import {
  REQUEST_CATEGORIES,
  REQUEST_PRIORITIES,
  REQUEST_PROBLEM_TYPES,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_STYLES,
  REQUEST_STATUSES,
  buildAccessiblePageOptions,
  buildRequestEvent,
  buildRequestPayload,
  filterRequestsForUser,
  formatRequestDate,
  getRequestDurationLabel,
  groupSimilarRequests,
  isRequestFinal,
  isRequestManager,
  resolveRequestStatus,
} from "../../services/requestService.js";
import { cn } from "../../utils/cn.js";

const INITIAL_FORM = {
  attachmentDataUrl: "",
  attachmentName: "",
  attachmentType: "",
  category: "Erro",
  description: "",
  isGeneral: false,
  pageId: "home",
  priority: "Media",
  problemType: "Tela",
  title: "",
};

const REJECTION_REASONS = ["Fora do escopo", "Informacao insuficiente", "Duplicada", "Sem permissao", "Outro"];
const TRANSFER_REASONS = ["Especialidade tecnica", "Disponibilidade", "Escalonamento", "Outro"];

function readFileAsDataUrl(file) {
  assertInlineImageFile(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Nao foi possivel ler a imagem.")));
    reader.readAsDataURL(file);
  });
}

function isActiveStatus(status) {
  return [
    REQUEST_STATUSES.ANALYSIS,
    REQUEST_STATUSES.ANSWER_WAIT,
    REQUEST_STATUSES.ATTENDING,
    REQUEST_STATUSES.OPEN,
    REQUEST_STATUSES.REACTIVATED,
    REQUEST_STATUSES.TRANSFERRED,
  ].includes(status);
}

function buildActionUpdate(request, user, status, action, extra = {}) {
  const now = new Date().toISOString();

  return {
    ...extra,
    events: [buildRequestEvent(action, user, extra.eventDetails || ""), ...(request.events || [])],
    status,
    updatedAt: now,
  };
}

export default function SolicitacoesPage({ navigation, onSelectPage, user }) {
  const [commentTextById, setCommentTextById] = useState({});
  const [filterStatus, setFilterStatus] = useState("ativas");
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [transferTargetById, setTransferTargetById] = useState({});
  const [transferReasonById, setTransferReasonById] = useState({});
  const [rejectionReasonById, setRejectionReasonById] = useState({});
  const { records, createRecord, updateRecord } = useCollection("accountRequests");
  const manager = isRequestManager(user);
  const { records: accountRecords } = useCollection(manager ? "accounts" : "accountRequests");
  const pageOptions = useMemo(() => buildAccessiblePageOptions(navigation, user?.role || "VEN"), [navigation, user?.role]);
  const attendants = useMemo(
    () => manager ? accountRecords.filter((account) => account.status === "ativo" && ["DEV", "CEO", "DON"].includes(account.role)) : [],
    [accountRecords, manager]
  );

  const visibleRequests = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    return filterRequestsForUser(records, user)
      .map((request) => ({ ...request, resolvedStatus: resolveRequestStatus(request) }))
      .filter((request) => {
        if (manager && request.managerInboxHidden && filterStatus !== "todas") {
          return false;
        }

        if (filterStatus === "ativas" && !isActiveStatus(request.resolvedStatus)) {
          return false;
        }

        if (filterStatus === "finalizadas" && isActiveStatus(request.resolvedStatus)) {
          return false;
        }

        if (filterStatus !== "todas" && !["ativas", "finalizadas"].includes(filterStatus) && request.resolvedStatus !== filterStatus) {
          return false;
        }

        if (!normalizedTerm) {
          return true;
        }

        return [
          request.title,
          request.description,
          request.category,
          request.problemType,
          request.requesterName,
          request.priority,
        ].join(" ").toLowerCase().includes(normalizedTerm);
      })
      .sort((first, second) => String(second.updatedAt || second.requestedAt || "").localeCompare(String(first.updatedAt || first.requestedAt || "")));
  }, [filterStatus, manager, records, searchTerm, user]);

  const groupedRequests = useMemo(() => manager ? groupSimilarRequests(visibleRequests) : [], [manager, visibleRequests]);

  function updateForm(fieldName, value) {
    setFormData((currentData) => ({
      ...currentData,
      [fieldName]: value,
    }));
    setMessage("");
  }

  async function handleAttachmentChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      updateForm("attachmentDataUrl", await readFileAsDataUrl(file));
      updateForm("attachmentName", file.name);
      updateForm("attachmentType", file.type);
    } catch (error) {
      setMessage(error.message || "Nao foi possivel carregar a imagem.");
      event.target.value = "";
    }
  }

  async function handleCreateRequest(event) {
    event.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      setMessage("Informe nome e descricao da solicitacao.");
      return;
    }

    const createdPayload = buildRequestPayload(formData, user);

    await createRecord({
      ...createdPayload,
      similarityKey: [
        createdPayload.pageId,
        createdPayload.category,
        createdPayload.problemType,
        createdPayload.description.toLowerCase().slice(0, 90),
      ].join("|"),
    });
    setFormData(INITIAL_FORM);
    setMessage("Solicitacao criada e registrada internamente.");
  }

  async function handleAttend(request) {
    const update = buildActionUpdate(request, user, REQUEST_STATUSES.ATTENDING, "Atendeu", {
      assigneeId: user?.id || "",
      assigneeName: user?.displayName || user?.fullName || "",
      assigneeRole: user?.role || "",
      attendedAt: new Date().toISOString(),
      eventDetails: "Solicitacao assumida para atendimento.",
    });

    await updateRecord(request.id, update);

    if (request.problemType === "Criacao de Conta") {
      onSelectPage?.("accounts");
    }

    if (request.problemType === "Deletar Conta") {
      onSelectPage?.("accounts");
    }
  }

  async function handleReject(request) {
    const reason = rejectionReasonById[request.id] || REJECTION_REASONS[0];

    await updateRecord(request.id, buildActionUpdate(request, user, REQUEST_STATUSES.REJECTED, "Rejeitou", {
      closedAt: new Date().toISOString(),
      eventDetails: `Motivo: ${reason}`,
      rejectionReason: reason,
    }));
  }

  async function handleComplete(request, status, action) {
    const now = new Date().toISOString();

    await updateRecord(request.id, buildActionUpdate(request, user, status, action, {
      closedAt: now,
      completedAt: status === REQUEST_STATUSES.COMPLETED ? now : request.completedAt || "",
      giveUpAt: status === REQUEST_STATUSES.GIVE_UP ? now : request.giveUpAt || "",
      unresolvedAt: status === REQUEST_STATUSES.UNRESOLVED ? now : request.unresolvedAt || "",
    }));
  }

  async function handleReactivate(request) {
    await updateRecord(request.id, buildActionUpdate(request, user, REQUEST_STATUSES.REACTIVATED, "Reativou", {
      reactivatedAt: new Date().toISOString(),
      closedAt: "",
    }));
  }

  async function handleAnalysis(request) {
    await updateRecord(request.id, buildActionUpdate(request, user, REQUEST_STATUSES.ANALYSIS, "Colocou em analise"));
  }

  async function handleTransfer(request) {
    const targetId = transferTargetById[request.id];
    const target = attendants.find((account) => account.id === targetId);

    if (!target) {
      setMessage("Selecione o novo atendente.");
      return;
    }

    const reason = transferReasonById[request.id] || TRANSFER_REASONS[0];

    await updateRecord(request.id, buildActionUpdate(request, user, REQUEST_STATUSES.TRANSFERRED, "Transferiu", {
      assigneeId: target.id,
      assigneeName: target.displayName || target.fullName,
      assigneeRole: target.role,
      eventDetails: `Transferido para ${target.displayName || target.fullName}. Motivo: ${reason}`,
      transferredAt: new Date().toISOString(),
      transferReason: reason,
    }));
  }

  async function handleComment(request) {
    const text = commentTextById[request.id]?.trim();

    if (!text || isRequestFinal(resolveRequestStatus(request))) {
      return;
    }

    const comment = {
      at: new Date().toISOString(),
      id: `comment_${Date.now()}`,
      role: user?.role || "",
      text,
      userId: user?.id || "",
      userName: user?.displayName || user?.fullName || "Usuario",
    };

    await updateRecord(request.id, {
      comments: [comment, ...(request.comments || [])],
      events: [buildRequestEvent("Comentou", user, "Comentario adicionado na solicitacao."), ...(request.events || [])],
      status: manager ? REQUEST_STATUSES.ANSWER_WAIT : REQUEST_STATUSES.ANALYSIS,
    });
    setCommentTextById((currentData) => ({ ...currentData, [request.id]: "" }));
  }

  async function handleCleanFinalized() {
    const finalizedRequests = visibleRequests.filter((request) => isRequestFinal(resolveRequestStatus(request)));

    for (const request of finalizedRequests) {
      await updateRecord(request.id, {
        events: [buildRequestEvent("Limpou da caixa", user, "Solicitacao finalizada removida da caixa principal."), ...(request.events || [])],
        managerInboxHidden: true,
      });
    }
  }

  async function handleAlsoAffected(request) {
    await updateRecord(request.id, {
      affectedCount: Number(request.affectedCount || 0) + 1,
      events: [buildRequestEvent("Tambem afetado", user, "Usuario marcou que tambem esta com esse problema."), ...(request.events || [])],
    });
  }

  function renderRequestCard(request) {
    const status = resolveRequestStatus(request);
    const style = REQUEST_STATUS_STYLES[status] || REQUEST_STATUS_STYLES[REQUEST_STATUSES.OPEN];
    const closed = isRequestFinal(status);

    return (
      <article className={cn("rounded-2xl border p-4 shadow-sm", style)} key={request.id}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <strong className="block font-display text-lg font-black">{request.title || "Solicitacao"}</strong>
            <span className="mt-1 block text-xs font-bold opacity-75">
              {REQUEST_STATUS_LABELS[status]} | {request.category || "-"} | {request.priority || "-"} | {request.problemType || "-"}
            </span>
          </div>
          {Number(request.occurrenceCount || 1) > 1 ? (
            <span className="grid size-7 place-items-center rounded-full bg-amiste-red text-xs font-black text-white">
              {request.occurrenceCount}
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-sm font-semibold leading-6 opacity-85">{request.description || "-"}</p>

        <div className="mt-4 grid grid-cols-1 gap-2 text-xs font-bold opacity-80 md:grid-cols-2">
          <span>Solicitante: {request.requesterName || "Usuario Desconhecido"}</span>
          <span>Pagina: {request.pageId || "-"}</span>
          <span>Solicitado: {formatRequestDate(request.requestedAt || request.createdAt)}</span>
          <span>Atendido: {formatRequestDate(request.attendedAt)}</span>
          <span>Concluido: {formatRequestDate(request.completedAt || request.closedAt)}</span>
          <span>Tempo atendimento: {getRequestDurationLabel(request.attendedAt, request.completedAt || request.closedAt)}</span>
          {request.assigneeName ? <span className="md:col-span-2">Atendente: {request.assigneeName} ({request.assigneeRole})</span> : null}
        </div>

        {request.attachments?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {request.attachments.map((attachment) => (
              <img alt={attachment.name || "Anexo"} className="h-24 w-32 rounded-xl border border-white/60 object-cover" key={attachment.uploadedAt || attachment.name} src={attachment.dataUrl} />
            ))}
          </div>
        ) : null}

        {request.isGeneral ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button className="h-8 px-3 text-xs" variant="secondary" onClick={() => handleAlsoAffected(request)}>
              Tambem estou com esse problema ({Number(request.affectedCount || 0)})
            </Button>
          </div>
        ) : null}

        {manager ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {!closed ? (
              <>
                <Button className="h-8 px-3 text-xs" icon="checkSquare" onClick={() => handleAttend(request)}>Atender</Button>
                <Button className="h-8 px-3 text-xs" variant="secondary" onClick={() => handleAnalysis(request)}>Em Analise</Button>
                <SelectInput className="h-8 w-40 bg-white text-xs" value={rejectionReasonById[request.id] || REJECTION_REASONS[0]} onChange={(event) => setRejectionReasonById((currentData) => ({ ...currentData, [request.id]: event.target.value }))}>
                  {REJECTION_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                </SelectInput>
                <Button className="h-8 px-3 text-xs" variant="danger" onClick={() => handleReject(request)}>Rejeitar</Button>
                <Button className="h-8 px-3 text-xs" variant="success" onClick={() => handleComplete(request, REQUEST_STATUSES.COMPLETED, "Concluiu")}>Concluido</Button>
                <Button className="h-8 px-3 text-xs" variant="warning" onClick={() => handleComplete(request, REQUEST_STATUSES.GIVE_UP, "Desistiu")}>Desistencia</Button>
                <Button className="h-8 px-3 text-xs" variant="secondary" onClick={() => handleComplete(request, REQUEST_STATUSES.UNRESOLVED, "Nao resolveu")}>Nao resolvido</Button>
              </>
            ) : (
              <Button className="h-8 px-3 text-xs" variant="warning" onClick={() => handleReactivate(request)}>Reativar</Button>
            )}
          </div>
        ) : null}

        {manager && !closed && attendants.length > 1 ? (
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
            <SelectInput className="h-8 bg-white text-xs" value={transferTargetById[request.id] || ""} onChange={(event) => setTransferTargetById((currentData) => ({ ...currentData, [request.id]: event.target.value }))}>
              <option value="">Transferir para...</option>
              {attendants.filter((account) => account.id !== request.assigneeId).map((account) => (
                <option key={account.id} value={account.id}>{account.displayName || account.fullName} ({account.role})</option>
              ))}
            </SelectInput>
            <SelectInput className="h-8 bg-white text-xs" value={transferReasonById[request.id] || TRANSFER_REASONS[0]} onChange={(event) => setTransferReasonById((currentData) => ({ ...currentData, [request.id]: event.target.value }))}>
              {TRANSFER_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
            </SelectInput>
            <Button className="h-8 px-3 text-xs" variant="secondary" onClick={() => handleTransfer(request)}>Transferir</Button>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-white/50 bg-white/70 p-3 text-amiste-gray">
          <strong className="text-xs font-black uppercase text-amiste-gray/60">
            {request.isGeneral ? "Comentarios publicos" : "Chat da solicitacao"}
          </strong>
          {!closed ? (
            <div className="mt-3 flex gap-2">
              <TextInput
                className="flex-1"
                placeholder="Escreva uma mensagem"
                value={commentTextById[request.id] || ""}
                onChange={(event) => setCommentTextById((currentData) => ({ ...currentData, [request.id]: event.target.value }))}
              />
              <Button className="h-9" onClick={() => handleComment(request)}>Enviar</Button>
            </div>
          ) : (
            <span className="mt-2 block text-xs font-bold text-amiste-gray/55">Chat em modo leitura. Reative a solicitacao para responder.</span>
          )}
          <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1">
            {(request.comments || []).length ? request.comments.map((comment) => (
              <div className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-amiste-gray" key={comment.id}>
                <strong className="block text-amiste-black">{comment.userName} ({comment.role})</strong>
                <span>{comment.text}</span>
                <small className="mt-1 block text-amiste-gray/50">{formatRequestDate(comment.at)}</small>
              </div>
            )) : (
              <span className="text-xs font-bold text-amiste-gray/55">Nenhum comentario registrado.</span>
            )}
          </div>
        </div>

        {manager ? (
          <details className="mt-4 rounded-2xl border border-white/50 bg-white/60 p-3 text-xs text-amiste-gray">
            <summary className="font-black">Historico da solicitacao</summary>
            <div className="mt-3 space-y-2">
              {(request.events || []).map((event) => (
                <div className="rounded-xl bg-white px-3 py-2" key={`${event.at}_${event.action}`}>
                  <strong>{event.action}</strong> por {event.userName} ({event.role}) em {formatRequestDate(event.at)}
                  {event.details ? <span className="block text-amiste-gray/65">{event.details}</span> : null}
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </article>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={manager ? "Caixa interna de pedidos, incidentes e atendimentos." : "Acompanhe suas solicitacoes e problemas gerais do sistema."}
        icon="fileClock"
        title="Solicitacoes"
      />

      <form className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm" onSubmit={handleCreateRequest}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <label>
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Nome</span>
            <TextInput required placeholder="Ex: Erro ao imprimir etiqueta" value={formData.title} onChange={(event) => updateForm("title", event.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Categoria</span>
            <SelectInput value={formData.category} onChange={(event) => updateForm("category", event.target.value)}>
              {REQUEST_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </SelectInput>
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Pagina</span>
            <SelectInput value={formData.pageId} onChange={(event) => updateForm("pageId", event.target.value)}>
              {pageOptions.map((page) => <option key={page.value} value={page.value}>{page.label}</option>)}
            </SelectInput>
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Prioridade</span>
            <SelectInput value={formData.priority} onChange={(event) => updateForm("priority", event.target.value)}>
              {REQUEST_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </SelectInput>
          </label>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[220px_1fr_260px]">
          <label>
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Tipo</span>
            <SelectInput value={formData.problemType} onChange={(event) => updateForm("problemType", event.target.value)}>
              {REQUEST_PROBLEM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </SelectInput>
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Descricao</span>
            <TextArea required placeholder="Descreva o problema, onde ocorreu e o que esperava acontecer." value={formData.description} onChange={(event) => updateForm("description", event.target.value)} />
          </label>
          <div>
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Print do problema</span>
            <input
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="block h-9 w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[13px] font-semibold text-amiste-gray file:mr-3 file:rounded-xl file:border-0 file:bg-amiste-black file:px-3 file:py-1 file:text-xs file:font-black file:text-white"
              type="file"
              onChange={handleAttachmentChange}
            />
            <span className="mt-2 block text-xs font-bold text-amiste-gray/55">PNG, JPG, JPEG ou WEBP ate {formatInlineImageLimit()}.</span>
            <button
              className="mt-3 flex h-9 w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 text-xs font-black text-amiste-gray"
              type="button"
              onClick={() => updateForm("isGeneral", !formData.isGeneral)}
            >
              Problema geral?
              <span className={formData.isGeneral ? "text-amiste-green" : "text-amiste-red"}>{formData.isGeneral ? "Sim" : "Nao"}</span>
            </button>
          </div>
        </div>
        {message ? <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-amiste-gray">{message}</div> : null}
        <footer className="mt-5 flex justify-end">
          <Button icon="fileClock" type="submit">Criar Solicitacao</Button>
        </footer>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["ativas", "todas", "finalizadas", REQUEST_STATUSES.OPEN, REQUEST_STATUSES.ATTENDING, REQUEST_STATUSES.ANSWER_WAIT, REQUEST_STATUSES.COMPLETED, REQUEST_STATUSES.REJECTED].map((status) => (
            <Button
              className="h-8 px-3 text-xs"
              key={status}
              variant={filterStatus === status ? "primary" : "secondary"}
              onClick={() => setFilterStatus(status)}
            >
              {status === "ativas" ? "Ativas" : status === "todas" ? "Todas" : status === "finalizadas" ? "Finalizadas" : REQUEST_STATUS_LABELS[status]}
            </Button>
          ))}
        </div>
        <div className="flex w-full flex-wrap justify-end gap-2 md:w-auto">
          {manager ? (
            <Button className="h-9 px-3 text-xs" variant="secondary" onClick={handleCleanFinalized}>
              Limpar finalizadas
            </Button>
          ) : null}
          <TextInput className="w-full md:w-80" icon="search" placeholder="Buscar solicitacao" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </div>
      </div>

      {manager && groupedRequests.some((group) => group.count > 1) ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <strong className="font-display text-base font-black text-amiste-black">Agrupamentos semelhantes</strong>
          <div className="mt-3 flex flex-wrap gap-2">
            {groupedRequests.filter((group) => group.count > 1).map((group) => (
              <span className="rounded-full border border-amiste-red/20 bg-amiste-red/10 px-3 py-1 text-xs font-black text-amiste-red" key={group.key}>
                {group.latest?.title || "Solicitacao"} x{group.count}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {visibleRequests.length ? visibleRequests.map(renderRequestCard) : (
          <div className="xl:col-span-2">
            <TableEmptyState
              description="Nenhuma solicitacao encontrada para os filtros atuais."
              icon="fileClock"
              title="Sem solicitacoes"
            />
          </div>
        )}
      </div>
    </div>
  );
}
