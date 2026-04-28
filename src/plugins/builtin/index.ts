import brewPlugin from "./brew";
import npmPlugin from "./npm";
import vscodePlugin from "./vscode";
import gitPlugin from "./git";
import type { Plugin } from "../types";

export const builtinPlugins: Plugin[] = [
  brewPlugin,
  npmPlugin,
  vscodePlugin,
  gitPlugin,
];

export { brewPlugin, npmPlugin, vscodePlugin, gitPlugin };
