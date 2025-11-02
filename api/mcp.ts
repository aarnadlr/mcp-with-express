import type { VercelRequest, VercelResponse } from '@vercel/node';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from '../src/create-server.js';

// Create server and transport instances once
const { server } = createServer();
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});

// Initialize connection once
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await server.connect(transport);
    initialized = true;
  }
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
    // Ensure server is initialized
    await ensureInitialized();
    
    // Use transport to handle the request
    await transport.handleRequest(req as any, res as any, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal server error',
        },
        id: req.body?.id || null,
      });
    }
  }
}
