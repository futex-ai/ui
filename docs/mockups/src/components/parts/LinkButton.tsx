import { MockLink } from "@mokly/mokly";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

import a11y from "../common/a11y.module.css";
import { classes } from "../common/classes";
import type { DrawnState } from "../common/drawnState";
import { useControlMetrics } from "../common/Surface";
import styles from "./LinkButton.module.css";

/** The tones of a link button: the button tones without `danger`. */
export type LinkButtonTone = "primary" | "secondary" | "ghost" | "plain";

type Destination =
  /** A screen of the app. */
  | { to: string; href?: never }
  /** A page outside the app, which opens in a new tab. */
  | { href: string; to?: never };

type LinkButtonProps = Destination & {
  children: string;
  icon?: LucideIcon;
  tone?: LinkButtonTone;
  block?: boolean;
  /** Put the label at the start, as in a list of links. */
  alignStart?: boolean;
  /** The link leads to the page that shows now. */
  current?: boolean;
  state?: DrawnState;
};

/**
 * The proposed `LinkButton`: a real anchor with the look of a `Button`.
 * It keeps standard link behaviour, so a user can open it in a new tab or
 * copy its address. A link to a page outside the app ends with an arrow and
 * tells assistive technology that it opens a new tab.
 */
export function LinkButton(props: LinkButtonProps) {
  const metrics = useControlMetrics();
  const Icon = props.icon;
  const className = classes(
    styles.link,
    styles[props.tone ?? "secondary"],
    props.block && styles.block,
    props.alignStart && styles.start,
    props.state === "hover" && styles.hover,
    props.state === "focus" && styles.focus,
  );
  const content = (
    <>
      {Icon ? <Icon aria-hidden size={metrics.iconSize} /> : null}
      <span className={styles.label}>{props.children}</span>
      {props.href ? (
        <>
          <ArrowUpRight
            aria-hidden
            className={styles.external}
            size={metrics.iconSize}
          />
          <span className={a11y.hidden}>(opens in a new tab)</span>
        </>
      ) : null}
    </>
  );
  if (props.href !== undefined) {
    return (
      <a
        className={className}
        href={props.href}
        rel="noreferrer"
        target="_blank"
      >
        {content}
      </a>
    );
  }
  return (
    <MockLink
      aria-current={props.current ? "page" : undefined}
      className={className}
      to={props.to}
    >
      {content}
    </MockLink>
  );
}

/** An icon-only link button, such as Back, with a required name. */
export function IconLinkButton(props: {
  label: string;
  icon: LucideIcon;
  to: string;
}) {
  const metrics = useControlMetrics();
  const Icon = props.icon;
  return (
    <MockLink
      aria-label={props.label}
      className={classes(styles.link, styles.plain, styles.square)}
      to={props.to}
    >
      <Icon aria-hidden size={metrics.iconSize + 4} />
    </MockLink>
  );
}
