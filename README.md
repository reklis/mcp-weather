# MCP Weather Server

<p align="center">
  <img src="logo.png" alt="MCP Weather Server Logo" width="250"/>
</p>

A Model Context Protocol (MCP) server that provides hourly weather forecasts using the AccuWeather API.

## Overview

This MCP server allows large language models (like Claude) to access real-time weather data. When integrated with an LLM, it enables the model to:

- Fetch accurate, up-to-date weather forecasts
- Provide hourly weather data for any location
- Access temperature, conditions, and other weather details

## Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/TimLukaHorstmann/mcp-weather.git
   cd mcp-weather
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Get an AccuWeather API key:
   - Register at [AccuWeather API](https://developer.accuweather.com/)
   - Create a new app and obtain an API key

4. Create a `.env` file with your API key:
   ```
   ACCUWEATHER_API_KEY=your_api_key_here
   ```

5. Build the project:
   ```bash
   npm run build
   ```

## Usage with Claude Desktop

1. Configure Claude Desktop to use this MCP server:
   - Open Claude Desktop
   - Go to Settings > Developer > Edit Config
   - Add the following to your `claude_desktop_config.json`:

   ```json
   {
     "mcpServers": {
       "weather": {
         "command": "node",
         "args": ["/absolute/path/to/mcp-weather/build/index.js"],
         "env": {
           "ACCUWEATHER_API_KEY": "your_api_key_here"
         }
       }
     }
   }
   ```

2. Restart Claude Desktop

3. In a new conversation, enable the MCP server by clicking the plug icon and selecting "weather"

4. Now you can ask Claude for weather forecasts, such as:
   - "What's the weather forecast for New York City?"
   - "Will it rain in London tomorrow?"
   - "How hot will it be in Tokyo this afternoon?"

## Usage with mcp.json

You can also integrate this server into any MCP-compatible app using an `mcp.json` config. Example:

```json
{
  "mcp": {
    "servers": {
      "weather": {
        "command": "uvx",
        "args": ["--from", "git+https://github.com/TimLukaHorstmann/mcp-weather.git", "mcp-weather"],
        "env": {
          "ACCUWEATHER_API_KEY": "${input:accuweather_api_key}"
        }
      }
    }
  }
}
```

## Running with Supergateway

You can run this server with [supergateway](https://github.com/supercorp-ai/supergateway) for HTTP/REST access:

```bash
npx -y supergateway --stdio "uvx --from git+https://github.com/TimLukaHorstmann/mcp-weather.git mcp-weather" \
  --port 4004 \
  --baseUrl http://127.0.0.1:4004 \
  --ssePath /messages \
  --messagePath /message \
  --cors "*" \
  --env ACCUWEATHER_API_KEY="$ACCUWEATHER_API_KEY"
```

This will expose the MCP weather server on port 4004.

## Development

- Run tests: `npm test`
- Start in development mode: `npm run dev`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.