import { inputSchema, handler } from "../src/tools/WeatherTool";
import axios, { AxiosHeaders, AxiosError } from "axios"; // Import AxiosError and AxiosHeaders
import { z } from "zod";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeAll(() => {
  jest.spyOn(axios, "isAxiosError").mockReturnValue(true);
});

describe("WeatherTool", () => {
  const valid = { sessionId: "123e4567-e89b-12d3-a456-426614174000", location: "Paris" };
  const mockExtra: RequestHandlerExtra<any, any> = {
    signal: new AbortController().signal,
    requestId: "test-request-id",
    sendNotification: jest.fn(),
    sendRequest: jest.fn()
  };

  const originalApiKey = process.env.ACCUWEATHER_API_KEY;

  beforeEach(() => {
    mockedAxios.get.mockReset();
    process.env.ACCUWEATHER_API_KEY = "test-api-key";
  });

  afterAll(() => {
    if (originalApiKey) {
      process.env.ACCUWEATHER_API_KEY = originalApiKey;
    } else {
      delete process.env.ACCUWEATHER_API_KEY;
    }
  });


  it("should validate inputs", () => {
    expect(() => inputSchema.parse(valid)).not.toThrow();
    expect(() => inputSchema.parse({ sessionId: "not-uuid", location: "" })).toThrow();
  });

  it("should call AccuWeather and format response", async () => {
    // Mock the location search first
    mockedAxios.get.mockResolvedValueOnce({ data: [{ Key: "12345" }] });
    // Mock the forecast call second
    const mockForecastData = [
      { DateTime: "2025-05-04T15:00:00+02:00", Temperature: { Value: 20, Unit: "C" }, IconPhrase: "Sunny" }
    ];
    mockedAxios.get.mockResolvedValueOnce({ data: mockForecastData });

    // Pass the mockExtra object as the second argument
    const resp = await handler(valid, mockExtra);

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("locations/v1/cities/search"));
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("forecasts/v1/hourly/12hour/12345"));
    expect(resp.content).toHaveLength(1);
    expect(resp.content[0].text).toContain("2025-05-04T15:00:00+02:00: 20°C, Sunny");
  });

  it("should handle validation errors", async () => {
    const invalidInput = { sessionId: "not-a-uuid", location: "London" };
    const resp = await handler(invalidInput, mockExtra);
    expect(resp.content[0].text).toContain("Invalid input: sessionId: Invalid uuid");
    expect(mockedAxios.get).not.toHaveBeenCalled(); // Axios should not be called on validation error
  });

  it("should handle API key missing error", async () => {
    // Delete the key set in beforeEach
    delete process.env.ACCUWEATHER_API_KEY;
    const resp = await handler(valid, mockExtra);
    expect(resp.content[0].text).toBe("Error: AccuWeather API key not configured");
    // No need to restore here, beforeEach will set it for the next test
    expect(mockedAxios.get).not.toHaveBeenCalled(); // Axios should not be called if API key is missing
  });

  it("should handle location not found error", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] }); // Simulate location not found
    const resp = await handler(valid, mockExtra);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Only location search should be called
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("locations/v1/cities/search"));
    expect(resp.content[0].text).toBe("No location found for: Paris");
  });

  it("should handle AccuWeather API errors", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [{ Key: "12345" }] });

    const apiError = {
      isAxiosError: true,
      response: {
        status: 401,
        data: { Message: "API key invalid" }
      }
    };

    mockedAxios.get.mockRejectedValueOnce(apiError);

    const resp = await handler(valid, mockExtra);

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(resp.content[0].text).toBe("Invalid AccuWeather API key. Please check your credentials.");
  });

});