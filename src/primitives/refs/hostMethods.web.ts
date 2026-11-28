import type { NativeMethods } from "../types/hostInstance";
import type { TextInputInstance } from "../types/textInput";

export type TextFieldElement = HTMLInputElement | HTMLTextAreaElement;
export type Selection = { start: number; end?: number };

type SetNativeProps = NativeMethods["setNativeProps"];
type SetSelection = TextInputInstance["setSelection"];

export function createSetNativeProps(node: HTMLElement): SetNativeProps {
  return (nativeProps) => {
    const entries: [string, unknown][] = Object.entries(nativeProps ?? {});
    for (const [prop, value] of entries) {
      if (prop === "style" && value != null && typeof value === "object") {
        Object.assign(node.style, value);
      } else if (prop === "class" || prop === "className") {
        node.setAttribute("class", String(value));
      } else if (prop === "text" || prop === "value") {
        (node as HTMLInputElement).value = String(value);
      } else if (value != null) {
        node.setAttribute(prop, String(value));
      }
    }
  };
}

/** A range with no end reapplies the caret after a programmatic edit. */
export function isSelectionStale(
  node: Pick<TextFieldElement, "selectionStart" | "selectionEnd">,
  selection: Selection,
): boolean {
  return (
    selection.start !== node.selectionStart ||
    selection.end !== node.selectionEnd
  );
}

export function applySelection(
  node: TextFieldElement,
  selection: Selection,
): void {
  if (!isSelectionStale(node, selection)) {
    return;
  }
  try {
    node.setSelectionRange(selection.start, selection.end ?? selection.start);
  } catch {
    // Input types such as email and number have no selection range.
  }
}

export function createSetSelection(node: TextFieldElement): SetSelection {
  return (start, end) => applySelection(node, { start, end });
}

export function createFieldSetNativeProps(
  node: TextFieldElement,
): SetNativeProps {
  return (nativeProps) => {
    const props = nativeProps as {
      selection?: Selection;
      text?: unknown;
      style?: unknown;
    };
    const selection = props?.selection;
    if (selection != null) {
      applySelection(node, selection);
    }
    if (typeof props?.text === "string") {
      node.value = props.text;
    }
    if (props?.style != null) {
      Object.assign(node.style, props.style);
    }
  };
}

export function fillMissingHostMethods(
  instance: unknown,
  textField: boolean,
): void {
  // Both web renderers forward the DOM element as the host instance.
  if (textField) {
    const node = instance as TextFieldElement &
      Partial<Pick<TextInputInstance, "setNativeProps" | "setSelection">>;
    node.setNativeProps ??= createFieldSetNativeProps(node);
    node.setSelection ??= createSetSelection(node);
  } else {
    const node = instance as HTMLElement &
      Partial<Pick<NativeMethods, "setNativeProps">>;
    node.setNativeProps ??= createSetNativeProps(node);
  }
}
