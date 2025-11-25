# Mastra Developer Agent

A comprehensive AI-powered developer agent that can manage GitHub repositories, containerize applications, automate git workflows, and handle development task management using Mastra's agent framework and MCP servers.

## 🚀 Features

### Core Capabilities
- **GitHub Repository Management**: Clone, analyze, and manage GitHub repositories
- **Container Operations**: Build and run repositories in containerized environments  
- **Git Workflow Automation**: Handle branching, commits, pushes, and pull requests
- **Task Management**: Create, track, and manage development tasks
- **MCP Integration**: Extended functionality through MCP servers

### Tool Categories

#### GitHub Tools
- `getRepositoryInfo` - Get repository metadata and statistics
- `getRepositoryBranches` - List all repository branches
- `createBranch` - Create new branches
- `createPullRequest` - Create pull requests with detailed descriptions
- `getFileContents` - Read file contents from repositories
- `updateFileContents` - Update files in repositories
- `listRepositoryContents` - Browse repository directory structure

#### Container Tools
- `cloneRepository` - Clone repositories to local temporary directories
- `buildDockerImage` - Build Docker images from repositories
- `runContainer` - Run containers with proper configuration
- `executeInContainer` - Execute commands in running containers
- `stopContainer` - Stop and cleanup containers
- `getContainerLogs` - Retrieve container logs for debugging
- `cleanupRepository` - Clean up temporary files and directories

#### Git Workflow Tools
- `initializeGitRepo` - Initialize new git repositories
- `addRemoteOrigin` - Add remote repositories
- `stageFiles` - Stage files for commits
- `commitChanges` - Create commits with proper messaging
- `createAndCheckoutBranch` - Create and switch to new branches
- `pushChanges` - Push changes to remote repositories
- `pullChanges` - Pull latest changes from remote
- `getRepositoryStatus` - Get current repository status

#### Task Management Tools
- `createTask` - Create new development tasks
- `updateTaskStatus` - Update task progress
- `listTasks` - List and filter tasks
- `getTask` - Get specific task details
- `deleteTask` - Remove completed tasks
- `updateTask` - Modify task details
- `getTaskStatistics` - Generate task reports and statistics

## 🔧 Setup

### Prerequisites
- Node.js 18+ 
- Docker (for container operations)
- Git (for repository operations)
- GitHub Personal Access Token

### Environment Variables
Create a `.env` file with the following variables:

```env
# GitHub Integration
GITHUB_PAT=your_github_personal_access_token
GITHUB_TOKEN=your_github_token

# MCP Server Configuration  
MCP_SERVER_URL=https://gitmcp.io/zon-cx/mcp-identity
MCP_DEFAULT_HEADERS={"scai-agent-runtime":"mastra","scai-agent-name":"developer-agent"}

# Development Environment
NODE_ENV=development
HOST=0.0.0.0
PORT=4111
```

### Installation
The developer agent is already integrated into the Mastra configuration. Simply start the Mastra server:

```bash
cd app/mastra
pnpm install
pnpm dev
```

## 📖 Usage

### Basic Agent Interaction
```typescript
import { mastra } from './src/mastra';

const agent = mastra.getAgent('developerAgent');

const response = await agent.run([
  {
    role: 'user',
    content: 'Analyze the microsoft/vscode repository and create a development task for adding TypeScript support'
  }
]);
```

### Repository Analysis Workflow
```typescript
// 1. Get repository information
const repoInfo = await agent.run([{
  role: 'user',
  content: 'Get detailed information about the facebook/react repository including branches and directory structure'
}]);

// 2. Create development tasks based on analysis
const taskCreation = await agent.run([{
  role: 'user', 
  content: 'Create high-priority tasks for the identified improvements in the React repository'
}]);
```

### Container Development Workflow
```typescript
// 1. Clone and containerize repository
const containerSetup = await agent.run([{
  role: 'user',
  content: 'Clone the vercel/next.js repository, analyze its structure, create a Dockerfile if needed, and run it in a container with proper port mapping'
}]);

// 2. Execute development commands
const devCommands = await agent.run([{
  role: 'user',
  content: 'Execute npm install and npm run dev in the running Next.js container, then check the application logs'
}]);
```

### Git Workflow Automation
```typescript
// 1. Create feature branch and make changes
const featureDevelopment = await agent.run([{
  role: 'user',
  content: 'Create a feature branch called "feature/add-authentication", make necessary file changes, commit with proper message, and push to remote'
}]);

// 2. Create pull request
const prCreation = await agent.run([{
  role: 'user',
  content: 'Create a pull request for the authentication feature with detailed description and checklist'
}]);
```

## 🏗️ Architecture

### Agent Structure
The developer agent is built using Mastra's agent framework with:
- **Instructions**: Comprehensive system prompt with operational workflows
- **Tools**: Integrated tool sets for GitHub, containers, git, and task management
- **Memory**: Persistent storage for conversation context
- **MCP Integration**: Extended capabilities through MCP servers

### Tool Organization
```
tools/
├── githubTools.ts       # GitHub API operations
├── containerTools.ts    # Docker container management
├── gitWorkflowTools.ts  # Git operations
├── taskManagementTools.ts # Task lifecycle management
└── mcp.ts              # MCP server integration
```

### Configuration
```
config/
└── developerConfig.ts   # Default repositories, templates, and settings
```

## 🔄 Operational Workflows

### Phase 1: Repository Analysis
1. Use `getRepositoryInfo` to understand structure
2. Use `listRepositoryContents` to explore codebase
3. Use `getFileContents` to examine key files
4. Create tasks for identified work items

### Phase 2: Development Environment Setup
1. Use `cloneRepository` to get local copy
2. Analyze for containerization needs
3. Use `buildDockerImage` if Dockerfile exists
4. Use `runContainer` to start development environment

### Phase 3: Development Work
1. Use `createAndCheckoutBranch` for feature development
2. Make code changes using `updateFileContents`
3. Use `stageFiles` and `commitChanges` for version control
4. Update task status as work progresses

### Phase 4: Deployment and Integration
1. Use `pushChanges` to push to remote repository
2. Use `createPullRequest` for code review
3. Use `executeInContainer` for testing
4. Complete tasks and update statistics

## 🧪 Testing

Run the example script to test all functionality:

```bash
cd app/mastra
npx tsx src/examples/developerAgentExample.ts
```

This will demonstrate:
- Repository analysis
- Task management
- Container workflow planning
- Git workflow automation
- Development process automation

## 🔒 Security Considerations

- Store GitHub tokens securely in environment variables
- Use proper input validation for all tool parameters
- Implement secure container practices
- Follow git security best practices
- Validate all file operations

## 🛠️ Customization

### Adding Custom Repositories
Edit `src/mastra/config/developerConfig.ts` to add your repositories:

```typescript
defaultRepositories: [
  {
    owner: 'your-org',
    repo: 'your-repo',
    description: 'Your repository description',
    tags: ['your', 'tags'],
  }
]
```

### Custom Task Templates
Add new task templates in the configuration:

```typescript
taskTemplates: {
  customTask: {
    title: 'Custom: {description}',
    description: 'Custom task for {description}',
    priority: 'medium',
    tags: ['custom'],
  }
}
```

### Container Configurations
Add support for new project types:

```typescript
containerConfigs: {
  yourStack: {
    baseImage: 'your-base:latest',
    workdir: '/app',
    defaultPorts: ['8080:8080'],
    installCommand: 'your-install-command',
    startCommand: 'your-start-command',
  }
}
```

## 📚 API Reference

### GitHub Tools
All GitHub tools require `owner` and `repo` parameters and return structured responses with success/failure status.

### Container Tools
Container tools work with local Docker daemon and support standard Docker configurations.

### Git Tools
Git tools operate on local repositories and support standard git operations.

### Task Management Tools
Task management tools store data in JSON format with full CRUD operations.

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Add proper TypeScript types and Zod schemas
3. Include error handling and validation
4. Update documentation for new features
5. Test all functionality before submitting

## 📄 License

This project follows the same license as the parent Mastra project.

---

## 🎯 Next Steps

- Add support for additional version control systems
- Implement CI/CD pipeline integration
- Add code quality analysis tools
- Extend MCP server integrations
- Add support for more container orchestration platforms
