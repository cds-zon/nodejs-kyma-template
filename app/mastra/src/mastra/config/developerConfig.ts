// Configuration for the Developer Agent
export const developerConfig = {
  // Default repositories to work with (can be hardcoded initially)
  defaultRepositories: [
    {
      owner: 'microsoft',
      repo: 'vscode',
      description: 'Visual Studio Code - popular code editor',
      tags: ['typescript', 'electron', 'editor'],
    },
    {
      owner: 'facebook',
      repo: 'react',
      description: 'React JavaScript library for building user interfaces',
      tags: ['javascript', 'react', 'frontend'],
    },
    {
      owner: 'nodejs',
      repo: 'node',
      description: 'Node.js JavaScript runtime',
      tags: ['javascript', 'nodejs', 'runtime'],
    },
    {
      owner: 'vercel',
      repo: 'next.js',
      description: 'The React Framework for Production',
      tags: ['react', 'nextjs', 'framework'],
    },
  ],

  // Container configurations for different project types
  containerConfigs: {
    nodejs: {
      baseImage: 'node:18-alpine',
      workdir: '/app',
      defaultPorts: ['3000:3000'],
      installCommand: 'npm install',
      startCommand: 'npm start',
      devCommand: 'npm run dev',
    },
    python: {
      baseImage: 'python:3.11-alpine',
      workdir: '/app',
      defaultPorts: ['8000:8000'],
      installCommand: 'pip install -r requirements.txt',
      startCommand: 'python main.py',
      devCommand: 'python -m flask run --host=0.0.0.0',
    },
    react: {
      baseImage: 'node:18-alpine',
      workdir: '/app',
      defaultPorts: ['3000:3000'],
      installCommand: 'npm install',
      startCommand: 'npm start',
      devCommand: 'npm run dev',
    },
    nextjs: {
      baseImage: 'node:18-alpine',
      workdir: '/app',
      defaultPorts: ['3000:3000'],
      installCommand: 'npm install',
      startCommand: 'npm start',
      devCommand: 'npm run dev',
    },
  },

  // Git workflow templates
  gitWorkflowTemplates: {
    feature: {
      branchPrefix: 'feature/',
      commitPrefix: 'feat:',
      prTemplate: `## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests for changes
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated if needed`,
    },
    bugfix: {
      branchPrefix: 'fix/',
      commitPrefix: 'fix:',
      prTemplate: `## Bug Description
Description of the bug being fixed

## Root Cause
What caused the issue

## Solution
How the issue was resolved

## Testing
- [ ] Bug reproduction steps verified
- [ ] Fix tested locally
- [ ] Regression tests added

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed`,
    },
    hotfix: {
      branchPrefix: 'hotfix/',
      commitPrefix: 'hotfix:',
      prTemplate: `## Critical Issue
Description of the critical issue

## Urgency
Why this needs immediate attention

## Solution
Quick fix implemented

## Risk Assessment
- [ ] Low risk change
- [ ] Minimal impact on existing functionality
- [ ] Thoroughly tested

## Checklist
- [ ] Hotfix tested in production-like environment
- [ ] Stakeholders notified`,
    },
  },

  // Task templates for common development activities
  taskTemplates: {
    codeReview: {
      title: 'Code Review: {repository}',
      description: 'Review code changes in {repository} repository',
      priority: 'medium',
      tags: ['code-review', 'quality'],
    },
    bugFix: {
      title: 'Bug Fix: {issue}',
      description: 'Fix bug: {issue}',
      priority: 'high',
      tags: ['bug', 'fix'],
    },
    featureImplementation: {
      title: 'Feature: {feature}',
      description: 'Implement new feature: {feature}',
      priority: 'medium',
      tags: ['feature', 'development'],
    },
    documentation: {
      title: 'Documentation: {topic}',
      description: 'Update documentation for {topic}',
      priority: 'low',
      tags: ['documentation', 'maintenance'],
    },
    testing: {
      title: 'Testing: {component}',
      description: 'Add tests for {component}',
      priority: 'medium',
      tags: ['testing', 'quality'],
    },
  },

  // MCP server configurations
  mcpServerConfigs: {
    // Default MCP servers for enhanced functionality
    defaultServers: [
      {
        name: 'filesystem',
        description: 'File system operations',
        url: 'https://gitmcp.io/zon-cx/mcp-identity',
      },
      {
        name: 'git',
        description: 'Git operations',
        url: 'https://gitmcp.io/zon-cx/mcp-identity',
      },
    ],
  },

  // Environment configurations
  environment: {
    // Default environment variables for development
    defaultEnvVars: {
      NODE_ENV: 'development',
      PORT: '3000',
      HOST: '0.0.0.0',
    },
    
    // Required environment variables
    requiredEnvVars: [
      'GITHUB_PAT', // GitHub Personal Access Token
      'GITHUB_TOKEN', // Alternative GitHub token
    ],
  },
};

export default developerConfig;
