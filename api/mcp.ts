import { createServer, toolDefinitions } from '../src/create-server.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

export const config = {
  runtime: 'nodejs',
};

const { server } = createServer();
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});

// Initialize once
let isConnected = false;

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
    // Connect server to transport if not already connected
    if (!isConnected) {
      await server.connect(transport);
      isConnected = true;
    }

    const body = await req.json();
    const { method, params, id } = body;

    // Handle MCP protocol methods
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
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: { tools: toolDefinitions },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'tools/call') {
      // Forward to transport which will handle it
      const mockReq = {
        body,
        headers: { 'content-type': 'application/json' },
      };
      
      const mockRes: any = {
        _data: null,
        _status: 200,
        status(code: number) {
          this._status = code;
          return this;
        },
        json(data: any) {
          this._data = data;
          return this;
        },
        setHeader() {},
        end(data: any) {
          if (data) this._data = JSON.parse(data);
        },
      };

      await transport.handleRequest(mockReq as any, mockRes, body);
      
      return new Response(
        JSON.stringify(mockRes._data || { jsonrpc: '2.0', id, result: {} }),
        { 
          status: mockRes._status,
          headers: { 'Content-Type': 'application/json' } 
        }
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
