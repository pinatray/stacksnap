import { describe, it, expect, vi, beforeEach } from "vitest";
import gitPlugin, { isGitAvailable, getGlobalGitConfig } from "../builtin/git";
import type { PluginContext } from "../types";

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

import { execSync } from "child_process";
const mockExec = vi.mocked(execSync);

function makeCtx(pluginData: Record<string, unknown> = {}): PluginContext {
  return {
    manifest: { version: "1", plugins: { git: pluginData } },
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  } as unknown as PluginContext;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isGitAvailable", () => {
  it("returns true when git is installed", () => {
    mockExec.mockReturnValue("git version 2.40.0" as never);
    expect(isGitAvailable()).toBe(true);
  });

  it("returns false when git is not installed", () => {
    mockExec.mockImplementation(() => { throw new Error("not found"); });
    expect(isGitAvailable()).toBe(false);
  });
});

describe("getGlobalGitConfig", () => {
  it("parses key=value pairs correctly", () => {
    mockExec.mockReturnValue("user.name=Jane\nuser.email=jane@example.com" as never);
    const config = getGlobalGitConfig();
    expect(config["user.name"]).toBe("Jane");
    expect(config["user.email"]).toBe("jane@example.com");
  });

  it("returns empty object on error", () => {
    mockExec.mockImplementation(() => { throw new Error("fail"); });
    expect(getGlobalGitConfig()).toEqual({});
  });
});

describe("gitPlugin.capture", () => {
  it("captures git config when git is available", async () => {
    mockExec
      .mockReturnValueOnce("git version 2.40.0" as never)
      .mockReturnValueOnce("user.name=Jane\ncore.autocrlf=false" as never);
    const ctx = makeCtx();
    const result = await gitPlugin.capture(ctx);
    expect(result).toHaveProperty("config");
    expect((result as any).config["user.name"]).toBe("Jane");
  });

  it("skips capture when git is unavailable", async () => {
    mockExec.mockImplementation(() => { throw new Error("not found"); });
    const ctx = makeCtx();
    const result = await gitPlugin.capture(ctx);
    expect(result).toEqual({});
    expect(ctx.logger.warn).toHaveBeenCalled();
  });
});

describe("gitPlugin.restore", () => {
  it("sets each config entry via git config --global", async () => {
    mockExec.mockReturnValue("" as never);
    const ctx = makeCtx({ config: { "user.name": "Jane", "user.email": "jane@example.com" } });
    await gitPlugin.restore(ctx);
    expect(mockExec).toHaveBeenCalledWith(expect.stringContaining("user.name"), expect.anything());
    expect(ctx.logger.info).toHaveBeenCalledTimes(3); // git --version + 2 sets
  });
});
