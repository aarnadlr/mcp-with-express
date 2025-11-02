import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer } from '../src/create-server.js';

// Create server instance once (reused across invocations in warm containers)
const { server } = createServer();

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
    // Use Vercel's MCP adapter pattern - handle request directly
    const body = req.body;
    
    // Call the appropriate method based on the JSON-RPC request
    if (body.method === 'initialize') {
      const result = await server.server.request(
        { method: 'initialize', params: body.params },
        body.id
      );
      return res.json({
        jsonrpc: '2.0',
        id: body.id,
        result,
      });
    }
    
    if (body.method === 'tools/list') {
      const result = await server.server.request(
        { method: 'tools/list', params: body.params || {} },
        body.id
      );
      return res.json({
        jsonrpc: '2.0',
        id: body.id,
        result,
      });
    }
    
    if (body.method === 'tools/call') {
      const result = await server.server.request(
        { method: 'tools/call', params: body.params },
        body.id
      );
      return res.json({
        jsonrpc: '2.0',
        id: body.id,
        result,
      });
    }
    
    // Handle other methods
    const result = await server.server.request(
      { method: body.method, params: body.params },
      body.id
    );
    
    return res.json({
      jsonrpc: '2.0',
      id: body.id,
      result,
    });
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
