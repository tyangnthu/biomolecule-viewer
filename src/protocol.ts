export type ClientMessage =
  | { type: 'ready' }
  | { type: 'error'; message: string };

export interface LoadStructureMessage {
  type: 'loadStructure';
  url: string;
  format: string;
  isBinary: boolean;
  label: string;
}

export type HostMessage = LoadStructureMessage;
