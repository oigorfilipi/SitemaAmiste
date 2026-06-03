import StatusPill from "../atoms/StatusPill.jsx";

function accessStatus(access) {
  const statusByAccess = {
    AC: "concluido",
    OC: "cancelado",
    UP: "rascunho",
    VIS: "pendente",
  };

  return statusByAccess[access] || "automatico";
}

export default function ProfileAccessPanel({ rows }) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="font-display text-lg font-black text-amiste-black">Acessos do perfil</h2>
        <p className="mt-1 text-sm font-semibold text-amiste-gray/60">
          Leitura das permissoes aplicadas ao cargo atual.
        </p>
      </div>

      {/* --- SECAO: MODULOS E PERMISSOES --- */}
      <div className="mt-4 max-h-[480px] space-y-2 overflow-y-auto pr-1">
        {rows.map((row) => (
          <div className="flex items-center justify-between gap-3 rounded-md bg-zinc-50 px-3 py-2" key={row.id}>
            <span className="truncate text-sm font-bold text-amiste-black">{row.name}</span>
            <StatusPill
              className="h-6 px-2 text-[10px]"
              label={row.access}
              status={accessStatus(row.access)}
              title={row.accessLabel}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
