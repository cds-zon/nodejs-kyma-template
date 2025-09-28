import { createTool } from '@mastra/core';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

// Clone repository to local temporary directory
export const cloneRepository = createTool({
  id: 'cloneRepository',
  description: 'Clone a GitHub repository to a temporary directory',
  inputSchema: z.object({
    repoUrl: z.string().describe('Repository URL (HTTPS or SSH)'),
    branch: z.string().optional().describe('Specific branch to clone'),
    depth: z.number().default(1).describe('Clone depth (default: 1 for shallow clone)'),
  }),
  outputSchema: z.object({
    localPath: z.string(),
    repoName: z.string(),
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      // Create temporary directory
      const tempDir = await fs.mkdtemp(path.join(tmpdir(), 'repo-'));
      
      // Extract repository name from URL
      const repoName = context.repoUrl.split('/').pop()?.replace('.git', '') || 'unknown-repo';
      const targetPath = path.join(tempDir, repoName);
      
      // Build git clone command
      let cloneCmd = `git clone`;
      if (context.depth) {
        cloneCmd += ` --depth ${context.depth}`;
      }
      if (context.branch) {
        cloneCmd += ` --branch ${context.branch}`;
      }
      cloneCmd += ` "${context.repoUrl}" "${targetPath}"`;
      
      const { stdout, stderr } = await execAsync(cloneCmd);
      
      return {
        localPath: targetPath,
        repoName,
        success: true,
        message: `Repository cloned successfully to ${targetPath}`,
      };
    } catch (error) {
      return {
        localPath: '',
        repoName: '',
        success: false,
        message: `Failed to clone repository: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// Build Docker image from repository
export const buildDockerImage = createTool({
  id: 'buildDockerImage',
  description: 'Build a Docker image from a repository directory',
  inputSchema: z.object({
    repoPath: z.string().describe('Local path to repository'),
    imageName: z.string().describe('Name for the Docker image'),
    dockerfilePath: z.string().default('Dockerfile').describe('Path to Dockerfile relative to repo root'),
    buildArgs: z.record(z.string()).optional().describe('Build arguments for Docker'),
  }),
  outputSchema: z.object({
    imageId: z.string(),
    imageName: z.string(),
    success: z.boolean(),
    message: z.string(),
    buildLog: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      // Check if Dockerfile exists
      const dockerfilePath = path.join(context.repoPath, context.dockerfilePath);
      await fs.access(dockerfilePath);
      
      // Build Docker command
      let buildCmd = `docker build -t ${context.imageName}`;
      
      // Add build arguments if provided
      if (context.buildArgs) {
        for (const [key, value] of Object.entries(context.buildArgs)) {
          buildCmd += ` --build-arg ${key}="${value}"`;
        }
      }
      
      buildCmd += ` -f ${context.dockerfilePath} ${context.repoPath}`;
      
      const { stdout, stderr } = await execAsync(buildCmd);
      const buildLog = stdout + stderr;
      
      // Extract image ID from build output
      const imageIdMatch = buildLog.match(/Successfully built ([a-f0-9]+)/);
      const imageId = imageIdMatch ? imageIdMatch[1] : '';
      
      return {
        imageId,
        imageName: context.imageName,
        success: true,
        message: `Docker image built successfully: ${context.imageName}`,
        buildLog,
      };
    } catch (error) {
      return {
        imageId: '',
        imageName: context.imageName,
        success: false,
        message: `Failed to build Docker image: ${error instanceof Error ? error.message : String(error)}`,
        buildLog: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// Run container with repository
export const runContainer = createTool({
  id: 'runContainer',
  description: 'Run a Docker container from an image',
  inputSchema: z.object({
    imageName: z.string().describe('Docker image name'),
    containerName: z.string().optional().describe('Name for the container'),
    command: z.string().optional().describe('Command to run in container'),
    ports: z.array(z.string()).optional().describe('Port mappings (e.g., ["3000:3000"])'),
    environment: z.record(z.string()).optional().describe('Environment variables'),
    volumes: z.array(z.string()).optional().describe('Volume mounts (e.g., ["/host:/container"])'),
    detached: z.boolean().default(true).describe('Run in detached mode'),
    autoRemove: z.boolean().default(false).describe('Automatically remove container when it exits'),
  }),
  outputSchema: z.object({
    containerId: z.string(),
    containerName: z.string(),
    success: z.boolean(),
    message: z.string(),
    output: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      let runCmd = `docker run`;
      
      if (context.detached) {
        runCmd += ` -d`;
      }
      
      if (context.autoRemove) {
        runCmd += ` --rm`;
      }
      
      if (context.containerName) {
        runCmd += ` --name ${context.containerName}`;
      }
      
      // Add port mappings
      if (context.ports) {
        for (const port of context.ports) {
          runCmd += ` -p ${port}`;
        }
      }
      
      // Add environment variables
      if (context.environment) {
        for (const [key, value] of Object.entries(context.environment)) {
          runCmd += ` -e ${key}="${value}"`;
        }
      }
      
      // Add volume mounts
      if (context.volumes) {
        for (const volume of context.volumes) {
          runCmd += ` -v ${volume}`;
        }
      }
      
      runCmd += ` ${context.imageName}`;
      
      if (context.command) {
        runCmd += ` ${context.command}`;
      }
      
      const { stdout, stderr } = await execAsync(runCmd);
      const output = stdout + stderr;
      
      // Extract container ID from output
      const containerId = stdout.trim();
      
      return {
        containerId,
        containerName: context.containerName || containerId,
        success: true,
        message: `Container started successfully`,
        output,
      };
    } catch (error) {
      return {
        containerId: '',
        containerName: context.containerName || '',
        success: false,
        message: `Failed to run container: ${error instanceof Error ? error.message : String(error)}`,
        output: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// Execute command in running container
export const executeInContainer = createTool({
  id: 'executeInContainer',
  description: 'Execute a command in a running Docker container',
  inputSchema: z.object({
    containerName: z.string().describe('Container name or ID'),
    command: z.string().describe('Command to execute'),
    workdir: z.string().optional().describe('Working directory for the command'),
    user: z.string().optional().describe('User to run command as'),
  }),
  outputSchema: z.object({
    exitCode: z.number(),
    stdout: z.string(),
    stderr: z.string(),
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      let execCmd = `docker exec`;
      
      if (context.workdir) {
        execCmd += ` -w ${context.workdir}`;
      }
      
      if (context.user) {
        execCmd += ` -u ${context.user}`;
      }
      
      execCmd += ` ${context.containerName} ${context.command}`;
      
      const { stdout, stderr } = await execAsync(execCmd);
      
      return {
        exitCode: 0,
        stdout,
        stderr,
        success: true,
        message: 'Command executed successfully',
      };
    } catch (error: any) {
      return {
        exitCode: error.code || 1,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message || '',
        success: false,
        message: `Command execution failed: ${error.message || String(error)}`,
      };
    }
  },
});

// Stop and remove container
export const stopContainer = createTool({
  id: 'stopContainer',
  description: 'Stop and optionally remove a Docker container',
  inputSchema: z.object({
    containerName: z.string().describe('Container name or ID'),
    remove: z.boolean().default(true).describe('Remove container after stopping'),
    force: z.boolean().default(false).describe('Force stop the container'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      // Stop the container
      const stopCmd = context.force 
        ? `docker kill ${context.containerName}`
        : `docker stop ${context.containerName}`;
      
      await execAsync(stopCmd);
      
      // Remove the container if requested
      if (context.remove) {
        await execAsync(`docker rm ${context.containerName}`);
      }
      
      return {
        success: true,
        message: `Container ${context.containerName} stopped${context.remove ? ' and removed' : ''}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop container: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// Get container logs
export const getContainerLogs = createTool({
  id: 'getContainerLogs',
  description: 'Get logs from a Docker container',
  inputSchema: z.object({
    containerName: z.string().describe('Container name or ID'),
    tail: z.number().optional().describe('Number of lines to show from end of logs'),
    since: z.string().optional().describe('Show logs since timestamp (e.g., "2023-01-01T00:00:00")'),
    follow: z.boolean().default(false).describe('Follow log output'),
  }),
  outputSchema: z.object({
    logs: z.string(),
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      let logsCmd = `docker logs`;
      
      if (context.tail) {
        logsCmd += ` --tail ${context.tail}`;
      }
      
      if (context.since) {
        logsCmd += ` --since "${context.since}"`;
      }
      
      if (context.follow) {
        logsCmd += ` -f`;
      }
      
      logsCmd += ` ${context.containerName}`;
      
      const { stdout, stderr } = await execAsync(logsCmd);
      const logs = stdout + stderr;
      
      return {
        logs,
        success: true,
        message: 'Logs retrieved successfully',
      };
    } catch (error) {
      return {
        logs: '',
        success: false,
        message: `Failed to get logs: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// Clean up temporary files and directories
export const cleanupRepository = createTool({
  id: 'cleanupRepository',
  description: 'Clean up temporary repository directory',
  inputSchema: z.object({
    repoPath: z.string().describe('Path to repository directory to clean up'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      await fs.rm(context.repoPath, { recursive: true, force: true });
      return {
        success: true,
        message: `Cleaned up repository at ${context.repoPath}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to cleanup repository: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

export const containerTools = {
  cloneRepository,
  buildDockerImage,
  runContainer,
  executeInContainer,
  stopContainer,
  getContainerLogs,
  cleanupRepository,
};
