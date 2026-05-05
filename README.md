Full README example:

````md
# JS Minify Compiler

[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://paypal.me/mmltools)

A Visual Studio Code extension that minifies JavaScript files and saves `.min.js` files into a configurable output directory.

## Features

- Minify current JavaScript file
- Minify entire workspace
- Auto-minify on save
- Configurable output directory
- Optional source maps
- Uses Terser

## Configuration

Example `.vscode/settings.json`:

```json
{
  "jsMinifyCompiler.enabled": true,
  "jsMinifyCompiler.outputDirectory": "public/assets/min-js",
  "jsMinifyCompiler.include": "**/*.js",
  "jsMinifyCompiler.exclude": [
    "**/*.min.js",
    "**/node_modules/**",
    "**/public/assets/min-js/**",
    "**/vendor/**"
  ],
  "jsMinifyCompiler.mangle": true,
  "jsMinifyCompiler.compress": true,
  "jsMinifyCompiler.sourceMap": false
}
```
````
