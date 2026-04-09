import Constants from "expo-constants";

type ExtraConfig = {
  apiBaseUrl?: string;
  projectName?: string;
  demoMode?: boolean;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

function parseBoolean(value: string | boolean | undefined) {
  if (typeof value === "boolean") return value;
  return value === "1" || value === "true" || value === "yes";
}

export const mobileConfig = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || extra.apiBaseUrl || "http://localhost:3000",
  projectName: extra.projectName || "AreaSorted Provider",
  demoMode: parseBoolean(process.env.EXPO_PUBLIC_DEMO_MODE) || parseBoolean(extra.demoMode),
};
