import { createTool } from '@mastra/core';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

// Task interface
const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignee: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
  repository: z.object({
    owner: z.string(),
    repo: z.string(),
    branch: z.string().optional(),
  }).optional(),
});

type Task = z.infer<typeof TaskSchema>;

// Get tasks file path
function getTasksFilePath(workspaceDir: string): string {
  return path.join(workspaceDir, '.mastra', 'tasks.json');
}

// Load tasks from file
async function loadTasks(workspaceDir: string): Promise<Task[]> {
  try {
    const tasksFile = getTasksFilePath(workspaceDir);
    const data = await fs.readFile(tasksFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is invalid, return empty array
    return [];
  }
}

// Save tasks to file
async function saveTasks(workspaceDir: string, tasks: Task[]): Promise<void> {
  const tasksFile = getTasksFilePath(workspaceDir);
  const dir = path.dirname(tasksFile);
  
  // Ensure directory exists
  await fs.mkdir(dir, { recursive: true });
  
  await fs.writeFile(tasksFile, JSON.stringify(tasks, null, 2));
}

// Create a new task
export const createTask = createTool({
  id: 'createTask',
  description: 'Create a new development task',
  inputSchema: z.object({
    title: z.string().describe('Task title'),
    description: z.string().describe('Task description'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    assignee: z.string().optional().describe('Task assignee'),
    dueDate: z.string().optional().describe('Due date (ISO string)'),
    tags: z.array(z.string()).default([]).describe('Task tags'),
    repository: z.object({
      owner: z.string(),
      repo: z.string(),
      branch: z.string().optional(),
    }).optional().describe('Associated repository'),
    workspaceDir: z.string().default(process.cwd()).describe('Workspace directory'),
  }),
  outputSchema: z.object({
    task: TaskSchema,
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const tasks = await loadTasks(context.workspaceDir);
      
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: context.title,
        description: context.description,
        status: 'pending',
        priority: context.priority,
        assignee: context.assignee,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: context.dueDate,
        tags: context.tags,
        repository: context.repository,
      };
      
      tasks.push(newTask);
      await saveTasks(context.workspaceDir, tasks);
      
      return {
        task: newTask,
        success: true,
        message: `Task created: ${newTask.title}`,
      };
    } catch (error) {
      return {
        task: {} as Task,
        success: false,
        message: `Failed to create task: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// Update task status
export const updateTaskStatus = createTool({
  id: 'updateTaskStatus',
  description: 'Update the status of a task',
  inputSchema: z.object({
    taskId: z.string().describe('Task ID'),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
    workspaceDir: z.string().default(process.cwd()).describe('Workspace directory'),
  }),
  outputSchema: z.object({
    task: TaskSchema.optional(),
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const tasks = await loadTasks(context.workspaceDir);
      const taskIndex = tasks.findIndex(task => task.id === context.taskId);
      
      if (taskIndex === -1) {
        return {
          success: false,
          message: `Task not found: ${context.taskId}`,
        };
      }
      
      tasks[taskIndex].status = context.status;
      tasks[taskIndex].updatedAt = new Date().toISOString();
      
      await saveTasks(context.workspaceDir, tasks);
      
      return {
        task: tasks[taskIndex],
        success: true,
        message: `Task status updated to ${context.status}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update task: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// List tasks with filtering
export const listTasks = createTool({
  id: 'listTasks',
  description: 'List tasks with optional filtering',
  inputSchema: z.object({
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assignee: z.string().optional(),
    repository: z.object({
      owner: z.string(),
      repo: z.string(),
    }).optional(),
    tags: z.array(z.string()).optional(),
    workspaceDir: z.string().default(process.cwd()).describe('Workspace directory'),
  }),
  outputSchema: z.object({
    tasks: z.array(TaskSchema),
    count: z.number(),
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      let tasks = await loadTasks(context.workspaceDir);
      
      // Apply filters
      if (context.status) {
        tasks = tasks.filter(task => task.status === context.status);
      }
      
      if (context.priority) {
        tasks = tasks.filter(task => task.priority === context.priority);
      }
      
      if (context.assignee) {
        tasks = tasks.filter(task => task.assignee === context.assignee);
      }
      
      if (context.repository) {
        tasks = tasks.filter(task => 
          task.repository?.owner === context.repository!.owner &&
          task.repository?.repo === context.repository!.repo
        );
      }
      
      if (context.tags && context.tags.length > 0) {
        tasks = tasks.filter(task => 
          context.tags!.some(tag => task.tags.includes(tag))
        );
      }
      
      return {
        tasks,
        count: tasks.length,
        success: true,
        message: `Found ${tasks.length} tasks`,
      };
    } catch (error) {
      return {
        tasks: [],
        count: 0,
        success: false,
        message: `Failed to list tasks: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// Get task by ID
export const getTask = createTool({
  id: 'getTask',
  description: 'Get a specific task by ID',
  inputSchema: z.object({
    taskId: z.string().describe('Task ID'),
    workspaceDir: z.string().default(process.cwd()).describe('Workspace directory'),
  }),
  outputSchema: z.object({
    task: TaskSchema.optional(),
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const tasks = await loadTasks(context.workspaceDir);
      const task = tasks.find(task => task.id === context.taskId);
      
      if (!task) {
        return {
          success: false,
          message: `Task not found: ${context.taskId}`,
        };
      }
      
      return {
        task,
        success: true,
        message: `Task found: ${task.title}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get task: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// Delete task
export const deleteTask = createTool({
  id: 'deleteTask',
  description: 'Delete a task by ID',
  inputSchema: z.object({
    taskId: z.string().describe('Task ID'),
    workspaceDir: z.string().default(process.cwd()).describe('Workspace directory'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const tasks = await loadTasks(context.workspaceDir);
      const taskIndex = tasks.findIndex(task => task.id === context.taskId);
      
      if (taskIndex === -1) {
        return {
          success: false,
          message: `Task not found: ${context.taskId}`,
        };
      }
      
      const deletedTask = tasks.splice(taskIndex, 1)[0];
      await saveTasks(context.workspaceDir, tasks);
      
      return {
        success: true,
        message: `Task deleted: ${deletedTask.title}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete task: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// Update task details
export const updateTask = createTool({
  id: 'updateTask',
  description: 'Update task details',
  inputSchema: z.object({
    taskId: z.string().describe('Task ID'),
    title: z.string().optional(),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assignee: z.string().optional(),
    dueDate: z.string().optional(),
    tags: z.array(z.string()).optional(),
    workspaceDir: z.string().default(process.cwd()).describe('Workspace directory'),
  }),
  outputSchema: z.object({
    task: TaskSchema.optional(),
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const tasks = await loadTasks(context.workspaceDir);
      const taskIndex = tasks.findIndex(task => task.id === context.taskId);
      
      if (taskIndex === -1) {
        return {
          success: false,
          message: `Task not found: ${context.taskId}`,
        };
      }
      
      const task = tasks[taskIndex];
      
      // Update fields if provided
      if (context.title) task.title = context.title;
      if (context.description) task.description = context.description;
      if (context.priority) task.priority = context.priority;
      if (context.assignee !== undefined) task.assignee = context.assignee;
      if (context.dueDate !== undefined) task.dueDate = context.dueDate;
      if (context.tags) task.tags = context.tags;
      
      task.updatedAt = new Date().toISOString();
      
      await saveTasks(context.workspaceDir, tasks);
      
      return {
        task,
        success: true,
        message: `Task updated: ${task.title}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update task: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// Get task statistics
export const getTaskStatistics = createTool({
  id: 'getTaskStatistics',
  description: 'Get statistics about tasks',
  inputSchema: z.object({
    workspaceDir: z.string().default(process.cwd()).describe('Workspace directory'),
  }),
  outputSchema: z.object({
    total: z.number(),
    byStatus: z.record(z.number()),
    byPriority: z.record(z.number()),
    overdue: z.number(),
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const tasks = await loadTasks(context.workspaceDir);
      const now = new Date();
      
      const stats = {
        total: tasks.length,
        byStatus: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        overdue: 0,
      };
      
      // Count by status and priority
      tasks.forEach(task => {
        stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
        stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
        
        // Check if overdue
        if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'completed') {
          stats.overdue++;
        }
      });
      
      return {
        ...stats,
        success: true,
        message: `Statistics for ${tasks.length} tasks`,
      };
    } catch (error) {
      return {
        total: 0,
        byStatus: {},
        byPriority: {},
        overdue: 0,
        success: false,
        message: `Failed to get statistics: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

export const taskManagementTools = {
  createTask,
  updateTaskStatus,
  listTasks,
  getTask,
  deleteTask,
  updateTask,
  getTaskStatistics,
};
