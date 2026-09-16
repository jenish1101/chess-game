import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';
import { useEngine } from './useEngine';
import { chessSound } from './sound';
import { DIFFICULTIES, PIECE_NAMES, calculateScore, movePoints, readPreference, readScores, savePreference, type Burst, type Difficulty, type GameMode, type GameResult, type Phase, type ScoreRecord, type SimpleMove } from './types';

type ModalKind = 'help' | 'scores' | 'resign' | null;

export function useChessGame() {
  const [game] = useState(() => new Chess());
  const [phase, setPhase] = useState<Phase>('ready');
  const [history, setHistory] = useState<Move[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    const stored = readPreference('difficulty', 'casual');
    return Object.prototype.hasOwnProperty.call(DIFFICULTIES, stored) ? stored as Difficulty : 'casual';
  });
  const [mode, setMode] = useState<GameMode>('computer');
  const [playerColor, setPlayerColor] = useState<Color>('w');
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState<Square | null>(null);
  const [hint, setHint] = useState<SimpleMove | null>(null);
  const [hintBusy, setHintBusy] = useState(false);
  const [hintsUsed, setHintsUsed] = useState({ w: 0, b: 0 });
  const [thinking, setThinking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [session, setSession] = useState(0);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [records, setRecords] = useState<ScoreRecord[]>(readScores);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [soundOn, setSoundOn] = useState(() => readPreference('sound', 'on') === 'on');
  const [showLegal, setShowLegal] = useState(() => readPreference('legal-moves', 'on') === 'on');
  const [tab, setTab] = useState<'moves' | 'scores'>('moves');
  const [modal, setModal] = useState<ModalKind>(null);
  const [promotion, setPromotion] = useState<(SimpleMove & { color: Color }) | null>(null);
  const [message, setMessage] = useState('A fresh board. A world of possibilities.');
  const [clearConfirm, setClearConfirm] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const boardColumnRef = useRef<HTMLElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const finished = useRef(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const resumeAfterModal = useRef(false);
  const hintRequest = useRef(0);
  const requestEngine = useEngine();
  const turn = game.turn();
  const inCheck = game.isCheck();
  const humanTurn = mode === 'local' || turn === playerColor;
  const canInteract = phase === 'playing' && humanTurn && !promotion && !modal;
  const bestScore = records[0]?.score ?? 0;
  const scoreColor = mode === 'computer' ? playerColor : 'w';
  const score = result ? result.score : calculateScore(history, scoreColor, hintsUsed[scoreColor]);
  const legalMoves = useMemo(() => selected ? game.moves({ square: selected, verbose: true }).map((move) => move.to) : [], [game, selected, history]);
  const canUndo = phase === 'playing' && !promotion && history.some((move) => mode === 'local' || move.color === playerColor);

  useEffect(() => { savePreference('difficulty', difficulty); }, [difficulty]);
  useEffect(() => { savePreference('sound', soundOn ? 'on' : 'off'); }, [soundOn]);
  useEffect(() => { savePreference('legal-moves', showLegal ? 'on' : 'off'); }, [showLegal]);
  useEffect(() => {
    try { localStorage.setItem('knight-club-scores-v1', JSON.stringify(records)); }
    catch { setStorageAvailable(false); }
  }, [records]);
  useEffect(() => {
    if (phase !== 'playing' || modal) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [phase, modal, session]);
  useEffect(() => {
    const onVisibilityChange = () => { if (document.hidden) setPhase((value) => value === 'playing' ? 'paused' : value); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);
  useEffect(() => {
    if (phase !== 'playing') { hintRequest.current++; setHintBusy(false); }
    if (phase === 'paused') setPromotion(null);
  }, [phase]);
  useEffect(() => {
    if (!burst) return;
    const timer = window.setTimeout(() => setBurst(null), 1000);
    return () => window.clearTimeout(timer);
  }, [burst]);
  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [history, tab]);

  function focusBoard(scroll = false) {
    requestAnimationFrame(() => {
      boardRef.current?.focus({ preventScroll: true });
      if (scroll && window.innerWidth < 800) boardColumnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function resetPosition(nextPhase: Phase) {
    game.reset();
    setHistory([]); setSelected(null); setHint(null); setHintBusy(false); setHintsUsed({ w: 0, b: 0 });
    setElapsed(0); setResult(null); setBurst(null); setPromotion(null); setThinking(false);
    setFlipped(playerColor === 'b'); setTab('moves'); setPhase(nextPhase); setSession((value) => value + 1);
    setMessage('The board is yours. Make yourself at home.');
    phaseRef.current = nextPhase;
    hintRequest.current++; finished.current = false;
  }

  function startGame() {
    resetPosition('playing');
    chessSound.play('start', soundOn);
    focusBoard(true);
  }

  function finishGame(winner: Color | null, reason: string) {
    if (finished.current) return;
    finished.current = true;
    const side = mode === 'computer' ? playerColor : (winner ?? 'w');
    const outcome = winner === null ? 'Draw' : winner === side ? 'Win' : 'Loss';
    const finalScore = calculateScore(history, side, hintsUsed[side]) + (outcome === 'Win' ? 1000 : outcome === 'Draw' ? 200 : 0);
    setResult({ winner, reason, outcome, score: finalScore, side });
    setPhase('over'); setThinking(false); setSelected(null); setHint(null); setPromotion(null);
    setMessage(outcome === 'Win' ? 'A well-earned victory. Shall we do it again?' : outcome === 'Draw' ? 'An evenly matched mind is a wonderful thing.' : 'Every game has something to teach us.');
    const record: ScoreRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, score: finalScore,
      date: new Date().toISOString(), difficulty, mode, outcome,
      moves: Math.ceil(history.length / 2), side,
    };
    setRecords((previous) => [...previous, record].sort((a, b) => b.score - a.score).slice(0, 10));
    chessSound.play(outcome === 'Win' ? 'win' : 'end', soundOn);
    if (outcome === 'Win') setBurst({ id: Date.now(), square: history[history.length - 1]?.to ?? 'e4', type: 'win', points: 1000 });
  }

  const finishRef = useRef(finishGame);
  finishRef.current = finishGame;
  useEffect(() => {
    if (phase !== 'playing' || !game.isGameOver()) return;
    if (game.isCheckmate()) finishRef.current(game.turn() === 'w' ? 'b' : 'w', 'Checkmate. The king has nowhere left to go.');
    else if (game.isStalemate()) finishRef.current(null, 'Stalemate. No legal moves, but the king is safe.');
    else if (game.isThreefoldRepetition()) finishRef.current(null, 'A draw by threefold repetition. Familiar territory.');
    else if (game.isInsufficientMaterial()) finishRef.current(null, 'A draw. Neither side has enough pieces to checkmate.');
    else finishRef.current(null, 'A draw by the fifty-move rule. A well-matched game.');
  }, [game, history, phase]);

  function commitMove(move: SimpleMove) {
    if (phaseRef.current !== 'playing' || game.isGameOver()) return;
    try {
      const played = game.move(move);
      setHistory((previous) => [...previous, played]);
      setSelected(null); setHint(null); setHintBusy(false); setPromotion(null); hintRequest.current++;
      const isHuman = mode === 'local' || played.color === playerColor;
      const type = played.san.includes('#') ? 'win' : game.isCheck() ? 'check' : played.captured ? 'capture' : 'move';
      setBurst({ id: Date.now() + Math.random(), square: played.to, type, points: isHuman ? movePoints(played) : 0 });
      chessSound.play(game.isCheck() ? 'check' : played.captured ? 'capture' : 'move', soundOn);
      if (type !== 'move') {
        try { navigator.vibrate?.(type === 'capture' ? 22 : 35); } catch { /* Haptics are optional. */ }
      }
      if (game.isCheck()) setMessage(`${game.turn() === 'w' ? 'White' : 'Black'} is in check. Keep your king safe.`);
      else if (played.promotion) setMessage(`A well-earned ${PIECE_NAMES[played.promotion]}. New possibilities await.`);
      else if (played.isKingsideCastle() || played.isQueensideCastle()) setMessage('King, tucked away. A little peace of mind.');
      else if (played.captured) setMessage(isHuman ? `One less ${PIECE_NAMES[played.captured]} to worry about. Nicely done.` : 'A little setback. Your next move can change things.');
      else setMessage(isHuman ? 'Good move. Let\'s see what comes next.' : 'Your turn. There\'s a good move in here.');
    } catch { setMessage('Not quite. Try one of the highlighted squares.'); }
  }

  const commitRef = useRef(commitMove);
  commitRef.current = commitMove;
  useEffect(() => {
    if (phase !== 'playing' || mode !== 'computer' || game.turn() === playerColor || game.isGameOver() || modal) {
      setThinking(false); return;
    }
    let cancelled = false;
    const fen = game.fen();
    setThinking(true);
    const timer = window.setTimeout(async () => {
      const move = await requestEngine(fen, difficulty);
      if (cancelled || game.fen() !== fen) return;
      setThinking(false);
      if (move) commitRef.current(move);
    }, 380);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [game, history, phase, mode, playerColor, difficulty, requestEngine, modal, session]);

  function tryMove(from: Square, to: Square) {
    if (phaseRef.current !== 'playing' || !humanTurn || promotion || modal) return;
    const legal = game.moves({ square: from, verbose: true }).find((move) => move.to === to);
    if (!legal) { setMessage('Not quite. Try one of the highlighted squares.'); return; }
    if (legal.promotion) { setPromotion({ from, to, color: game.turn() }); return; }
    commitMove({ from, to });
  }

  function selectPiece(square: Square) {
    if (phase === 'ready') startGame();
    else if (phase !== 'playing') return;
    const piece = game.get(square);
    if (!piece || piece.color !== game.turn() || (mode === 'computer' && piece.color !== playerColor)) return;
    setSelected(square); setHint(null); chessSound.play('select', soundOn);
  }

  function clickSquare(square: Square) {
    if (promotion || modal) return;
    if (phase === 'ready') {
      startGame();
      if (humanTurn && game.get(square)?.color === game.turn()) setSelected(square);
      return;
    }
    if (phase !== 'playing' || !humanTurn) return;
    if (square === selected) { setSelected(null); setHint(null); return; }
    if (selected && legalMoves.includes(square)) { tryMove(selected, square); return; }
    if (game.get(square)?.color === turn) selectPiece(square);
    else if (selected) setMessage('Look for a marked square. That\'s where this piece can go.');
  }

  function undoMove() {
    if (!canUndo) return;
    let count = 1;
    game.undo();
    if (mode === 'computer' && game.turn() !== playerColor && history.length > 1) { game.undo(); count++; }
    setHistory((previous) => previous.slice(0, -count)); setSelected(null); setHint(null); setBurst(null);
    setHintBusy(false); hintRequest.current++;
    setMessage('A second look. Sometimes that\'s all it takes.');
    chessSound.play('select', soundOn); focusBoard();
  }

  async function getHint() {
    if (phase !== 'playing' || !humanTurn || hintBusy || promotion || game.isGameOver()) return;
    const id = ++hintRequest.current;
    const fen = game.fen();
    const color = game.turn();
    setHintBusy(true);
    const move = await requestEngine(fen, 'club');
    if (id !== hintRequest.current || phaseRef.current !== 'playing' || game.fen() !== fen) return;
    setHintBusy(false);
    if (move) {
      setHint(move); setSelected(move.from); setShowLegal(true);
      setHintsUsed((previous) => ({ ...previous, [color]: previous[color] + 1 }));
      setMessage(`A little nudge: ${move.from} to ${move.to}. Hint used, 25 points.`);
      chessSound.play('select', soundOn); focusBoard();
    }
  }

  function togglePause() {
    if (phase === 'playing') { setPhase('paused'); setSelected(null); }
    else if (phase === 'paused' && !modal) { setPhase('playing'); focusBoard(); }
  }

  function openModal(kind: ModalKind) {
    resumeAfterModal.current = phase === 'playing';
    if (phase === 'playing') setPhase('paused');
    setClearConfirm(false); setModal(kind);
  }

  const closeModal = useCallback(() => {
    setModal(null); setClearConfirm(false);
    if (resumeAfterModal.current) setPhase('playing');
    resumeAfterModal.current = false;
  }, []);

  function resignGame() {
    resumeAfterModal.current = false; setModal(null);
    const resigning = mode === 'computer' ? playerColor : turn;
    finishGame(resigning === 'w' ? 'b' : 'w', 'The game ended by resignation. A fresh board awaits.');
  }

  function toggleSound() {
    setSoundOn(!soundOn);
    if (!soundOn) chessSound.play('select', true);
  }

  const keyboardActions = useRef({ startGame, togglePause, undoMove, getHint, openModal });
  keyboardActions.current = { startGame, togglePause, undoMove, getHint, openModal };
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (promotion) {
        if (['q', 'r', 'b', 'n'].includes(event.key.toLowerCase())) {
          event.preventDefault(); commitRef.current({ ...promotion, promotion: event.key.toLowerCase() as PieceSymbol });
        }
        return;
      }
      if (modal) return;
      const key = event.key.toLowerCase();
      if (key === 'p' || (key === ' ' && !target.closest('button, [data-board]'))) {
        event.preventDefault(); keyboardActions.current.togglePause();
      } else if (key === 'escape') {
        if (selected) { setSelected(null); setHint(null); }
        else if (focusMode) setFocusMode(false);
        else keyboardActions.current.togglePause();
      } else if (key === 'r') { event.preventDefault(); keyboardActions.current.startGame(); }
      else if (key === 'f') { event.preventDefault(); setFlipped((value) => !value); }
      else if (key === 'u') { event.preventDefault(); keyboardActions.current.undoMove(); }
      else if (key === 'h') { event.preventDefault(); void keyboardActions.current.getHint(); }
      else if (key === 'm') { event.preventDefault(); setSoundOn((value) => !value); }
      else if (key === '?') { event.preventDefault(); keyboardActions.current.openModal('help'); }
      else if (key === 'enter' && phase === 'ready' && !target.closest('button, [data-board]')) {
        event.preventDefault(); keyboardActions.current.startGame();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, modal, promotion, selected, focusMode]);

  return {
    phase, history, difficulty, setDifficulty, mode, setMode, playerColor, setPlayerColor,
    flipped, setFlipped, selected, setSelected, hint, hintBusy, hintsUsed, thinking,
    elapsed, burst, result, records, setRecords, storageAvailable, soundOn, toggleSound,
    showLegal, setShowLegal, tab, setTab, modal, promotion, setPromotion, message,
    clearConfirm, setClearConfirm, focusMode, setFocusMode, boardRef, boardColumnRef,
    historyRef, turn, inCheck, humanTurn, canInteract, bestScore, score, legalMoves,
    canUndo, startGame, resetPosition, commitMove, tryMove, selectPiece, clickSquare,
    undoMove, getHint, togglePause, openModal, closeModal, resignGame,
  };
}

export type ChessGame = ReturnType<typeof useChessGame>;