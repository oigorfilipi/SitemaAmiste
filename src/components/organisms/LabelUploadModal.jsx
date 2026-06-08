import { useEffect, useMemo, useState } from "react";
import Button from "../atoms/Button.jsx";
import SelectInput from "../atoms/SelectInput.jsx";
import TextArea from "../atoms/TextArea.jsx";
import TextInput from "../atoms/TextInput.jsx";
import FormSection from "../molecules/FormSection.jsx";
import Modal from "../molecules/Modal.jsx";
import {
  LABEL_FILE_ACCEPT,
  buildLabelCategoryOptions,
  formatFileSize,
  resolveFileFormat,
} from "../../services/labelService.js";

export default function LabelUploadModal({ existingLabels = [], open, snapshot, onClose, onUpload }) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const categoryOptions = useMemo(() => buildLabelCategoryOptions(snapshot), [snapshot]);

  useEffect(() => {
    if (open) {
      setCategory("");
      setDescription("");
      setErrorMessage("");
      setFile(null);
      setName("");
    }
  }, [open]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    try {
      const duplicate = existingLabels.some((label) => label.name.trim().toLowerCase() === name.trim().toLowerCase());

      if (duplicate) {
        throw new Error("Ja existe uma etiqueta com este nome.");
      }

      await onUpload({
        category,
        description,
        file,
        name,
      });
    } catch (uploadError) {
      setErrorMessage(uploadError.message || "Nao foi possivel enviar o arquivo.");
    }
  }

  return (
    <Modal
      description="Envie arquivos externos de etiquetas e vincule cada item a uma categoria operacional."
      open={open}
      title="Enviar Arquivo de Etiqueta"
      onClose={onClose}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <FormSection eyebrow="Arquivo" title="Identificacao e vinculo">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">
                Nome do arquivo/etiqueta <span className="text-amiste-red">*</span>
              </span>
              <TextInput
                required
                placeholder="Ex: Etiqueta Lio 2C frente"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">
                Categoria ou vinculo <span className="text-amiste-red">*</span>
              </span>
              <SelectInput required value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">Selecione</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </label>

            <label className="md:col-span-2">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">
                Arquivo <span className="text-amiste-red">*</span>
              </span>
              <input
                accept={LABEL_FILE_ACCEPT}
                className="block h-9 w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[13px] font-semibold text-amiste-gray file:mr-4 file:rounded-lg file:border-0 file:bg-amiste-black file:px-3 file:py-1 file:text-xs file:font-black file:text-white focus:border-amiste-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-amiste-red/10"
                required
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>
          </div>
        </FormSection>

        {file ? (
          <section className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-3">
            <div>
              <span className="text-xs font-black uppercase text-amiste-gray/50">Arquivo</span>
              <strong className="mt-1 block truncate text-sm font-black text-amiste-black">{file.name}</strong>
            </div>
            <div>
              <span className="text-xs font-black uppercase text-amiste-gray/50">Tipo detectado</span>
              <strong className="mt-1 block text-sm font-black text-amiste-black">{resolveFileFormat(file)}</strong>
            </div>
            <div>
              <span className="text-xs font-black uppercase text-amiste-gray/50">Tamanho</span>
              <strong className="mt-1 block text-sm font-black text-amiste-black">{formatFileSize(file.size)}</strong>
            </div>
          </section>
        ) : null}

        <FormSection eyebrow="Uso" title="Organizacao interna">
          <label>
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Observacoes</span>
            <TextArea
              placeholder="Uso, versao, impressora, papel ou observacao interna."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
        </FormSection>

        {errorMessage ? (
          <div className="rounded-2xl border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
            {errorMessage}
          </div>
        ) : null}

        <footer className="flex min-h-14 justify-end gap-3 border-t border-zinc-100 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button icon="upload" type="submit">
            Enviar Arquivo
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
