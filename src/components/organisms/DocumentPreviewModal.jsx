import Button from "../atoms/Button.jsx";
import Modal from "../molecules/Modal.jsx";
import ProposalDocumentPreview from "./ProposalDocumentPreview.jsx";
import ServiceSheetDocumentPreview from "./ServiceSheetDocumentPreview.jsx";
import {
  buildDocumentModel,
  downloadDocumentHtml,
} from "../../services/documentService.js";

export default function DocumentPreviewModal({ open, record, documentType, snapshot, onClose }) {
  if (!record) {
    return null;
  }

  const title = documentType === "proposal" ? "Preview da Proposta" : "Preview da Ficha";
  const model = buildDocumentModel(documentType, record, snapshot);

  function handleDownload() {
    downloadDocumentHtml(documentType, record, snapshot);
  }

  return (
    <Modal
      description="Visualizacao interna do documento antes da geracao/exportacao final."
      open={open}
      title={title}
      onClose={onClose}
    >
      <div className="space-y-5">
        {documentType === "proposal" ? (
          <ProposalDocumentPreview model={model} />
        ) : (
          <ServiceSheetDocumentPreview model={model} />
        )}

        <div className="flex justify-end gap-3">
          <Button icon="download" onClick={handleDownload}>
            Baixar HTML
          </Button>
          <Button icon="fileText" variant="secondary" onClick={() => window.print()}>
            Imprimir
          </Button>
        </div>
      </div>
    </Modal>
  );
}
