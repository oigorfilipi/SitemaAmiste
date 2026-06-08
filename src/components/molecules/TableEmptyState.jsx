import AppIcon from "../atoms/AppIcon.jsx";

export default function TableEmptyState({ icon = "archive", title, description }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-zinc-300 bg-white p-8 shadow-sm">
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-amiste-red/10 bg-amiste-red/7 text-amiste-red">
          <AppIcon name={icon} size={24} />
        </span>
        <strong className="mt-4 block font-display text-base font-black text-amiste-black">{title}</strong>
        {description ? <p className="mx-auto mt-2 max-w-md text-xs font-semibold leading-5 text-amiste-gray/60">{description}</p> : null}
      </div>
    </div>
  );
}
