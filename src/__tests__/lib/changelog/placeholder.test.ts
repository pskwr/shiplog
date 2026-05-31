import { describe, it, expect } from "vitest";
import { PlaceholderChangelogGenerator } from "@/lib/changelog/placeholder";
import type { PullRequest } from "@/lib/github/types";

function makePR(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    number: 1,
    title: "chore: update deps",
    mergedAt: "2024-01-01T00:00:00Z",
    author: "bot",
    url: "https://github.com/x/y/pull/1",
    labels: [],
    ...overrides,
  };
}

describe("PlaceholderChangelogGenerator", () => {
  const generator = new PlaceholderChangelogGenerator();

  it("produces identical output for the same input (deterministic)", async () => {
    const prs = [makePR({ number: 10, title: "feat: something cool" })];

    const r1 = await generator.generate(prs);
    const r2 = await generator.generate(prs);

    expect(r1).toEqual(r2);
  });

  it("different instances produce the same output for the same input", async () => {
    const prs = [makePR({ number: 5, title: "fix: broken thing" })];
    const other = new PlaceholderChangelogGenerator();

    expect(await generator.generate(prs)).toEqual(await other.generate(prs));
  });

  it("includes PR number in the technical bullet", async () => {
    const prs = [makePR({ number: 99, title: "feat: new widget" })];
    const { technical } = await generator.generate(prs);

    expect(technical.some((b) => b.includes("99"))).toBe(true);
  });

  it("includes full PR title in the technical bullet", async () => {
    const prs = [makePR({ title: "fix: correct the regression" })];
    const { technical } = await generator.generate(prs);

    expect(technical.some((b) => b.includes("fix: correct the regression"))).toBe(
      true,
    );
  });

  it("classifies feat: titles as New feature in technical bullets", async () => {
    const prs = [makePR({ title: "feat: add dark mode" })];
    const { technical } = await generator.generate(prs);

    expect(technical[0]).toMatch(/new feature/i);
  });

  it("classifies fix: titles as Bug fix in technical bullets", async () => {
    const prs = [makePR({ title: "fix: null pointer crash" })];
    const { technical } = await generator.generate(prs);

    expect(technical[0]).toMatch(/bug fix/i);
  });

  it("produces one technical bullet per PR", async () => {
    const prs = [
      makePR({ number: 1, title: "feat: a" }),
      makePR({ number: 2, title: "fix: b" }),
      makePR({ number: 3, title: "chore: c" }),
    ];
    const { technical } = await generator.generate(prs);

    expect(technical).toHaveLength(3);
  });

  it("customer summary mentions new features when present", async () => {
    const prs = [
      makePR({ title: "feat: export to CSV" }),
      makePR({ title: "feat: dark mode", number: 2 }),
    ];
    const { customerFacing } = await generator.generate(prs);

    expect(customerFacing).toMatch(/new feature/i);
  });

  it("customer summary mentions bug fixes when present", async () => {
    const prs = [makePR({ title: "fix: crash on empty list" })];
    const { customerFacing } = await generator.generate(prs);

    expect(customerFacing).toMatch(/bug fix/i);
  });

  it("handles an empty PR list with non-empty output", async () => {
    const { technical, customerFacing } = await generator.generate([]);

    expect(technical.length).toBeGreaterThan(0);
    expect(customerFacing.length).toBeGreaterThan(0);
  });
});
