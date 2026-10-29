import type { HostMessage } from '../protocol';

const vscodeApi = acquireVsCodeApi();

type ErrorCount = () => number;

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function forwardLogErrors(viewer: molstar.Viewer): ErrorCount {
  let count = 0;
  viewer.subscribe(viewer.plugin.events.log, (entry) => {
    if (entry.type !== 'error') {
      return;
    }
    count += 1;
    vscodeApi.postMessage({ type: 'error', message: entry.message });
  });
  return () => count;
}

function reportError(viewer: molstar.Viewer, action: string, error: unknown): void {
  viewer.plugin.log.error(`${action}: ${describeError(error)}`);
}

async function loadStructure(
  viewer: molstar.Viewer,
  message: HostMessage,
  getErrorCount: ErrorCount,
): Promise<void> {
  const initialErrorCount = getErrorCount();
  try {
    await viewer.loadStructureFromUrl(message.url, message.format, message.isBinary, {
      label: message.label,
    });
  } catch (error) {
    if (getErrorCount() === initialErrorCount) {
      reportError(viewer, `Failed to load ${message.label}`, error);
    }
  }
}

async function dropFiles(
  viewer: molstar.Viewer,
  event: DragEvent,
  getErrorCount: ErrorCount,
): Promise<void> {
  if (!event.dataTransfer?.files.length) {
    return;
  }
  const initialErrorCount = getErrorCount();
  try {
    await viewer.loadFiles(Array.from(event.dataTransfer.files));
  } catch (error) {
    if (getErrorCount() === initialErrorCount) {
      reportError(viewer, 'Failed to load dropped structure files', error);
    }
  }
}

function registerDragAndDrop(viewer: molstar.Viewer, getErrorCount: ErrorCount): void {
  let dragDepth = 0;

  window.addEventListener('dragenter', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    dragDepth += 1;
    document.body.classList.add('drag-over');
  }, true);
  window.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    document.body.classList.add('drag-over');
  }, true);
  window.addEventListener('dragleave', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) {
      document.body.classList.remove('drag-over');
    }
  }, true);
  window.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    dragDepth = 0;
    document.body.classList.remove('drag-over');
    void dropFiles(viewer, event, getErrorCount);
  }, true);
}

async function start(): Promise<void> {
  try {
    const viewer = await molstar.Viewer.create('app', {
      layoutIsExpanded: false,
      layoutShowControls: true,
      layoutShowSequence: true,
    });
    const getErrorCount = forwardLogErrors(viewer);

    window.addEventListener('message', (event: MessageEvent<HostMessage>) => {
      if (event.data?.type === 'loadStructure') {
        void loadStructure(viewer, event.data, getErrorCount);
      }
    });
    registerDragAndDrop(viewer, getErrorCount);
    window.addEventListener('pagehide', () => viewer.dispose(), { once: true });
    vscodeApi.postMessage({ type: 'ready' });
  } catch (error) {
    vscodeApi.postMessage({
      type: 'error',
      message: `Failed to initialize Mol*: ${describeError(error)}`,
    });
  }
}

void start();
