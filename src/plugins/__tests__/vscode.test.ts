import vscodePlugin from "../builtin/vscode";
import * as vscodeModule from "../builtin/vscode";
import { PluginContext } from "../types";
import { Manifest } from "../../manifest/types";

function makeCtx(overrides: Partial<Manifest["plugins"]> = {}): PluginContext {
  return {
    manifest: {
      version: "1",
      plugins: { vscode: { extensions: [] }, ...overrides },
    } as Manifest,
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  };
}

describe("vscode plugin", () => {
  beforeEach(() => jest.restoreAllMocks());

  describe("capture", () => {
    it("skips when code CLI is unavailable", async () => {
      jest.spyOn(vscodeModule, "isCodeAvailable").mockReturnValue(false);
      const ctx = makeCtx();
      await vscodePlugin.capture(ctx);
      expect(ctx.logger.warn).toHaveBeenCalledWith(expect.stringContaining("not found"));
      expect(ctx.manifest.plugins.vscode?.extensions).toEqual([]);
    });

    it("captures installed extensions", async () => {
      jest.spyOn(vscodeModule, "isCodeAvailable").mockReturnValue(true);
      jest
        .spyOn(vscodeModule, "getInstalledExtensions")
        .mockReturnValue(["esbenp.prettier-vscode", "dbaeumer.vscode-eslint"]);
      const ctx = makeCtx();
      await vscodePlugin.capture(ctx);
      expect(ctx.manifest.plugins.vscode?.extensions).toEqual([
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
      ]);
      expect(ctx.logger.info).toHaveBeenCalledWith(expect.stringContaining("2 extension"));
    });
  });

  describe("restore", () => {
    it("skips when code CLI is unavailable", async () => {
      jest.spyOn(vscodeModule, "isCodeAvailable").mockReturnValue(false);
      const ctx = makeCtx({ vscode: { extensions: ["esbenp.prettier-vscode"] } });
      await vscodePlugin.restore(ctx);
      expect(ctx.logger.warn).toHaveBeenCalledWith(expect.stringContaining("not found"));
    });

    it("skips already-installed extensions", async () => {
      jest.spyOn(vscodeModule, "isCodeAvailable").mockReturnValue(true);
      jest
        .spyOn(vscodeModule, "getInstalledExtensions")
        .mockReturnValue(["esbenp.prettier-vscode"]);
      const runSpy = jest.spyOn(vscodeModule, "runCommand").mockReturnValue("");
      const ctx = makeCtx({ vscode: { extensions: ["esbenp.prettier-vscode"] } });
      await vscodePlugin.restore(ctx);
      expect(runSpy).not.toHaveBeenCalledWith(expect.stringContaining("--install-extension"));
      expect(ctx.logger.info).toHaveBeenCalledWith(expect.stringContaining("already installed"));
    });

    it("installs missing extensions", async () => {
      jest.spyOn(vscodeModule, "isCodeAvailable").mockReturnValue(true);
      jest.spyOn(vscodeModule, "getInstalledExtensions").mockReturnValue([]);
      const runSpy = jest.spyOn(vscodeModule, "runCommand").mockReturnValue("");
      const ctx = makeCtx({ vscode: { extensions: ["esbenp.prettier-vscode"] } });
      await vscodePlugin.restore(ctx);
      expect(runSpy).toHaveBeenCalledWith(expect.stringContaining("esbenp.prettier-vscode"));
      expect(ctx.logger.info).toHaveBeenCalledWith(expect.stringContaining("1 new extension"));
    });
  });
});
