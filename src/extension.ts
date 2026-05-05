import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";
import { minify } from "terser";

type ExtensionConfig = {
  enabled: boolean;
  outputDirectory: string;
  include: string;
  exclude: string[];
  mangle: boolean;
  compress: boolean;
  sourceMap: boolean;
};

let watcher: vscode.FileSystemWatcher | undefined;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel("JS Minify Compiler");

  context.subscriptions.push(outputChannel);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "jsMinifyCompiler.minifyCurrentFile",
      async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
          vscode.window.showWarningMessage("No active file selected.");
          return;
        }

        await minifyFile(editor.document.uri);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "jsMinifyCompiler.minifyWorkspace",
      async () => {
        await minifyWorkspace();
      },
    ),
  );

  registerWatcher(context);

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("jsMinifyCompiler")) {
        registerWatcher(context);
      }
    }),
  );
}

export function deactivate(): void {
  watcher?.dispose();
}

function getConfig(): ExtensionConfig {
  const cfg = vscode.workspace.getConfiguration("jsMinifyCompiler");

  return {
    enabled: cfg.get<boolean>("enabled", true),
    outputDirectory: cfg.get<string>("outputDirectory", "dist/js"),
    include: cfg.get<string>("include", "**/*.js"),
    exclude: cfg.get<string[]>("exclude", [
      "**/*.min.js",
      "**/node_modules/**",
      "**/dist/**",
      "**/vendor/**",
    ]),
    mangle: cfg.get<boolean>("mangle", true),
    compress: cfg.get<boolean>("compress", true),
    sourceMap: cfg.get<boolean>("sourceMap", false),
  };
}

function registerWatcher(context: vscode.ExtensionContext): void {
  watcher?.dispose();

  const config = getConfig();

  if (!config.enabled) {
    outputChannel.appendLine("Auto minification disabled.");
    return;
  }

  watcher = vscode.workspace.createFileSystemWatcher(config.include);

  watcher.onDidCreate((uri) => minifyFile(uri), null, context.subscriptions);
  watcher.onDidChange((uri) => minifyFile(uri), null, context.subscriptions);

  context.subscriptions.push(watcher);

  outputChannel.appendLine(`Watching JavaScript files: ${config.include}`);
}

async function minifyWorkspace(): Promise<void> {
  const config = getConfig();
  const excludeGlob = `{${config.exclude.join(",")}}`;

  const files = await vscode.workspace.findFiles(config.include, excludeGlob);

  if (files.length === 0) {
    vscode.window.showInformationMessage(
      "No JavaScript files found to minify.",
    );
    return;
  }

  let success = 0;

  for (const file of files) {
    const ok = await minifyFile(file, false);
    if (ok) success++;
  }

  vscode.window.showInformationMessage(
    `Minified ${success}/${files.length} JavaScript files.`,
  );
}

async function minifyFile(
  uri: vscode.Uri,
  showMessage = true,
): Promise<boolean> {
  try {
    const config = getConfig();

    if (!config.enabled) {
      return false;
    }

    if (uri.scheme !== "file") {
      return false;
    }

    const sourcePath = uri.fsPath;

    if (!sourcePath.endsWith(".js") || sourcePath.endsWith(".min.js")) {
      return false;
    }

    if (isExcluded(sourcePath, config.exclude)) {
      return false;
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);

    if (!workspaceFolder) {
      vscode.window.showWarningMessage(
        "File is not inside a workspace folder.",
      );
      return false;
    }

    const sourceCode = await fs.readFile(sourcePath, "utf8");

    const result = await minify(sourceCode, {
      compress: config.compress,
      mangle: config.mangle,
      sourceMap: config.sourceMap
        ? {
            filename: path.basename(sourcePath),
            url: `${getMinifiedFileName(sourcePath)}.map`,
          }
        : false,
      format: {
        comments: false,
      },
    });

    if (!result.code) {
      throw new Error("Terser returned empty output.");
    }

    const outputPath = getOutputPath(
      sourcePath,
      workspaceFolder.uri.fsPath,
      config.outputDirectory,
    );
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, result.code, "utf8");

    if (config.sourceMap && result.map) {
      const sourceMapContent =
        typeof result.map === "string"
          ? result.map
          : JSON.stringify(result.map);

      await fs.writeFile(`${outputPath}.map`, sourceMapContent, "utf8");
    }

    outputChannel.appendLine(`Minified: ${sourcePath} -> ${outputPath}`);

    if (showMessage) {
      vscode.window.setStatusBarMessage(
        `JS minified: ${path.basename(outputPath)}`,
        3000,
      );
    }

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(`Error: ${message}`);
    vscode.window.showErrorMessage(`JS minification failed: ${message}`);
    return false;
  }
}

function getOutputPath(
  sourcePath: string,
  workspaceRoot: string,
  outputDirectory: string,
): string {
  const relativeSource = path.relative(workspaceRoot, sourcePath);
  const parsed = path.parse(relativeSource);

  const outputBase = path.isAbsolute(outputDirectory)
    ? outputDirectory
    : path.join(workspaceRoot, outputDirectory);

  return path.join(outputBase, parsed.dir, `${parsed.name}.min.js`);
}

function getMinifiedFileName(sourcePath: string): string {
  const parsed = path.parse(sourcePath);
  return `${parsed.name}.min.js`;
}

function isExcluded(filePath: string, patterns: string[]): boolean {
  const normalized = filePath.replace(/\\/g, "/");

  return patterns.some((pattern) => {
    const clean = pattern.replace(/\\/g, "/");

    if (
      clean.includes("node_modules") &&
      normalized.includes("/node_modules/")
    ) {
      return true;
    }

    if (clean.includes("dist") && normalized.includes("/dist/")) {
      return true;
    }

    if (clean.includes("vendor") && normalized.includes("/vendor/")) {
      return true;
    }

    if (clean.includes("*.min.js") && normalized.endsWith(".min.js")) {
      return true;
    }

    return false;
  });
}
