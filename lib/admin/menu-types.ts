export type AdminOptionItem = {
  id: string;
  name: string;
  priceModifier: number;
  sortOrder: number;
};

export type AdminOptionGroup = {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: AdminOptionItem[];
};

export type AdminMenuProduct = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  ingredients: string;
  allergens: string;
  price: number;
  campaignPrice: number | null;
  campaignStart: string | null;
  campaignEnd: string | null;
  image: string | null;
  active: boolean;
  hidden: boolean;
  soldOut: boolean;
  isPopular: boolean;
  isNew: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  spicyLevel: number;
  sortOrder: number;
  optionGroups: AdminOptionGroup[];
};

export type AdminMenuCategory = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  icon: string | null;
  active: boolean;
  sortOrder: number;
  products: AdminMenuProduct[];
  _count: { products: number; extraOptions: number };
};

export type ProductDraft = {
  name: string;
  description: string;
  ingredients: string;
  allergens: string;
  price: string;
  campaignPrice: string;
  campaignStart: string;
  campaignEnd: string;
  image: string;
  categoryId: string;
  active: boolean;
  hidden: boolean;
  soldOut: boolean;
  isPopular: boolean;
  isNew: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  spicyLevel: number;
  optionGroups: AdminOptionGroup[];
};

export const emptyProductDraft = (categoryId = ""): ProductDraft => ({
  name: "",
  description: "",
  ingredients: "",
  allergens: "",
  price: "",
  campaignPrice: "",
  campaignStart: "",
  campaignEnd: "",
  image: "",
  categoryId,
  active: true,
  hidden: false,
  soldOut: false,
  isPopular: false,
  isNew: false,
  isVegetarian: false,
  isGlutenFree: false,
  spicyLevel: 0,
  optionGroups: [],
});

export type CategoryDraft = {
  name: string;
  slug: string;
  image: string;
  icon: string;
  active: boolean;
};

export const emptyCategoryDraft = (): CategoryDraft => ({
  name: "",
  slug: "",
  image: "",
  icon: "",
  active: true,
});

export type MenuFilters = {
  search: string;
  categoryId: string;
  availability: "all" | "available" | "unavailable";
  soldOut: "all" | "sold" | "in_stock";
};

export const defaultMenuFilters = (): MenuFilters => ({
  search: "",
  categoryId: "all",
  availability: "all",
  soldOut: "all",
});
