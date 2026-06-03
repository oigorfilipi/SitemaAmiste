import AppIcon from "../atoms/AppIcon.jsx";

export default function AlertItem({ alert, onSelect }) {
  return (
    <button
      className="flex w-full min-w-0 items-start gap-3 rounded-md border border-zinc-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-x-1 hover:border-amiste-red/30 hover:shadow-amiste"
      type="button"
      onClick={() => onSelect?.(alert)}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-amiste-red/10 text-amiste-red">
        <AppIcon name={alert.icon} size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm font-black text-amiste-black">{alert.title}</strong>
        <span className="mt-1 block break-words text-sm leading-5 text-amiste-gray/70">{alert.description}</span>
      </span>
      {alert.pageId ? (
        <span className="mt-2 text-amiste-gray/45">
          <AppIcon name="chevronRight" size={17} />
        </span>
      ) : null}
    </button>
  );
}
