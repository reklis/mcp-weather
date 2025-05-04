// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { inputShape, handler } from "./tools/WeatherTool.js";
import type { ZodRawShape } from "zod";

async function main() {
  const server = new McpServer({
    name:    "mcp-weather",
    version: "0.1.0",
  });

  // Cast inputShape to ZodRawShape so TS picks the correct overload
  server.tool(
    "weather-get_hourly",
    inputShape as ZodRawShape,
    handler  // handler(params) -> Promise<{ content: TextContent[] }>
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

}

main().catch((err) => {
  console.error("Server error:", err);
  process.exit(1);
});
