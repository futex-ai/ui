/**
 * The announcement of an urgent {@link Notice}: once when it appears, and
 * again only when its message changes.
 */
import { useEffect, useRef, type ReactNode } from "react";

import { announce } from "../announcer";

/**
 * The message that an urgent notice announces: the caller's
 * `announcementText` when it has one, else the title and then a text body. A
 * node body is not text the library can read, so without `announcementText`
 * the title alone is announced then.
 */
export function noticeAnnouncement(
  title: string,
  body: ReactNode,
  announcementText?: string,
): string {
  if (announcementText != null && announcementText !== "") {
    return announcementText;
  }
  const text =
    typeof body === "string" || typeof body === "number" ? String(body) : "";
  if (text === "") {
    return title;
  }
  // Join two sentences, without a second full stop after a title that ends
  // one already.
  return /[.!?…]$/.test(title) ? `${title} ${text}` : `${title}. ${text}`;
}

/**
 * Announces `message` assertively while `urgent` holds: when the notice
 * appears or turns urgent, and when the message changes. A re-render with the
 * same message, and React's development double effect, do not announce again.
 * Focus never moves. The visible notice keeps its alert role with its own live
 * behaviour off, so the shared announcer is the one path that speaks, on web
 * and native alike.
 */
export function useUrgentAnnouncement(urgent: boolean, message: string): void {
  const announced = useRef<string | null>(null);
  useEffect(() => {
    if (!urgent) {
      announced.current = null;
      return;
    }
    if (announced.current === message) {
      return;
    }
    announced.current = message;
    announce(message, { politeness: "assertive" });
  }, [message, urgent]);
}
