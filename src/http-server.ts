#!/usr/bin/env node
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from "@modelcontextprotocol/sdk/types.js";
import { handler as hourlyHandler } from "./tools/WeatherTool.js";
import { handler as dailyHandler } from "./tools/WeatherDailyTool.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

const hourlyWeatherTool: Tool = {
  name: "weather-get_hourly",
  description: "Get hourly weather forecast for the next 12 hours",
  inputSchema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "The city or location for which to retrieve the weather forecast."
      },
      units: {
        type: "string",
        description: "Temperature unit system (metric for Celsius, imperial for Fahrenheit). Default is metric.",
        enum: ["metric", "imperial"]
      }
    },
    required: ["location"]
  }
};

const dailyWeatherTool: Tool = {
  name: "weather-get_daily",
  description: "Get daily weather forecast for up to 15 days",
  inputSchema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "The city or location for which to retrieve the weather forecast."
      },
      days: {
        type: "number",
        description: "Number of days to forecast (1, 5, 10, or 15). Default is 5.",
        enum: [1, 5, 10, 15]
      },
      units: {
        type: "string",
        description: "Temperature unit system (metric for Celsius, imperial for Fahrenheit). Default is metric.",
        enum: ["metric", "imperial"]
      }
    },
    required: ["location"]
  }
};

const server = new Server(
  {
    name: "mcp-weather",
    version: "0.4.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [hourlyWeatherTool, dailyWeatherTool],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const args = request.params.arguments;
    if (args === undefined) {
      return {
        content: [{ type: "text", text: "Error: No arguments provided for the tool." }],
        isError: true
      };
    }
    
    if (request.params.name === "weather-get_hourly") {
      return await hourlyHandler(args, {} as RequestHandlerExtra<any, any>);
    } else if (request.params.name === "weather-get_daily") {
      return await dailyHandler(args, {} as RequestHandlerExtra<any, any>);
    } else {
      return {
        content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
        isError: true
      };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true
    };
  }
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', server: 'mcp-weather' });
});

// Create transport with stateless mode for simplicity
const httpTransport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined, // Stateless mode
  enableJsonResponse: false // Use SSE streaming
});

// Handle MCP requests
app.all('/mcp', async (req, res) => {
  await httpTransport.handleRequest(req, res, req.body);
});

server.connect(httpTransport).then(() => {
  console.error('MCP server connected to HTTP transport');
  app.listen(PORT, () => {
    console.error(`Weather MCP Server running on http://localhost:${PORT}`);
    console.error(`MCP endpoint: http://localhost:${PORT}/mcp`);
  });
}).catch((error) => {
  console.error('Failed to connect MCP server:', error);
  process.exit(1);
});