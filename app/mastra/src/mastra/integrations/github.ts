import { GithubIntegration } from '@mastra/github';
import { env } from 'process';

export const github = new GithubIntegration({
  config: {
    PERSONAL_ACCESS_TOKEN: env.GITHUB_PAT || env.GITHUB_TOKEN || 'your-github-pat-here',
  },
});

export default github;
