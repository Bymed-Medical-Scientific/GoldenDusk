import type { CatalogueCardItem } from "@/components/catalogue/catalogue-card";
import { CatalogueCard } from "@/components/catalogue/catalogue-card";

type CatalogueGridProps = {
  items: CatalogueCardItem[];
};

export function CatalogueGrid({ items }: CatalogueGridProps) {
  if (items.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 justify-items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="w-full max-w-[22rem]">
          <CatalogueCard item={item} />
        </li>
      ))}
    </ul>
  );
}
