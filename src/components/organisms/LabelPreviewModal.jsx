import Button from "../atoms/Button.jsx";
import LabelArtwork from "../molecules/LabelArtwork.jsx";
import Modal from "../molecules/Modal.jsx";

export default function LabelPreviewModal({ label, open, onClose, onDownload }) {
  return (
    <Modal
      description="Preview gerado localmente a partir dos dados cadastrados."
      open={open}
      title={label ? `Preview - ${label.name}` : "Preview"}
      onClose={onClose}
    >
      {label ? (
        <div className="space-y-5">
          <LabelArtwork label={label} />

          <section className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <div>
              <span className="text-xs font-black uppercase text-amiste-gray/55">Categoria</span>
              <strong className="mt-1 block text-sm font-black text-amiste-black">{label.category}</strong>
            </div>
            <div>
              <span className="text-xs font-black uppercase text-amiste-gray/55">Formato original</span>
              <strong className="mt-1 block text-sm font-black text-amiste-black">{label.format}</strong>
            </div>
            <div>
              <span className="text-xs font-black uppercase text-amiste-gray/55">Vinculo</span>
              <strong className="mt-1 block text-sm font-black text-amiste-black">{label.linkedName}</strong>
            </div>
            <div>
              <span className="text-xs font-black uppercase text-amiste-gray/55">Especificacao</span>
              <strong className="mt-1 block text-sm font-black text-amiste-black">{label.specLine}</strong>
            </div>
          </section>

          <footer className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Fechar
            </Button>
            <Button icon="download" onClick={() => onDownload(label)}>
              Baixar SVG
            </Button>
          </footer>
        </div>
      ) : null}
    </Modal>
  );
}
