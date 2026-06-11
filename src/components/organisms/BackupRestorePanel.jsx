import Button from "../atoms/Button.jsx";
import TextArea from "../atoms/TextArea.jsx";
import { cn } from "../../utils/cn.js";

export default function BackupRestorePanel({
  backupText,
  canBackup = true,
  canReset = false,
  canRestore = false,
  message,
  onBackup,
  onChangeBackupText,
  onReset,
  onRestore,
}) {
  const hasMessage = Boolean(message?.text);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-black text-amiste-black">Backup e restauracao</h2>
          <p className="mt-1 text-sm font-semibold text-amiste-gray/60">
            Exportacao JSON da base local e restauracao controlada pelo service.
          </p>
        </div>
        <Button disabled={!canBackup} icon="download" variant="secondary" onClick={onBackup}>
          Baixar backup
        </Button>
      </div>

      {/* --- SECAO: RESTAURACAO JSON --- */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        <TextArea
          className="min-h-44"
          disabled={!canRestore}
          placeholder="Cole aqui o JSON exportado pelo backup do ERP"
          value={backupText}
          onChange={(event) => onChangeBackupText(event.target.value)}
        />
        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
          <strong className="block text-sm font-black text-amiste-black">Acoes da base local</strong>
          <p className="text-xs font-semibold leading-5 text-amiste-gray/60">
            Restaurar substitui os dados locais normalizando as colecoes atuais do ERP.
          </p>
          <Button
            className="w-full"
            disabled={!canRestore}
            icon="refresh"
            variant="primary"
            onClick={onRestore}
          >
            Restaurar backup
          </Button>
          <Button
            className="w-full"
            disabled={!canReset}
            icon="trash"
            variant="warning"
            onClick={onReset}
          >
            Resetar base local
          </Button>
          {!canRestore && !canReset ? (
            <span className="block text-xs font-bold text-amiste-red">
              Seu perfil atual permite apenas visualizacao.
            </span>
          ) : null}
        </div>
      </div>

      {hasMessage ? (
        <div
          className={cn(
            "mt-4 rounded-2xl border px-4 py-3 text-sm font-bold",
            message.type === "error"
              ? "border-amiste-red/20 bg-amiste-red/10 text-amiste-red"
              : "border-amiste-green/20 bg-amiste-green/10 text-amiste-green"
          )}
        >
          {message.text}
        </div>
      ) : null}
    </section>
  );
}
