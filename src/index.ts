import { Server } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import WeatherTool from "./tools/WeatherTool";

async function main() {
  const server = new Server(
    { name: "mcp-weather", version: "0.1.0" },
    { capabilities: { tools: { "weather-get_hourly": {} } } }
  );

  server.tool(
    "weather-get_hourly",
    WeatherTool.inputSchema,
    WeatherTool.handler
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log("✅ MCP Weather server listening on STDIO");
}

main().catch((err) => {
  console.error("❌ Server error:", err);
  process.exit(1);
});