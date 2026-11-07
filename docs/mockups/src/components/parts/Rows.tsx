import { useId, type ReactNode } from "react";
import { MockLink } from "@mokly/mokly";

import { classes } from "../common/classes";
import styles from "./Rows.module.css";

/**
 * A list of rows at the row size of its surface: 26 px for one line on
 * desktop, and 44 px on a phone. A longer row grows with its content. A
 * divided list draws a hairline between rows, never after the last. A
 * bleeding list moves out by the row padding, so the row content lines up
 * with the headings and text around it.
 */
export function RowList(props: {
  label?: string;
  divided?: boolean;
  bleed?: boolean;
  children: ReactNode;
}) {
  return (
    <ul
      aria-label={props.label}
      className={classes(
        styles.list,
        props.divided && styles.divided,
        props.bleed && styles.bleed,
      )}
      role="list"
    >
      {props.children}
    </ul>
  );
}

/** A titled group of rows, such as the pinned projects. */
export function RowSection(props: {
  title: string;
  divided?: boolean;
  bleed?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className={classes(styles.section, props.bleed && styles.bleed)}
    >
      <h3 className={styles.sectionTitle} id={id}>
        {props.title}
      </h3>
      <ul
        className={classes(styles.list, props.divided && styles.divided)}
        role="list"
      >
        {props.children}
      </ul>
    </section>
  );
}

/**
 * One row: a leading mark, a title with an optional second line, and a
 * trailing detail. A row with a destination is a link, and the row of the
 * page that shows now carries `aria-current="page"`.
 */
export function Row(props: {
  leading?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  trailing?: ReactNode;
  /** The screen that the row opens. */
  to?: string;
  current?: boolean;
  /** Draws the pointer over the row, because a view runs no script. */
  hovered?: boolean;
}) {
  const className = classes(
    styles.row,
    props.current && styles.current,
    props.hovered && styles.hovered,
  );
  const content = (
    <>
      {props.leading ? (
        <span className={styles.leading}>{props.leading}</span>
      ) : null}
      <span className={styles.main}>
        <span className={styles.title}>{props.title}</span>
        {props.detail ? (
          <span className={styles.detail}>{props.detail}</span>
        ) : null}
      </span>
      {props.trailing ? (
        <span className={styles.trailing}>{props.trailing}</span>
      ) : null}
    </>
  );
  return (
    <li className={styles.item}>
      {props.to ? (
        <MockLink
          aria-current={props.current ? "page" : undefined}
          className={className}
          to={props.to}
        >
          {content}
        </MockLink>
      ) : (
        <div className={className}>{content}</div>
      )}
    </li>
  );
}
