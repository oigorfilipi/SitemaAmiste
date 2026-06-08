import AppIcon from "../atoms/AppIcon.jsx";
import Button from "../atoms/Button.jsx";
import Modal from "./Modal.jsx";

export default function ConfirmDialog({
  confirmLabel = "Confirmar",
  description,
  icon = "trash",
  open,
  title = "Confirmar acao",
  onCancel,
  onConfirm,
}) {
  return (
    <Modal
      bodyClassName="bg-white"
      description="Revise antes de continuar."
      open={open}
      size="default"
      title={title}
      onClose={onCancel}
    >
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-amiste-red/15 bg-amiste-red/10 text-amiste-red">
          <AppIcon name={icon} size={24} />
        </span>
        <div className="min-w-0">
          <strong className="block font-display text-lg font-black text-amiste-black">
            Esta acao precisa de confirmacao
          </strong>
          {description ? (
            <p className="mt-2 text-sm font-semibold leading-6 text-amiste-gray/70">{description}</p>
          ) : null}
        </div>
      </div>

      <footer className="mt-6 flex min-h-14 justify-end gap-3 border-t border-zinc-100 pt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button icon={icon} variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </footer>
    </Modal>
  );
}
