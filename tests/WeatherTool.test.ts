// tests/WeatherTool.test.ts
import { inputSchema, handler } from "../src/tools/WeatherTool";
import axios from "axios";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeAll(() => {
  // Make axios.isAxiosError always return true for our error‐tests
  jest.spyOn(axios, "isAxiosError").mockReturnValue(true);
});

describe("WeatherTool handler", () => {
  const validArgs = {
    sessionId: "123e4567-e89b-12d3-a456-426614174000",
    location: "Paris",
  };
  const extra: RequestHandlerExtra<any, any> = {
    signal: new AbortController().signal,
    requestId: "req-1",
    sendNotification: jest.fn(),
    sendRequest: jest.fn(),
  };

  const originalApiKey = process.env.ACCUWEATHER_API_KEY;

  beforeEach(() => {
    process.env.ACCUWEATHER_API_KEY = "dummy-key";
    mockedAxios.get.mockReset();
  });

  afterAll(() => {
    // restore env
    if (originalApiKey) process.env.ACCUWEATHER_API_KEY = originalApiKey;
    else delete process.env.ACCUWEATHER_API_KEY;
  });

  it("passes zod validation for well-formed input", () => {
    expect(() => inputSchema.parse(validArgs)).not.toThrow();
  });

  it("rejects when location is empty", () => {
    expect(() =>
      inputSchema.parse({ sessionId: validArgs.sessionId, location: "" })
    ).toThrow(/Location must be at least 1 character/);
  });

  it("returns validation error when sessionId is empty", async () => {
    const resp = await handler(
      { sessionId: "", location: "London" },
      extra
    );
    expect(resp.content[0].text).toMatch(
      /Invalid input: sessionId: SessionId must be at least 1 character/
    );
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it("fetches location key and 12-hour forecast and formats text", async () => {
    // location-search API
    mockedAxios.get
      .mockResolvedValueOnce({ data: [{ Key: "LOC123" }] })
      // forecast API
      .mockResolvedValueOnce({
        data: [
          {
            DateTime: "2025-05-04T15:00:00+02:00",
            Temperature: { Value: 20, Unit: "C" },
            IconPhrase: "Sunny",
          },
        ],
      });

    const result = await handler(validArgs, extra);

    // two calls: one for cities/search, one for hourly forecast
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("locations/v1/cities/search")
    );
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("forecasts/v1/hourly/12hour/LOC123")
    );

    // one text item in content array
    expect(result.content).toHaveLength(1);
    expect(result.content[0].text).toContain(
      "2025-05-04T15:00:00+02:00: 20°C, Sunny"
    );
  });

  it("errors out if API key is missing", async () => {
    delete process.env.ACCUWEATHER_API_KEY;
    const resp = await handler(validArgs, extra);
    expect(resp.content[0].text).toBe(
      "Error: AccuWeather API key not configured"
    );
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it("handles no-location-found", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    const resp = await handler(validArgs, extra);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(resp.content[0].text).toBe("No location found for: Paris");
  });

  it("handles 401 from forecast as invalid API key", async () => {
    // first call returns a valid key
    mockedAxios.get.mockResolvedValueOnce({ data: [{ Key: "LOCX" }] });
    // second call rejects with a 401
    const err = {
      isAxiosError: true,
      response: { status: 401, data: { Message: "Bad key" } },
    };
    mockedAxios.get.mockRejectedValueOnce(err);

    const resp = await handler(validArgs, extra);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(resp.content[0].text).toBe(
      "Invalid AccuWeather API key. Please check your credentials."
    );
  });
});