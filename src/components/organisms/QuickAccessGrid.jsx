import QuickAccessCard from "../molecules/QuickAccessCard.jsx";

export default function QuickAccessGrid({ items, onSelectPage }) {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
      {items.map((item) => (
        <QuickAccessCard key={item.id} item={item} onSelect={onSelectPage} />
      ))}
    </section>
  );
}
