import { OnnxEngine, type OnnxEngineConfig } from '@kaya/ai-engine';
import type { SignMap } from '@kaya/goboard';

// Define message types
type WorkerMessage =
  | { type: 'init'; config: OnnxEngineConfig }
  | { type: 'analyze'; id: number; signMap: SignMap; options: any }
  | {
      type: 'analyzeBatch';
      id: number;
      inputs: { signMap: SignMap; options?: any }[];
    }
  | { type: 'dispose' }
  | { type: 'clearCache' };

let engine: OnnxEngine | null = null;
let isProcessing = false;
const messageQueue: MessageEvent<WorkerMessage>[] = [];

const processQueue = async () => {
  if (isProcessing || messageQueue.length === 0) return;

  isProcessing = true;
  const e = messageQueue.shift()!;
  const msg = e.data;

  try {
    switch (msg.type) {
      case 'init':
        if (engine) {
          await engine.dispose();
        }
        engine = new OnnxEngine(msg.config);
        await engine.initialize();
        self.postMessage({ type: 'init_success' });
        break;

      case 'analyze':
        if (!engine) throw new Error('Engine not initialized');
        const result = await engine.analyze(msg.signMap, msg.options);
        self.postMessage({ type: 'analyze_success', id: msg.id, result });
        break;

      case 'analyzeBatch':
        if (!engine) throw new Error('Engine not initialized');
        const results = await engine.analyzeBatch(msg.inputs);
        self.postMessage({ type: 'analyzeBatch_success', id: msg.id, results });
        break;

      case 'dispose':
        if (engine) {
          await engine.dispose();
          engine = null;
        }
        self.postMessage({ type: 'dispose_success' });
        break;

      case 'clearCache':
        if (engine) {
          engine.clearCache();
        }
        self.postMessage({ type: 'clearCache_success' });
        break;
    }
  } catch (error) {
    console.error('[Worker] Error:', error);
    self.postMessage({
      type: 'error',
      id: msg.type === 'analyze' || msg.type === 'analyzeBatch' ? msg.id : undefined,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    isProcessing = false;
    // Process next message
    if (messageQueue.length > 0) {
      processQueue();
    }
  }
};

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  messageQueue.push(e);
  processQueue();
};
