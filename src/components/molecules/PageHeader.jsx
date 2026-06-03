import Button from "../atoms/Button.jsx";

export default function PageHeader({ title, description, actionLabel, actionIcon = "plus", onAction }) {
  return (
    <header className="flex items-start justify-between gap-6">
      <div>
        <h1 className="font-display text-3xl font-black text-amiste-black">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm italic text-amiste-gray/70">{description}</p>
        ) : null}
      </div>
      {actionLabel ? (
        <Button icon={actionIcon} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </header>
  );
}
