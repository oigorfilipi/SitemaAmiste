import StatusPill from "../atoms/StatusPill.jsx";
import UserTag from "../atoms/UserTag.jsx";

export default function ProfileIdentityPanel({ profile }) {
  if (!profile) {
    return null;
  }

  return (
    <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="grid size-20 shrink-0 place-items-center rounded-md bg-amiste-red text-2xl font-black text-white">
          {profile.avatarInitials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-display text-2xl font-black text-amiste-black">
              {profile.displayName}
            </h2>
            <UserTag role={profile.role} />
            <StatusPill status={profile.status || "ativo"} />
          </div>
          <p className="mt-2 text-sm font-semibold text-amiste-gray/70">{profile.fullName}</p>
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div className="rounded-md bg-zinc-50 p-3">
              <span className="block text-xs font-black uppercase text-amiste-gray/50">Email</span>
              <strong className="mt-1 block truncate text-amiste-black">{profile.email || "-"}</strong>
            </div>
            <div className="rounded-md bg-zinc-50 p-3">
              <span className="block text-xs font-black uppercase text-amiste-gray/50">Telefone</span>
              <strong className="mt-1 block text-amiste-black">{profile.phone || "-"}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
