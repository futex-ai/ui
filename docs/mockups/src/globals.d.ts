/**
 * The React Native development flag that the library reads with a `typeof`
 * guard. The root type check gets it from React Native's global types
 * through the native seam files. The catalogue resolves only the `.web`
 * files, so it declares the flag with the same type.
 */
declare var __DEV__: boolean;
