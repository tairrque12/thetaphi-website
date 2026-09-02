import { describe, expect, it } from "vitest";

import { parseRosterLayout } from "./roster-layout";

describe("legacy PDF layout parsing", () => {
  it("associates numbered rows with the current crossing line", () => {
    const source = [
      "NAME                                Line Name                       Email                          Phone Number                     Address",
      "                              Fall 23  Example Line",
      "1 John Doe                           Individual Name                 john@example.com               334-555-1911                    Troy, AL",
      "2 James Smith                                                        james@example.com              205-555-1911                    Birmingham, AL",
    ].join("\n");

    const result = parseRosterLayout(source);

    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toMatchObject({
      name: "John Doe",
      crossingSeason: "fall",
      crossingYear: 2023,
      groupLineName: "Example Line",
    });
  });

  it("marks combined Winter/Spring headings as ambiguous", () => {
    const source = [
      "                   Wtr/Spr 76 Historical 20",
      "1 John Doe                           Chapter Invisible",
    ].join("\n");

    const result = parseRosterLayout(source);

    expect(result.records[0]).toMatchObject({
      crossingSeason: null,
      crossingYear: 1976,
    });
    expect(result.warnings).toContain(
      "Line heading has a combined season: Wtr/Spr 76 Historical 20",
    );
  });

  it("recognizes abbreviated seasons and unnumbered later records", () => {
    const source = [
      "NAME                                Line Name                       Email                          Phone Number                     Address",
      "                              Spr 17  Example Line",
      "  John Doe                          Individual Name                 john@example.com               334-555-1911",
    ].join("\n");

    const result = parseRosterLayout(source);

    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      name: "John Doe",
      crossingSeason: "spring",
      crossingYear: 2017,
    });
  });
});
