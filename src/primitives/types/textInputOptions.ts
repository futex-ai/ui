/**
 * `TextInput`'s option unions and event payloads.
 *
 * Split from `textInput.ts` to keep both files short. Vendored from React
 * Native's public declarations (`Libraries/Components/TextInput/TextInput.d.ts`)
 * so the web build's declarations never reference the `react-native` package.
 * The unions are copied whole rather than trimmed: a value React Native's type
 * accepts has to be accepted here too, or a native consumer's prop stops
 * assigning into ours.
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. Licensed under the MIT
 * license found in the LICENSE file of the React Native source tree
 * (https://github.com/facebook/react-native).
 */
import type { NativeSyntheticEvent, TargetedEvent } from "./events";

/** On-screen keyboard layout to request. */
export type KeyboardTypeOptions =
  | "default"
  | "number-pad"
  | "decimal-pad"
  | "numeric"
  | "email-address"
  | "phone-pad"
  | "url"
  | "ascii-capable"
  | "numbers-and-punctuation"
  | "name-phone-pad"
  | "twitter"
  | "web-search"
  | "visible-password";

/** HTML-style input mode, the cross-platform spelling of `keyboardType`. */
export type InputModeOptions =
  | "none"
  | "text"
  | "decimal"
  | "numeric"
  | "tel"
  | "search"
  | "email"
  | "url";

/** Autofill hint. */
export type AutoCompleteOptions =
  | "additional-name"
  | "address-line1"
  | "address-line2"
  | "birthdate-day"
  | "birthdate-full"
  | "birthdate-month"
  | "birthdate-year"
  | "cc-csc"
  | "cc-exp"
  | "cc-exp-day"
  | "cc-exp-month"
  | "cc-exp-year"
  | "cc-number"
  | "cc-name"
  | "cc-given-name"
  | "cc-middle-name"
  | "cc-family-name"
  | "cc-type"
  | "country"
  | "current-password"
  | "email"
  | "family-name"
  | "gender"
  | "given-name"
  | "honorific-prefix"
  | "honorific-suffix"
  | "name"
  | "name-family"
  | "name-given"
  | "name-middle"
  | "name-middle-initial"
  | "name-prefix"
  | "name-suffix"
  | "new-password"
  | "nickname"
  | "one-time-code"
  | "organization"
  | "organization-title"
  | "password"
  | "password-new"
  | "postal-address"
  | "postal-address-country"
  | "postal-address-extended"
  | "postal-address-extended-postal-code"
  | "postal-address-locality"
  | "postal-address-region"
  | "postal-code"
  | "street-address"
  | "sms-otp"
  | "tel"
  | "tel-country-code"
  | "tel-national"
  | "tel-device"
  | "url"
  | "username"
  | "username-new"
  | "off";

/** Label of the keyboard's submit key. */
export type ReturnKeyTypeOptions =
  | "done"
  | "go"
  | "next"
  | "search"
  | "send"
  | "none"
  | "previous"
  | "default"
  | "google"
  | "join"
  | "route"
  | "yahoo"
  | "emergency-call";

/** Label of the keyboard's submit key, HTML spelling. */
export type EnterKeyHintTypeOptions =
  | "done"
  | "go"
  | "next"
  | "search"
  | "send"
  | "previous"
  | "enter";

/** Kinds of text iOS turns into tappable links. */
export type DataDetectorTypes =
  | "phoneNumber"
  | "link"
  | "address"
  | "calendarEvent"
  | "trackingNumber"
  | "flightNumber"
  | "lookupSuggestion"
  | "none"
  | "all";

/** What the field holds, so iOS can offer the right autofill. */
export type TextContentType =
  | "none"
  | "URL"
  | "addressCity"
  | "addressCityAndState"
  | "addressState"
  | "countryName"
  | "creditCardNumber"
  | "creditCardExpiration"
  | "creditCardExpirationMonth"
  | "creditCardExpirationYear"
  | "creditCardSecurityCode"
  | "creditCardType"
  | "creditCardName"
  | "creditCardGivenName"
  | "creditCardMiddleName"
  | "creditCardFamilyName"
  | "emailAddress"
  | "familyName"
  | "fullStreetAddress"
  | "givenName"
  | "jobTitle"
  | "location"
  | "middleName"
  | "name"
  | "namePrefix"
  | "nameSuffix"
  | "nickname"
  | "organizationName"
  | "postalCode"
  | "streetAddressLine1"
  | "streetAddressLine2"
  | "sublocality"
  | "telephoneNumber"
  | "username"
  | "password"
  | "newPassword"
  | "oneTimeCode"
  | "birthdate"
  | "birthdateDay"
  | "birthdateMonth"
  | "birthdateYear"
  | "cellularEID"
  | "cellularIMEI"
  | "dateTime"
  | "flightNumber"
  | "shipmentTrackingNumber";

/** What pressing the submit key does. */
export type SubmitBehavior = "submit" | "blurAndSubmit" | "newline";

/** Payload of `onFocus` / `onBlur` on a `TextInput`. */
export interface TextInputFocusEventData extends TargetedEvent {
  text: string;
  eventCount: number;
}

/** Payload of `onChange`. */
export interface TextInputChangeEventData extends TargetedEvent {
  eventCount: number;
  text: string;
}

/** Payload of `onSelectionChange`. */
export interface TextInputSelectionChangeEventData extends TargetedEvent {
  selection: { start: number; end: number };
}

/** Payload of `onKeyPress`. */
export interface TextInputKeyPressEventData {
  key: string;
}

/** Payload of `onContentSizeChange`. */
export interface TextInputContentSizeChangeEventData {
  contentSize: { width: number; height: number };
}

/** Payload of `onEndEditing`. */
export interface TextInputEndEditingEventData {
  text: string;
}

/** Payload of `onSubmitEditing`. */
export interface TextInputSubmitEditingEventData {
  text: string;
}

/** Payload of `onScroll` on a multiline `TextInput`. */
export interface TextInputScrollEventData {
  contentOffset: { x: number; y: number };
}

/** `onFocus` / `onBlur` event. */
export type TextInputFocusEvent = NativeSyntheticEvent<TextInputFocusEventData>;
