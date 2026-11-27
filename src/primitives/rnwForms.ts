export const rnwForms = {
  reactNative: "native",
  svg: "web",
  icons: "web",
  link: "web",
  domBackendCss: "web",
} as const satisfies Readonly<Record<string, "native" | "web">>;
