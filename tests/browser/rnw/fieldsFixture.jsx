import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { Button } from "@firna/ui/button";
import {
  ComboboxMultiSelect,
  DropdownList,
  DropdownSelector,
} from "@firna/ui/dropdown";
import { Input } from "@firna/ui/input";
import { LinkButton } from "@firna/ui/link";

const options = [{ label: "Primary", value: "primary" }];

function SubmitField({ label, ...props }) {
  const [submissions, setSubmissions] = useState([]);
  return (
    <>
      <Input
        {...props}
        defaultValue="Draft"
        label={label}
        onSubmitEditing={(event) => {
          const { text } = event.nativeEvent;
          setSubmissions((previous) => [...previous, text]);
        }}
      />
      <output aria-label={`${label} submissions`}>
        {[submissions.length, ...submissions].join(": ")}
      </output>
    </>
  );
}

function RefFields() {
  const buttonRef = useRef(null);
  const inputRef = useRef(null);
  const linkRef = useRef(null);
  const listRef = useRef(null);
  const triggerRef = useRef(null);
  const dim = (ref) => ref.current.setNativeProps({ style: { opacity: 0.5 } });
  return (
    <>
      <LinkButton href="#details" linkRef={linkRef}>
        Details
      </LinkButton>
      <Button buttonRef={buttonRef} onPress={() => {}}>
        Save
      </Button>
      <Input defaultValue="Draft" inputRef={inputRef} label="Reference text" />
      <DropdownList
        entries={[{ id: "primary", label: "Primary", type: "item" }]}
        label="Reference list"
        listRef={listRef}
        maxHeight={200}
        onClose={() => {}}
      />
      <DropdownSelector
        onValueChange={() => {}}
        options={options}
        triggerLabel="Reference selector"
        triggerRef={triggerRef}
        value="primary"
      />
      <button onClick={() => dim(linkRef)}>Dim link</button>
      <button onClick={() => dim(buttonRef)}>Dim button</button>
      <button onClick={() => dim(listRef)}>Dim list</button>
      <button onClick={() => dim(triggerRef)}>Dim selector</button>
      <button
        onClick={() => inputRef.current.setNativeProps({ text: "Updated" })}
      >
        Replace text
      </button>
      <button
        onClick={() => {
          inputRef.current.focus();
          inputRef.current.setSelection(1, 4);
        }}
      >
        Select text
      </button>
    </>
  );
}

function FieldsFixture() {
  return (
    <>
      <SubmitField label="Message" multiline submitBehavior="submit" />
      <SubmitField label="Title" submitBehavior="submit" />
      <SubmitField
        blurOnSubmit
        label="Name"
        multiline
        submitBehavior="newline"
      />
      <SubmitField label="Reference" submitBehavior="newline" />
      <ComboboxMultiSelect
        label="Categories"
        onChange={() => {}}
        options={options}
        values={[]}
      />
      <RefFields />
    </>
  );
}

createRoot(document.getElementById("root")).render(<FieldsFixture />);
