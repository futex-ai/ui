import { Switch } from "@firna/ui/switch";
import { Archive } from "lucide-react";

import { useSurface } from "../../components/common/Surface";
import { Txt } from "../../components/common/Txt";
import { Section } from "../../components/layout/Section";
import { ActionButton } from "../../components/parts/Action";
import {
  Field,
  Segmented,
  Select,
  TextField,
} from "../../components/parts/Fields";
import { currentProject } from "../../fixtures/projects";
import { noop } from "../../noop";
import { paths } from "../../paths";
import styles from "./SettingsTab.module.css";

/** A switch beside its label. The `xs` size maps the switch to `sm`. */
function SwitchLine(props: { label: string }) {
  const phone = useSurface() === "phone";
  return (
    <div className={styles.switchLine}>
      <Switch
        accessibilityLabel={props.label}
        onValueChange={noop}
        size={phone ? "md" : "sm"}
        value
      />
      <span className={styles.switchLabel}>{props.label}</span>
    </div>
  );
}

/** The form actions. A phone shows them in its footer instead. */
export function SettingsActions() {
  return (
    <>
      <ActionButton to={paths.overview}>Cancel</ActionButton>
      <ActionButton tone="primary">Save changes</ActionButton>
    </>
  );
}

/**
 * The project settings: a dense form on desktop and a touch form on a
 * phone. The invalid state shows a field error with keyboard focus, and a
 * member's view of Archive.
 */
export function SettingsTab(props: { invalid: boolean }) {
  const phone = useSurface() === "phone";
  return (
    <>
      <Section title="General">
        <div className={styles.form}>
          <Field
            error={props.invalid ? "Enter a project name." : undefined}
            label="Name"
          >
            <TextField
              focused={props.invalid}
              invalid={props.invalid}
              label="Name"
              value={props.invalid ? "" : currentProject.name}
            />
          </Field>
          <Field
            hint="Each push to the default branch deploys."
            label="Repository"
          >
            <Select label="Repository" value={currentProject.repository} />
          </Field>
          <Field label="Default branch">
            <Select label="Default branch" value="main" />
          </Field>
          <Field label="Visibility">
            <Segmented
              label="Visibility"
              options={["Private", "Team", "Public"]}
              value="Team"
            />
          </Field>
          <Field label="Notifications">
            <SwitchLine label="Email me when a deploy fails" />
          </Field>
        </div>
        {phone ? null : (
          <div className={styles.actions}>
            <SettingsActions />
          </div>
        )}
      </Section>
      <Section title="Archive">
        <Txt color="secondary">
          Archived projects keep their history and stop deploying.
        </Txt>
        <div className={styles.archive}>
          <ActionButton disabled={props.invalid} icon={Archive} tone="danger">
            Archive project
          </ActionButton>
          {props.invalid ? (
            <Txt variant="caption">Ask an admin to archive this project.</Txt>
          ) : null}
        </div>
      </Section>
    </>
  );
}
