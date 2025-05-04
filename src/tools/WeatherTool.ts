import { z } from "zod";
import axios from "axios";
import type { CallToolResponse, Content } from "@modelcontextprotocol/sdk/types";

export const inputSchema = z.object({
  sessionId: z.string().uuid().describe("Unique session ID"),
  location: z.string().min(1).describe("City name or coordinates"),
});

export async function handler(
  params: z.infer<typeof inputSchema>
): Promise<CallToolResponse> {
  const { sessionId, location } = params;
  
  // Check for API key
  const apiKey = process.env.ACCUWEATHER_API_KEY;
  if (!apiKey) {
    return {
      content: [{
        type: "text",
        text: "Error: AccuWeather API key not configured. Please set the ACCUWEATHER_API_KEY environment variable."
      }]
    };
  }
  
  try {
    const url = `http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/${encodeURIComponent(
      location
    )}?apikey=${apiKey}`;

    const resp = await axios.get(url);
    const data = resp.data as any[];

    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No weather data available for location: ${location}`
        }]
      };
    }

    const contents: Content[] = data.map((hour) => ({
      type: "text",
      text: `${hour.DateTime}: ${hour.Temperature.Value}°${hour.Temperature.Unit}, ${hour.IconPhrase}`,
    }));

    return { content: contents };
  } catch (error) {
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
    
    return {
      content: [{
        type: "text",
        text: errorMessage
      }]
    };
  }
}

export default { inputSchema, handler };