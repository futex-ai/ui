export const rnwForms = {
  reactNative: "native",
  svg: "native",
  icons: "native",
  link: "web",
  domBackendCss: "web",
} as const satisfies Readonly<Record<string, "native" | "web">>;
