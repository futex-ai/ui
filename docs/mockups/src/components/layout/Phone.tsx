import type { ReactNode } from "react";

import { classes } from "../common/classes";
import styles from "./Phone.module.css";

/** The top bar of a phone screen: back, the titles, and the actions. */
export function PhoneHeader(props: {
  back?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header
      className={classes(styles.header, props.back ? styles.withBack : false)}
    >
      {props.back}
      <div className={styles.titles}>
        <h1 className={styles.title}>{props.title}</h1>
        {props.subtitle ? (
          <span className={styles.subtitle}>{props.subtitle}</span>
        ) : null}
      </div>
      {props.actions ? (
        <div className={styles.actions}>{props.actions}</div>
      ) : null}
    </header>
  );
}

/** The tab bar under the header, which grows with its 44 px tabs. */
export function PhoneTabs(props: { children: ReactNode }) {
  return <div className={styles.tabs}>{props.children}</div>;
}

/** The scrolling body of a phone screen. */
export function PhoneBody(props: { children: ReactNode; flush?: boolean }) {
  return (
    <main className={classes(styles.body, props.flush && styles.flush)}>
      {props.children}
    </main>
  );
}

/** The actions at the foot of a phone screen. They share the width. */
export function PhoneFooter(props: { children: ReactNode }) {
  return <div className={styles.footer}>{props.children}</div>;
}
