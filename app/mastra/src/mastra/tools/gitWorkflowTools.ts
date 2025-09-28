import { createTool } from '@mastra/core';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

// Initialize git repository
export const initializeGitRepo = createTool({
  id: 'initializeGitRepo',
  description: 'Initialize a git repository in a directory',
  inputSchema: z.object({
    repoPath: z.string().describe('Path to the repository directory'),
    initialBranch: z.string().default('main').describe('Name of initial branch'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const { stdout, stderr } = await execAsync(`git init -b ${context.initialBranch}`, {
        cwd: context.repoPath,
      });
      
      return {
        success: true,
        message: `Git repository initialized with branch ${context.initialBranch}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize git repository: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// Add remote origin
export const addRemoteOrigin = createTool({
  id: 'addRemoteOrigin',
  description: 'Add remote origin to git repository',
  inputSchema: z.object({
    repoPath: z.string().describe('Path to the repository directory'),
    remoteUrl: z.string().describe('Remote repository URL'),
    remoteName: z.string().default('origin').describe('Name of the remote'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      await execAsync(`git remote add ${context.remoteName} ${context.remoteUrl}`, {
        cwd: context.repoPath,
      });
      
      return {
        success: true,
        message: `Remote ${context.remoteName} added: ${context.remoteUrl}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to add remote: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// Stage files
export const stageFiles = createTool({
  id: 'stageFiles',
  description: 'Stage files for commit in git repository',
  inputSchema: z.object({
    repoPath: z.string().describe('Path to the repository directory'),
    files: z.array(z.string()).optional().describe('Specific files to stage (empty for all)'),
    all: z.boolean().default(false).describe('Stage all modified files'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    stagedFiles: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    try {
      let addCmd = 'git add';
      
      if (context.all) {
        addCmd += ' .';
      } else if (context.files && context.files.length > 0) {
        addCmd += ' ' + context.files.join(' ');
      } else {
        addCmd += ' .';
      }
      
      await execAsync(addCmd, { cwd: context.repoPath });
      
      // Get list of staged files
      const { stdout } = await execAsync('git diff --cached --name-only', {
        cwd: context.repoPath,
      });
      
      const stagedFiles = stdout.trim().split('\n').filter(file => file.length > 0);
      
      return {
        success: true,
        message: `Staged ${stagedFiles.length} files`,
        stagedFiles,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to stage files: ${error instanceof Error ? error.message : String(error)}`,
        stagedFiles: [],
      };
    }
  },
});

// Commit changes
export const commitChanges = createTool({
  id: 'commitChanges',
  description: 'Commit staged changes in git repository',
  inputSchema: z.object({
    repoPath: z.string().describe('Path to the repository directory'),
    message: z.string().describe('Commit message'),
    author: z.object({
      name: z.string(),
      email: z.string(),
    }).optional().describe('Author information'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    commitHash: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      // Set author if provided
      if (context.author) {
        await execAsync(`git config user.name "${context.author.name}"`, {
          cwd: context.repoPath,
        });
        await execAsync(`git config user.email "${context.author.email}"`, {
          cwd: context.repoPath,
        });
      }
      
      const { stdout } = await execAsync(`git commit -m "${context.message}"`, {
        cwd: context.repoPath,
      });
      
      // Extract commit hash
      const commitHashMatch = stdout.match(/\[[\w\s]+ ([a-f0-9]+)\]/);
      const commitHash = commitHashMatch ? commitHashMatch[1] : '';
      
      return {
        success: true,
        message: `Changes committed: ${context.message}`,
        commitHash,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to commit changes: ${error instanceof Error ? error.message : String(error)}`,
        commitHash: '',
      };
    }
  },
});

// Create and checkout branch
export const createAndCheckoutBranch = createTool({
  id: 'createAndCheckoutBranch',
  description: 'Create and checkout a new branch in git repository',
  inputSchema: z.object({
    repoPath: z.string().describe('Path to the repository directory'),
    branchName: z.string().describe('Name of the new branch'),
    fromBranch: z.string().optional().describe('Branch to create from (current branch if not specified)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    currentBranch: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      let checkoutCmd = `git checkout -b ${context.branchName}`;
      
      if (context.fromBranch) {
        checkoutCmd += ` ${context.fromBranch}`;
      }
      
      await execAsync(checkoutCmd, { cwd: context.repoPath });
      
      return {
        success: true,
        message: `Created and checked out branch: ${context.branchName}`,
        currentBranch: context.branchName,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create branch: ${error instanceof Error ? error.message : String(error)}`,
        currentBranch: '',
      };
    }
  },
});

// Push changes to remote
export const pushChanges = createTool({
  id: 'pushChanges',
  description: 'Push changes to remote repository',
  inputSchema: z.object({
    repoPath: z.string().describe('Path to the repository directory'),
    remoteName: z.string().default('origin').describe('Name of the remote'),
    branchName: z.string().optional().describe('Branch to push (current branch if not specified)'),
    setUpstream: z.boolean().default(false).describe('Set upstream for the branch'),
    force: z.boolean().default(false).describe('Force push'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      let pushCmd = `git push`;
      
      if (context.setUpstream) {
        pushCmd += ' -u';
      }
      
      if (context.force) {
        pushCmd += ' -f';
      }
      
      pushCmd += ` ${context.remoteName}`;
      
      if (context.branchName) {
        pushCmd += ` ${context.branchName}`;
      }
      
      const { stdout, stderr } = await execAsync(pushCmd, {
        cwd: context.repoPath,
      });
      
      return {
        success: true,
        message: `Changes pushed to ${context.remoteName}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to push changes: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// Pull changes from remote
export const pullChanges = createTool({
  id: 'pullChanges',
  description: 'Pull changes from remote repository',
  inputSchema: z.object({
    repoPath: z.string().describe('Path to the repository directory'),
    remoteName: z.string().default('origin').describe('Name of the remote'),
    branchName: z.string().optional().describe('Branch to pull (current branch if not specified)'),
    rebase: z.boolean().default(false).describe('Use rebase instead of merge'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    changes: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      let pullCmd = `git pull`;
      
      if (context.rebase) {
        pullCmd += ' --rebase';
      }
      
      pullCmd += ` ${context.remoteName}`;
      
      if (context.branchName) {
        pullCmd += ` ${context.branchName}`;
      }
      
      const { stdout, stderr } = await execAsync(pullCmd, {
        cwd: context.repoPath,
      });
      
      const changes = stdout + stderr;
      
      return {
        success: true,
        message: 'Changes pulled successfully',
        changes,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to pull changes: ${error instanceof Error ? error.message : String(error)}`,
        changes: '',
      };
    }
  },
});

// Get repository status
export const getRepositoryStatus = createTool({
  id: 'getRepositoryStatus',
  description: 'Get the current status of git repository',
  inputSchema: z.object({
    repoPath: z.string().describe('Path to the repository directory'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    currentBranch: z.string(),
    status: z.string(),
    modifiedFiles: z.array(z.string()),
    stagedFiles: z.array(z.string()),
    untrackedFiles: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    try {
      // Get current branch
      const { stdout: branchOutput } = await execAsync('git branch --show-current', {
        cwd: context.repoPath,
      });
      const currentBranch = branchOutput.trim();
      
      // Get status
      const { stdout: statusOutput } = await execAsync('git status --porcelain', {
        cwd: context.repoPath,
      });
      
      const modifiedFiles: string[] = [];
      const stagedFiles: string[] = [];
      const untrackedFiles: string[] = [];
      
      statusOutput.split('\n').forEach(line => {
        if (line.length < 3) return;
        
        const status = line.substring(0, 2);
        const filename = line.substring(3);
        
        if (status[0] === 'M' || status[0] === 'A' || status[0] === 'D') {
          stagedFiles.push(filename);
        }
        if (status[1] === 'M' || status[1] === 'D') {
          modifiedFiles.push(filename);
        }
        if (status === '??') {
          untrackedFiles.push(filename);
        }
      });
      
      return {
        success: true,
        currentBranch,
        status: statusOutput,
        modifiedFiles,
        stagedFiles,
        untrackedFiles,
      };
    } catch (error) {
      return {
        success: false,
        currentBranch: '',
        status: '',
        modifiedFiles: [],
        stagedFiles: [],
        untrackedFiles: [],
      };
    }
  },
});

export const gitWorkflowTools = {
  initializeGitRepo,
  addRemoteOrigin,
  stageFiles,
  commitChanges,
  createAndCheckoutBranch,
  pushChanges,
  pullChanges,
  getRepositoryStatus,
};
