/** Stable automation identifiers for native rich-text fields and blocks. */
import type { RichTextBlock } from "./richTextModel";

/** Native test identifiers derived from one public editor identifier. */
export type NativeRichTextTestIDs = {
  blocks: (string | undefined)[];
  field: string | undefined;
};

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
  const primaryBlock = document.findIndex((block) => block.type !== "divider");
  return {
    blocks: document.map((_, index) =>
      index === primaryBlock ? testID : `${testID}-block-${index}`,
    ),
    field: `${testID}-field`,
  };
}
