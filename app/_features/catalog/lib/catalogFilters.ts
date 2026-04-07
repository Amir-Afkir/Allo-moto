import type {
  CatalogMotorcycle,
  CatalogPriceBand,
  CatalogSortKey,
} from "@/app/_features/catalog/data/motorcycles";

export type CatalogFilterState = {
  category: "all" | CatalogMotorcycle["category"];
  transmission: "all" | CatalogMotorcycle["transmission"];
  license: "all" | CatalogMotorcycle["licenseCategory"];
  price: CatalogPriceBand;
  sort: CatalogSortKey;
};

export const DEFAULT_CATALOG_FILTERS: CatalogFilterState = {
  category: "all",
  transmission: "all",
  license: "all",
  price: "all",
  sort: "recommended",
};

export function hasAdvancedCatalogFilters(filters: CatalogFilterState) {
  return (
    filters.category !== "all" ||
    filters.transmission !== "all" ||
    filters.price !== "all" ||
    filters.license !== "all"
  );
}

export function hasActiveCatalogFilters(filters: CatalogFilterState) {
  return (
    filters.category !== DEFAULT_CATALOG_FILTERS.category ||
    filters.transmission !== DEFAULT_CATALOG_FILTERS.transmission ||
    filters.license !== DEFAULT_CATALOG_FILTERS.license ||
    filters.price !== DEFAULT_CATALOG_FILTERS.price ||
    filters.sort !== DEFAULT_CATALOG_FILTERS.sort
  );
}
