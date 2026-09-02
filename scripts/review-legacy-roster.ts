import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { ImportReviewFlag } from "../src/domain/legacy-roster";
import { normalizeLegacyRoster } from "../src/domain/legacy-roster";
import { parseRosterLayout } from "../src/domain/roster-layout";

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const inputPath = argument("--input");
const outputDirectory = resolve(
  argument("--output") ?? "private/roster-import",
);

if (!inputPath) {
  throw new Error(
    "Usage: npm run roster:review -- --input /private/path/to/layout.txt",
  );
}

const source = await readFile(resolve(inputPath), "utf8");
const parsed = parseRosterLayout(source);
const records = normalizeLegacyRoster(parsed.records);
const countFlag = (flag: ImportReviewFlag) =>
  records.filter((record) => record.reviewFlags.includes(flag)).length;
const summary = {
  generatedAt: new Date().toISOString(),
  sourceRecordsDetected: records.length,
  readyForOfficerReview: records.filter(
    (record) => record.importState === "ready_for_review",
  ).length,
  needsManualCorrection: records.filter(
    (record) => record.importState === "needs_review",
  ).length,
  chapterInvisible: records.filter(
    (record) => record.importState === "chapter_invisible",
  ).length,
  flags: {
    missingEmail: countFlag("missing_email"),
    invalidEmail: countFlag("invalid_email"),
    ambiguousLine: countFlag("ambiguous_line"),
    possibleDuplicate: countFlag("possible_duplicate"),
  },
  extraction: {
    warnings: parsed.warnings,
    ignoredContactLines: parsed.ignoredContactLines,
  },
  productionImportAllowed: false,
};

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(
    resolve(outputDirectory, "staging-records.json"),
    `${JSON.stringify(records, null, 2)}\n`,
    { mode: 0o600 },
  ),
  writeFile(
    resolve(outputDirectory, "review-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    { mode: 0o600 },
  ),
]);

console.log(JSON.stringify(summary, null, 2));
