import DocumentInfoRow from "../molecules/DocumentInfoRow.jsx";

function CheckMark({ checked, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-amiste-black">
      <b className="grid size-4 place-items-center border border-amiste-black text-[10px]">{checked ? "X" : ""}</b>
      {label}
    </span>
  );
}

function SheetBox({ children, title }) {
  return (
    <section className="border border-zinc-300 p-2">
      <h4 className="mb-2 text-[10px] font-black uppercase text-amiste-black">{title}</h4>
      {children}
    </section>
  );
}

export default function ServiceSheetDocumentPreview({ model }) {
  const record = model.record || {};
  const machine = model.machine || {};
  const client = model.client || {};

  return (
    <article className="mx-auto flex aspect-[210/297] w-full max-w-[794px] flex-col overflow-hidden border border-zinc-300 bg-white text-amiste-black shadow-xl">
      {/* --- SECAO: CABECALHO A4 --- */}
      <header className="flex items-center justify-between bg-amiste-black px-[4%] py-[2.5%] text-white">
        <div>
          <span className="text-[10px] font-black uppercase text-white/60">{model.badge} | {model.documentCode}</span>
          <h3 className="mt-1 font-display text-2xl font-black">{model.sheetType}</h3>
        </div>
        <strong className="text-right text-sm font-black text-amiste-green">Amiste Cafe</strong>
      </header>

      <section className="grid flex-1 content-start gap-2 p-[3%] text-[11px]">
        <SheetBox title="Checklist tecnico">
          <div className="flex flex-wrap gap-2">
            <CheckMark checked={record.testMachine} label="Testada" />
            <CheckMark checked={record.testMill} label="Moinho" />
            <CheckMark checked={record.testPump} label="Bomba" />
            <CheckMark checked={record.testTransformer} label="Transformador" />
          </div>
          <p className="mt-2 font-semibold text-amiste-gray">Pecas defeituosas: {record.defectiveParts || "-"}</p>
        </SheetBox>

        <SheetBox title="Tipo de servico">
          <div className="mb-2 flex flex-wrap gap-2">
            <CheckMark checked={model.serviceFlags.instalacao} label="Instalacao" />
            <CheckMark checked={model.serviceFlags.retirada} label="Retirada" />
            <CheckMark checked={model.serviceFlags.comodato} label="Comodato" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <DocumentInfoRow label="Tipo" value={model.sheetType} />
            <DocumentInfoRow label="Cobranca" value={record.chargeType} />
            <DocumentInfoRow label="Valor" value={model.primaryValue} />
          </div>
        </SheetBox>

        <SheetBox title="Dados do cliente">
          <div className="grid grid-cols-3 gap-2">
            <DocumentInfoRow label="Empresa" value={client.name} />
            <DocumentInfoRow label="Contato" value={client.contact} />
            <DocumentInfoRow label="Telefone" value={client.phone} />
            <DocumentInfoRow label="Endereco" value={client.address} />
            <DocumentInfoRow label="OS" value={model.checklist.code} />
            <DocumentInfoRow label="Status" value={record.status} />
          </div>
        </SheetBox>

        <SheetBox title="Dados da maquina">
          <div className="grid grid-cols-3 gap-2">
            <DocumentInfoRow label="Instalar / Retirar" value={`${model.sheetType} (${machine.voltage || "-"})`} />
            <DocumentInfoRow label="Patrimonio" value={machine.assetTag || machine.id} />
            <DocumentInfoRow label="Serie" value={machine.serialNumber || machine.id} />
            <DocumentInfoRow label="Data" value={record.date} />
            <DocumentInfoRow label="Horario" value={record.time} />
            <DocumentInfoRow label="Maquina" value={machine.name} />
          </div>
        </SheetBox>

        <SheetBox title="Condicoes">
          <div className="grid grid-cols-2 gap-2">
            <DocumentInfoRow label="Meio de instalacao" value={record.serviceMode} />
            <DocumentInfoRow label="Leitura da maquina" value={record.machineReading} />
          </div>
          <p className="mt-2 line-clamp-3 font-semibold leading-5 text-amiste-gray">{record.notes || "-"}</p>
        </SheetBox>

        <SheetBox title="Programacao, documentos, perifericos e danos">
          <div className="grid grid-cols-3 gap-2">
            <DocumentInfoRow label="Programacao" value={record.drinkProgramming} />
            <DocumentInfoRow label="Perifericos" value={record.peripherals} />
            <DocumentInfoRow label="Danos" value={record.damages} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <CheckMark checked={record.contractDocument} label="Contrato" />
            <CheckMark checked={record.nfDocument} label="NF" />
          </div>
        </SheetBox>

        <SheetBox title="Produtos / insumos">
          <p className="line-clamp-4 font-semibold leading-5 text-amiste-gray">{record.products || "-"}</p>
        </SheetBox>
      </section>

      {/* --- SECAO: ASSINATURAS --- */}
      <footer className="grid grid-cols-2 gap-12 px-[5%] pb-[4%] text-center text-[10px] font-black uppercase text-amiste-gray/70">
        <span className="border-t border-amiste-gray/50 pt-2">Assinatura Cliente</span>
        <span className="border-t border-amiste-gray/50 pt-2">Assinatura Tecnico</span>
      </footer>
    </article>
  );
}
