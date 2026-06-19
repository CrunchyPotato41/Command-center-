#!/usr/bin/env node
import { handleTool } from './tools.js';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: command-center <tool_name> [args...]');
  process.exit(1);
}

const commandName = args[0].replace(/-/g, '_');
const rawArgs = args.slice(1);
const toolArgs: Record<string, any> = {};

// Very simple argument parser for CLI
// Example: command-center start-task task_001
// Example: command-center register-agent agent_001 "My Agent" orchestrator --permissions read,write
if (commandName === 'get_project_status' || commandName === 'list_agents') {
  // No args needed
} else if (commandName === 'get_task_context' || commandName === 'get_task_summary' || commandName === 'get_task_history' || commandName === 'reset_task' || commandName === 'start_task') {
  if (rawArgs.length > 0) toolArgs.task_id = rawArgs[0];
} else if (commandName === 'complete_task') {
  if (rawArgs.length > 0) toolArgs.task_id = rawArgs[0];
  if (rawArgs.length > 1) toolArgs.summary = rawArgs[1];
} else if (commandName === 'get_milestone_overview') {
  if (rawArgs.length > 0) toolArgs.milestone_id = rawArgs[0];
} else if (commandName === 'create_milestone') {
  if (rawArgs.length > 0) toolArgs.id = rawArgs[0];
  if (rawArgs.length > 1) toolArgs.title = rawArgs[1];
} else if (commandName === 'add_milestone_task') {
  if (rawArgs.length > 0) toolArgs.milestone_id = rawArgs[0];
  if (rawArgs.length > 1) toolArgs.label = rawArgs[1];
} else if (commandName === 'list_tasks') {
  let i = 0;
  while (i < rawArgs.length) {
    if (rawArgs[i] === '--milestone' && i + 1 < rawArgs.length) { toolArgs.milestone_id = rawArgs[++i]; }
    else if (rawArgs[i] === '--status' && i + 1 < rawArgs.length) { toolArgs.status = rawArgs[++i]; }
    else if (rawArgs[i] === '--domain' && i + 1 < rawArgs.length) { toolArgs.domain = rawArgs[++i]; }
    i++;
  }
} else if (commandName === 'register_agent') {
  if (rawArgs.length > 0) toolArgs.agent_id = rawArgs[0];
  if (rawArgs.length > 1) toolArgs.name = rawArgs[1];
  if (rawArgs.length > 2) toolArgs.type = rawArgs[2];
  let i = 3;
  while (i < rawArgs.length) {
    if (rawArgs[i] === '--permissions' && i + 1 < rawArgs.length) { 
      toolArgs.permissions = rawArgs[++i].split(','); 
    }
    i++;
  }
  if (!toolArgs.permissions) toolArgs.permissions = ['read', 'write'];
} else {
  // Try to parse basic positional arguments
  if (rawArgs.length > 0) toolArgs.task_id = rawArgs[0]; // best guess fallback
}

const result = handleTool(commandName, toolArgs);

if (result.isError) {
  console.error('Error:', result.content[0].text);
  process.exit(1);
} else {
  console.log(result.content[0].text);
}
