# Biomolecule Viewer Design

## Goal

Build a locally testable VS Code extension that opens molecular structures in Mol* and can be launched directly by right-clicking a structure file in the Explorer. The first milestone must run in the user's code-server 1.101.2 instance without a separate web server or CDN dependency.

## Scope of the First Installable Milestone

- Extension display name: `Biomolecule Viewer`.
- View type: `biomoleculeViewer.preview`.
- Read-only custom editor with `priority: option`, so ordinary PDB/mmCIF text editing remains available.
- Explorer command `Open with Biomolecule Viewer` for `.pdb`, `.ent`, `.pdbqt`, `.cif`, `.mmcif`, `.mcif`, `.bcif`, `.gro`, `.xyz`, `.mol`, `.mol2`, `.sdf`, and `.sd` files.
- Command-palette command `Biomolecule Viewer: Open Structure...` with a file picker.
- Locally bundled Mol* 5.13.1 viewer; no runtime CDN dependency.
- Secure external-script webview with a restrictive CSP and typed host-to-webview load messages.
- Full Mol* selection, component, representation, measurement, and visibility interface.
- Drag-and-drop loading through Mol*'s `Viewer.loadFiles` API.
- A packaged VSIX below 10 MB if practical with the standard Mol* bundle.
- Installation through `code-server --install-extension` and verification of command/editor registration.

Named PyMOL selections, a PyMOL command parser, automatic trajectory pairing, and workspace session restoration are subsequent milestones. The first milestone deliberately establishes the installable editor and loading path they will use.

## Architecture

The extension host registers commands and a `CustomReadonlyEditorProvider`. Opening a file creates a webview whose scripts, styles, and Mol* assets are packaged under `media/`. The webview sends a `ready` message; the host replies with a versioned `loadStructure` message containing a webview URI, Mol* format, binary flag, and display label. User input is never interpolated into executable JavaScript.

The extension-host bundle uses Node/CommonJS with `vscode` external. The webview bundle uses browser JavaScript and the prebuilt Mol* global. Build scripts copy only Mol*'s viewer JavaScript, CSS, and license notices out of `node_modules`.

## Error Handling

Unsupported extensions are rejected before opening the viewer. Missing or failed structure loads surface in the VS Code error notification area and the webview log. Webview panels and event subscriptions are disposed with the editor. Files outside the workspace are supported by granting the containing directory to `localResourceRoots` rather than exposing the whole filesystem.

## Verification

Run TypeScript checking, both esbuild bundles, asset copying, and VSIX packaging. Inspect the VSIX contents to ensure `node_modules` and sources are excluded. Install the exact VSIX with `code-server --install-extension --force`; list installed extensions to confirm `tzuhsiungyang.biomolecule-viewer`. Exercise the manifest's real `vscode.openWith` command path in automated extension-host verification if the server permits it; otherwise report that browser canvas interaction requires the user's reload and click test.

## Later Milestones

- PyMOL-style named selections, command console, show/hide/enable/disable semantics, and scene persistence.
- Explicit PDB/topology plus XTC/DCD trajectory pairing and playback.
- Remote HTTP data sources, signed URLs, and large-trajectory streaming after range-request behavior is verified.
