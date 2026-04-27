# stacksnap

> CLI tool that captures and restores your dev environment config across machines using a single YAML manifest.

---

## Installation

```bash
npm install -g stacksnap
```

Or with pnpm:

```bash
pnpm add -g stacksnap
```

---

## Usage

**Capture your current environment:**

```bash
stacksnap capture
```

This generates a `stacksnap.yaml` manifest in your current directory, recording your installed tools, shell config, environment variables, and editor settings.

**Restore an environment from a manifest:**

```bash
stacksnap restore stacksnap.yaml
```

**Example `stacksnap.yaml`:**

```yaml
version: 1
tools:
  node: "20.11.0"
  python: "3.12.2"
  git: "2.44.0"
shell:
  type: zsh
  plugins:
    - zsh-autosuggestions
    - zsh-syntax-highlighting
editor:
  vscode:
    extensions:
      - esbenp.prettier-vscode
      - dbaeumer.vscode-eslint
```

---

## Requirements

- Node.js >= 18
- macOS, Linux, or WSL

---

## License

[MIT](./LICENSE) © stacksnap contributors