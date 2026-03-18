export type GitHubPullRequestState = 'open' | 'closed' | 'merged';

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: GitHubPullRequestState;
  user: {
    login: string;
  };
  updated_at: string;
  html_url: string;
}
