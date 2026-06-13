// Web Worker: runs the discard EV analysis off the main thread so the
// Trainer's pick→reveal transition never janks. Posts incremental progress and
// a final result, keyed by the request id so the caller can match/ignore.
import { analyzeHand } from "./engine.js";

self.onmessage = (/** @type {MessageEvent} */ e) => {
  const { id, hand6, isDealer } = e.data;
  try {
    const options = analyzeHand(hand6, isDealer, (done, total) => {
      self.postMessage({ id, type: "progress", done, total });
    });
    self.postMessage({ id, type: "result", options });
  } catch (err) {
    self.postMessage({ id, type: "error", error: err instanceof Error ? err.message : String(err) });
  }
};
