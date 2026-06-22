import { Search, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function MenuSearch({ value, onChange }: Props) {
  return (
    <div className="menu-search">
      <Search size={18} className="menu-search__icon" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Sök rätter…"
        aria-label="Sök rätter"
        className="menu-search__input"
        autoComplete="off"
        enterKeyHint="search"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Rensa sökning"
          className="menu-search__clear"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
