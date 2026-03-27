import { getPrisma } from "@/lib/db";
import { getSettingValue } from "@/lib/config/env";
import { serviceCatalog, type ServiceValue } from "@/lib/service-catalog";

export const ALL_SERVICE_VALUES = serviceCatalog.map((service) => service.value) as ServiceValue[];

export async function getEnabledServiceValues() {
  try {
    const prisma = getPrisma();
    const setting = await prisma.adminSetting.findUnique({
      where: { key: "marketplace.enabled_service_categories" },
      select: { valueJson: true },
    });

    const rawValueJson = setting?.valueJson;
    const raw = Array.isArray(rawValueJson)
      ? rawValueJson
      : getSettingValue<unknown>(setting, ALL_SERVICE_VALUES);
    const values = Array.isArray(raw)
      ? raw.filter((value): value is ServiceValue => typeof value === "string" && ALL_SERVICE_VALUES.includes(value as ServiceValue))
      : ALL_SERVICE_VALUES;

    return values.length > 0 ? values : [ALL_SERVICE_VALUES[0]];
  } catch {
    return ALL_SERVICE_VALUES;
  }
}

export function isServiceEnabled(enabledServices: ServiceValue[], service: string) {
  return enabledServices.includes(service as ServiceValue);
}
