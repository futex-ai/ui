import assert from "node:assert/strict";
import test from "node:test";

import { snapshotOptOut, SNAPSHOT_OPT_OUTS } from "../browser/snapshotOptOuts";

// Every gap in the visual sweep has to stay auditable at a glance, so the
// opt-out list is held to the shape its readers assume: one sorted entry per
// story, each carrying a one-line reason. `snapshots.spec.ts` separately fails
// when an entry names a story that no longer exists, which needs a running
// Storybook and so cannot be checked here.

test("every snapshot opt-out gives a one-line reason", () => {
  for (const [id, optOut] of Object.entries(SNAPSHOT_OPT_OUTS)) {
    assert.ok(
      optOut.reason.trim().length > 0,
      `${id} opts out of the snapshot sweep without a reason`,
    );
    assert.ok(
      !optOut.reason.includes("\n"),
      `${id} should explain itself in one line`,
    );
  }
});

test("snapshot opt-outs are listed in story id order", () => {
  const ids = Object.keys(SNAPSHOT_OPT_OUTS);
  assert.deepEqual(ids, [...ids].sort());
});

test("a story with no entry is not opted out", () => {
  assert.equal(snapshotOptOut("button-examples--tones"), undefined);
});
