import * as vscode from 'vscode';

export function getWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const mediaUri = vscode.Uri.joinPath(extensionUri, 'media');
  const molstarCss = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'molstar.css'));
  const molstarJs = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'molstar.js'));
  const webviewJs = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'webview.js'));
  const csp = [
    "default-src 'none'",
    `img-src ${webview.cspSource} data: blob:`,
    `font-src ${webview.cspSource} data:`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src ${webview.cspSource} 'unsafe-eval' 'wasm-unsafe-eval'`,
    `connect-src ${webview.cspSource} data: blob:`,
    'worker-src blob:',
  ].join('; ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${molstarCss}">
  <style>
    html, body, #app { width: 100%; height: 100%; margin: 0; overflow: hidden; }
    #app { position: fixed; inset: 0; }
    #drop-overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 10000;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.65);
      color: white;
      font: 20px sans-serif;
      pointer-events: none;
    }
    body.drag-over #drop-overlay { display: flex; }
  </style>
</head>
<body>
  <div id="app"></div>
  <div id="drop-overlay">Drop structure files to open</div>
  <script src="${molstarJs}"></script>
  <script src="${webviewJs}"></script>
</body>
</html>`;
}
