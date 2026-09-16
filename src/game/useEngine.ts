import { useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessWorker from './engine.worker?worker&inline';
import type { Difficulty, SimpleMove } from './types';

export function useEngine() {
  const worker = useRef<Worker | null>(null);
  const nextId = useRef(0);
  const pending = useRef(new Map<number, (move: SimpleMove | null) => void>());

  useEffect(() => {
    let instance: Worker;
    try { instance = new ChessWorker(); }
    catch { return; }
    worker.current = instance;
    instance.onmessage = (event: MessageEvent<{ id: number; move: SimpleMove | null }>) => {
      pending.current.get(event.data.id)?.(event.data.move);
      pending.current.delete(event.data.id);
    };
    instance.onerror = () => {
      pending.current.forEach((resolve) => resolve(null));
      pending.current.clear();
      if (worker.current === instance) worker.current = null;
      instance.terminate();
    };
    return () => {
      instance.terminate();
      worker.current = null;
      pending.current.forEach((resolve) => resolve(null));
      pending.current.clear();
    };
  }, []);

  return useCallback((fen: string, difficulty: Difficulty): Promise<SimpleMove | null> => {
    return new Promise((resolve) => {
      const fallback = () => {
        const moves = new Chess(fen).moves({ verbose: true });
        const move = moves[0];
        return move ? { from: move.from, to: move.to, promotion: move.promotion } : null;
      };
      if (!worker.current) { resolve(fallback()); return; }
      const id = ++nextId.current;
      pending.current.set(id, (move) => resolve(move ?? fallback()));
      try { worker.current.postMessage({ id, fen, difficulty }); }
      catch { pending.current.delete(id); resolve(fallback()); }
    });
  }, []);
}