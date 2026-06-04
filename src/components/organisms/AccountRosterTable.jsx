import Button from "../atoms/Button.jsx";
import IconButton from "../atoms/IconButton.jsx";
import StatusPill from "../atoms/StatusPill.jsx";
import UserTag from "../atoms/UserTag.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";

export default function AccountRosterTable({
  accounts,
  onEdit,
  onToggleStatus,
}) {
  if (!accounts.length) {
    return (
      <TableEmptyState
        description="Nenhum colaborador atende ao filtro selecionado."
        icon="users"
        title="Sem colaboradores"
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[1.3fr_1fr_120px_120px_145px_160px] gap-4 border-b border-zinc-100 px-4 py-3 text-xs font-black uppercase text-amiste-gray/60">
            <span>Colaborador</span>
            <span>Email</span>
            <span>Cargo</span>
            <span>Status</span>
            <span>Acesso AC</span>
            <span className="text-right">Acao</span>
          </div>

          {accounts.map((account) => (
            <div
              className="grid grid-cols-[1.3fr_1fr_120px_120px_145px_160px] items-center gap-4 border-b border-zinc-100 px-4 py-4 last:border-b-0"
              key={account.id}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-amiste-red text-sm font-black text-white">
                  {account.profilePhotoDataUrl || account.profilePhotoUrl ? (
                    <img alt={account.displayName} className="h-full w-full object-cover" src={account.profilePhotoDataUrl || account.profilePhotoUrl} />
                  ) : account.avatarInitials}
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-sm font-black text-amiste-black">{account.displayName}</strong>
                  <span className="block truncate text-xs text-amiste-gray/65">{account.fullName}</span>
                </span>
              </div>
              <span className="truncate text-sm font-semibold text-amiste-gray">{account.email}</span>
              <UserTag role={account.role} />
              <StatusPill status={account.status} />
              <span className="text-sm font-black text-amiste-black">
                {account.accessFullCount} modulos
              </span>
              <div className="flex justify-end gap-2">
                <IconButton icon="pencil" label={`Editar ${account.displayName}`} onClick={() => onEdit(account)} />
                <Button
                  aria-label={account.status === "ativo" ? `Desativar ${account.displayName}` : `Reativar ${account.displayName}`}
                  className="h-8 px-3 text-xs"
                  icon={account.status === "ativo" ? "archive" : "refresh"}
                  variant={account.status === "ativo" ? "secondary" : "success"}
                  onClick={() => onToggleStatus(account)}
                >
                  {account.status === "ativo" ? "Desativar" : "Reativar"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
