import type { LegacyRosterInput } from "./legacy-roster";

type LineContext = {
  crossingSeason: string | null;
  crossingYear: number | null;
  groupLineName: string | null;
};

type ColumnOffsets = {
  lineName: number;
  email: number;
  phone: number;
  address: number;
};

type ParseResult = {
  records: LegacyRosterInput[];
  warnings: string[];
  ignoredContactLines: number;
};

const memberStartPattern = /^\s*(\d+)[.)]?\s+(.+)/;
const contactPattern = /@|\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/;
const termPattern =
  /\b(wtr\/spr|wtr|winter|spr|spring|summer|fall)\s*(2k\d{1,2}|\d{2,4})\b/i;
const reversedTermPattern =
  /\b(2k\d{1,2}|\d{2,4})\s*(wtr|winter|spr|spring|summer|fall)\b/i;

function parseYear(raw: string) {
  const normalized = raw.toLowerCase();

  if (normalized.startsWith("2k")) {
    return 2000 + Number(normalized.slice(2));
  }

  const year = Number(normalized);
  if (year < 100) {
    return year >= 50 ? 1900 + year : 2000 + year;
  }

  return year;
}

function parseLineHeading(line: string): LineContext | null {
  const forward = line.match(termPattern);
  const reversed = line.match(reversedTermPattern);
  const match = forward ?? reversed;

  if (!match) return null;

  const rawSeason = (forward ? match[1] : match[2]).toLowerCase();
  const seasonValue =
    rawSeason === "spr"
      ? "spring"
      : rawSeason === "wtr"
        ? "winter"
        : rawSeason;
  const yearValue = forward ? match[2] : match[1];
  const groupLineName =
    line
      .replace(match[0], "")
      .replace(/\s+/g, " ")
      .trim() || null;

  return {
    crossingSeason: seasonValue === "wtr/spr" ? null : seasonValue,
    crossingYear: parseYear(yearValue),
    groupLineName,
  };
}

function readColumns(line: string, offsets: ColumnOffsets) {
  return {
    name: line.slice(0, offsets.lineName).trim(),
    individualLineName: line.slice(offsets.lineName, offsets.email).trim(),
    email: line.slice(offsets.email, offsets.phone).trim(),
    phone: line.slice(offsets.phone, offsets.address).trim(),
    address: line.slice(offsets.address).trim(),
  };
}

function append(base: string, addition: string) {
  return [base, addition.trim()].filter(Boolean).join(" ");
}

export function parseRosterLayout(source: string): ParseResult {
  const offsets: ColumnOffsets = {
    lineName: 34,
    email: 54,
    phone: 91,
    address: 125,
  };
  let currentLine: LineContext = {
    crossingSeason: null,
    crossingYear: null,
    groupLineName: null,
  };
  const records: LegacyRosterInput[] = [];
  const warnings: string[] = [];
  let ignoredContactLines = 0;

  source.split(/\r?\n/).forEach((line, sourceIndex) => {
    if (
      line.includes("NAME") &&
      line.includes("Line Name") &&
      line.includes("Email")
    ) {
      return;
    }

    const memberMatch = line.match(memberStartPattern);
    if (!memberMatch) {
      const heading = parseLineHeading(line.trim());
      if (heading) {
        currentLine = heading;
        if (heading.crossingSeason === null) {
          warnings.push(`Line heading has a combined season: ${line.trim()}`);
        }
        return;
      }

      const possibleRecord = readColumns(line, offsets);
      if (
        possibleRecord.name &&
        /^[A-Za-z"'().\s-]+$/.test(possibleRecord.name) &&
        contactPattern.test(line)
      ) {
        records.push({
          sourceRow: sourceIndex + 1,
          ...possibleRecord,
          chapterInvisible: /chapter\s+invis(?:ible|able)/i.test(line),
          ...currentLine,
        });
        return;
      }

      if (records.length && line.trim() && !line.includes("\f")) {
        const continuation = readColumns(line, offsets);
        const last = records[records.length - 1];
        if (/chapter\s+invis(?:ible|able)/i.test(line)) {
          last.chapterInvisible = true;
        }
        const hasColumnContent =
          continuation.individualLineName ||
          continuation.email ||
          continuation.phone ||
          continuation.address;

        if (hasColumnContent) {
          last.individualLineName = append(
            last.individualLineName,
            continuation.individualLineName,
          );
          last.email = append(last.email, continuation.email);
          last.phone = append(last.phone, continuation.phone);
          last.address = append(last.address, continuation.address);
        } else if (contactPattern.test(line)) {
          ignoredContactLines += 1;
        }
      } else if (contactPattern.test(line)) {
        ignoredContactLines += 1;
      }
      return;
    }

    const columns = readColumns(line, offsets);
    records.push({
      sourceRow: sourceIndex + 1,
      name: columns.name.replace(memberStartPattern, "$2").trim(),
      individualLineName: columns.individualLineName,
      email: columns.email,
      phone: columns.phone,
      address: columns.address,
      chapterInvisible: /chapter\s+invis(?:ible|able)/i.test(line),
      ...currentLine,
    });
  });

  return { records, warnings, ignoredContactLines };
}
