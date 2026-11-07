import { MockLink } from "@mokly/mokly";

import { classes } from "../common/classes";
import styles from "./LinkTabs.module.css";

export type LinkTab = {
  label: string;
  /** The screen that the tab opens. Each tab has its own address. */
  to: string;
  /** A count after the label, such as the number of files. */
  count?: number;
  /** The tab of the page that shows now. */
  current: boolean;
  /** Draws keyboard focus on the tab, because a view runs no script. */
  focused?: boolean;
};

/**
 * The proposed `LinkTabs`: a navigation landmark whose tabs are links. The
 * current tab carries `aria-current="page"`. A filled bar shares its width
 * equally between the tabs, as a phone does.
 */
export function LinkTabs(props: {
  label: string;
  tabs: readonly LinkTab[];
  fill?: boolean;
}) {
  return (
    <nav
      aria-label={props.label}
      className={classes(styles.tabs, props.fill && styles.fill)}
    >
      {props.tabs.map((tab) => (
        <MockLink
          aria-current={tab.current ? "page" : undefined}
          className={classes(
            styles.tab,
            tab.current && styles.current,
            tab.focused && styles.focused,
          )}
          key={tab.label}
          to={tab.to}
        >
          <span className={styles.label}>{tab.label}</span>
          {tab.count === undefined ? null : (
            <span className={styles.count}>{tab.count}</span>
          )}
        </MockLink>
      ))}
    </nav>
  );
}
