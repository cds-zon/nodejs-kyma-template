#!/usr/bin/env tsx

/**
 * Developer Agent Example
 * 
 * This example demonstrates how to use the Developer Agent to:
 * 1. Analyze a GitHub repository
 * 2. Create development tasks
 * 3. Clone and containerize a repository
 * 4. Perform git operations
 * 5. Manage task lifecycle
 */

import { mastra } from '../mastra';
import { developerConfig } from '../mastra/config/developerConfig';

async function runDeveloperAgentExample() {
  console.log('🚀 Starting Developer Agent Example...\n');

  try {
    // Get the developer agent
    const agent = mastra.getAgent('developerAgent');

    // Example 1: Repository Analysis
    console.log('📊 Example 1: Repository Analysis');
    console.log('=' .repeat(50));
    
    const repoAnalysis = await agent.run([
      {
        role: 'user',
        content: `Analyze the repository ${developerConfig.defaultRepositories[1].owner}/${developerConfig.defaultRepositories[1].repo} and provide a comprehensive overview including:
        - Repository information and statistics
        - Main branches available
        - Directory structure overview
        - Key files and their purposes
        - Technology stack identification
        - Potential containerization approach`,
      },
    ]);

    console.log('Repository Analysis Result:');
    console.log(repoAnalysis.text);
    console.log('\n');

    // Example 2: Task Management
    console.log('📋 Example 2: Task Management');
    console.log('=' .repeat(50));
    
    const taskManagement = await agent.run([
      {
        role: 'user',
        content: `Create a development task for implementing a new feature in the ${developerConfig.defaultRepositories[1].owner}/${developerConfig.defaultRepositories[1].repo} repository. The task should be:
        - Title: "Add TypeScript support to existing JavaScript components"
        - High priority
        - Tagged with "typescript", "migration", "enhancement"
        - Due in 2 weeks
        
        After creating the task, list all current tasks and show task statistics.`,
      },
    ]);

    console.log('Task Management Result:');
    console.log(taskManagement.text);
    console.log('\n');

    // Example 3: Container Workflow Simulation
    console.log('🐳 Example 3: Container Workflow Planning');
    console.log('=' .repeat(50));
    
    const containerWorkflow = await agent.run([
      {
        role: 'user',
        content: `Plan a complete containerization workflow for a Node.js React application. Include:
        1. Repository cloning strategy
        2. Dockerfile creation approach
        3. Container build and run configuration
        4. Development environment setup
        5. Port mapping and volume considerations
        6. Environment variable management
        
        Use the repository ${developerConfig.defaultRepositories[3].owner}/${developerConfig.defaultRepositories[3].repo} as an example.`,
      },
    ]);

    console.log('Container Workflow Plan:');
    console.log(containerWorkflow.text);
    console.log('\n');

    // Example 4: Git Workflow Automation
    console.log('🌿 Example 4: Git Workflow Planning');
    console.log('=' .repeat(50));
    
    const gitWorkflow = await agent.run([
      {
        role: 'user',
        content: `Design a complete git workflow for implementing a new feature. Include:
        1. Branch creation strategy
        2. Commit message conventions
        3. Pull request preparation
        4. Code review process
        5. Merge strategy
        
        Create a step-by-step plan for adding a new authentication feature to a web application.`,
      },
    ]);

    console.log('Git Workflow Plan:');
    console.log(gitWorkflow.text);
    console.log('\n');

    // Example 5: Development Automation
    console.log('⚡ Example 5: Development Automation Strategy');
    console.log('=' .repeat(50));
    
    const automationStrategy = await agent.run([
      {
        role: 'user',
        content: `Create an automation strategy for a typical development workflow that includes:
        1. Automated repository setup
        2. Development environment provisioning
        3. Code quality checks
        4. Testing automation
        5. Deployment preparation
        6. Task tracking and reporting
        
        Focus on how to use the available tools effectively to streamline development processes.`,
      },
    ]);

    console.log('Development Automation Strategy:');
    console.log(automationStrategy.text);
    console.log('\n');

    console.log('✅ Developer Agent Example completed successfully!');
    console.log('\nKey Capabilities Demonstrated:');
    console.log('- GitHub repository analysis and management');
    console.log('- Task creation and lifecycle management');
    console.log('- Container workflow planning and execution');
    console.log('- Git workflow automation');
    console.log('- Development process automation');
    console.log('- MCP tool integration for extended functionality');

  } catch (error) {
    console.error('❌ Error running Developer Agent example:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runDeveloperAgentExample()
    .then(() => {
      console.log('\n🎉 Example execution completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export { runDeveloperAgentExample };
