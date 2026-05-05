# JS Minify Compiler

[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://paypal.me/mmltools)

A Visual Studio Code extension that minifies JavaScript files and saves `.min.js` files into a configurable output directory.

## Features

- Minify current JavaScript file
- Minify entire workspace
- Auto-minify on save
- Configurable output directory (flat output, no nested paths)
- Optional source maps
- Uses Terser

## Configuration

Example `.vscode/settings.json`:

```json
{
  "jsMinifyCompiler.enabled": true,
  "jsMinifyCompiler.minifyOnSave": true,
  "jsMinifyCompiler.outputDirectory": "public/assets/js/",
  "jsMinifyCompiler.include": "**/*.js",
  "jsMinifyCompiler.exclude": [
    "**/*.min.js",
    "**/node_modules/**",
    "**/vendor/**"
  ],
  "jsMinifyCompiler.mangle": true,
  "jsMinifyCompiler.compress": true,
  "jsMinifyCompiler.sourceMap": false
}
```

## Output Behavior

All minified files are written **directly into the configured output directory**.

Example:

```
src/scripts/frontend.js
→ public/assets/js/frontend.min.js
```

Not:

```
public/assets/js/src/scripts/frontend.min.js
```

## Available Settings

| Setting | Default | Description |
|--------|--------|------------|
| `jsMinifyCompiler.enabled` | `true` | Enables the extension globally. |
| `jsMinifyCompiler.minifyOnSave` | `true` | Automatically minifies `.js` files when saving. |
| `jsMinifyCompiler.outputDirectory` | `dist/js` | Folder where `.min.js` files are written (flat structure). |
| `jsMinifyCompiler.include` | `**/*.js` | Glob pattern used for workspace minification. |
| `jsMinifyCompiler.exclude` | see defaults | Files/folders ignored by the minifier. |
| `jsMinifyCompiler.mangle` | `true` | Shortens variable and function names. |
| `jsMinifyCompiler.compress` | `true` | Optimizes and removes unused code. |
| `jsMinifyCompiler.sourceMap` | `false` | Generates `.map` files when enabled. |

## Commands

Open the Command Palette with `Ctrl + Shift + P`:

- `JS Minify Compiler: Minify Current File`
- `JS Minify Compiler: Minify Workspace`
