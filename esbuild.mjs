import * as esbuild from 'esbuild';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const mediaDir = path.join(root, 'media');
const watch = process.argv.includes('--watch');

const builds = [
  {
    entryPoints: [path.join(root, 'src/extension.ts')],
    outfile: path.join(root, 'dist/extension.js'),
    bundle: true,
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    target: 'node20',
    logLevel: 'info',
  },
  {
    entryPoints: [path.join(root, 'src/webview/main.ts')],
    outfile: path.join(mediaDir, 'webview.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    minify: true,
    logLevel: 'info',
  },
];

async function readJson(file) {
  return JSON.parse(await readFile(path.join(root, file), 'utf8'));
}

async function validateManifestFormats() {
  const [formatMap, manifest] = await Promise.all([
    readJson('src/formats.json'),
    readJson('package.json'),
  ]);
  const extensions = Object.keys(formatMap);
  const editor = manifest.contributes.customEditors.find(
    (entry) => entry.viewType === 'biomoleculeViewer.preview',
  );
  const expectedSelectors = extensions.map((extension) => `*.${extension}`);
  const actualSelectors = editor?.selector?.map((entry) => entry.filenamePattern) ?? [];
  if (JSON.stringify(actualSelectors) !== JSON.stringify(expectedSelectors)) {
    throw new Error(
      `Custom-editor selectors do not match src/formats.json: expected ${expectedSelectors.join(', ')}`,
    );
  }

  const explorerCommand = manifest.contributes.menus['explorer/context'].find(
    (entry) => entry.command === 'biomoleculeViewer.open',
  );
  const expectedWhen = `resourceExtname =~ /\\.(${extensions.join('|')})$/i`;
  if (explorerCommand?.when !== expectedWhen) {
    throw new Error(`Explorer format filter does not match src/formats.json: expected ${expectedWhen}`);
  }
}

async function copyAssets() {
  await mkdir(mediaDir, { recursive: true });
  const packageRoot = path.join(root, 'node_modules/molstar');
  await Promise.all([
    copyFile(path.join(packageRoot, 'build/viewer/molstar.js'), path.join(mediaDir, 'molstar.js')),
    copyFile(path.join(packageRoot, 'build/viewer/molstar.css'), path.join(mediaDir, 'molstar.css')),
    copyFile(path.join(packageRoot, 'LICENSE'), path.join(mediaDir, 'molstar.LICENSE')),
  ]);
}

await validateManifestFormats();

if (watch) {
  await copyAssets();
  const contexts = await Promise.all(builds.map((options) => esbuild.context(options)));
  await Promise.all(contexts.map((context) => context.watch()));
} else {
  await Promise.all([...builds.map((options) => esbuild.build(options)), copyAssets()]);
}
