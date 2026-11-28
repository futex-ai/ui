import assert from "node:assert/strict";
import test from "node:test";

import {
  handleTextFieldEnter,
  type TextFieldKeyEvent,
} from "../../src/primitives/textFieldEnter";
import type { SubmitBehavior } from "../../src/primitives/types/textInputOptions";

type SubmitCase = readonly [
  submitBehavior: SubmitBehavior | undefined,
  blurUnset: SubmitBehavior,
  blurTrue: SubmitBehavior,
  blurFalse: SubmitBehavior,
];

// React Native 0.85.3 resolves these cases in
// node_modules/react-native/Libraries/Components/TextInput/TextInput.js:557-581.
const singleLineCases: readonly SubmitCase[] = [
  [undefined, "blurAndSubmit", "blurAndSubmit", "submit"],
  ["newline", "blurAndSubmit", "blurAndSubmit", "blurAndSubmit"],
  ["submit", "submit", "submit", "submit"],
  ["blurAndSubmit", "blurAndSubmit", "blurAndSubmit", "blurAndSubmit"],
];

const multilineCases: readonly SubmitCase[] = [
  [undefined, "newline", "blurAndSubmit", "newline"],
  ["newline", "newline", "newline", "newline"],
  ["submit", "submit", "submit", "submit"],
  ["blurAndSubmit", "blurAndSubmit", "blurAndSubmit", "blurAndSubmit"],
];

const blurOnSubmitCases = [undefined, true, false] as const;
const expectedActions: Record<SubmitBehavior, readonly string[]> = {
  newline: [],
  submit: ["preventDefault", "submit Draft"],
  blurAndSubmit: ["preventDefault", "submit Draft", "blur"],
};

for (const multiline of [undefined, false, true]) {
  const cases = multiline ? multilineCases : singleLineCases;
  for (const [submitBehavior, ...behaviors] of cases) {
    for (const [index, blurOnSubmit] of blurOnSubmitCases.entries()) {
      const behavior = behaviors[index];
      test(`Enter uses ${behavior} with multiline=${multiline}, submitBehavior=${submitBehavior}, blurOnSubmit=${blurOnSubmit}`, (context) => {
        context.mock.timers.enable({ apis: ["setTimeout"] });
        const actions: string[] = [];
        const event = {
          currentTarget: { value: "Draft", blur: () => actions.push("blur") },
          isDefaultPrevented: () => false,
          key: "Enter",
          nativeEvent: {},
          preventDefault: () => actions.push("preventDefault"),
          shiftKey: false,
        };

        handleTextFieldEnter(event as unknown as TextFieldKeyEvent, {
          blurOnSubmit,
          multiline,
          onSubmitEditing: ({ nativeEvent }) => {
            actions.push(`submit ${nativeEvent.text}`);
          },
          submitBehavior,
        });
        context.mock.timers.runAll();

        assert.deepEqual(actions, expectedActions[behavior]);
      });
    }
  }
}
