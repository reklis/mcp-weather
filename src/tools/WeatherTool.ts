import { z } from "zod";
import axios from "axios";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

// 1) Raw Zod shape (OpenAI-compatible JSON Schema)
export const inputShape = {
  sessionId: z.string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      "Must be a valid UUID"
    ),
  location: z.string().min(1),
};

// 2) Full schema for your own validation/tests
export const inputSchema = z.object(inputShape).describe("Get hourly weather forecast");

// 3) Handler: Accept generic args and validate inside
export async function handler(
    args: { [x: string]: any; }, // Accept generic args type
    extra: RequestHandlerExtra<any, any>
  ): Promise<{ content: TextContent[] }> {

    // Validate args using the schema inside the handler
    let validatedArgs: z.infer<typeof inputSchema>;
    try {
        validatedArgs = inputSchema.parse(args);
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { content: [{ type: "text", text: `Invalid input: ${errorMessages}` }] };
        }
        // Handle unexpected errors during parsing
        return { content: [{ type: "text", text: "An unexpected error occurred during input validation." }] };
    }

    const { sessionId, location } = validatedArgs; // Use validated args
    const apiKey = process.env.ACCUWEATHER_API_KEY;
    if (!apiKey) {
      return { content: [{ type: "text", text: "Error: AccuWeather API key not configured" }] };
    }

  try {
    // ... rest of the handler code remains the same ...
    // Step 1: Get location key
    const locationUrl = `http://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=${encodeURIComponent(location)}`;
    const locationResp = await axios.get(locationUrl);

    if (!locationResp.data || locationResp.data.length === 0) {
        const content: TextContent[] = [
            { type: "text" as const, text: `No location found for: ${location}` }
            ];
            return { content };
    }

    const locationKey = locationResp.data[0].Key;

    // Step 2: Get forecast with location key
    const forecastUrl = `http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/${locationKey}?apikey=${apiKey}`;
    const forecastResp = await axios.get(forecastUrl);
    const data = forecastResp.data;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No weather data available for location: ${location}`
        }]
      };
    }

    // 4) Return exactly `{ content: ContentBlock[] }`
    const content: TextContent[] = data.map((hour: any) => ({
      type: "text" as const,
      text: `${hour.DateTime}: ${hour.Temperature.Value}°${hour.Temperature.Unit}, ${hour.IconPhrase}`,
    }));

    return { content };
  } catch (error) {
    console.error("WeatherTool handler error:", error);
    let errorMessage = "An error occurred while fetching weather data.";

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        errorMessage = "Invalid AccuWeather API key. Please check your credentials.";
      } else if (error.response?.status === 404) {
        errorMessage = `Location not found: ${location}`;
      } else if (error.response) {
        errorMessage = `AccuWeather API error (${error.response.status}): ${error.response.data?.Message || error.message}`;
      } else if (error.request) {
        errorMessage = "Network error: Unable to connect to AccuWeather API.";
      }
    }

    const content: TextContent[] = [
        { type: "text" as const, text: errorMessage }
      ];
      return { content };

  }
}

export default { inputShape, inputSchema, handler };