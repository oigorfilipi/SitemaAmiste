import StatusPill from "../atoms/StatusPill.jsx";

function accessTone(access) {
  const tones = {
    AC: "concluido",
    OC: "cancelado",
    UP: "rascunho",
    VIS: "pendente",
  };

  return tones[access] || "automatico";
}

export default function RolePermissionMatrix({ matrix, roles }) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[1.3fr_repeat(6,1fr)] gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-3 text-xs font-black uppercase text-amiste-gray/60">
            <span>Rota</span>
            {roles.map((role) => (
              <span key={role}>{role}</span>
            ))}
          </div>
          {matrix.map((row) => (
            <div
              className="grid grid-cols-[1.3fr_repeat(6,1fr)] items-center gap-2 border-b border-zinc-100 px-4 py-3 last:border-b-0"
              key={row.pageId}
            >
              <strong className="text-sm text-amiste-black">{row.pageLabel}</strong>
              {row.permissions.map((permission) => (
                <div key={`${permission.role}_${row.pageId}`}>
                  <StatusPill
                    className="h-6 px-2 text-[10px]"
                    label={permission.access}
                    status={accessTone(permission.access)}
                  />
                  <span className="mt-1 block text-[10px] font-semibold text-amiste-gray/55">
                    {permission.accessLabel}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
