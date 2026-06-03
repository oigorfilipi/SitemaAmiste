import Button from "../atoms/Button.jsx";

export default function EntityGroupTabs({ activeGroup, groups, onSelectGroup }) {
  return (
    <div className="flex flex-wrap gap-2">
      {groups.map((group) => (
        <Button
          key={group.id}
          variant={activeGroup === group.id ? "primary" : "secondary"}
          onClick={() => onSelectGroup(group.id)}
        >
          {group.label}
        </Button>
      ))}
    </div>
  );
}
