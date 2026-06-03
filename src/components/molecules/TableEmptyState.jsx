import AppIcon from "../atoms/AppIcon.jsx";

export default function TableEmptyState({ icon = "archive", title, description }) {
  return (
    <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-zinc-300 bg-white">
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-zinc-100 text-zinc-400">
          <AppIcon name={icon} size={26} />
        </span>
        <strong className="mt-4 block font-display text-lg font-black text-amiste-gray">{title}</strong>
        {description ? <p className="mt-2 text-sm italic text-amiste-gray/60">{description}</p> : null}
      </div>
    </div>
  );
}
