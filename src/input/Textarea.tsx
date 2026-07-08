/** Labelled multiline text input field with validation and shared input chrome. */
import { Input, InputProps } from "./Input";

export type TextareaProps = Omit<InputProps, "multiline"> & {
  /**
   * Number of visible text rows. Defaults to four rows, and — when `maxLines`
   * is set — is the minimum the field can shrink back to.
   */
  numberOfLines?: InputProps["numberOfLines"];
  /**
   * Cap for auto-grow, in rows. When set above `numberOfLines`, the textarea
   * starts at `numberOfLines` rows and grows with content up to `maxLines`
   * rows, then scrolls. Omit for a fixed-height textarea. On web this needs a
   * controlled `value`.
   */
  maxLines?: InputProps["maxLines"];
};

/**
 * The shared labelled textarea. Reuses {@link Input}'s label, error, hint,
 * required, clearable, icon, and focus-ring behavior while forcing multiline
 * `TextInput` geometry. Pass `maxLines` (above `numberOfLines`) to make it
 * auto-grow from its initial rows up to that cap.
 */
export function Textarea({ numberOfLines = 4, ...props }: TextareaProps) {
  return <Input multiline numberOfLines={numberOfLines} {...props} />;
}
