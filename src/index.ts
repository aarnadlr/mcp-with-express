import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import { randomUUID } from "crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./create-server.js";

// Environment setup
dotenv.config();
const PORT = process.env.PORT || 3000;

// Initialize Express app
const app = express();

// Middleware setup
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));
app.use(
  cors({
    origin: true,
    methods: "*",
    allowedHeaders: "Authorization, Origin, Content-Type, Accept, *",
  })
);
app.options("*", cors());

// Create single shared MCP server and transport
// StreamableHTTPServerTransport handles session management internally
const { server } = createServer();
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
});

let serverConnected = false;

// MCP endpoint handler
const handleMcpRequest = async (req: Request, res: Response) => {
  console.log(`${req.method} /mcp - ${req.body?.method || 'unknown'} - sessionId: ${req.body?.sessionId || 'none'}`);

  try {
    // Ensure server is connected to transport (lazy initialization)
    if (!serverConnected) {
      await server.connect(transport);
      serverConnected = true;
      console.log('MCP server connected to transport');
    }
    
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
};

// Health check endpoint for Railway
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    serverConnected,
    timestamp: new Date().toISOString(),
  });
});

// MCP endpoints - handle all methods and let transport decide what's allowed
app.all("/mcp", handleMcpRequest);

// Start Express server
app.listen(PORT, () => {
  console.log(`MCP Server listening on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});

// Handle server shutdown
const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down server...`);
  
  try {
    await transport.close();
    await server.close();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  
  console.log("Shutdown complete");
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM")); // Railway uses SIGTERM
