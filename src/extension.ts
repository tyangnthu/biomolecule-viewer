import * as vscode from 'vscode';
import { detectStructureFormat, extensions } from './formats';
import { STRUCTURE_VIEW_TYPE, StructureEditorProvider } from './editor/StructureEditorProvider';

async function openStructure(uri?: vscode.Uri): Promise<void> {
  let target = uri;
  if (!target) {
    const selection = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      openLabel: 'Open Structure',
      title: 'Biomolecule Viewer: Open Structure...',
      filters: { 'Structure files': [...extensions] },
    });
    target = selection?.[0];
  }

  if (!target) {
    return;
  }
  if (!detectStructureFormat(target)) {
    void vscode.window.showErrorMessage(`Unsupported structure file: ${target.fsPath}`);
    return;
  }

  await vscode.commands.executeCommand('vscode.openWith', target, STRUCTURE_VIEW_TYPE);
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('biomoleculeViewer.open', openStructure),
    vscode.commands.registerCommand('biomoleculeViewer.openPalette', () => openStructure()),
    vscode.window.registerCustomEditorProvider(
      STRUCTURE_VIEW_TYPE,
      new StructureEditorProvider(context),
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );
}
