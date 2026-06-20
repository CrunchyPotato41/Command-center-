import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { toolDefinitions, handleTool } from './tools.js';

const server = new Server(
  {
    name: 'command-center',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: toolDefinitions
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const result = await handleTool(name, args || {});
  return result;
});

const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.error('Command Center MCP server running on stdio');
}).catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
