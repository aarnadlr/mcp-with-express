import type { VercelRequest, VercelResponse } from '@vercel/node';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from '../src/create-server.js';

// Singleton transport instance (stateless)
let transport: StreamableHTTPServerTransport | null = null;
let server: ReturnType<typeof createServer>['server'] | null = null;

async function initializeServer() {
  if (!transport) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });
  }
  
  if (!server) {
    const created = createServer();
    server = created.server;
    await server.connect(transport);
  }
  
  return { transport, server };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed.',
      },
      id: null,
    });
  }

  try {
    // Initialize or reuse server and transport
    const { transport, server } = await initializeServer();

    // Handle the MCP request
    await transport.handleRequest(
      req as any,
      res as any,
      req.body
    );
  } catch (error) {
    console.error('Error handling MCP request:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
}
