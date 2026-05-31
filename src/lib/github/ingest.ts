import type { PullRequest } from "./types";

export type IngestResult =
  | { ok: true; prs: PullRequest[] }
  | { ok: false; error: string };

interface GitHubPRResponse {
  number: number;
  title: string;
  merged_at: string | null;
  user: { login: string };
  html_url: string;
  labels: Array<{ name: string }>;
}

const GITHUB_API_BASE = "https://api.github.com";

export async function fetchRecentPRs(
  owner: string,
  repo: string,
  limit = 20,
): Promise<IngestResult> {
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=closed&sort=updated&direction=desc&per_page=${limit}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "Network error: unable to reach GitHub API." };
  }

  if (response.status === 404) {
    return { ok: false, error: `Repository "${owner}/${repo}" not found.` };
  }

  if (!response.ok) {
    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
    if (response.status === 403 && rateLimitRemaining === "0") {
      return {
        ok: false,
        error: "GitHub API rate limit exceeded. Please try again later.",
      };
    }
    return { ok: false, error: `GitHub API error: HTTP ${response.status}.` };
  }

  const raw = (await response.json()) as GitHubPRResponse[];
  const prs: PullRequest[] = raw
    .filter((pr) => pr.merged_at !== null)
    .map((pr) => ({
      number: pr.number,
      title: pr.title,
      mergedAt: pr.merged_at as string,
      author: pr.user.login,
      url: pr.html_url,
      labels: pr.labels.map((l) => l.name),
    }));

  return { ok: true, prs };
}
