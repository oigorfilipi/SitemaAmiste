import { useEffect, useState } from "react";
import AppIcon from "../atoms/AppIcon.jsx";
import Button from "../atoms/Button.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";
import { resolveLabelFileUrl } from "../../services/labelService.js";

function PreviewFrame({ isLoading, label, previewUrl }) {
  if (isLoading) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
        <div>
          <AppIcon className="mx-auto text-amiste-gray/45" name="fileClock" size={42} />
          <strong className="mt-4 block font-display text-lg font-black text-amiste-black">Carregando preview</strong>
          <p className="mt-2 text-sm font-semibold text-amiste-gray/65">
            Preparando o arquivo salvo no repositorio local.
          </p>
        </div>
      </div>
    );
  }

  if (!label?.hasFile || !previewUrl) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
        <div>
          <AppIcon className="mx-auto text-amiste-gray/45" name="fileText" size={42} />
          <strong className="mt-4 block font-display text-lg font-black text-amiste-black">Arquivo nao anexado</strong>
          <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-amiste-gray/65">
            Este registro veio de uma versao antiga e nao possui arquivo salvo no repositorio local.
          </p>
        </div>
      </div>
    );
  }

  if (label.previewKind === "image") {
    return (
      <div className="grid min-h-[520px] place-items-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 p-4">
        <img alt={label.name} className="max-h-[640px] max-w-full object-contain" src={previewUrl} />
      </div>
    );
  }

  if (label.previewKind === "pdf" || label.previewKind === "text") {
    return (
      <iframe
        className="h-[640px] w-full rounded-md border border-zinc-200 bg-white"
        src={previewUrl}
        title={`Preview ${label.name}`}
      />
    );
  }

  return (
    <div className="grid min-h-[420px] place-items-center rounded-md border border-zinc-200 bg-zinc-50 p-8 text-center">
      <div>
        <AppIcon className="mx-auto text-amiste-gray/45" name="fileSpreadsheet" size={46} />
        <strong className="mt-4 block font-display text-lg font-black text-amiste-black">
          Preview nativo indisponivel
        </strong>
        <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-amiste-gray/65">
          Este formato foi salvo e pode ser baixado. Para conferir o conteudo completo, abra o arquivo no aplicativo adequado.
        </p>
      </div>
    </div>
  );
}

export default function LabelFilePreviewPanel({ canDownload = true, canPrint = true, label, onDownload, onPrint }) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    async function loadPreview() {
      setPreviewUrl("");

      if (!label) {
        return;
      }

      setIsLoading(true);
      const resolved = await resolveLabelFileUrl(label);

      if (cancelled) {
        if (resolved.shouldRevoke && resolved.url) {
          window.URL.revokeObjectURL(resolved.url);
        }

        return;
      }

      objectUrl = resolved.shouldRevoke ? resolved.url : "";
      setPreviewUrl(resolved.url);
      setIsLoading(false);
    }

    loadPreview();

    return () => {
      cancelled = true;
      setIsLoading(false);

      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [label]);

  if (!label) {
    return (
      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <TableEmptyState
          description="Selecione um card para carregar a pre-visualizacao do arquivo."
          icon="fileText"
          title="Nenhum arquivo selecionado"
        />
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      {/* --- SECAO: CABECALHO DO PREVIEW --- */}
      <header className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-xs font-black uppercase text-amiste-gray/50">Preview do arquivo</span>
          <h2 className="mt-1 truncate font-display text-xl font-black text-amiste-black">{label.name}</h2>
          <p className="mt-1 truncate text-sm font-semibold text-amiste-gray/65">
            {label.category} | {label.format} | {label.fileSizeLabel}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            disabled={!canDownload || !label.hasFile}
            icon="download"
            variant="secondary"
            onClick={() => {
              if (canDownload) {
                onDownload(label);
              }
            }}
          >
            Baixar
          </Button>
          <Button
            disabled={!canPrint || !label.canPrint}
            icon="printer"
            onClick={() => {
              if (canPrint) {
                onPrint(label);
              }
            }}
          >
            Imprimir
          </Button>
        </div>
      </header>

      <PreviewFrame isLoading={isLoading} label={label} previewUrl={previewUrl} />
    </section>
  );
}
