import brewPlugin from "./brew";
import npmPlugin from "./npm";
import vscodePlugin from "./vscode";
import { Plugin } from "../types";

const builtinPlugins: Plugin[] = [brewPlugin, npmPlugin, vscodePlugin];

export default builtinPlugins;
export { brewPlugin, npmPlugin, vscodePlugin };
