import UserTag from "../atoms/UserTag.jsx";

export default function UserBadge({ user, compact = false }) {
  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-full bg-amiste-red text-sm font-black text-white">
        {user.avatarInitials}
      </span>
      {!compact ? (
        <span className="min-w-0 leading-tight">
          <strong className="block truncate text-sm font-black text-amiste-black">{user.displayName}</strong>
          <span className="mt-1 block">
            <UserTag role={user.role} />
          </span>
        </span>
      ) : null}
    </div>
  );
}
