import type { PullRequest } from "../github/types";

export interface ChangelogEntry {
  technical: string[];
  customerFacing: string;
}

export interface ChangelogGenerator {
  generate(prs: PullRequest[]): Promise<ChangelogEntry>;
}
