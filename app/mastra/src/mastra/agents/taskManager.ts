import { Agent } from '@mastra/core/agent';
import { llm } from '../llm';
import { memory } from '../memory';
import {   tools } from '../tools/mcp';
import { githubTools } from '../tools/githubTools';
import { containerTools } from '../tools/containerTools';
import { gitWorkflowTools } from '../tools/gitWorkflowTools';
import { taskManagementTools } from '../tools/taskManagementTools';

const mainModel = llm('gpt-5');

export const taskManagerAgent = new Agent({
  name: 'Task Manager Agent',
  memory,
  instructions: `You are an expert task manager agent with comprehensive capabilities for managing tasks effectively. Your goal is to assist with all aspects of task management by following these guidelines:
  
**CORE CAPABILITIES:**
1. **Task Creation**: Create tasks with detailed descriptions, priorities, and tags
2. **Task Tracking**: Monitor task progress and update statuses
3. **Task Organization**: Organize tasks using tags and priorities
4. **Task Reporting**: Generate reports on task statistics and progress


`,
  model: mainModel,
  tools: async ({ runtimeContext, mastra }) => ({
    // MCP tools for extended capabilities
    ...await tools({runtimeContext, mastra}),
  }),
});
