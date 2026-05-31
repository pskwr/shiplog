import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchRecentPRs } from "@/lib/github/ingest";

function makeResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as unknown as Response;
}

const MERGED_PR = {
  number: 42,
  title: "feat: add new thing",
  merged_at: "2024-01-15T10:00:00Z",
  user: { login: "octocat" },
  html_url: "https://github.com/owner/repo/pull/42",
  labels: [{ name: "enhancement" }],
};

const OPEN_PR = {
  number: 43,
  title: "fix: not merged yet",
  merged_at: null,
  user: { login: "other" },
  html_url: "https://github.com/owner/repo/pull/43",
  labels: [],
};

describe("fetchRecentPRs", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns mapped PullRequest objects for merged PRs only", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      makeResponse(200, [MERGED_PR, OPEN_PR]),
    );

    const result = await fetchRecentPRs("owner", "repo");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.prs).toHaveLength(1);
    const pr = result.prs[0];
    expect(pr.number).toBe(42);
    expect(pr.title).toBe("feat: add new thing");
    expect(pr.author).toBe("octocat");
    expect(pr.labels).toEqual(["enhancement"]);
    expect(pr.mergedAt).toBe("2024-01-15T10:00:00Z");
  });

  it("returns not-found error for a 404 response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(makeResponse(404, {}));

    const result = await fetchRecentPRs("nobody", "ghost-repo");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/not found/i);
    expect(result.error).toContain("nobody/ghost-repo");
  });

  it("returns rate-limit error when x-ratelimit-remaining is 0", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      makeResponse(403, {}, { "x-ratelimit-remaining": "0" }),
    );

    const result = await fetchRecentPRs("owner", "repo");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/rate limit/i);
  });

  it("returns network error when fetch throws", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await fetchRecentPRs("owner", "repo");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/network/i);
  });

  it("returns empty prs array when all PRs are unmerged", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      makeResponse(200, [OPEN_PR]),
    );

    const result = await fetchRecentPRs("owner", "repo");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.prs).toHaveLength(0);
  });

  it("includes owner and repo name in the GitHub API request URL", async () => {
    let capturedUrl = "";
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      capturedUrl = url as string;
      return makeResponse(200, []);
    });

    await fetchRecentPRs("vercel", "next.js");

    expect(capturedUrl).toContain("/repos/vercel/next.js/");
  });
});
