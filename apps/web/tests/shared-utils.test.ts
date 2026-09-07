import { describe, expect, it } from "vitest";
import { formatInrPaise } from "@/lib/shared/money";
import { parseClassLabel, nextClassName } from "@/lib/shared/class-utils";

describe("formatInrPaise", () => {
  it("formats paise as INR", () => {
    expect(formatInrPaise(420000)).toBe("₹4,200");
    expect(formatInrPaise(0)).toBe("₹0");
  });
});

describe("parseClassLabel", () => {
  it("normalizes grade-section", () => {
    expect(parseClassLabel("6B")).toEqual({
      grade: "6",
      section: "B",
      className: "6-B",
    });
    expect(parseClassLabel("6-B").className).toBe("6-B");
  });

  it("nextClassName advances grade", () => {
    expect(nextClassName("6-B")).toBe("7-B");
    expect(nextClassName("12-A")).toBeNull();
  });
});
