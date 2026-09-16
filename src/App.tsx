import type { Color } from 'chess.js';
import { MotionConfig, motion } from 'framer-motion';
import { ArrowDownUp, ArrowLeft, ArrowRight, BookOpen, Clock3, Coffee, Lightbulb, Maximize2, Minimize2, Pause, Play, RotateCcw, Trophy, Undo2, Users, Volume2, VolumeX } from 'lucide-react';
import { ChessBoard } from './components/ChessBoard';
import { ChessPiece } from './components/ChessPiece';
import { ClubMark, Starburst } from './components/Brand';
import { GameSidebar } from './components/GameSidebar';
import { GameDialogs } from './components/GameDialogs';
import { DIFFICULTIES, PIECE_NAMES, formatTime } from './game/types';
import { useChessGame, type ChessGame } from './game/useChessGame';

function PlayerRow({ g, color, bottom = false }: { g: ChessGame; color: Color; bottom?: boolean }) {
  const isYou = g.mode === 'computer' && color === g.playerColor;
  const active = g.phase === 'playing' && color === g.turn;
  const captures = g.history.filter((move) => move.color === color && move.captured).map((move) => move.captured!);
  return <div className={`player-row ${bottom ? 'bottom-player' : 'top-player'}`}>
    <div className={`player-avatar ${color === 'w' ? 'white-avatar' : 'black-avatar'}`}>
      <ChessPiece type={isYou || g.mode === 'local' ? 'p' : 'n'} color={color} />
      {active && <span className={`active-dot ${g.thinking ? 'thinking-dot' : ''}`} />}
    </div>
    <div className="player-info"><strong>{g.mode === 'local' ? (color === 'w' ? 'White' : 'Black') : isYou ? 'You' : 'The Club'}</strong>
      <div className="player-subline"><span>{color === 'w' ? 'White pieces' : 'Black pieces'}</span>
        {captures.length > 0 && <span className="captured-pieces" aria-label={`Captured: ${captures.map((piece) => PIECE_NAMES[piece]).join(', ')}`}>{captures.map((piece, i) => <ChessPiece key={`${piece}-${i}`} type={piece} color={color === 'w' ? 'b' : 'w'} />)}</span>}
      </div>
    </div>
    {bottom ? <div className="game-clock" title="Time enjoyed. This is not a countdown."><Clock3 size={14} strokeWidth={1.6} /><span>{formatTime(g.elapsed)}</span></div>
      : <div className="opponent-label">{g.mode === 'computer' ? <><span className={`level-bars level-${g.difficulty}`} aria-hidden="true"><i /><i /><i /></span>{DIFFICULTIES[g.difficulty].label}</> : <><Users size={14} />Pass & play</>}</div>}
  </div>;
}

export default function App() {
  const g = useChessGame();
  const { phase, soundOn, focusMode, flipped, result } = g;

  return <MotionConfig reducedMotion="user">
    <div className={`app-shell ${focusMode ? 'focus-mode' : ''}`}>
      <header className="site-header">
        <a className="brand" href="#" aria-label="Knight Club home" onClick={(event) => { event.preventDefault(); g.setFocusMode(false); if (phase !== 'ready') g.resetPosition('ready'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><ClubMark /><span>knight club<span className="brand-period">.</span></span></a>
        <span className="header-note">A small break. A great game.</span>
        <nav className="header-actions" aria-label="Game resources">
          <button className="text-button best-nav" onClick={() => g.openModal('scores')}><Trophy size={16} strokeWidth={1.6} /><span>Your best</span></button>
          <button className="text-button" onClick={() => g.openModal('help')}><BookOpen size={16} strokeWidth={1.6} /><span>How to play</span></button>
          <span className="nav-divider" />
          <button className="icon-button sound-button" aria-label={soundOn ? 'Mute sound' : 'Enable sound'} aria-pressed={soundOn} title="Toggle sound (M)" onClick={g.toggleSound}>{soundOn ? <Volume2 size={19} strokeWidth={1.6} /> : <VolumeX size={19} strokeWidth={1.6} />}</button>
        </nav>
      </header>

      <main className="main-content">
        <motion.section className="introduction" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div><div className="eyebrow intro-eyebrow">A little strategy. A little headspace.</div><h1>The Knight <em>Club.</em><Starburst /></h1></div>
          <p>Your everyday escape, one move at a time.<br /><span>No rush. No distractions. Just chess.</span></p>
        </motion.section>

        <div className={`game-layout ${phase === 'ready' ? 'game-ready' : 'game-active'}`}>
          <motion.section className="board-column" ref={g.boardColumnRef} aria-label="Your chess game" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}>
            <PlayerRow g={g} color={flipped ? 'w' : 'b'} />
            <ChessBoard history={g.history} selected={g.selected} legalMoves={g.legalMoves} flipped={flipped} canInteract={g.canInteract} turn={g.turn} inCheck={g.inCheck} hint={g.hint} burst={g.burst} showLegal={g.showLegal} onSquare={g.clickSquare} onSelect={g.selectPiece} onMove={g.tryMove} boardRef={g.boardRef}>
              {phase === 'paused' && <motion.div key="paused" className="board-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <motion.div className="board-overlay-content" initial={{ y: 14 }} animate={{ y: 0 }}>
                  <Coffee className="overlay-symbol" size={35} strokeWidth={1.25} /><span className="eyebrow">A well-deserved pause</span><h2>Take a breather.</h2><p>Your next move can wait.<br />Everything is right where you left it.</p>
                  <button className="primary-button" onClick={g.togglePause}><Play size={16} fill="currentColor" />Back to the game<ArrowRight size={18} /></button>
                  <div className="overlay-links"><button className="overlay-secondary" onClick={g.startGame}><RotateCcw size={14} />Start fresh</button><button className="overlay-secondary" onClick={() => g.resetPosition('ready')}><ArrowLeft size={14} />Back to club</button></div>
                </motion.div>
              </motion.div>}
              {phase === 'over' && result && <motion.div key="over" className="board-overlay game-over-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.35, duration: 0.35 }}>
                <motion.div className="board-overlay-content" initial={{ y: 16, scale: 0.96 }} animate={{ y: 0, scale: 1 }}>
                  <Trophy className="overlay-symbol" size={38} strokeWidth={1.25} /><span className="eyebrow">{result.outcome === 'Win' ? 'A very good game' : result.outcome === 'Draw' ? 'Perfectly matched' : 'Another game, a little wiser'}</span>
                  <h2>{g.mode === 'local' && result.winner ? `${result.winner === 'w' ? 'White' : 'Black'} wins.` : result.outcome === 'Win' ? 'Beautifully played.' : result.outcome === 'Draw' ? 'Great minds, a draw.' : 'On to the next one.'}</h2>
                  <p>{result.reason}</p><div className="final-score">{result.score.toLocaleString()}<span>points earned</span></div>
                  <button className="primary-button" onClick={g.startGame}><RotateCcw size={16} />One more game<ArrowRight size={18} /></button>
                  <button className="overlay-secondary" onClick={() => g.resetPosition('ready')}><ArrowLeft size={14} />Back to the club</button>
                </motion.div>
              </motion.div>}
            </ChessBoard>
            <PlayerRow g={g} color={flipped ? 'b' : 'w'} bottom />
            <div className="board-toolbar" aria-label="Board controls">
              <div className="toolbar-main">
                <button onClick={g.undoMove} disabled={!g.canUndo} title="Take back your last move (U)"><Undo2 size={17} strokeWidth={1.65} /><span>Undo</span></button>
                <button onClick={() => g.setFlipped(!flipped)} title="Flip the board (F)"><ArrowDownUp size={16} strokeWidth={1.65} /><span>Flip board</span></button>
                <button onClick={() => void g.getHint()} disabled={phase !== 'playing' || !g.humanTurn || g.hintBusy || !!g.promotion} className={g.hint ? 'hint-active' : ''} title="Get a hint, costs 25 points (H)"><Lightbulb size={17} strokeWidth={1.65} /><span>{g.hintBusy ? 'Thinking...' : 'A little hint'}</span></button>
              </div>
              <div className="toolbar-extra"><button className="toolbar-pause" onClick={g.togglePause} disabled={phase !== 'playing' && phase !== 'paused'} aria-label={phase === 'paused' ? 'Resume game' : 'Pause game'} title="Pause or resume (P)">{phase === 'paused' ? <Play size={17} /> : <Pause size={17} />}</button><button onClick={() => g.setFocusMode(!focusMode)} aria-label={focusMode ? 'Exit focus view' : 'Enter focus view'} title="A little more room to think">{focusMode ? <Minimize2 size={17} strokeWidth={1.65} /> : <Maximize2 size={17} strokeWidth={1.65} />}</button></div>
            </div>
            <div className="board-guidance"><span className="guidance-dot" />Click or drag to move.<span className="keyboard-guidance">Arrow keys + <kbd>enter</kbd> work, too.</span><button onClick={() => g.openModal('help')} aria-label="View keyboard controls">?</button></div>
          </motion.section>
          <GameSidebar g={g} />
        </div>
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {phase === 'ready' ? 'Ready to play. Press Enter to start, or choose a piece.'
            : phase === 'paused' ? 'Game paused. Press P to continue.'
            : phase === 'over' && result ? `Game over. ${result.winner ? `${result.winner === 'w' ? 'White' : 'Black'} wins.` : 'A draw.'} ${result.score} points earned. Press R to play again.`
            : `${g.turn === 'w' ? 'White' : 'Black'} to move. ${g.inCheck ? 'Check. ' : ''}${g.message}`}
        </p>
      </main>
      <footer className="site-footer"><span><ClubMark small />A classic game. A fresh state of mind.</span><span>Made for the love of the game.<span className="footer-star">+</span></span></footer>
    </div>
    <GameDialogs g={g} />
  </MotionConfig>;
}
