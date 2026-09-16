import { Chess, type Move, type PieceSymbol } from 'chess.js';
import type { Difficulty, SimpleMove } from './types';

const VALUES: Record<PieceSymbol, number> = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 20000 };
const TIMEOUT = Symbol('search-timeout');

function evaluate(chess: Chess): number {
  let score = 0;
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece) continue;
      const file = piece.square.charCodeAt(0) - 97;
      const rank = Number(piece.square[1]) - 1;
      const advance = piece.color === 'w' ? rank : 7 - rank;
      const center = 7 - Math.abs(3.5 - file) - Math.abs(3.5 - rank);
      let positional = 0;
      if (piece.type === 'p') positional = advance * 9 + center * 7 - (file === 0 || file === 7 ? 8 : 0);
      if (piece.type === 'n') positional = center * 15 - (advance === 0 ? 20 : 0);
      if (piece.type === 'b') positional = center * 8 + Math.min(advance, 3) * 7;
      if (piece.type === 'r') positional = advance === 6 ? 24 : advance * 2;
      if (piece.type === 'q') positional = center * 3;
      if (piece.type === 'k') positional = advance < 2 ? (file === 6 || file === 2 ? 32 : 6) : -center * 7;
      score += (VALUES[piece.type] + positional) * (piece.color === 'w' ? 1 : -1);
    }
  }
  return score * (chess.turn() === 'w' ? 1 : -1);
}

function moveOrder(move: Move): number {
  return (move.captured ? 10 * VALUES[move.captured] - VALUES[move.piece] : 0)
    + (move.promotion ? VALUES[move.promotion] : 0) + (move.san.includes('+') ? 45 : 0)
    + (move.san.includes('#') ? 100000 : 0);
}

export function findBestMove(fen: string, difficulty: Difficulty): SimpleMove | null {
  const chess = new Chess(fen);
  const legal = chess.moves({ verbose: true });
  if (!legal.length) return null;
  const config = {
    casual: { depth: 1, budget: 160, noise: 115 },
    club: { depth: 2, budget: 400, noise: 18 },
    expert: { depth: 4, budget: 1000, noise: 3 },
  }[difficulty];
  const deadline = performance.now() + config.budget;
  let nodes = 0;
  let best = legal[Math.floor(Math.random() * legal.length)];

  function search(depth: number, alpha: number, beta: number, ply: number): number {
    if ((++nodes & 31) === 0 && performance.now() > deadline) throw TIMEOUT;
    const moves = chess.moves({ verbose: true });
    if (!moves.length) return chess.isCheck() ? -100000 + ply : 0;
    if (chess.isInsufficientMaterial() || chess.isThreefoldRepetition() || chess.isDrawByFiftyMoves()) return 0;
    if (depth <= 0) return evaluate(chess);
    moves.sort((a, b) => moveOrder(b) - moveOrder(a));
    let value = -Infinity;
    for (const move of moves) {
      chess.move(move);
      let child: number;
      try { child = -search(depth - 1, -beta, -alpha, ply + 1); }
      finally { chess.undo(); }
      value = Math.max(value, child);
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  }

  // Only completed search depths replace the result; an interrupted search is always safe to discard.
  for (let depth = 1; depth <= config.depth; depth++) {
    let iterationBest = best;
    let bestScore = -Infinity;
    const ordered = [...legal].sort((a, b) =>
      (b.lan === best.lan ? 1000000 : moveOrder(b)) - (a.lan === best.lan ? 1000000 : moveOrder(a)),
    );
    try {
      for (const move of ordered) {
        if (performance.now() > deadline) throw TIMEOUT;
        chess.move(move);
        let value: number;
        try { value = -search(depth - 1, -Infinity, -bestScore + config.noise, 1); }
        finally { chess.undo(); }
        value += (Math.random() - 0.5) * config.noise;
        if (value > bestScore) { bestScore = value; iterationBest = move; }
      }
      best = iterationBest;
    } catch (error) {
      if (error !== TIMEOUT) throw error;
      break;
    }
  }
  return { from: best.from, to: best.to, ...(best.promotion ? { promotion: best.promotion } : {}) };
}