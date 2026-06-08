import ProposalDocumentPreview from "./ProposalDocumentPreview.jsx";
import ServiceSheetDocumentPreview from "./ServiceSheetDocumentPreview.jsx";
import { buildDocumentModel } from "../../services/documentService.js";

export default function DocumentLivePreviewPanel({ documentType, record, snapshot }) {
  const model = buildDocumentModel(documentType, record || {}, snapshot);
  const title = documentType === "proposal" ? "Preview da proposta" : "Preview da ficha";

  return (
    <aside className="min-h-0 overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      {/* --- SECAO: PREVIEW AO VIVO ---
       * O modelo abaixo recebe os dados ainda nao salvos do formulario. Assim,
       * qualquer campo alterado reflete imediatamente no documento lateral.
       */}
      <div className="mb-4">
        <span className="text-xs font-black uppercase text-amiste-gray/50">Pre-visualizacao em tempo real</span>
        <h3 className="mt-1 font-display text-xl font-black text-amiste-black">{title}</h3>
      </div>

      <div className="min-w-0 origin-top rounded-2xl bg-white/60 p-3">
        {documentType === "proposal" ? (
          <ProposalDocumentPreview model={model} />
        ) : (
          <ServiceSheetDocumentPreview model={model} />
        )}
      </div>
    </aside>
  );
}
