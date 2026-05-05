import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [
      ".next/**",
      ".next-dev/**",
      "node_modules/**",
      "provider-app/**",
      "provider-app/node_modules/**",
    ],
  },
  ...nextCoreWebVitals.map((entry) => ({
    ...entry,
    rules: {
      ...(entry.rules || {}),
      "@next/next/no-page-custom-font": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  })),
];

export default config;
