import SelectInput from "../atoms/SelectInput.jsx";
import StatusPill from "../atoms/StatusPill.jsx";

const ACCESS_OPTIONS = [
  { label: "AC", value: "AC" },
  { label: "VIS", value: "VIS" },
  { label: "UP", value: "UP" },
  { label: "OC", value: "OC" },
];

function accessTone(access) {
  const tones = {
    AC: "concluido",
    OC: "cancelado",
    UP: "rascunho",
    VIS: "pendente",
  };

  return tones[access] || "automatico";
}

export default function RolePermissionMatrix({ editable = false, matrix, roles, onChange }) {
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
              <div>
                <strong className="block text-sm text-amiste-black">{row.pageLabel}</strong>
                <span className="mt-1 block text-[10px] font-black uppercase text-amiste-gray/45">
                  {row.resourceType}
                </span>
              </div>
              {row.permissions.map((permission) => (
                <div key={`${permission.role}_${row.pageId}`}>
                  {editable ? (
                    <SelectInput
                      className="h-8 bg-white text-xs font-black"
                      value={permission.access}
                      onChange={(event) => onChange?.(permission.role, row.pageId, event.target.value)}
                    >
                      {ACCESS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  ) : (
                    <StatusPill
                      className="h-6 px-2 text-[10px]"
                      label={permission.access}
                      status={accessTone(permission.access)}
                    />
                  )}
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
