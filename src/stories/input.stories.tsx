import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Check,
  DollarSign,
  Eye,
  EyeOff,
  Mail,
  Search,
} from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

import { Input } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Input/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const surface = (node: React.ReactNode) => (
  <StorySurface>
    <View style={{ gap: 14, minWidth: 320 }}>{node}</View>
  </StorySurface>
);

export const LabelledField: Story = {
  name: "Labelled field",
  render: () => surface(<LabelledExample />),
};

export const ValidatedField: Story = {
  name: "Validated field",
  render: () => surface(<ValidatedExample />),
};

export const WithIcons: Story = {
  name: "Prefix and suffix icons",
  render: () => surface(<WithIconsExample />),
};

export const ClearableField: Story = {
  name: "Clearable field",
  render: () => surface(<ClearableExample />),
};

export const PasswordField: Story = {
  name: "Password with show/hide",
  render: () => surface(<PasswordExample />),
};

export const BareField: Story = {
  name: "Bare field (no label)",
  render: () => surface(<BareExample />),
};

function LabelledExample() {
  const [value, setValue] = useState("");
  return (
    <Input
      hint="As it appears on official documents."
      label="Full name"
      onChangeText={setValue}
      placeholder="Ada Lovelace"
      value={value}
    />
  );
}

function ValidatedExample() {
  const [value, setValue] = useState("not-an-email");
  const valid = /.+@.+\..+/.test(value);
  return (
    <Input
      error={valid ? undefined : "Enter a valid email address"}
      label="Email"
      onChangeText={setValue}
      placeholder="you@example.com"
      prefixIcon={Mail}
      required
      value={value}
    />
  );
}

function WithIconsExample() {
  const [value, setValue] = useState("250.00");
  return (
    <Input
      hint="Amount in the account currency."
      label="Opening balance"
      onChangeText={setValue}
      prefixIcon={DollarSign}
      suffixIcon={Check}
      value={value}
    />
  );
}

function ClearableExample() {
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

function PasswordExample() {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  return (
    <Input
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

function BareExample() {
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
