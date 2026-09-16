import { findBestMove } from './engine';
import type { Difficulty } from './types';

self.onmessage = (event: MessageEvent<{ id: number; fen: string; difficulty: Difficulty }>) => {
  const { id, fen, difficulty } = event.data;
  try {
    self.postMessage({ id, move: findBestMove(fen, difficulty) });
  } catch {
    self.postMessage({ id, move: null });
  }
};