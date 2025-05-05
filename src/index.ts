#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from "@modelcontextprotocol/sdk/types.js";
import { handler } from "./tools/WeatherTool.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

// Define the tool in MCP-compatible format
const weatherTool: Tool = {
  name: "weather-get_hourly",
  description: "Get hourly weather forecast",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "A unique identifier for the user session."
      },
      location: {
        type: "string",
        description: "The city or location for which to retrieve the weather forecast."
      }
    },
    required: ["sessionId", "location"]
  }
};

const server = new Server(
  {
    name: "mcp-weather",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [weatherTool],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === "weather-get_hourly") {
      const args = request.params.arguments;
      if (args === undefined) {
        return {
          content: [{ type: "text", text: "Error: No arguments provided for the tool." }],
          isError: true
        };
      }
      return await handler(args, {} as RequestHandlerExtra<any, any>);
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

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

runServer().catch((err) => {
  console.error("Server error:", err);
  process.exit(1);
});