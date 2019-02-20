import Octokit from '@octokit/rest';

import { Comment, Notification } from '../types';

class GitHubApi {
  private octokit: Octokit;

  constructor(apiToken: string | null) {
    // TODO: Initialization without token
    this.octokit = new Octokit({
      auth: `token ${apiToken}`,
      // TODO: Deprecated, how can we disable caching now, since it's not workign properly
      headers: {
        'if-none-match': '',
      },
    });
  }

  public async getUnreadNotifications(): Promise<Notification[]> {
    const notifications = await this.octokit.activity.listNotifications({ per_page: 100 });
    // TODO: Better streaming approach
    const promises = notifications.data.map(async (notification) => {
      const issue: Octokit.Response<Octokit.IssuesGetResponse> = await this.octokit.request(notification.subject.url);
      return {
        ...notification,
        issue: issue.data,
      };
    });
    return await Promise.all(promises);
  }

  public async markNotificationAsRead(threadId: string): Promise<{}> {
    const response = await this.octokit.activity.markThreadAsRead({ thread_id: Number(threadId) });
    return response.data;
  }

  public async loadComments(owner: string, repo: string, issue: number, since?: string): Promise<Comment[]> {
    const params: Octokit.IssuesListCommentsParams = {
      owner, repo, number: issue,
    };
    if (since) {
      params.since = since;
    }
    const comments = await this.octokit.issues.listComments(params);
    // TODO: load only most recent comment if no comment has been returned
    return comments.data;
  }

  public get api() {
    return this.octokit;
  }
}

export { GitHubApi };