import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../../src", import.meta.url));

// Files allowed to contain literal white, with the exact count, so any new
// occurrence anywhere in src/ fails loudly instead of silently breaking the
// dark themes. Stories are exempt (demo scaffolding).
const WHITE_LITERAL_ALLOWLIST: Record<string, number> = {
  "theme.tsx": 4, // the two light presets' surface + onSolid "#ffffff" pairs
  "skeleton/Skeleton.tsx": 3, // sheen gradient stops stay white by design
  "workflow/WorkflowNode.tsx": 2, // fixed category palette glyphs (see D6)
  "toast/toastStyles.ts": 2, // hover washes rgba(255, 255, 255, 0.14) — drops to 1 in M3.3
  "switch/switchStyles.ts": 2, // knob + knobOn "#fff" — removed entirely in M3.1
};

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      return name === "stories" ? [] : walk(full);
    }
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [full] : [];
  });
}

test("no stray literal white in library source (dark-mode guard)", () => {
  const pattern = /"#fff(?:fff)?"|'#fff(?:fff)?'|rgba\(\s*255,\s*255,\s*255/gi;
  for (const file of walk(SRC)) {
    const relative = file.slice(SRC.length + 1);
    const count = (readFileSync(file, "utf8").match(pattern) ?? []).length;
    const allowed = WHITE_LITERAL_ALLOWLIST[relative] ?? 0;
    assert.equal(
      count,
      allowed,
      `${relative}: ${count} literal white value(s), expected ${allowed}. ` +
        `Use theme.colors.onSolid (or extend the allowlist with a rationale).`,
    );
  }
});
