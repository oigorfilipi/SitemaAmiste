import { useState } from "react";
import Button from "../atoms/Button.jsx";
import StatusPill from "../atoms/StatusPill.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";

function formatStockGap(item) {
  if (!item.missingToMin) {
    return "OK";
  }

  return `Faltam ${item.missingToMin}`;
}

function MachineAssets({ assets = [] }) {
  if (!assets.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-3 text-xs font-bold text-amiste-gray/55">
        Nenhum patrimonio/serie registrado para esta linha.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {assets.map((asset, index) => (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3" key={`${asset.assetTag}_${asset.serialNumber}_${index}`}>
          <span className="block text-[11px] font-black uppercase text-amiste-gray/45">Unidade {index + 1}</span>
          <strong className="mt-1 block text-xs text-amiste-black">Serie: {asset.serialNumber || "-"}</strong>
          <strong className="mt-1 block text-xs text-amiste-black">Patrimonio: {asset.assetTag || "-"}</strong>
        </div>
      ))}
    </div>
  );
}

export default function InventoryAuditTable({
  canAdjust = false,
  canDelete = false,
  canMutate,
  groupId,
  mode = "realtime",
  records,
  unitLabel,
  onAdjust,
  onDelete,
}) {
  const [expandedId, setExpandedId] = useState("");
  const isPhysical = mode === "physical";
  const isMachines = groupId === "machines";
  const tableSurfaceClass = isPhysical
    ? "border-zinc-200 bg-white"
    : "border-zinc-300 bg-zinc-100/80";
  const headerSurfaceClass = isPhysical
    ? "border-zinc-100 bg-zinc-50/70"
    : "border-zinc-200 bg-zinc-200/75";
  const rowSurfaceClass = isPhysical
    ? "border-zinc-100 hover:bg-amiste-red/5"
    : "border-zinc-200 hover:bg-white/75";

  if (!records.length) {
    return (
      <TableEmptyState
        description="Cadastre itens no catalogo para habilitar a contagem."
        icon="boxes"
        title="Nenhum item neste grupo"
      />
    );
  }

  return (
    <section className={`overflow-hidden rounded-2xl border shadow-sm ${tableSurfaceClass}`}>
      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          {isPhysical ? (
            <div className={`grid grid-cols-[1.45fr_130px_180px_180px_170px] gap-4 border-b px-4 py-3 text-xs font-black uppercase text-amiste-gray/60 ${headerSurfaceClass}`}>
              <span>Produto</span>
              <span>Quantidade</span>
              <span>Ultima Auditoria</span>
              <span>Responsavel</span>
              <span className="text-right">Acao</span>
            </div>
          ) : (
            <div className={`grid grid-cols-[1.45fr_140px_160px_160px_120px] gap-4 border-b px-4 py-3 text-xs font-black uppercase text-amiste-gray/60 ${headerSurfaceClass}`}>
              <span>Produto</span>
              <span>Quantidade Atual</span>
              <span>Status de Giro</span>
              <span>Status de Estoque</span>
              <span className="text-right">Detalhes</span>
            </div>
          )}

          <div className="max-h-[560px] overflow-y-auto">
            {records.map((item) => {
              const expanded = expandedId === item.id;

              return (
                <div className={`border-b transition last:border-b-0 ${rowSurfaceClass}`} key={item.id}>
                {isPhysical ? (
                  <div className="grid h-14 grid-cols-[1.45fr_130px_180px_180px_170px] items-center gap-4 px-4 py-2">
                    <div className="min-w-0">
                      <strong className="block truncate text-sm font-black text-amiste-black">{item.name}</strong>
                      <span className="mt-1 block truncate text-xs font-semibold text-amiste-gray/55">{item.category || item.brand || "Sem categoria"}</span>
                    </div>
                    <span className="text-sm font-black">
                      {item.physicalQuantity} {unitLabel}
                    </span>
                    <span className="text-sm font-semibold text-amiste-gray">{item.lastAuditLabel}</span>
                    <span className="truncate text-sm font-semibold text-amiste-gray">{item.countedBy || "-"}</span>
                    <div className="flex justify-end gap-2">
                      {isMachines ? (
                        <Button className="h-8 w-[72px] px-3 text-xs" variant="secondary" onClick={() => setExpandedId(expanded ? "" : item.id)}>
                          {expanded ? "Ocultar" : "Ver"}
                        </Button>
                      ) : null}
                      {canMutate ? (
                        <>
                          {canAdjust ? (
                            <Button className="h-8 w-[76px] px-3 text-xs" icon="pencil" variant="secondary" onClick={() => onAdjust(item)}>
                              Editar
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button className="h-8 w-[76px] px-3 text-xs" icon="trash" variant="secondary" onClick={() => onDelete(item)}>
                              Excluir
                            </Button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="grid h-14 grid-cols-[1.45fr_140px_160px_160px_120px] items-center gap-4 px-4 py-2">
                    <div className="min-w-0">
                      <strong className="block truncate text-sm font-black text-amiste-black">{item.name}</strong>
                      <span className="mt-1 block truncate text-xs font-semibold text-amiste-gray/55">
                        {item.category || item.brand || formatStockGap(item)}
                      </span>
                    </div>
                    <span className="text-sm font-black">
                      {item.stock} {unitLabel}
                    </span>
                    <span className="text-sm font-bold text-amiste-gray">{item.turnoverStatus}</span>
                    <StatusPill label={item.stockStatusLabel} status={item.stockStatus?.status || item.status} />
                    <div className="text-right">
                      {isMachines ? (
                        <Button className="h-8 w-[72px] px-3 text-xs" variant="secondary" onClick={() => setExpandedId(expanded ? "" : item.id)}>
                          {expanded ? "Ocultar" : "Ver"}
                        </Button>
                      ) : (
                        <span className="text-xs font-bold text-amiste-gray/45">-</span>
                      )}
                    </div>
                  </div>
                )}

                {isMachines && expanded ? (
                  <div className="px-4 pb-4">
                    <MachineAssets assets={item.assets} />
                  </div>
                ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
