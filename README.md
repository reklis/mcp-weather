# MCP Weather Server

[![npm version](https://img.shields.io/npm/v/@timlukahorstmann/mcp-weather)](https://www.npmjs.com/package/@timlukahorstmann/mcp-weather)
[![license](https://img.shields.io/github/license/TimLukaHorstmann/mcp-weather)](https://github.com/TimLukaHorstmann/mcp-weather/blob/main/LICENSE)
[![node version](https://img.shields.io/node/v/@timlukahorstmann/mcp-weather)](https://www.npmjs.com/package/@timlukahorstmann/mcp-weather)
[![issues](https://img.shields.io/github/issues/TimLukaHorstmann/mcp-weather)](https://github.com/TimLukaHorstmann/mcp-weather/issues)
[![weekly downloads](https://img.shields.io/npm/dw/@timlukahorstmann/mcp-weather)](https://www.npmjs.com/package/@timlukahorstmann/mcp-weather)

<p align="center">
  <img src="logo.png" alt="MCP Weather Server Logo" width="250"/>
  <a href="https://glama.ai/mcp/servers/@TimLukaHorstmann/mcp-weather">
    <img width="380" height="200" src="https://glama.ai/mcp/servers/@TimLukaHorstmann/mcp-weather/badge" alt="Weather MCP server" />
  </a>
</p>

A Model Context Protocol (MCP) server that provides hourly weather forecasts using the AccuWeather API.

---

## Quick Start

You need an AccuWeather API key (free tier available).  
[Sign up here](https://developer.accuweather.com/) and create an app to get your key.

Export your API key as an environment variable:

```bash
export ACCUWEATHER_API_KEY=your_api_key_here
```

Then run the MCP Weather server directly with:

```bash
npx -y @timlukahorstmann/mcp-weather
```

Or, for HTTP/REST access via [supergateway](https://github.com/supercorp-ai/supergateway):

```bash
npx -y supergateway --stdio "npx -y @timlukahorstmann/mcp-weather" \
  --port 4004 \
  --baseUrl http://127.0.0.1:4004 \
  --ssePath /messages \
  --messagePath /message \
  --cors "*" \
  --env ACCUWEATHER_API_KEY="$ACCUWEATHER_API_KEY"
```

---

## MCP Server Config Example

For integration with Claude Desktop or other MCP-compatible clients, add this to your config (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["-y", "@timlukahorstmann/mcp-weather"],
      "env": {
        "ACCUWEATHER_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

---

## Overview

This MCP server allows large language models (like Claude) to access real-time weather data. When integrated with an LLM, it enables the model to:

- Fetch accurate, up-to-date weather forecasts
- Provide hourly weather data for any location
- Access temperature, conditions, and other weather details

## Prerequisites

- Node.js ≥18  
- An AccuWeather API key (set via `.env` or your shell)

## Setup

1. **Clone this repository:**
   ```bash
   git clone https://github.com/TimLukaHorstmann/mcp-weather.git
   cd mcp-weather
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Get an AccuWeather API key:**
   - Register at [AccuWeather API](https://developer.accuweather.com/)
   - Create a new app and obtain an API key

4. **Create a `.env` file with your API key:**
   ```
   ACCUWEATHER_API_KEY=your_api_key_here
   ```

5. **Build the project:**
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
         "command": "npx",
         "args": ["-y", "@timlukahorstmann/mcp-weather"],
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

## Development

- Install dev dependencies: `npm install`
- Lint your code:           `npm run lint`  
- Build:                    `npm run build`  
- Run tests:                `npm test`
- Start in dev mode:        `npm run dev`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Future Enhancements

We're always looking to improve the MCP Weather Server. Here are some features we're considering for future releases:

-   **Daily Forecasts:** Option to retrieve a summary for the next few days.
-   **Extended Hourly Forecasts:** Beyond 12 hours, e.g., 24 or 48 hours.
-   **More Configuration Options:** e.g., preferred units (Celsius/Fahrenheit) via input.

If you have ideas for other features, feel free to open an issue!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.