"use babel";

import Config from "../lib/config";

describe("Config", () => {
  it("should read config values", () => {
    atom.config.set("Hydrogen.read", JSON.stringify("bar"));
    expect(Config.getJson("read")).toEqual("bar");
  });

  it("should return {} for broken config", () => {
    atom.config.set("Hydrogen.broken", "foo");
    expect(Config.getJson("broken")).toEqual({});
  });
});
