/** Joins the class names that apply, and skips the ones that do not. */
export function classes(...names: (string | false | undefined)[]): string {
  return names
    .filter((name): name is string => typeof name === "string" && name !== "")
    .join(" ");
}
