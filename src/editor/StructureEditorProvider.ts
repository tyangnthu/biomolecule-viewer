import path from 'node:path';
import * as vscode from 'vscode';
import { detectStructureFormat } from '../formats';
import type { ClientMessage, HostMessage } from '../protocol';
import { StructureDocument } from './StructureDocument';
import { getWebviewHtml } from './webviewHtml';

export const STRUCTURE_VIEW_TYPE = 'biomoleculeViewer.preview';

export class StructureEditorProvider implements vscode.CustomReadonlyEditorProvider<StructureDocument> {
  constructor(private readonly context: vscode.ExtensionContext) {}

  openCustomDocument(uri: vscode.Uri): StructureDocument {
    return new StructureDocument(uri);
  }

  resolveCustomEditor(document: StructureDocument, panel: vscode.WebviewPanel): void {
    const structureFormat = detectStructureFormat(document.uri);
    if (!structureFormat) {
      void vscode.window.showErrorMessage(`Unsupported structure file: ${document.uri.fsPath}`);
      panel.dispose();
      return;
    }

    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'media'),
        vscode.Uri.joinPath(document.uri, '..'),
      ],
    };
    panel.webview.html = getWebviewHtml(panel.webview, this.context.extensionUri);

    const messageSubscription = panel.webview.onDidReceiveMessage((message: ClientMessage) => {
      if (message.type === 'ready') {
        const loadMessage: HostMessage = {
          type: 'loadStructure',
          url: panel.webview.asWebviewUri(document.uri).toString(),
          format: structureFormat.format,
          isBinary: structureFormat.isBinary,
          label: path.basename(document.uri.fsPath),
        };
        void panel.webview.postMessage(loadMessage);
      } else if (message.type === 'error') {
        void vscode.window.showErrorMessage(`Biomolecule Viewer: ${message.message}`);
      }
    });
    panel.onDidDispose(() => messageSubscription.dispose());
  }
}
