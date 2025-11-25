import { createTool } from '@mastra/core';
import { z } from 'zod';
import { github } from '../integrations/github';

// Get repository information
export const getRepositoryInfo = createTool({
  id: 'getRepositoryInfo',
  description: 'Get information about a GitHub repository',
  inputSchema: z.object({
    owner: z.string().describe('Repository owner/organization'),
    repo: z.string().describe('Repository name'),
  }),
  outputSchema: z.object({
    name: z.string(),
    fullName: z.string(),
    description: z.string().nullable(),
    defaultBranch: z.string(),
    language: z.string().nullable(),
    stars: z.number(),
    forks: z.number(),
    cloneUrl: z.string(),
    sshUrl: z.string(),
  }),
  execute: async ({ context }) => {
    const client = await github.getApiClient();
    
    const repo = await client.repos.get({
      owner: context.owner,
      repo: context.repo,
    });

    return {
      name: repo.data.name,
      fullName: repo.data.full_name,
      description: repo.data.description,
      defaultBranch: repo.data.default_branch,
      language: repo.data.language,
      stars: repo.data.stargazers_count,
      forks: repo.data.forks_count,
      cloneUrl: repo.data.clone_url,
      sshUrl: repo.data.ssh_url,
    };
  },
});

// Get repository branches
export const getRepositoryBranches = createTool({
  id: 'getRepositoryBranches',
  description: 'Get all branches for a GitHub repository',
  inputSchema: z.object({
    owner: z.string().describe('Repository owner/organization'),
    repo: z.string().describe('Repository name'),
  }),
  outputSchema: z.object({
    branches: z.array(z.object({
      name: z.string(),
      sha: z.string(),
      protected: z.boolean(),
    })),
  }),
  execute: async ({ context }) => {
    const client = await github.getApiClient();
    
    const branches = await client.repos.listBranches({
      owner: context.owner,
      repo: context.repo,
    });

    return {
      branches: branches.data.map(branch => ({
        name: branch.name,
        sha: branch.commit.sha,
        protected: branch.protected,
      })),
    };
  },
});

// Create a new branch
export const createBranch = createTool({
  id: 'createBranch',
  description: 'Create a new branch in a GitHub repository',
  inputSchema: z.object({
    owner: z.string().describe('Repository owner/organization'),
    repo: z.string().describe('Repository name'),
    branchName: z.string().describe('Name of the new branch'),
    fromBranch: z.string().default('main').describe('Branch to create from (default: main)'),
  }),
  outputSchema: z.object({
    ref: z.string(),
    sha: z.string(),
    url: z.string(),
  }),
  execute: async ({ context }) => {
    const client = await github.getApiClient();
    
    // Get the SHA of the source branch
    const sourceBranch = await client.git.getRef({
      owner: context.owner,
      repo: context.repo,
      ref: `heads/${context.fromBranch}`,
    });

    // Create the new branch
    const newBranch = await client.git.createRef({
      owner: context.owner,
      repo: context.repo,
      ref: `refs/heads/${context.branchName}`,
      sha: sourceBranch.data.object.sha,
    });

    return {
      ref: newBranch.data.ref,
      sha: newBranch.data.object.sha,
      url: newBranch.data.url,
    };
  },
});

// Create a pull request
export const createPullRequest = createTool({
  id: 'createPullRequest',
  description: 'Create a pull request in a GitHub repository',
  inputSchema: z.object({
    owner: z.string().describe('Repository owner/organization'),
    repo: z.string().describe('Repository name'),
    title: z.string().describe('Pull request title'),
    body: z.string().describe('Pull request description'),
    head: z.string().describe('Branch containing changes'),
    base: z.string().default('main').describe('Branch to merge into (default: main)'),
    draft: z.boolean().default(false).describe('Create as draft PR'),
  }),
  outputSchema: z.object({
    number: z.number(),
    url: z.string(),
    state: z.string(),
    title: z.string(),
  }),
  execute: async ({ context }) => {
    const client = await github.getApiClient();
    
    const pr = await client.pulls.create({
      owner: context.owner,
      repo: context.repo,
      title: context.title,
      body: context.body,
      head: context.head,
      base: context.base,
      draft: context.draft,
    });

    return {
      number: pr.data.number,
      url: pr.data.html_url,
      state: pr.data.state,
      title: pr.data.title,
    };
  },
});

// Get file contents
export const getFileContents = createTool({
  id: 'getFileContents',
  description: 'Get the contents of a file from a GitHub repository',
  inputSchema: z.object({
    owner: z.string().describe('Repository owner/organization'),
    repo: z.string().describe('Repository name'),
    path: z.string().describe('File path in the repository'),
    branch: z.string().default('main').describe('Branch to read from (default: main)'),
  }),
  outputSchema: z.object({
    content: z.string(),
    encoding: z.string(),
    sha: z.string(),
    size: z.number(),
  }),
  execute: async ({ context }) => {
    const client = await github.getApiClient();
    
    const file = await client.repos.getContent({
      owner: context.owner,
      repo: context.repo,
      path: context.path,
      ref: context.branch,
    });

    if (Array.isArray(file.data) || file.data.type !== 'file') {
      throw new Error('Path does not point to a file');
    }

    return {
      content: Buffer.from(file.data.content, 'base64').toString('utf-8'),
      encoding: file.data.encoding,
      sha: file.data.sha,
      size: file.data.size,
    };
  },
});

// Update file contents
export const updateFileContents = createTool({
  id: 'updateFileContents',
  description: 'Update the contents of a file in a GitHub repository',
  inputSchema: z.object({
    owner: z.string().describe('Repository owner/organization'),
    repo: z.string().describe('Repository name'),
    path: z.string().describe('File path in the repository'),
    content: z.string().describe('New file content'),
    message: z.string().describe('Commit message'),
    branch: z.string().default('main').describe('Branch to commit to (default: main)'),
    sha: z.string().optional().describe('SHA of the file being replaced (for updates)'),
  }),
  outputSchema: z.object({
    commit: z.object({
      sha: z.string(),
      url: z.string(),
    }),
    content: z.object({
      sha: z.string(),
      url: z.string(),
    }),
  }),
  execute: async ({ context }) => {
    const client = await github.getApiClient();
    
    const result = await client.repos.createOrUpdateFileContents({
      owner: context.owner,
      repo: context.repo,
      path: context.path,
      message: context.message,
      content: Buffer.from(context.content).toString('base64'),
      branch: context.branch,
      ...(context.sha && { sha: context.sha }),
    });

    return {
      commit: {
        sha: result.data.commit.sha,
        url: result.data.commit.html_url,
      },
      content: {
        sha: result.data.content.sha,
        url: result.data.content.html_url,
      },
    };
  },
});

// List repository contents
export const listRepositoryContents = createTool({
  id: 'listRepositoryContents',
  description: 'List the contents of a directory in a GitHub repository',
  inputSchema: z.object({
    owner: z.string().describe('Repository owner/organization'),
    repo: z.string().describe('Repository name'),
    path: z.string().default('').describe('Directory path (empty for root)'),
    branch: z.string().default('main').describe('Branch to read from (default: main)'),
  }),
  outputSchema: z.object({
    contents: z.array(z.object({
      name: z.string(),
      path: z.string(),
      type: z.enum(['file', 'dir']),
      size: z.number().optional(),
      sha: z.string(),
    })),
  }),
  execute: async ({ context }) => {
    const client = await github.getApiClient();
    
    const contents = await client.repos.getContent({
      owner: context.owner,
      repo: context.repo,
      path: context.path,
      ref: context.branch,
    });

    if (!Array.isArray(contents.data)) {
      // Single file
      return {
        contents: [{
          name: contents.data.name,
          path: contents.data.path,
          type: contents.data.type as 'file' | 'dir',
          size: contents.data.size,
          sha: contents.data.sha,
        }],
      };
    }

    return {
      contents: contents.data.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type as 'file' | 'dir',
        size: item.size,
        sha: item.sha,
      })),
    };
  },
});

export const githubTools = {
  getRepositoryInfo,
  getRepositoryBranches,
  createBranch,
  createPullRequest,
  getFileContents,
  updateFileContents,
  listRepositoryContents,
};
