/** Labelled field examples for the Input stories. */
import {
  Check,
  DollarSign,
  Eye,
  EyeOff,
  Mail,
  Search,
  ShieldQuestionMark,
} from "../primitives/icons";
import { useState } from "react";

import { Input } from "../index";

export function LabelledExample() {
  const [value, setValue] = useState("");
  return (
    <Input
      // 1.3.5 Identify Input Purpose (AA): declare the field's purpose so the
      // browser/AT can autofill it. RNW forwards `autoComplete → autocomplete`.
      autoComplete="name"
      hint="As it appears on official documents."
      label="Full name"
      onChangeText={setValue}
      placeholder="Ada Lovelace"
      value={value}
    />
  );
}

export function ValidatedExample() {
  const [value, setValue] = useState("not-an-email");
  const valid = /.+@.+\..+/.test(value);
  return (
    <Input
      // 1.3.5 Identify Input Purpose (AA): an email field declares both its
      // autofill token and the email keyboard/input mode.
      autoComplete="email"
      error={valid ? undefined : "Enter a valid email address"}
      inputMode="email"
      label="Email"
      onChangeText={setValue}
      placeholder="you@example.com"
      prefixIcon={Mail}
      required
      value={value}
    />
  );
}

export function WithIconsExample() {
  const [value, setValue] = useState("250.00");
  return (
    <Input
      // 1.3.5 Identify Input Purpose (AA): a currency amount is decimal entry.
      inputMode="decimal"
      // 1.1.1 (A): both icons are decorative (hidden from AT). The leading
      // `$` purpose is already in the visible label/hint, and the trailing
      // `Check` is an affirmation the hint states in words — never the only
      // carrier of meaning. A *meaningful* trailing icon must instead be a
      // labelled, pressable suffix (see the password story's show/hide toggle).
      hint="Looks good — amount is in the account currency."
      label="Opening balance"
      onChangeText={setValue}
      prefixIcon={DollarSign}
      suffixIcon={Check}
      value={value}
    />
  );
}

export function ClearableExample() {
  const [value, setValue] = useState("Quarterly report");
  return (
    <Input
      clearable
      hint="The ✕ clears the field once there is text to remove."
      label="Search"
      onChangeText={setValue}
      placeholder="Search documents"
      prefixIcon={Search}
      value={value}
    />
  );
}

export function PasswordExample() {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  return (
    <Input
      // 1.3.5 Identify Input Purpose (AA): a sign-in password field.
      autoComplete="current-password"
      label="Password"
      onChangeText={setValue}
      onSuffixIconPress={() => setVisible((current) => !current)}
      placeholder="Enter a password"
      secureTextEntry={!visible}
      suffixIcon={visible ? EyeOff : Eye}
      suffixIconLabel={visible ? "Hide password" : "Show password"}
      value={value}
    />
  );
}

export function LabelInfoExample() {
  const [tax, setTax] = useState("");
  const [key, setKey] = useState("");
  return (
    <>
      <Input
        // The ⓘ button after the label opens a tooltip with the detail, so the
        // always-read `hint` slot stays free for the short, everyday guidance.
        hint="9 or 12 digits, no spaces."
        label="VAT number"
        labelInfo="Your VAT registration number identifies your business to the tax authority. Leave it blank if you are not VAT registered."
        onChangeText={setTax}
        placeholder="GB123456789"
        value={tax}
      />
      <Input
        // `labelInfoIcon` swaps the default ⓘ for any lucide glyph; a custom
        // `labelInfoLabel` names the button when the default reads awkwardly.
        label="API key"
        labelInfo="Create a key in Settings → Developers. Treat it like a password — it grants full access to your account."
        labelInfoIcon={ShieldQuestionMark}
        labelInfoLabel="How to find your API key"
        onChangeText={setKey}
        placeholder="sk_live_…"
        secureTextEntry
        value={key}
      />
    </>
  );
}

export function BareExample() {
  const [value, setValue] = useState("");
  return (
    <Input
      accessibilityLabel="Promo code"
      clearable
      onChangeText={setValue}
      placeholder="Promo code"
      value={value}
    />
  );
}

export function FieldSizesExample() {
  const [extraSmall, setExtraSmall] = useState("Invoices");
  const [small, setSmall] = useState("");
  const [medium, setMedium] = useState("");
  const [large, setLarge] = useState("");
  return (
    <>
      {/* The dense size: a 26px frame around a 24px input, with a 24px Clear
          action. */}
      <Input
        clearable
        label="Extra small field"
        onChangeText={setExtraSmall}
        placeholder="Search"
        prefixIcon={Search}
        size="xs"
        value={extraSmall}
      />
      <Input
        label="Small field"
        onChangeText={setSmall}
        placeholder="Search"
        prefixIcon={Search}
        size="sm"
        value={small}
      />
      <Input
        label="Medium field"
        onChangeText={setMedium}
        placeholder="Search"
        prefixIcon={Search}
        size="md"
        value={medium}
      />
      <Input
        label="Large field"
        onChangeText={setLarge}
        placeholder="Search"
        prefixIcon={Search}
        size="lg"
        value={large}
      />
    </>
  );
}
