import type * as vscode from 'vscode';
import formatMap from './formats.json';

export interface StructureFormat {
  readonly format: string;
  readonly isBinary: boolean;
}

const FORMATS: Readonly<Record<string, StructureFormat>> = formatMap;

export const extensions: readonly string[] = Object.keys(FORMATS);

export function detectStructureFormat(uri: vscode.Uri): StructureFormat | undefined {
  const extension = uri.path.split('.').pop()?.toLowerCase();
  return extension ? FORMATS[extension] : undefined;
}
