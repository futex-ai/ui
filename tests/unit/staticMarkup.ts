/**
 * Readers for server-rendered markup in the static tests. They find elements
 * by an attribute or by their own text, so an assertion pins what a component
 * renders, not where its code lives.
 */
import assert from "node:assert/strict";

/** The opening tag of the first element that carries `attribute`. */
export function tagWith(markup: string, attribute: string): string {
  const index = markup.indexOf(attribute);
  assert.ok(index >= 0, `markup has ${attribute}`);
  return markup.slice(
    markup.lastIndexOf("<", index),
    markup.indexOf(">", index) + 1,
  );
}

/**
 * The whole element, from the opening tag that carries `attribute` to its
 * matching closing tag, with everything nested inside it.
 */
export function elementWith(markup: string, attribute: string): string {
  const index = markup.indexOf(attribute);
  assert.ok(index >= 0, `markup has ${attribute}`);
  const start = markup.lastIndexOf("<", index);
  const name = /^<([a-z0-9]+)/i.exec(markup.slice(start))?.[1];
  assert.ok(name, `an element carries ${attribute}`);
  const tags = new RegExp(`<(/?)${name}(?=[\\s>/])[^>]*?(/?)>`, "gi");
  tags.lastIndex = start;
  let depth = 0;
  for (let match = tags.exec(markup); match; match = tags.exec(markup)) {
    if (match[2] === "/") {
      continue;
    }
    depth += match[1] === "/" ? -1 : 1;
    if (depth === 0) {
      return markup.slice(start, match.index + match[0].length);
    }
  }
  assert.fail(`the element with ${attribute} has no closing tag`);
}

/** The value of one CSS property in a tag's inline style, if it is set. */
export function styleValue(tag: string, property: string): string | undefined {
  const style = /style="([^"]*)"/.exec(tag)?.[1] ?? "";
  for (const declaration of style.split(";")) {
    const colon = declaration.indexOf(":");
    if (colon > 0 && declaration.slice(0, colon).trim() === property) {
      return declaration.slice(colon + 1).trim();
    }
  }
  return undefined;
}

/** A CSS property of the element whose own text starts with `text`. */
export function textStyle(
  markup: string,
  text: string,
  property: string,
): string | undefined {
  const index = markup.indexOf(`>${text}<`);
  assert.ok(index >= 0, `markup has the text ${text}`);
  return styleValue(
    markup.slice(markup.lastIndexOf("<", index), index + 1),
    property,
  );
}
