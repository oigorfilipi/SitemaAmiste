import Button from "../atoms/Button.jsx";
import Modal from "../molecules/Modal.jsx";
import ProposalDocumentPreview from "./ProposalDocumentPreview.jsx";
import ServiceSheetDocumentPreview from "./ServiceSheetDocumentPreview.jsx";
import {
  buildDocumentModel,
  downloadDocumentPdf,
} from "../../services/documentService.js";

export default function DocumentPreviewModal({
  canDownload = true,
  canPrint = true,
  open,
  record,
  documentType,
  snapshot,
  onClose,
}) {
  if (!record) {
    return null;
  }

  const title = documentType === "proposal" ? "Preview da Proposta" : "Preview da Ficha";
  const model = buildDocumentModel(documentType, record, snapshot);

  function handleDownload() {
    if (!canDownload || !canPrint) {
      return;
    }

    downloadDocumentPdf(documentType, record, snapshot);
  }

  function handlePrint() {
    if (!canPrint) {
      return;
    }

    window.print();
  }

  return (
    <Modal
      description="Visualizacao interna do documento antes da geracao/exportacao final."
      open={open}
      size="wide"
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
          <Button disabled={!canDownload || !canPrint} icon="download" onClick={handleDownload}>
            Baixar PDF
          </Button>
          <Button disabled={!canPrint} icon="fileText" variant="secondary" onClick={handlePrint}>
            Imprimir
          </Button>
        </div>
      </div>
    </Modal>
  );
}
