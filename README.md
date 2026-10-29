# Biomolecule Viewer

A local-first molecular structure viewer for VS Code and code-server, powered by Mol*.

## Open a structure

- Right-click a supported structure file in the Explorer and select **Open with Biomolecule Viewer**.
- Alternatively, run **Biomolecule Viewer: Open Structure...** from the Command Palette.
- To choose the viewer through VS Code's standard menu, select **Open With... → Biomolecule Viewer**.
- Drag structure files directly into an open viewer to load additional structures.

The extension uses a read-only custom editor with optional priority, so PDB and mmCIF files can still be opened as text normally.

## Supported formats

PDB (`.pdb`, `.ent`, `.pdbqt`), mmCIF (`.cif`, `.mmcif`, `.mcif`, `.bcif`), GRO (`.gro`), XYZ (`.xyz`), MOL (`.mol`), MOL2 (`.mol2`), and SDF (`.sdf`, `.sd`). Extension matching is case-insensitive. Gzip files are not supported in this milestone.

Mol* provides sequence, selection, component, representation, measurement, visibility, and camera controls. All viewer assets are packaged locally; no CDN is required.

## Build and install

```bash
npm ci
npm run check-types
npm run package
npx @vscode/vsce package --out biomolecule-viewer-0.1.0.vsix
code-server --install-extension biomolecule-viewer-0.1.0.vsix --force
```

Run **Developer: Reload Window** after installing or upgrading.

## Current scope

This release establishes secure local loading, right-click opening, and drag-and-drop. PyMOL-style named selections and commands, explicit XTC/DCD trajectory pairing, and session restoration are planned subsequent milestones.

## Acknowledgments

Built with [Mol*](https://molstar.org/). Inspired by [VSCoding-Sequence / Protein Viewer](https://github.com/molstar/VSCoding-Sequence). If Mol* is useful in research, cite Sehnal et al., *Nucleic Acids Research* 2021, doi:10.1093/nar/gkab314.
