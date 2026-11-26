// Runs the on-device model off the main thread. Imports our byte-identical copy of @mlc-ai/web-llm 0.2.86 (npm).
import { WebWorkerMLCEngineHandler } from './vendor/web-llm-0.2.86.js';
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => { handler.onmessage(msg); };
