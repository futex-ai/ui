/**
 * Vite asset-import types for the Storybook config, which is the only part of
 * the repository that imports a file URL (`./fonts.ts` pins the bundled font
 * files). `src/global.d.ts` deliberately declares nothing but `*.css`, so the
 * library's own typecheck stays free of bundler-specific module shapes.
 */
declare module "*.woff2?url" {
  const src: string;
  export default src;
}
