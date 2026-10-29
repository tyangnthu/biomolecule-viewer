declare namespace molstar {
  interface ViewerOptions {
    layoutIsExpanded: boolean;
    layoutShowControls: boolean;
    layoutShowSequence: boolean;
  }

  interface LogEntry {
    type: 'message' | 'error' | 'warning' | 'info';
    timestamp: Date;
    message: string;
  }

  interface Observable<T> {
    subscribe(observer: (value: T) => void): { unsubscribe(): void };
  }

  interface Viewer {
    loadStructureFromUrl(
      url: string,
      format: string,
      isBinary: boolean,
      options?: { label?: string },
    ): Promise<unknown>;
    loadFiles(files: File[]): Promise<unknown>;
    subscribe<T>(
      observable: Observable<T> | undefined,
      action: (value: T) => void,
    ): { unsubscribe(): void };
    dispose(): void;
    plugin: {
      events: {
        log: Observable<LogEntry>;
      };
      log: {
        error(message: string): void;
      };
    };
  }

  const Viewer: {
    create(elementId: string, options: ViewerOptions): Promise<Viewer>;
  };
}

declare function acquireVsCodeApi(): {
  postMessage(message: import('../protocol').ClientMessage): void;
};
