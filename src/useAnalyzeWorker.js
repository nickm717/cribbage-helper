import { useEffect, useRef, useCallback } from "react";
import { analyzeHand } from "./engine.js";

/**
 * Manages the discard-analysis Web Worker. Returns an `analyze` function that
 * resolves with the ranked DiscardOption[] and reports progress along the way.
 * Each call is tagged with an id; results are matched by id, and a `cancel`
 * drops the pending handler so stale results are ignored. If Workers aren't
 * available the analysis falls back to running synchronously on the main thread
 * so the app still works.
 *
 * @returns {{
 *   analyze: (hand6: any[], isDealer: boolean, onProgress?: (done: number, total: number) => void) => Promise<any[]>,
 *   cancel: () => void
 * }}
 */
export function useAnalyzeWorker() {
  const workerRef = useRef(/** @type {Worker | null} */ (null));
  const reqIdRef = useRef(0);
  const handlersRef = useRef(/** @type {Map<number, { resolve: (v: any[]) => void, reject: (e: Error) => void, onProgress?: (done: number, total: number) => void }>} */ (new Map()));

  useEffect(() => {
    /** @type {Worker | undefined} */
    let worker;
    try {
      worker = new Worker(new URL("./analyzeHand.worker.js", import.meta.url), { type: "module" });
      worker.onmessage = (e) => {
        const { id, type, options, done, total, error } = e.data;
        const h = handlersRef.current.get(id);
        if (!h) return;
        if (type === "progress") { h.onProgress?.(done, total); return; }
        handlersRef.current.delete(id);
        if (type === "result") h.resolve(options);
        else h.reject(new Error(error || "worker error"));
      };
      workerRef.current = worker;
    } catch {
      workerRef.current = null; // fall back to synchronous compute
    }
    const handlers = handlersRef.current;
    return () => {
      worker?.terminate();
      handlers.clear();
    };
  }, []);

  const analyze = useCallback((/** @type {any[]} */ hand6, /** @type {boolean} */ isDealer, /** @type {((done: number, total: number) => void)=} */ onProgress) => {
    const worker = workerRef.current;
    if (!worker) {
      // Synchronous fallback — still off the synchronous critical path via a
      // resolved promise, and still reports a single completion tick.
      try {
        const options = analyzeHand(hand6, isDealer, onProgress);
        return Promise.resolve(options);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return new Promise((resolve, reject) => {
      const id = ++reqIdRef.current;
      handlersRef.current.set(id, { resolve, reject, onProgress });
      worker.postMessage({ id, hand6, isDealer });
    });
  }, []);

  const cancel = useCallback(() => { handlersRef.current.clear(); }, []);

  return { analyze, cancel };
}
