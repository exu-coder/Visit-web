export interface Package {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  features: string[] | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  regional_prices: Record<string, number | null> | null;
  category: string;
  sub_category: string | null;
  created_at: string;
  updated_at: string;
}

export interface PackageWithRegionalPrice extends Package {
  displayPrice: number;
  displayPriceFormatted: string;
}

export const formatPrice = (price: number, region: string): string => {
  switch (region) {
    case "India":
      return `₹${price}`;
    case "Nepal":
      return `Rs.${price}`;
    case "Pakistan":
      return `Rs.${price}`;
    case "Bangladesh":
    default:
      return `৳${price}`;
  }
};

export const getRegionalPrice = (pkg: Package, region: string): number => {
  if (pkg.regional_prices && pkg.regional_prices[region] !== null && pkg.regional_prices[region] !== undefined) {
    return pkg.regional_prices[region] as number;
  }
  return pkg.price;
};
