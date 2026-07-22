/** Pure scheduling and ownership rules for native editor focus transfers. */
import type { NativeTextSelection } from "./nativeTextEdit";
import type { RichTextBlock } from "./richTextModel";

type NativeRichTextFocusInput = {
  focus: () => void;
  setNativeProps: (props: { selection: NativeTextSelection }) => void;
};

type NativeRichTextFocusHandoff = {
  input: NativeRichTextFocusInput;
  isCurrent: () => boolean;
  onHandled: () => void;
  scheduleFrame: (callback: () => void) => number;
  selection: NativeTextSelection;
};

/** Build the unique iOS input-accessory identifier for one native block. */
export function nativeRichTextAccessoryID(
  accessoryId: string,
  block: number,
): string {
  return `${accessoryId}-${block}`;
}

/** Build one pre-registered iOS toolbar host for every editable native block. */
export function nativeRichTextAccessoryTargets(
  accessoryId: string,
  blockTypes: readonly RichTextBlock["type"][],
  activeBlock: number,
): { block: number; id: string; visible: boolean }[] {
  return blockTypes.flatMap((type, block) =>
    type === "divider"
      ? []
      : [
          {
            block,
            id: nativeRichTextAccessoryID(accessoryId, block),
            visible: block === activeBlock,
          },
        ],
  );
}

/** Return whether a blur belongs to the block that still owns editor focus. */
export function shouldClearNativeEditorFocus(
  activeBlock: number,
  blurredBlock: number,
): boolean {
  return activeBlock === blurredBlock;
}

/** Move native first-responder focus after the current input event has settled. */
export function scheduleNativeRichTextFocusHandoff({
  input,
  isCurrent,
  onHandled,
  scheduleFrame,
  selection,
}: NativeRichTextFocusHandoff): number {
  return scheduleFrame(() => {
    if (!isCurrent()) return;
    onHandled();
    input.focus();
    input.setNativeProps({ selection });
  });
}
