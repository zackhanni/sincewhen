import { describe, expect, it } from "vitest";
import { DEFAULT_DISPLAY_SETTINGS, parseDisplaySettings, readValidDisplayFields } from "./display-settings";

describe("display settings", () => {
  it("uses the defaults when nothing is saved", () => {
    expect(parseDisplaySettings(null)).toEqual(DEFAULT_DISPLAY_SETTINGS);
  });

  it("keeps the valid fields and defaults only the bad or missing ones", () => {
    expect(parseDisplaySettings({ theme: "dark", size: "huge" })).toEqual({
      ...DEFAULT_DISPLAY_SETTINGS,
      theme: "dark",
    });
  });

  it("reads saved settings from before the start screen existed", () => {
    expect(parseDisplaySettings({ theme: "light", size: "large" })).toEqual({
      theme: "light",
      size: "large",
      startOn: DEFAULT_DISPLAY_SETTINGS.startOn,
    });
  });

  it("returns only what is valid, for merging into the current settings", () => {
    expect(readValidDisplayFields({ startOn: "due", theme: 3 })).toEqual({ startOn: "due" });
    expect(readValidDisplayFields("dark")).toEqual({});
  });

  it("accepts only the exact words, as the old zod enums did", () => {
    expect(readValidDisplayFields({ theme: "Dark", size: ["large"], startOn: "due " })).toEqual({});
    expect(readValidDisplayFields({ theme: "system", size: "large", startOn: "folders" })).toEqual({
      theme: "system",
      size: "large",
      startOn: "folders",
    });
  });
});
