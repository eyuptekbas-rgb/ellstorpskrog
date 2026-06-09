import { getCategoryEmoji } from "@/lib/menu/constants";
import type { MenuCategory } from "@/lib/menu";

type Props = {
  categories: MenuCategory[];
  activeCategoryId: string;
  onSelect: (categoryId: string) => void;
};

export default function CategoryNav({
  categories,
  activeCategoryId,
  onSelect,
}: Props) {
  return (
    <nav
      className="sticky top-[var(--header-height-mobile)] z-30 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl lg:top-[var(--header-height)]"
      aria-label="Kategorier"
    >
      <div className="flex gap-2 overflow-x-auto px-4 py-3.5 scrollbar-hide sm:gap-2.5 sm:px-6">
        {categories.map((category) => {
          const isActive = activeCategoryId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-250 ${
                isActive
                  ? "bg-gradient-to-r from-[#c96a44] to-[#b85c38] text-white shadow-lg shadow-[#b85c38]/35"
                  : "border border-white/10 bg-white/[0.03] text-white/52 hover:border-white/18 hover:text-white/80"
              }`}
            >
              <span className="text-base leading-none">
                {getCategoryEmoji(category.slug)}
              </span>
              {category.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
