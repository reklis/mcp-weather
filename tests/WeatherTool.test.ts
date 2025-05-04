import { inputSchema, handler } from "../src/tools/WeatherTool";
import axios from "axios";
import { z } from "zod";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("WeatherTool", () => {
  const valid = { sessionId: "123e4567-e89b-12d3-a456-426614174000", location: "Paris" };

  it("should validate inputs", () => {
    expect(() => inputSchema.parse(valid)).not.toThrow();
    expect(() => inputSchema.parse({ sessionId: "not-uuid", location: "" })).toThrow();
  });

  it("should call AccuWeather and format response", async () => {
    const mockData = [
      { DateTime: "2025-05-04T15:00:00", Temperature: { Value: 20, Unit: "C" }, IconPhrase: "Sunny" }
    ];
    mockedAxios.get.mockResolvedValue({ data: mockData });

    const resp = await handler(valid);
    expect(resp.content).toHaveLength(1);
    expect(resp.content[0].text).toContain("2025-05-04T15:00:00");
  });
});