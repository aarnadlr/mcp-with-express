import { createServer } from '../src/create-server.js';

export const config = {
  runtime: 'edge',
};

const { server } = createServer();

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.',
        },
        id: null,
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = await req.json();
    const { method, params, id } = body;

    // Handle MCP protocol methods directly
    if (method === 'initialize') {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'weather',
              version: '1.0.0',
            },
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'tools/list') {
      // Get tools from server
      const tools = Array.from(server.server.getHandlers('tools/call').keys()).map(name => ({
        name,
        description: `Tool: ${name}`,
        inputSchema: {
          type: 'object',
          properties: {},
        },
      }));

      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: { tools },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'tools/call') {
      // Call the tool handler directly
      const toolName = params.name;
      const toolArgs = params.arguments || {};
      
      const handlers = server.server.getHandlers('tools/call');
      const handler = handlers.get(toolName);
      
      if (!handler) {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: `Tool not found: ${toolName}`,
            },
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      const result = await handler(toolArgs);
      
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id,
          result,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error handling MCP request:', error);
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal server error',
        },
        id: null,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
