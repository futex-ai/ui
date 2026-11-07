# Concurrent urgent notices can lose announcements

- **Severity:** Low. **Likelihood:** Rare. **Effort:** Medium. **Confidence:** Medium. **Harder later:** No.
- **Kind:** Fix after merge.
- **Added:** 2026-11-07, from `conductor/firna-ui-parts-for-conductive`, implementation item 9.
- **Location:** `src/announcer.ts:82` and `src/notice/useUrgentAnnouncement.ts:52`.
- **Reason:** The uncommon timing case needs a shared announcement change with checks for existing status callers.

- **Terms:**
  - **Live region:** A web element whose text changes reach assistive technology without moving focus.
  - **Urgent notice:** A persistent `Notice` with `tone="urgent"` that announces its message assertively.
- **Background:** The library announces urgent notices through `announce` in `src/announcer.ts`.
  Web announcements share one live region for each politeness level.
  Each call clears that region and schedules its message with `requestAnimationFrame`.
  Other components use the same function for transient status updates.
- **Problem:** Two urgent notices mounted in one frame schedule writes to the same assertive region.
  The final write can replace the first before assistive technology reads it.
  Code inspection supports this risk, but no physical screen reader reproduction exists.
- **Impact if no action:** A person can miss one urgent message when multiple notices appear together.
  Both messages remain visible and available in document navigation.
- **Root question:** How can simultaneous urgent notices announce all their messages?
- **Options:**
  - **A.** Batch concurrent urgent-notice messages through a dedicated announcement helper.
    Keep existing transient status behavior.
    Check web and native delivery and repeated-message handling.
    Effort: Medium.
  - **B.** Give each urgent notice its own managed announcement region.
    Check initial mount behavior and native parity.
    More regions increase lifecycle work and risk repeated announcements.
    Effort: Medium.
  - **C.** Queue every call to the shared announcer.
    Audit existing callers because selection and search updates can become stale before delivery.
    Effort: Large.
- **Left out:** Keep only the final message.
  This fails the requirement that each urgent notice announces its message.
  A fixed delay cannot prove that a screen reader consumed the first message.
- **Wider fix:** A prevents collisions for persistent urgent notices without changing transient status semantics.
- **Previous examples:** `src/announcer.ts` serves status updates from multiple component families.
  No other recorded item covers concurrent urgent notices.
- **Recommendation:** A. Dedicated batching preserves both urgent messages and the existing status behavior.
- **Action:** fix after merge, apply A, because this rare timing case requires checks across a shared accessibility boundary.
