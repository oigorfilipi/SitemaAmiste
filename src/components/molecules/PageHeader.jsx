import AppIcon from "../atoms/AppIcon.jsx";
import Button from "../atoms/Button.jsx";

export default function PageHeader({
  title,
  description,
  actionLabel,
  actionIcon = "plus",
  icon = "layoutGrid",
  onAction,
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-2xl border border-amiste-red/15 bg-amiste-red/10 text-amiste-red shadow-sm">
          <AppIcon name={icon} size={22} />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-[1.65rem] font-black leading-tight text-amiste-black">{title}</h1>
          {description ? (
            <p className="mt-1.5 max-w-3xl text-[13px] font-medium leading-relaxed text-amiste-gray/70">{description}</p>
          ) : null}
        </div>
      </div>
      {actionLabel ? (
        <Button className="shrink-0" icon={actionIcon} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </header>
  );
}
