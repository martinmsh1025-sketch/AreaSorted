import { jobTypeCatalog, serviceCatalog } from "@/lib/service-catalog";

export const publicCategoryOptions = [
  { key: "CLEANING", label: "Cleaning", serviceValue: "cleaning" },
  { key: "PEST_CONTROL", label: "Pest control", serviceValue: "pest-control" },
  { key: "HANDYMAN", label: "Handyman", serviceValue: "handyman" },
  { key: "FURNITURE_ASSEMBLY", label: "Furniture assembly", serviceValue: "furniture-assembly" },
  { key: "WASTE_REMOVAL", label: "Waste removal", serviceValue: "waste-removal" },
  { key: "GARDEN_MAINTENANCE", label: "Garden maintenance", serviceValue: "garden-maintenance" },
] as const;

export function getCategoryForServiceValue(serviceValue: string) {
  return publicCategoryOptions.find((item) => item.serviceValue === serviceValue) ?? null;
}

export function getServiceValueForCategory(categoryKey: string) {
  return publicCategoryOptions.find((item) => item.key === categoryKey)?.serviceValue ?? null;
}

export function listJobTypesForCategory(categoryKey: string) {
  const serviceValue = getServiceValueForCategory(categoryKey);
  if (!serviceValue) return [];
  return jobTypeCatalog.filter((job) => job.service === serviceValue);
}

export function listPublicCategories() {
  return publicCategoryOptions.map((item) => ({
    ...item,
    strapline: serviceCatalog.find((service) => service.value === item.serviceValue)?.strapline || item.label,
  }));
}
