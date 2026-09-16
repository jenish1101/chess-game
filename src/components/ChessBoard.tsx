import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode, type RefObject } from 'react';
import { Chess, type Color, type Move, type Square } from 'chess.js';
import { AnimatePresence, motion, useAnimationControls, useMotionValue, useReducedMotion } from 'framer-motion';
import { ChessPiece } from './ChessPiece';
import { PIECE_NAMES, type Burst, type SimpleMove, type VisualPiece } from '../game/types';

const STARTING_PIECES: VisualPiece[] = new Chess().board().flat().filter((piece) => piece !== null)
  .map((piece) => ({ ...piece, id: `${piece.color}-${piece.square}` }));

function visualPosition(history: Move[]): VisualPiece[] {
  let pieces = STARTING_PIECES.map((piece) => ({ ...piece }));
  for (const move of history) {
    const moving = pieces.find((piece) => piece.square === move.from);
    if (!moving) continue;
    if (move.captured) {
      const capturedSquare = move.isEnPassant() ? `${move.to[0]}${move.from[1]}` : move.to;
      pieces = pieces.filter((piece) => piece.square !== capturedSquare);
    }
    if (move.isKingsideCastle() || move.isQueensideCastle()) {
      const kingSide = move.isKingsideCastle();
      const rank = move.color === 'w' ? '1' : '8';
      const rook = pieces.find((piece) => piece.square === `${kingSide ? 'h' : 'a'}${rank}`);
      if (rook) rook.square = `${kingSide ? 'f' : 'd'}${rank}` as Square;
    }
    moving.square = move.to;
    if (move.promotion) moving.type = move.promotion;
  }
  return pieces;
}

function position(square: Square, flipped: boolean) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return { col: flipped ? 7 - file : file, row: flipped ? rank : 7 - rank };
}

export function ChessBoard({ history, selected, legalMoves, flipped, canInteract, turn, inCheck, hint,
  burst, showLegal, onSquare, onSelect, onMove, boardRef, children }: {
  history: Move[]; selected: Square | null; legalMoves: Square[]; flipped: boolean;
  canInteract: boolean; turn: Color; inCheck: boolean; hint: SimpleMove | null;
  burst: Burst | null; showLegal: boolean; onSquare: (square: Square) => void;
  onSelect: (square: Square) => void; onMove: (from: Square, to: Square) => void;
  boardRef: RefObject<HTMLDivElement | null>; children?: ReactNode;
}) {
  const pieces = useMemo(() => visualPosition(history), [history]);
  const pieceMap = useMemo(() => new Map(pieces.map((piece) => [piece.square, piece])), [pieces]);
  const [cursor, setCursor] = useState<Square>('e2');
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [dragFrom, setDragFrom] = useState<Square | null>(null);
  const pointer = useRef<{ from: Square; x: number; y: number; rect: DOMRect; dragging: boolean; id: number } | null>(null);
  const suppressClick = useRef(false);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const controls = useAnimationControls();
  const reducedMotion = useReducedMotion();
  const lastMove = history[history.length - 1];
  const files = flipped ? 'hgfedcba' : 'abcdefgh';
  const ranks = flipped ? '12345678' : '87654321';
  const squares = [...ranks].flatMap((rank) => [...files].map((file) => `${file}${rank}` as Square));

  useEffect(() => {
    setCursor(flipped ? 'd7' : 'e2');
    pointer.current = null;
    setDragFrom(null);
  }, [flipped]);
  useEffect(() => {
    if (history.length === 0 && !selected) setCursor(flipped ? 'd7' : 'e2');
  }, [history, flipped, selected]);
  useEffect(() => {
    if (burst && burst.type !== 'move' && !reducedMotion) {
      void controls.start({ x: [0, -3, 3, -2, 2, 0], y: [0, 1, -2, 1, 0, 0], transition: { duration: 0.3 } });
    }
  }, [burst, controls, reducedMotion]);
  useEffect(() => {
    if (!canInteract) { pointer.current = null; setDragFrom(null); }
  }, [canInteract]);

  function pointerDown(event: PointerEvent<HTMLButtonElement>, square: Square) {
    setKeyboardMode(false);
    setCursor(square);
    if (!canInteract || event.button !== 0 || !event.isPrimary || pieceMap.get(square)?.color !== turn) return;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointer.current = { from: square, x: event.clientX, y: event.clientY, rect, dragging: false, id: event.pointerId };
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = pointer.current;
    if (!current || current.id !== event.pointerId) return;
    if (event.pointerType === 'mouse' && (event.buttons & 1) === 0) {
      pointer.current = null;
      setDragFrom(null);
      return;
    }
    if (!current.dragging && Math.hypot(event.clientX - current.x, event.clientY - current.y) > 7) {
      current.dragging = true;
      boardRef.current?.setPointerCapture(event.pointerId);
      setDragFrom(current.from);
      onSelect(current.from);
    }
    if (current.dragging) {
      dragX.set(event.clientX - current.rect.left - current.rect.width / 16);
      dragY.set(event.clientY - current.rect.top - current.rect.height / 16);
    }
  }

  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    const current = pointer.current;
    if (!current || current.id !== event.pointerId) return;
    if (current.dragging) {
      const col = Math.floor((event.clientX - current.rect.left) / current.rect.width * 8);
      const row = Math.floor((event.clientY - current.rect.top) / current.rect.height * 8);
      if (col >= 0 && col < 8 && row >= 0 && row < 8) {
        const destination = `${files[col]}${ranks[row]}` as Square;
        if (destination !== current.from) onMove(current.from, destination);
      }
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 80);
    }
    pointer.current = null;
    setDragFrom(null);
    boardRef.current?.focus({ preventScroll: true });
  }

  const dragPiece = dragFrom ? pieceMap.get(dragFrom) : null;
  const hintFrom = hint ? position(hint.from, flipped) : null;
  const hintTo = hint ? position(hint.to, flipped) : null;
  const burstPosition = burst ? position(burst.square, flipped) : null;

  return (
    <div className="board-frame">
      <div className="rank-labels" aria-hidden="true">{[...ranks].map((rank) => <span key={rank}>{rank}</span>)}</div>
      <motion.div ref={boardRef} data-board="true" className={`chessboard ${canInteract ? 'is-interactive' : ''}`} role="grid" aria-label="Chessboard. Use arrow keys to navigate, Enter or Space to select and move." aria-rowcount={8} aria-colcount={8} aria-activedescendant={`square-${cursor}`} tabIndex={0}
        animate={controls}
        onPointerMove={pointerMove} onPointerUp={pointerUp}
        onPointerLeave={() => { if (!pointer.current?.dragging) pointer.current = null; }}
        onPointerCancel={() => { pointer.current = null; setDragFrom(null); }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          const directions: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
          if (directions[event.key]) {
            event.preventDefault(); event.stopPropagation(); setKeyboardMode(true);
            const current = position(cursor, flipped);
            const [dx, dy] = directions[event.key];
            const col = Math.max(0, Math.min(7, current.col + dx));
            const row = Math.max(0, Math.min(7, current.row + dy));
            setCursor(`${files[col]}${ranks[row]}` as Square);
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault(); event.stopPropagation(); setKeyboardMode(true); onSquare(cursor);
          }
        }}>
        <div className="square-grid" role="presentation">
          {Array.from({ length: 8 }, (_, row) => <div className="board-row" role="row" key={row}>
          {squares.slice(row * 8, row * 8 + 8).map((square, column) => {
            const index = row * 8 + column;
            const piece = pieceMap.get(square);
            const light = (Math.floor(index / 8) + index % 8) % 2 === 0;
            const isLegal = legalMoves.includes(square);
            const checked = inCheck && piece?.type === 'k' && piece.color === turn;
            return <button key={square} id={`square-${square}`} type="button" role="gridcell" tabIndex={-1}
              aria-label={`${square}, ${piece ? `${piece.color === 'w' ? 'white' : 'black'} ${PIECE_NAMES[piece.type]}` : 'empty'}${isLegal ? ', possible move' : ''}${checked ? ', in check' : ''}`}
              aria-selected={selected === square} aria-rowindex={Math.floor(index / 8) + 1} aria-colindex={index % 8 + 1}
              className={`square ${light ? 'light' : 'dark'} ${lastMove && (lastMove.from === square || lastMove.to === square) ? 'last-move' : ''} ${selected === square ? 'selected' : ''} ${keyboardMode && cursor === square ? 'keyboard-cursor' : ''} ${checked ? 'in-check' : ''} ${hint && (hint.from === square || hint.to === square) ? 'hint-square' : ''}`}
              onPointerDown={(event) => pointerDown(event, square)}
              onClick={() => { if (!suppressClick.current) { onSquare(square); setCursor(square); boardRef.current?.focus({ preventScroll: true }); } }}>
              {showLegal && isLegal && <span className={piece ? 'capture-ring' : 'legal-dot'} />}
            </button>;
          })}
          </div>)}
        </div>
        <div className="piece-layer" aria-hidden="true">
          <AnimatePresence initial={false}>
            {pieces.map((piece) => {
              const pos = position(piece.square, flipped);
              return <motion.div key={piece.id} className={`positioned-piece ${selected === piece.square ? 'piece-selected' : ''}`}
                initial={false}
                animate={{ x: `${pos.col * 100}%`, y: `${pos.row * 100}%`, scale: selected === piece.square ? 1.09 : 1, opacity: dragFrom === piece.square ? 0.15 : 1 }}
                exit={{ opacity: 0, scale: 0.45, rotate: 12 }}
                transition={{ type: 'spring', stiffness: 470, damping: 32, mass: 0.7, opacity: { duration: 0.13 } }}
                style={{ zIndex: lastMove?.to === piece.square || selected === piece.square ? 3 : 2 }}>
                <ChessPiece type={piece.type} color={piece.color} />
              </motion.div>;
            })}
          </AnimatePresence>
        </div>
        {hintFrom && hintTo && <svg className="hint-arrow" viewBox="0 0 800 800" aria-hidden="true">
          <defs><marker id="hint-arrowhead" markerWidth="4" markerHeight="4" refX="2.7" refY="2" orient="auto"><path d="M0 0 4 2 0 4Z" fill="#b35b37" /></marker></defs>
          <line x1={(hintFrom.col + 0.5) * 100} y1={(hintFrom.row + 0.5) * 100} x2={(hintTo.col + 0.5) * 100} y2={(hintTo.row + 0.5) * 100} stroke="#b35b37" strokeWidth="11" strokeLinecap="round" markerEnd="url(#hint-arrowhead)" opacity="0.8" />
        </svg>}
        {dragPiece && <motion.div className="drag-piece" style={{ x: dragX, y: dragY }} aria-hidden="true"><ChessPiece type={dragPiece.type} color={dragPiece.color} /></motion.div>}
        {burst && burstPosition && !reducedMotion && <div key={burst.id} className="burst" style={{ left: `${(burstPosition.col + 0.5) * 12.5}%`, top: `${(burstPosition.row + 0.5) * 12.5}%` }} aria-hidden="true">
          <motion.span className={`move-ripple ${burst.type !== 'move' ? 'capture-ripple' : ''}`} initial={{ scale: 0.2, opacity: 0.7 }} animate={{ scale: burst.type === 'move' ? 1.2 : 2, opacity: 0 }} transition={{ duration: 0.5 }} />
          {burst.type !== 'move' && Array.from({ length: burst.type === 'win' ? 34 : 15 }, (_, i) => {
            const angle = i * 2.3999;
            const distance = 28 + (i % 5) * 13;
            return <motion.i key={i} className="particle" style={{ background: ['#bd653f', '#ead6a0', '#415c42', '#fffdf0'][i % 4], width: 4 + i % 4, height: 4 + i % 3 }} initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }} animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance + 15, scale: 0, opacity: 0, rotate: i * 41 }} transition={{ duration: 0.5 + (i % 4) * 0.1, ease: 'easeOut' }} />;
          })}
          {burst.points > 0 && <motion.span className="floating-points" initial={{ y: -10, opacity: 0, scale: 0.6 }} animate={{ y: -60, opacity: [0, 1, 1, 0], scale: 1 }} transition={{ duration: 0.85 }}>+{burst.points}</motion.span>}
        </div>}
        <AnimatePresence>{children}</AnimatePresence>
      </motion.div>
      <div className="file-labels" aria-hidden="true">{[...files].map((file) => <span key={file}>{file}</span>)}</div>
    </div>
  );
}