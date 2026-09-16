import type { Color, Move, PieceSymbol, Square } from 'chess.js';

export type Difficulty = 'casual' | 'club' | 'expert';
export type GameMode = 'computer' | 'local';
export type Phase = 'ready' | 'playing' | 'paused' | 'over';
export type SimpleMove = { from: Square; to: Square; promotion?: PieceSymbol };
export type VisualPiece = { id: string; square: Square; type: PieceSymbol; color: Color };
export type Burst = { id: number; square: Square; type: 'move' | 'capture' | 'check' | 'win'; points: number };
export type GameResult = { winner: Color | null; reason: string; outcome: 'Win' | 'Draw' | 'Loss'; score: number; side: Color };
export type ScoreRecord = {
  id: string;
  score: number;
  date: string;
  difficulty: Difficulty;
  mode: GameMode;
  outcome: 'Win' | 'Draw' | 'Loss';
  moves: number;
  side: Color;
};

export const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
};

export const CAPTURE_POINTS: Record<PieceSymbol, number> = {
  p: 100, n: 300, b: 300, r: 500, q: 900, k: 0,
};

export const DIFFICULTIES: Record<Difficulty, { label: string; description: string }> = {
  casual: { label: 'Casual', description: 'A friendly warm-up' },
  club: { label: 'Club', description: 'A little food for thought' },
  expert: { label: 'Expert', description: 'Bring your best moves' },
};

export function movePoints(move: Move): number {
  return 10 + (move.captured ? CAPTURE_POINTS[move.captured] : 0)
    + (/[+#]/.test(move.san) ? 50 : 0) + (move.promotion ? 200 : 0);
}

export function calculateScore(moves: Move[], color: Color, hints = 0): number {
  return Math.max(0, moves.filter((move) => move.color === color)
    .reduce((sum, move) => sum + movePoints(move), 0) - hints * 25);
}

export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export function readScores(): ScoreRecord[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('knight-club-scores-v1') || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is ScoreRecord =>
      item && typeof item.id === 'string' && typeof item.score === 'number'
      && Number.isFinite(item.score) && item.score >= 0 && typeof item.date === 'string'
      && !Number.isNaN(Date.parse(item.date)) && ['Win', 'Draw', 'Loss'].includes(item.outcome)
      && ['casual', 'club', 'expert'].includes(item.difficulty)
      && ['computer', 'local'].includes(item.mode) && ['w', 'b'].includes(item.side)
      && typeof item.moves === 'number',
    ).sort((a, b) => b.score - a.score).slice(0, 10);
  } catch {
    return [];
  }
}

export function savePreference(key: string, value: string) {
  try { localStorage.setItem(`knight-club-${key}`, value); } catch { /* Private browsing may disable storage. */ }
}

export function readPreference(key: string, fallback: string): string {
  try { return localStorage.getItem(`knight-club-${key}`) ?? fallback; } catch { return fallback; }
}