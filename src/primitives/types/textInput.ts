/**
 * `TextInput`: its props, instance and component type.
 *
 * Vendored from React Native's public declarations
 * (`Libraries/Components/TextInput/TextInput.d.ts`) so the web build's
 * declarations never reference the `react-native` package. `TextInputProps` is
 * part of the public API (`InputFrameProps` is `Omit<TextInputProps, "style">`
 * plus the field's own props), so the platform-only props are kept even though
 * the web backend ignores them: dropping one would reject a native consumer's
 * prop. The option unions and event payloads live in `textInputOptions.ts`.
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. Licensed under the MIT
 * license found in the LICENSE file of the React Native source tree
 * (https://github.com/facebook/react-native).
 */
import type { ForwardRefExoticComponent, RefAttributes } from "react";

import type { ViewProps } from "./components";
import type { NativeSyntheticEvent, NativeTouchEvent } from "./events";
import type { HostInstance } from "./hostInstance";
import type { ColorValue } from "./layout";
import type { StyleProp, TextStyle } from "./style";
import type {
  AutoCompleteOptions,
  DataDetectorTypes,
  EnterKeyHintTypeOptions,
  InputModeOptions,
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  SubmitBehavior,
  TextContentType,
  TextInputChangeEventData,
  TextInputContentSizeChangeEventData,
  TextInputEndEditingEventData,
  TextInputKeyPressEventData,
  TextInputScrollEventData,
  TextInputSelectionChangeEventData,
  TextInputSubmitEditingEventData,
} from "./textInputOptions";

/** iOS-only `TextInput` props. Accepted everywhere, honoured on iOS. */
export interface TextInputIOSProps {
  clearButtonMode?:
    | "never"
    | "while-editing"
    | "unless-editing"
    | "always"
    | undefined;
  clearTextOnFocus?: boolean | undefined;
  dataDetectorTypes?: DataDetectorTypes | DataDetectorTypes[] | undefined;
  disableKeyboardShortcuts?: boolean | undefined;
  enablesReturnKeyAutomatically?: boolean | undefined;
  keyboardAppearance?: "default" | "light" | "dark" | undefined;
  lineBreakModeIOS?:
    | "wordWrapping"
    | "char"
    | "clip"
    | "head"
    | "middle"
    | "tail"
    | undefined;
  lineBreakStrategyIOS?:
    | "none"
    | "standard"
    | "hangul-word"
    | "push-out"
    | undefined;
  passwordRules?: string | null | undefined;
  rejectResponderTermination?: boolean | null | undefined;
  smartInsertDelete?: boolean | undefined;
  spellCheck?: boolean | undefined;
  textContentType?: TextContentType | undefined;
}

/** Android-only `TextInput` props. Accepted everywhere, honoured on Android. */
export interface TextInputAndroidProps {
  cursorColor?: ColorValue | null | undefined;
  disableFullscreenUI?: boolean | undefined;
  importantForAutofill?:
    | "auto"
    | "no"
    | "noExcludeDescendants"
    | "yes"
    | "yesExcludeDescendants"
    | undefined;
  inlineImageLeft?: string | undefined;
  inlineImagePadding?: number | undefined;
  returnKeyLabel?: string | undefined;
  selectionHandleColor?: ColorValue | null | undefined;
  showSoftInputOnFocus?: boolean | undefined;
  textAlignVertical?: "auto" | "top" | "bottom" | "center" | undefined;
  textBreakStrategy?: "simple" | "highQuality" | "balanced" | undefined;
  underlineColorAndroid?: ColorValue | undefined;
  verticalAlign?: "auto" | "top" | "bottom" | "middle" | undefined;
}

/**
 * Props of a `TextInput`.
 *
 * @see https://reactnative.dev/docs/textinput#props
 */
export interface TextInputProps
  extends ViewProps, TextInputIOSProps, TextInputAndroidProps {
  /** Whether the font respects the OS text-size setting. */
  allowFontScaling?: boolean | undefined;
  autoCapitalize?: "none" | "sentences" | "words" | "characters" | undefined;
  autoComplete?: AutoCompleteOptions | undefined;
  autoCorrect?: boolean | undefined;
  autoFocus?: boolean | undefined;
  /** Deprecated spelling of {@link TextInputProps.submitBehavior}. */
  blurOnSubmit?: boolean | undefined;
  /** Hides the caret without disabling editing. */
  caretHidden?: boolean | undefined;
  /** Suppresses the native copy/paste menu. */
  contextMenuHidden?: boolean | undefined;
  /** Initial text for an uncontrolled field. */
  defaultValue?: string | undefined;
  /** Whether the text can be changed. */
  editable?: boolean | undefined;
  enterKeyHint?: EnterKeyHintTypeOptions | undefined;
  /** Links the field to an `InputAccessoryView` by id (iOS). */
  inputAccessoryViewID?: string | undefined;
  /** Label of the accessory view's button (iOS). */
  inputAccessoryViewButtonLabel?: string | undefined;
  inputMode?: InputModeOptions | undefined;
  keyboardType?: KeyboardTypeOptions | undefined;
  maxLength?: number | undefined;
  /** Highest font scale applied when `allowFontScaling` is on. */
  maxFontSizeMultiplier?: number | null | undefined;
  multiline?: boolean | undefined;
  /** Rows a multiline field shows before it scrolls. */
  numberOfLines?: number | undefined;
  onChange?:
    | ((event: NativeSyntheticEvent<TextInputChangeEventData>) => void)
    | undefined;
  onChangeText?: ((text: string) => void) | undefined;
  onContentSizeChange?:
    | ((
        event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
      ) => void)
    | undefined;
  onEndEditing?:
    | ((event: NativeSyntheticEvent<TextInputEndEditingEventData>) => void)
    | undefined;
  onKeyPress?:
    | ((event: NativeSyntheticEvent<TextInputKeyPressEventData>) => void)
    | undefined;
  onPress?:
    | ((event: NativeSyntheticEvent<NativeTouchEvent>) => void)
    | undefined;
  onPressIn?:
    | ((event: NativeSyntheticEvent<NativeTouchEvent>) => void)
    | undefined;
  onPressOut?:
    | ((event: NativeSyntheticEvent<NativeTouchEvent>) => void)
    | undefined;
  onScroll?:
    | ((event: NativeSyntheticEvent<TextInputScrollEventData>) => void)
    | undefined;
  onSelectionChange?:
    | ((event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => void)
    | undefined;
  onSubmitEditing?:
    | ((event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void)
    | undefined;
  placeholder?: string | undefined;
  placeholderTextColor?: ColorValue | undefined;
  /** Whether the text is read-only; the modern spelling of `editable`. */
  readOnly?: boolean | undefined;
  returnKeyType?: ReturnKeyTypeOptions | undefined;
  /** Whether a multiline field scrolls its own content (iOS). */
  scrollEnabled?: boolean | undefined;
  secureTextEntry?: boolean | undefined;
  /** Controlled selection range. */
  selection?: { start: number; end?: number | undefined } | undefined;
  selectionColor?: ColorValue | undefined;
  selectTextOnFocus?: boolean | undefined;
  style?: StyleProp<TextStyle> | undefined;
  submitBehavior?: SubmitBehavior | undefined;
  textAlign?: "left" | "center" | "right" | undefined;
  /** The controlled text. */
  value?: string | undefined;
}

/** A mounted `TextInput`. */
export interface TextInputInstance extends HostInstance {
  /** Whether the field currently holds focus. */
  isFocused(): boolean;
  /** Removes all text from the field. */
  clear(): void;
  /** Sets the selection range. */
  setSelection(start: number, end: number): void;
}

/** The `TextInput` component. */
export type TextInputComponent = ForwardRefExoticComponent<
  TextInputProps & RefAttributes<TextInputInstance>
>;
