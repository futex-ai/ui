import { useId, type ReactNode } from "react";

import styles from "./Section.module.css";

/** A titled part of a page, with an optional action beside the title. */
export function Section(props: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title} id={id}>
          {props.title}
        </h2>
        {props.action}
      </div>
      {props.children}
    </section>
  );
}

/** Running text in the body role of the surface's type scale. */
export function Paragraph(props: { children: ReactNode }) {
  return <p className={styles.paragraph}>{props.children}</p>;
}
