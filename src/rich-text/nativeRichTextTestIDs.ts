/** Stable automation identifiers for native rich-text fields and blocks. */
import type { RichTextBlock } from "./richTextModel";

/** Native test identifiers derived from one public editor identifier. */
export type NativeRichTextTestIDs = {
  blocks: (string | undefined)[];
  field: string | undefined;
};

/**
 * The block that carries the public editor identifier: the first editable
 * block, since a divider cannot take typing. `-1` when every block is a divider.
 */
export function nativeRichTextPrimaryBlock(
  document: readonly RichTextBlock[],
): number {
  return document.findIndex((block) => block.type !== "divider");
}

/** Keep the public ID editable while naming the field and remaining blocks. */
export function buildNativeRichTextTestIDs(
  document: readonly RichTextBlock[],
  testID?: string,
): NativeRichTextTestIDs {
  if (!testID) {
    return {
      blocks: document.map(() => undefined),
      field: undefined,
    };
  }
  const primaryBlock = nativeRichTextPrimaryBlock(document);
  return {
    blocks: document.map((_, index) =>
      index === primaryBlock ? testID : `${testID}-block-${index}`,
    ),
    field: `${testID}-field`,
  };
}
