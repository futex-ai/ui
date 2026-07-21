/** Shared public prop types for the web and native rich-text editors. */
import type {
  DocPosition,
  InlineMark,
  RichTextBlock,
  RichTextTurnIntoType,
} from "./richTextModel";

/** Commands exposed to slash-menu extension items. */
export type RichTextEditorCommands = {
  /** Return the current collapsed selection or range endpoints. */
  getSelection: () => { from: DocPosition; to: DocPosition } | null;
  /** Insert rich blocks at the current selection. */
  insertBlocks: (blocks: readonly RichTextBlock[]) => void;
  /** Toggle an inline mark across the current non-collapsed selection. */
  toggleMark: (mark: InlineMark) => void;
  /** Convert the selected block(s) to a supported block type. */
  turnInto: (type: RichTextTurnIntoType) => void;
};

/** Extra slash-menu item accepted by the public API. Native accepts and ignores it. */
export type SlashMenuItem = {
  execute?: (commands: RichTextEditorCommands) => void;
  icon?: unknown;
  id: string;
  keywords?: readonly string[];
  label: string;
  section?: string;
};

/** Public props shared by the web and native block editors. */
export type RichTextEditorProps = {
  /** Focus the editor after it mounts. */
  autoFocus?: boolean;
  /**
   * Disable the shared focus glow on the editor frame. It then falls back to the
   * browser's default focus outline so keyboard focus stays visible (WCAG 2.1 —
   * 2.4.7 Focus Visible, AA). Disable every ring at once via the theme's
   * `focusRing: false` flag instead.
   */
  disableFocusRing?: boolean;
  /** Visible field label. Also names the web textbox when present. */
  label?: string;
  /** Maximum editor body height in px; overflow scrolls inside the frame. */
  maxHeight?: number;
  /** Minimum editor body height in px. */
  minHeight?: number;
  /** Called with canonical markdown after committed edits. */
  onChangeMarkdown?: (markdown: string) => void;
  /** Placeholder shown while the document is one empty paragraph. */
  placeholder?: string;
  /** Render the editor read-only. */
  readOnly?: boolean;
  /** Additional web slash-menu items. Native accepts and ignores them. */
  slashExtraItems?: readonly SlashMenuItem[];
  /** Test identifier forwarded to the editable root. */
  testID?: string;
  /** Controlled markdown value. */
  value?: string;
};
