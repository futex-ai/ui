/** Selection and caret mapping helpers for RichTextEditor web DOM. */
import type { DocPosition, DocSelection } from "./richTextModel";

const editorCaretBoundary = "\u200b";

/** Return the model block index that contains a DOM node. */
export function currentBlockIndex(
  root: HTMLElement,
  node: Node | null,
): number | null {
  const block = closestBlock(root, node);
  const raw = block?.dataset.rtIndex;
  return raw === undefined ? null : Number(raw);
}

/** Convert a DOM selection focus into a document position. */
export function docPositionFromDom(
  root: HTMLElement,
  selection: Selection | null,
): DocPosition | null {
  if (!selection || selection.rangeCount === 0 || !selection.focusNode) {
    return null;
  }
  const block = closestBlock(root, selection.focusNode);
  if (!block || block.dataset.rtIndex === undefined) {
    return null;
  }
  return {
    block: Number(block.dataset.rtIndex),
    offset: offsetInBlock(
      blockContentElement(block),
      selection.focusNode,
      selection.focusOffset,
    ),
  };
}

/** Create a collapsed DOM range for a document position. */
export function domRangeFromDocPosition(
  root: HTMLElement,
  position: DocPosition,
): Range | null {
  const point = domPointFromDocPosition(root, position);
  if (!point) {
    return null;
  }
  const range = document.createRange();
  range.setStart(point.node, point.offset);
  range.collapse(true);
  return range;
}

/** Create a DOM range for document selection endpoints. */
export function domRangeFromDocSelection(
  root: HTMLElement,
  selection: DocSelection,
): Range | null {
  const start = domPointFromDocPosition(root, selection.from);
  const end = domPointFromDocPosition(root, selection.to);
  if (!start || !end) {
    return null;
  }
  const range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  return range;
}

/** Whether the current selection is collapsed at the start of its block. */
export function isAtBlockStart(
  root: HTMLElement,
  selection: Selection | null,
): boolean {
  if (!selection?.isCollapsed) {
    return false;
  }
  return docPositionFromDom(root, selection)?.offset === 0;
}

/** Whether the current selection is collapsed at the end of its block. */
export function isAtBlockEnd(
  root: HTMLElement,
  selection: Selection | null,
): boolean {
  if (!selection?.isCollapsed) {
    return false;
  }
  const position = docPositionFromDom(root, selection);
  const block = position ? blockElementAt(root, position.block) : null;
  return Boolean(
    block &&
    position &&
    position.offset >= textLength(blockContentElement(block)),
  );
}

/** Return a visible caret rect, falling back to a temporary zero-width span. */
export function caretRect(selection: Selection | null): DOMRect | null {
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  const range = selection.getRangeAt(0);
  const rect = range.getClientRects()[0] ?? null;
  if (rect) {
    return rect;
  }
  const marker = document.createElement("span");
  marker.textContent = "\u200b";
  range.insertNode(marker);
  const fallback = marker.getBoundingClientRect();
  marker.remove();
  selection.removeAllRanges();
  selection.addRange(range);
  return fallback;
}

/** Whether a collapsed selection sits after an editor-owned caret boundary. */
export function isAfterEditorCaretBoundary(
  selection: Selection | null,
): boolean {
  if (!selection?.isCollapsed || !selection.focusNode) {
    return false;
  }
  return (
    previousEditableCharacter(selection.focusNode, selection.focusOffset) ===
    editorCaretBoundary
  );
}

/** Return the ordered selection endpoints when both ends are inside the editor. */
export function docRangeFromDomSelection(
  root: HTMLElement,
  selection: Selection | null,
): DocSelection | null {
  if (
    !selection ||
    selection.rangeCount === 0 ||
    !selection.anchorNode ||
    !selection.focusNode
  ) {
    return null;
  }
  const anchorBlock = closestBlock(root, selection.anchorNode);
  const focusBlock = closestBlock(root, selection.focusNode);
  if (!anchorBlock || !focusBlock) {
    return null;
  }
  const anchor = {
    block: Number(anchorBlock.dataset.rtIndex),
    offset: offsetInBlock(
      blockContentElement(anchorBlock),
      selection.anchorNode,
      selection.anchorOffset,
    ),
  };
  const focus = {
    block: Number(focusBlock.dataset.rtIndex),
    offset: offsetInBlock(
      blockContentElement(focusBlock),
      selection.focusNode,
      selection.focusOffset,
    ),
  };
  return comparePosition(anchor, focus) <= 0
    ? { from: anchor, to: focus }
    : { from: focus, to: anchor };
}

function closestBlock(
  root: HTMLElement,
  node: Node | null,
): HTMLElement | null {
  let cursor: Node | null = node;
  while (cursor && cursor !== root) {
    if (cursor instanceof HTMLElement && cursor.dataset.rtIndex !== undefined) {
      return cursor;
    }
    cursor = cursor.parentNode;
  }
  return null;
}

function blockElementAt(root: HTMLElement, index: number): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-rt-index="${index}"]`);
}

function blockContentElement(block: HTMLElement): HTMLElement {
  if (block.dataset.rt === "code") {
    return block.querySelector<HTMLElement>("code") ?? block;
  }
  return block.querySelector<HTMLElement>('[data-rt="checktext"]') ?? block;
}

function offsetInBlock(
  container: HTMLElement,
  target: Node,
  targetOffset: number,
): number {
  const result = walkOffset(container, target, targetOffset, 0);
  return result.offset;
}

function walkOffset(
  node: Node,
  target: Node,
  targetOffset: number,
  offset: number,
): { found: boolean; offset: number } {
  if (node === target) {
    if (node.nodeType === Node.TEXT_NODE) {
      return {
        found: true,
        offset:
          offset +
          textOffsetWithoutCaretBoundaries(
            node.textContent ?? "",
            targetOffset,
          ),
      };
    }
    let nextOffset = offset;
    const children = [...node.childNodes].slice(0, targetOffset);
    for (const child of children) {
      nextOffset += nodeTextLength(child);
    }
    return { found: true, offset: nextOffset };
  }
  if (node instanceof HTMLElement && node.contentEditable === "false") {
    return { found: false, offset };
  }
  let nextOffset = offset;
  for (const child of node.childNodes) {
    const result = walkOffset(child, target, targetOffset, nextOffset);
    if (result.found) {
      return result;
    }
    nextOffset += nodeTextLength(child);
  }
  return { found: false, offset: nextOffset };
}

function nodeTextLength(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) {
    return textWithoutCaretBoundaries(node.textContent ?? "").length;
  }
  if (!(node instanceof HTMLElement) || node.contentEditable === "false") {
    return 0;
  }
  if (node.tagName.toLowerCase() === "br") {
    return 1;
  }
  return [...node.childNodes].reduce(
    (total, child) => total + nodeTextLength(child),
    0,
  );
}

function textLength(container: HTMLElement): number {
  return [...container.childNodes].reduce(
    (total, child) => total + nodeTextLength(child),
    0,
  );
}

function domPointFromDocPosition(
  root: HTMLElement,
  position: DocPosition,
): { node: Node; offset: number } | null {
  const block = blockElementAt(root, position.block);
  return block
    ? findNodeAtOffset(blockContentElement(block), Math.max(0, position.offset))
    : null;
}

function findNodeAtOffset(
  container: Node,
  offset: number,
): { node: Node; offset: number } {
  let remaining = offset;
  for (const child of container.childNodes) {
    const length = nodeTextLength(child);
    const index = childIndex(container, child);
    if (child.nodeType === Node.TEXT_NODE) {
      if (remaining < length) {
        return {
          node: child,
          offset: textOffsetWithCaretBoundaries(
            child.textContent ?? "",
            remaining,
          ),
        };
      }
      remaining -= length;
      continue;
    }
    if (child instanceof HTMLElement && child.tagName.toLowerCase() === "br") {
      if (remaining <= 0) {
        return { node: container, offset: index };
      }
      remaining -= length;
      continue;
    }
    if (
      child instanceof HTMLElement &&
      child.contentEditable !== "false" &&
      remaining === 0
    ) {
      return { node: container, offset: index };
    }
    if (
      child instanceof HTMLElement &&
      child.contentEditable !== "false" &&
      remaining < length
    ) {
      return findNodeAtOffset(child, remaining);
    }
    if (
      child instanceof HTMLElement &&
      child.contentEditable !== "false" &&
      remaining === length
    ) {
      return nextTextPoint(child) ?? { node: container, offset: index + 1 };
    }
    remaining -= length;
  }
  return { node: container, offset: container.childNodes.length };
}

function childIndex(parent: Node, child: Node): number {
  return Array.prototype.indexOf.call(parent.childNodes, child) as number;
}

function nextTextPoint(node: Node): { node: Node; offset: number } | null {
  let cursor = node.nextSibling;
  while (cursor) {
    if (cursor.nodeType === Node.TEXT_NODE) {
      return {
        node: cursor,
        offset: textOffsetWithCaretBoundaries(cursor.textContent ?? "", 0),
      };
    }
    if (cursor instanceof HTMLElement && cursor.contentEditable !== "false") {
      return findNodeAtOffset(cursor, 0);
    }
    cursor = cursor.nextSibling;
  }
  return null;
}

function previousEditableCharacter(node: Node, offset: number): string | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "")[offset - 1] ?? null;
  }
  const child = node.childNodes[offset - 1];
  return child ? lastEditableCharacter(child) : null;
}

function lastEditableCharacter(node: Node): string | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    return text[text.length - 1] ?? null;
  }
  if (!(node instanceof HTMLElement) || node.contentEditable === "false") {
    return null;
  }
  let index = node.childNodes.length - 1;
  while (index >= 0) {
    const character = lastEditableCharacter(node.childNodes[index]);
    if (character) {
      return character;
    }
    index -= 1;
  }
  return null;
}

function textWithoutCaretBoundaries(text: string): string {
  return text.replaceAll(editorCaretBoundary, "");
}

function textOffsetWithoutCaretBoundaries(
  text: string,
  domOffset: number,
): number {
  return textWithoutCaretBoundaries(text.slice(0, domOffset)).length;
}

function textOffsetWithCaretBoundaries(
  text: string,
  logicalOffset: number,
): number {
  let offset = 0;
  let index = 0;
  while (index < text.length) {
    if (text[index] !== editorCaretBoundary) {
      if (offset === logicalOffset) {
        return index;
      }
      offset += 1;
    }
    index += 1;
  }
  return text.length;
}

function comparePosition(left: DocPosition, right: DocPosition): number {
  if (left.block !== right.block) {
    return left.block - right.block;
  }
  return left.offset - right.offset;
}
