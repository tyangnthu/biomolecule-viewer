# Biomolecule Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and install a code-server-compatible VS Code extension that opens molecular structures in a secure, locally bundled Mol* custom editor from the Explorer context menu.

**Architecture:** A Node extension host registers a read-only custom editor and open command. A browser webview receives typed load messages and renders local files with Mol*'s prebuilt viewer; esbuild produces separate host and browser bundles and copies Mol* assets into the package.

**Tech Stack:** TypeScript, VS Code `CustomReadonlyEditorProvider`, Mol* 5.13.1, esbuild, npm, `@vscode/vsce`, code-server 1.101.2.

## Global Constraints

- Project root is `biomolecule-viewer/` under the current workspace.
- The required user workflow is Explorer right-click → `Open with Biomolecule Viewer` → rendered structure.
- Use `priority: option`; do not replace normal text editing by default.
- No runtime CDN, inline executable JavaScript, or user-input interpolation into scripts.
- Do not create new test files in this new project; verify with type checking, production builds, package inspection, extension-host/runtime commands, and the exact VSIX.
- Do not make git commits unless the user explicitly requests them.

---

### Task 1: Scaffold and Format Detection

**Files:**
- Create: `package.json`, `tsconfig.json`, `.vscodeignore`, `.gitignore`, `esbuild.mjs`
- Create: `src/formats.ts`, `src/protocol.ts`

**Interfaces:**
- Produces: `detectStructureFormat(uri: vscode.Uri): StructureFormat | undefined`, where `StructureFormat` has `format: string`, `isBinary: boolean`, and `extensions: readonly string[]` is used by the manifest generator/checks.
- Produces: `ClientMessage = { type: 'ready' } | { type: 'error'; message: string }` and `HostMessage = { type: 'loadStructure'; url: string; format: string; isBinary: boolean; label: string }`.

- [ ] **Step 1: Define scripts and pinned dependencies**

Use `molstar: 5.13.1`; development dependencies are TypeScript, esbuild, `@types/node`, and `@types/vscode`. Scripts must include `check-types`, `compile`, `watch`, `package`, and `vscode:prepublish`.

```json
{
  "name": "biomolecule-viewer",
  "displayName": "Biomolecule Viewer",
  "publisher": "tzuhsiungyang",
  "version": "0.1.0",
  "main": "./dist/extension.js",
  "engines": { "vscode": ">=1.95.0" }
}
```

- [ ] **Step 2: Implement extension-aware format mapping**

Map PDB-like files to Mol* format names, mmCIF names to `mmcif`, binary CIF to its binary parser, and `.sd` to `sdf`. Return `undefined` for unsupported extensions and for `.gz` rather than misidentifying gzip as a structure.

```ts
export interface StructureFormat {
  format: string;
  isBinary: boolean;
}

export function detectStructureFormat(uri: vscode.Uri): StructureFormat | undefined {
  const extension = uri.path.split('.').pop()?.toLowerCase();
  return extension ? FORMATS[extension] : undefined;
}
```

- [ ] **Step 3: Install and type-check**

Run `npm install` and `npx tsc --noEmit`; expected result is a clean install and no TypeScript errors.

### Task 2: Extension Host and Right-Click Opening

**Files:**
- Create: `src/extension.ts`, `src/editor/StructureDocument.ts`, `src/editor/StructureEditorProvider.ts`, `src/editor/webviewHtml.ts`

**Interfaces:**
- Consumes: `detectStructureFormat` and protocol messages from Task 1.
- Produces: `activate(context: vscode.ExtensionContext): void`, view type `biomoleculeViewer.preview`, and command `biomoleculeViewer.open`.

- [ ] **Step 1: Implement direct opening**

The command accepts the clicked URI, falls back to a file picker when invoked from the palette, and invokes the same VS Code open-with path used by custom editors.

```ts
await vscode.commands.executeCommand('vscode.openWith', uri, VIEW_TYPE);
```

- [ ] **Step 2: Implement document and editor lifecycle**

`StructureDocument` implements `CustomDocument`. The provider configures scripts, restricted resource roots, and HTML before waiting for the webview's `ready` message. On `ready`, it posts `loadStructure` using `panel.webview.asWebviewUri(document.uri).toString()` and the detected format.

- [ ] **Step 3: Generate CSP-correct HTML**

Load only `media/molstar.css`, `media/molstar.js`, and `media/webview.js`. Use `default-src 'none'`, external script sources, `wasm-unsafe-eval`, `worker-src blob:`, and `connect-src` containing the webview source. Permit inline styles required by Mol* but no inline scripts.

- [ ] **Step 4: Contribute the custom editor and Explorer action**

Register custom-editor selectors for every supported extension. Add an `explorer/context` command whose `when` clause accepts the same extensions and whose title is exactly `Open with Biomolecule Viewer`.

- [ ] **Step 5: Compile the host**

Run `npm run check-types && npm run compile`; expected result is `dist/extension.js` with `vscode` left external.

### Task 3: Mol* Webview and Drag-and-Drop

**Files:**
- Create: `src/webview/main.ts`
- Create: `src/webview/molstar.d.ts`
- Create: `media/.gitkeep` (build outputs remain ignored)

**Interfaces:**
- Consumes: `HostMessage` and emits `ClientMessage` from Task 1.
- Produces: a full-size Mol* viewer that loads the URI from `loadStructure` and accepts dropped structure files through `viewer.loadFiles(files)`.

- [ ] **Step 1: Create the viewer and ready handshake**

Declare the prebuilt global, create the viewer on `#app`, register message handlers, and only then post `ready`.

```ts
const viewer = await molstar.Viewer.create('app', {
  layoutIsExpanded: false,
  layoutShowControls: true,
  layoutShowSequence: true,
});
vscodeApi.postMessage({ type: 'ready' });
```

- [ ] **Step 2: Load structures without string-generated code**

Handle `loadStructure` by awaiting `viewer.loadStructureFromUrl(message.url, message.format, message.isBinary, { label: message.label })`. Report rejected loads with `viewer.plugin.log.error` and a typed error message.

- [ ] **Step 3: Add drag-and-drop**

Prevent the browser's default drop navigation, use a visible drag-over state, and pass dropped `File` objects directly to `viewer.loadFiles(Array.from(event.dataTransfer.files))`. Do not upload dropped files to the extension host.

- [ ] **Step 4: Build and inspect the browser bundle**

Run `npm run compile`; expected outputs are `dist/extension.js`, `media/webview.js`, `media/molstar.js`, and `media/molstar.css`, with no remote script URL in generated HTML.

### Task 4: Production Packaging and Runtime Verification

**Files:**
- Create: `README.md`, `LICENSE`, `NOTICE`, `CHANGELOG.md`
- Modify: `.vscodeignore`, `package.json` metadata as needed

**Interfaces:**
- Consumes: all prior build outputs.
- Produces: `biomolecule-viewer-0.1.0.vsix`, installable with code-server.

- [ ] **Step 1: Document local use and attribution**

Document right-click opening, command-palette opening, drag-and-drop, supported formats, and the fact that PyMOL commands/trajectory pairing are later milestones. Include Mol* and VSCoding-Sequence attribution and ship Mol*'s third-party license text.

- [ ] **Step 2: Build the production VSIX**

Run `npm run package && npx @vscode/vsce package --out biomolecule-viewer-0.1.0.vsix`; expected result is a valid VSIX with `dist/` and `media/`, without `node_modules/` or `src/`.

- [ ] **Step 3: Inspect the exact deliverable**

Run `unzip -l biomolecule-viewer-0.1.0.vsix`; confirm the manifest, bundles, Mol* assets, and licenses are present and package size is measured. If size exceeds 10 MB, inspect contents rather than deleting runtime assets blindly.

- [ ] **Step 4: Install into the user's code-server**

Run `code-server --install-extension biomolecule-viewer-0.1.0.vsix --force` and `code-server --list-extensions`; expected output includes `tzuhsiungyang.biomolecule-viewer`.

- [ ] **Step 5: Verify the real registration path**

Inspect the packaged `package.json` for the custom-editor selector, command ID, and Explorer `when` clause. If a headless VS Code extension host can run in this environment, invoke `vscode.openWith` on a small real PDB fixture and verify a `TabInputCustom` with view type `biomoleculeViewer.preview`; otherwise explicitly leave the final browser/canvas click test to the user after `Developer: Reload Window`.
