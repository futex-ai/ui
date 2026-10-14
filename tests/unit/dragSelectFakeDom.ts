/**
 * A tiny element tree for the drag-select start-rule tests. Each element
 * matches the selector parts it is built with, plus `[attribute]` parts for
 * the attributes it carries; a selector part that contains `!!` throws the
 * way an invalid selector does in a browser.
 */
export class FakeElement {
  parentElement: FakeElement | null = null;
  private readonly attributes = new Map<string, string>();
  private readonly children: FakeElement[] = [];
  private readonly selectorParts: readonly string[];

  constructor(selectorParts: readonly string[] = []) {
    this.selectorParts = selectorParts;
  }

  append<T extends FakeElement>(child: T): T {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  attr(name: string, value: string): this {
    this.attributes.set(name, value);
    return this;
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  contains(other: FakeElement): boolean {
    return (
      other === this || this.children.some((child) => child.contains(other))
    );
  }

  matches(selector: string): boolean {
    return selector
      .split(",")
      .map((part) => part.trim())
      .some((part) => {
        if (part.includes("!!")) {
          throw new SyntaxError(`'${part}' is not a valid selector`);
        }
        const attribute = /^\[([\w-]+)\]$/.exec(part)?.[1];
        return attribute
          ? this.attributes.has(attribute)
          : this.selectorParts.includes(part);
      });
  }

  closest(selector: string): FakeElement | null {
    for (let node: FakeElement | null = this; node; node = node.parentElement) {
      if (node.matches(selector)) {
        return node;
      }
    }
    return null;
  }
}

/** A fake element typed as a DOM `Element` for the code under test. */
export function asElement(element: FakeElement): Element {
  return element as unknown as Element;
}
