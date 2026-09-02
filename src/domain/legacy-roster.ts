export type LegacyRosterInput = {
  sourceRow: number;
  name: string;
  individualLineName: string;
  email: string;
  phone: string;
  address: string;
  crossingSeason: string | null;
  crossingYear: number | null;
  groupLineName: string | null;
  chapterInvisible?: boolean;
};

export type ImportReviewFlag =
  | "missing_email"
  | "invalid_email"
  | "ambiguous_line"
  | "possible_duplicate";

export type NormalizedLegacyRecord = {
  sourceRow: number;
  fullName: string;
  individualLineName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  crossingSeason: string | null;
  crossingYear: number | null;
  groupLineName: string | null;
  membershipStatus: "chapter_invisible" | null;
  verificationState: "unverified";
  importState: "ready_for_review" | "needs_review" | "chapter_invisible";
  reviewFlags: ImportReviewFlag[];
};

const chapterInvisiblePattern = /chapter\s+invis(?:ible|able)/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: string | null | undefined) {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized || null;
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return clean(value);
}

function normalizeRecord(input: LegacyRosterInput): NormalizedLegacyRecord {
  const sourceValues = [
    input.name,
    input.individualLineName,
    input.email,
    input.phone,
    input.address,
  ];
  const isChapterInvisible =
    input.chapterInvisible === true ||
    sourceValues.some((value) => {
      const normalized = clean(value);
      return (
        normalized !== null &&
        normalized.length <= 20 &&
        chapterInvisiblePattern.test(normalized)
      );
    });
  const rawEmail = clean(input.email)?.toLowerCase() ?? null;
  const email =
    !isChapterInvisible && rawEmail && emailPattern.test(rawEmail)
      ? rawEmail
      : null;
  const reviewFlags: ImportReviewFlag[] = [];

  if (!isChapterInvisible && !rawEmail) {
    reviewFlags.push("missing_email");
  } else if (!isChapterInvisible && !email) {
    reviewFlags.push("invalid_email");
  }

  if (!input.crossingSeason || !input.crossingYear) {
    reviewFlags.push("ambiguous_line");
  }

  return {
    sourceRow: input.sourceRow,
    fullName: clean(input.name) ?? "Unknown",
    individualLineName: isChapterInvisible
      ? null
      : clean(input.individualLineName),
    email,
    phone: isChapterInvisible ? null : normalizePhone(input.phone),
    address: isChapterInvisible ? null : clean(input.address),
    crossingSeason: clean(input.crossingSeason),
    crossingYear: input.crossingYear,
    groupLineName: clean(input.groupLineName),
    membershipStatus: isChapterInvisible ? "chapter_invisible" : null,
    verificationState: "unverified",
    importState: isChapterInvisible
      ? "chapter_invisible"
      : reviewFlags.length
        ? "needs_review"
        : "ready_for_review",
    reviewFlags,
  };
}

export function normalizeLegacyRoster(
  inputs: LegacyRosterInput[],
): NormalizedLegacyRecord[] {
  const records = inputs.map(normalizeRecord);
  const duplicateKeys = new Map<string, number[]>();

  records.forEach((record, index) => {
    const nameAndLine = [
      record.fullName.toLowerCase(),
      record.crossingSeason,
      record.crossingYear,
    ].join("|");
    const keys = [nameAndLine, record.email ? `email:${record.email}` : null];

    keys.forEach((key) => {
      if (!key) return;
      duplicateKeys.set(key, [...(duplicateKeys.get(key) ?? []), index]);
    });
  });

  const duplicateIndexes = new Set(
    [...duplicateKeys.values()]
      .filter((indexes) => indexes.length > 1)
      .flat(),
  );

  return records.map((record, index) => {
    if (!duplicateIndexes.has(index)) {
      return record;
    }

    return {
      ...record,
      importState:
        record.importState === "chapter_invisible"
          ? record.importState
          : ("needs_review" as const),
      reviewFlags: [...record.reviewFlags, "possible_duplicate"],
    };
  });
}
