/** Labelled multiline text input field with validation and shared input chrome. */
import { Input, InputProps } from "./Input";

export type TextareaProps = Omit<InputProps, "multiline"> & {
  /** Number of visible text rows. Defaults to four rows. */
  numberOfLines?: InputProps["numberOfLines"];
};

/**
 * The shared labelled textarea. Reuses {@link Input}'s label, error, hint,
 * required, clearable, icon, and focus-ring behavior while forcing multiline
 * `TextInput` geometry.
 */
export function Textarea({ numberOfLines = 4, ...props }: TextareaProps) {
  return <Input multiline numberOfLines={numberOfLines} {...props} />;
}
