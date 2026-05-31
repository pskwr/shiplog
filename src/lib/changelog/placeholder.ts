import type { ChangelogEntry, ChangelogGenerator } from "./types";
import type { PullRequest } from "../github/types";

export class PlaceholderChangelogGenerator implements ChangelogGenerator {
  async generate(prs: PullRequest[]): Promise<ChangelogEntry> {
    if (prs.length === 0) {
      return {
        technical: ["No recent pull requests found."],
        customerFacing: "No recent changes detected in this repository.",
      };
    }

    const technical = prs.map(
      (pr) => `- ${classifyTitle(pr.title)}: ${pr.title} (#${pr.number})`,
    );
    const customerFacing = buildCustomerSummary(prs);

    return { technical, customerFacing };
  }
}

function classifyTitle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.startsWith("feat:") || lower.startsWith("feature:"))
    return "New feature";
  if (lower.startsWith("fix:")) return "Bug fix";
  if (lower.startsWith("refactor:")) return "Refactor";
  if (lower.startsWith("docs:")) return "Documentation";
  if (lower.startsWith("chore:")) return "Maintenance";
  if (lower.startsWith("test:")) return "Tests";
  if (lower.startsWith("perf:")) return "Performance";
  if (lower.startsWith("ci:")) return "CI/CD";
  return "Change";
}

function buildCustomerSummary(prs: PullRequest[]): string {
  const counts: Record<string, number> = {};
  for (const pr of prs) {
    const kind = classifyTitle(pr.title);
    counts[kind] = (counts[kind] ?? 0) + 1;
  }

  const features = counts["New feature"] ?? 0;
  const fixes = counts["Bug fix"] ?? 0;
  const other = prs.length - features - fixes;

  const parts: string[] = [];
  if (features > 0) parts.push(`${features} new feature${features > 1 ? "s" : ""}`);
  if (fixes > 0) parts.push(`${fixes} bug fix${fixes > 1 ? "es" : ""}`);
  if (other > 0) parts.push(`${other} other improvement${other > 1 ? "s" : ""}`);

  if (parts.length === 0) {
    return `This release includes ${prs.length} change${prs.length !== 1 ? "s" : ""} to improve the product.`;
  }

  return `This release includes ${joinList(parts)}.`;
}

function joinList(parts: string[]): string {
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}
