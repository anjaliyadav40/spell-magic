const spells = [
  {
    id: "bloom",
    icon: "🌸",
    name: "Bloom",
  },
  {
    id: "star",
    icon: "⭐",
    name: "Starfall",
  },
  {
    id: "heart",
    icon: "💗",
    name: "Heart",
  },
  {
    id: "thunder",
    icon: "⚡",
    name: "Thunder",
  },
  {
    id: "invisible",
    icon: "🫥",
    name: "Invisible",
  },
];

function SpellSelector({
  selectedSpell,
  onSelect,
}) {
  return (
    <div className="floating-spell-selector">
      {spells.map((spell) => {
        const selected =
          selectedSpell === spell.id;

        return (
          <button
            key={spell.id}
            type="button"
            className={
              selected
                ? "spell-button selected"
                : "spell-button"
            }
            onClick={() =>
              onSelect(spell.id)
            }
            title={spell.name}
            aria-label={spell.name}
          >
            <span className="spell-icon">
              {spell.icon}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default SpellSelector;
export { spells };