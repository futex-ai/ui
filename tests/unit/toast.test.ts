import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  COOKIE_CONSENT_LAYERS,
  WEB_MODAL_LAYERS,
} from "../../src/modal/modalLayers";
import { TOAST_LAYERS, toastClearsLayer } from "../../src/toast/toastLayers";
import {
  createToastItem,
  DEFAULT_TOAST_DURATION,
  DEFAULT_TOAST_MAX,
  DEFAULT_TOAST_PLACEMENT,
  DEFAULT_TOAST_TONE,
  dequeueToast,
  enqueueToast,
  makeToastId,
  resolveToastDuration,
  toastLiveRegion,
  toastRole,
  toastStackAlign,
  toastStackDirection,
  toastViewportInset,
} from "../../src/toast/toastModel";
import type { ToastItem } from "../../src/toast/toastModel";

const baseItem = (id: string): ToastItem => ({
  dismissible: true,
  duration: null,
  id,
  title: id,
  tone: "info",
});

test("toast defaults are stable so value drift is caught", () => {
  assert.equal(DEFAULT_TOAST_TONE, "info");
  assert.equal(DEFAULT_TOAST_DURATION, 5000);
  assert.equal(DEFAULT_TOAST_MAX, 4);
  assert.equal(DEFAULT_TOAST_PLACEMENT, "bottom-right");
  // The createToastItem defaults must track the exported constants.
  const item = createToastItem(
    "toast-0",
    { title: "x" },
    DEFAULT_TOAST_DURATION,
  );
  assert.equal(item.tone, DEFAULT_TOAST_TONE);
  assert.equal(item.duration, DEFAULT_TOAST_DURATION);
  assert.equal(item.dismissible, true);
});

test("toast duration resolves defaults, sticky, and non-positive values", () => {
  assert.equal(resolveToastDuration(undefined, 5000), 5000);
  assert.equal(resolveToastDuration(2000, 5000), 2000);
  // Explicit null and non-positive values are sticky (no auto-dismiss).
  assert.equal(resolveToastDuration(null, 5000), null);
  assert.equal(resolveToastDuration(0, 5000), null);
  assert.equal(resolveToastDuration(-1, 5000), null);
});

test("createToastItem fills defaults and forwards caller options", () => {
  const minimal = createToastItem("toast-0", { title: "Saved" }, 5000);
  assert.deepEqual(minimal, {
    action: undefined,
    description: undefined,
    dismissible: true,
    duration: 5000,
    id: "toast-0",
    title: "Saved",
    tone: "info",
  });

  const action = { label: "Undo", onPress: () => undefined };
  const full = createToastItem(
    "toast-1",
    {
      action,
      description: "Removed invoice",
      dismissible: false,
      duration: null,
      title: "Deleted",
      tone: "error",
    },
    5000,
  );
  assert.equal(full.tone, "error");
  assert.equal(full.dismissible, false);
  assert.equal(full.duration, null);
  assert.equal(full.action, action);
  assert.equal(full.description, "Removed invoice");
});

test("enqueueToast appends and trims the oldest beyond the cap", () => {
  let list: ToastItem[] = [];
  for (const id of ["a", "b", "c", "d", "e"]) {
    list = enqueueToast(list, baseItem(id), 3);
  }
  // Only the three newest survive, in insertion order.
  assert.deepEqual(
    list.map((toast) => toast.id),
    ["c", "d", "e"],
  );

  // A non-positive cap disables trimming.
  const uncapped = enqueueToast(
    [baseItem("a"), baseItem("b")],
    baseItem("c"),
    0,
  );
  assert.equal(uncapped.length, 3);
});

test("dequeueToast removes by id and ignores unknown ids", () => {
  const list = [baseItem("a"), baseItem("b"), baseItem("c")];
  assert.deepEqual(
    dequeueToast(list, "b").map((toast) => toast.id),
    ["a", "c"],
  );
  assert.deepEqual(dequeueToast(list, "missing"), list);
});

test("makeToastId is stable and ordered by sequence", () => {
  assert.equal(makeToastId(0), "toast-0");
  assert.equal(makeToastId(7), "toast-7");
});

test("toast accessibility maps errors to assertive alerts", () => {
  assert.equal(toastLiveRegion("error"), "assertive");
  assert.equal(toastRole("error"), "alert");
  for (const tone of ["info", "success", "warning"] as const) {
    assert.equal(toastLiveRegion(tone), "polite");
    assert.equal(toastRole(tone), "status");
  }
});

test("toast stack direction keeps the newest toast nearest the pinned edge", () => {
  assert.equal(toastStackDirection("top-right"), "column-reverse");
  assert.equal(toastStackDirection("top-center"), "column-reverse");
  assert.equal(toastStackDirection("bottom-right"), "column");
  assert.equal(toastStackDirection("bottom-left"), "column");
});

test("toast stack alignment follows the horizontal placement segment", () => {
  assert.equal(toastStackAlign("top-left"), "flex-start");
  assert.equal(toastStackAlign("bottom-center"), "center");
  assert.equal(toastStackAlign("bottom-right"), "flex-end");
});

test("toast viewport inset pins the right edges per placement", () => {
  assert.deepEqual(toastViewportInset("bottom-right"), {
    bottom: 16,
    right: 16,
  });
  assert.deepEqual(toastViewportInset("top-left"), { left: 16, top: 16 });
  // Center placements span the full width so the stack can center.
  assert.deepEqual(toastViewportInset("top-center"), {
    left: 0,
    right: 0,
    top: 16,
  });
});

test("toast viewport floats above modals and the consent banner", () => {
  assert.equal(
    toastClearsLayer(TOAST_LAYERS.viewport, WEB_MODAL_LAYERS.nestedOverlay),
    true,
  );
  assert.equal(
    toastClearsLayer(TOAST_LAYERS.viewport, COOKIE_CONSENT_LAYERS.banner),
    true,
  );
});

test("web toast viewport portals to the document body; native does not", () => {
  const web = readSource("../../src/toast/ToastViewport.web.tsx");
  const native = readSource("../../src/toast/ToastViewport.tsx");

  assert.match(web, /createPortal/);
  assert.match(web, /document\.body/);
  assert.match(web, /pointerEvents="box-none"/);
  assert.doesNotMatch(native, /createPortal|document\.body/);
  assert.match(native, /position: "absolute"/);
  assert.match(native, /pointerEvents="box-none"/);
});

test("toast surface owns an auto-dismiss timer and announces itself", () => {
  const source = readSource("../../src/toast/Toast.tsx");

  assert.match(source, /setTimeout/);
  assert.match(source, /clearTimeout/);
  // Sticky (duration null) and paused toasts skip the timer; the countdown
  // resumes from the time still owed rather than restarting on resume.
  assert.match(source, /remainingRef\.current === null \|\| paused/);
  assert.match(source, /remainingRef\.current = remaining - \(Date\.now\(\)/);
  assert.match(source, /accessibilityLiveRegion=\{toastLiveRegion/);
  assert.match(source, /role=\{toastRole/);
});

test("useToast throws outside a provider and the provider renders the viewport", () => {
  const context = readSource("../../src/toast/ToastContext.ts");
  const provider = readSource("../../src/toast/ToastProvider.tsx");

  assert.match(context, /must be used within a <ToastProvider>/);
  assert.match(provider, /<ToastViewport/);
  assert.match(provider, /enqueueToast/);
  assert.match(provider, /dequeueToast/);
});

test("public toast entrypoint exports surface, provider, context, models, and layers", () => {
  const source = readSource("../../src/toast/index.ts");

  assert.match(source, /Toast/);
  assert.match(source, /ToastProvider/);
  assert.match(source, /ToastContext/);
  assert.match(source, /ToastViewport/);
  assert.match(source, /toastModel/);
  assert.match(source, /toastLayers/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
