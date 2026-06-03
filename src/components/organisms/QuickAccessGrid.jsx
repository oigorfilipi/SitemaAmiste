import QuickAccessCard from "../molecules/QuickAccessCard.jsx";

export default function QuickAccessGrid({ items, onSelectPage }) {
  return (
    <section className="grid grid-cols-6 gap-4">
      {items.map((item) => (
        <QuickAccessCard key={item.id} item={item} onSelect={onSelectPage} />
      ))}
    </section>
  );
}
