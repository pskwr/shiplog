export interface PullRequest {
  number: number;
  title: string;
  mergedAt: string;
  author: string;
  url: string;
  labels: string[];
}
