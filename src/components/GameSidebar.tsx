import type { Color } from 'chess.js';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronRight, CornerDownLeft, Flag, Monitor, Pause, Play, RotateCcw, Sparkles, Sprout, Trophy, Users } from 'lucide-react';
import { DIFFICULTIES, calculateScore, type Difficulty } from '../game/types';
import type { ChessGame } from '../game/useChessGame';
import { ClubMark } from './Brand';
import { ScoreTable } from './ScoreTable';

export function GameSidebar({ g }: { g: ChessGame }) {
  const { phase, difficulty, mode, playerColor, thinking, turn, inCheck, score, result,
    bestScore, history, message, showLegal, tab, records, hintsUsed } = g;

  return <motion.aside className="game-sidebar" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.17 }}>
    <div className={`game-panel ${phase !== 'ready' ? 'playing-panel' : ''}`}>
      <>
        {phase === 'ready' ? <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
          <div className="eyebrow orange panel-eyebrow"><span className="tiny-star">+</span>Your seat is ready</div>
          <h2>Pull up a chair.</h2>
          <p className="panel-description">A fresh board. A worthy opponent.<br />All that's missing is your first move.</p>

          <div className="mode-selector segmented" aria-label="Game mode">
            <button className={mode === 'computer' ? 'active' : ''} aria-pressed={mode === 'computer'} onClick={() => g.setMode('computer')}><Monitor size={15} />Play computer</button>
            <button className={mode === 'local' ? 'active' : ''} aria-pressed={mode === 'local'} onClick={() => { g.setMode('local'); g.setPlayerColor('w'); g.setFlipped(false); }}><Users size={15} />Play a friend</button>
          </div>
          <div className={`difficulty-field ${mode === 'local' ? 'local-difficulty' : ''}`}>
            <div className="field-label"><span>{mode === 'computer' ? 'Set the pace' : 'Good company, one screen'}</span><span>{mode === 'computer' ? DIFFICULTIES[difficulty].description : 'Take turns, share the board'}</span></div>
            {mode === 'computer' ? <div className="difficulty-selector segmented" aria-label="Computer difficulty">
              {(Object.keys(DIFFICULTIES) as Difficulty[]).map((level) => <button key={level} className={difficulty === level ? 'active' : ''} aria-pressed={difficulty === level} onClick={() => g.setDifficulty(level)}>{DIFFICULTIES[level].label}</button>)}
            </div> : <p className="local-note"><Users size={19} strokeWidth={1.4} />A classic, face-to-face. White moves first.</p>}
          </div>
          <div className="color-field"><span className="field-title">{mode === 'computer' ? 'You play as' : 'First to move'}</span>
            <div className="color-selector" aria-label="Your piece color">
              {(['w', 'b'] as Color[]).map((color) => <button key={color} className={playerColor === color ? 'active' : ''} disabled={mode === 'local' && color === 'b'} aria-pressed={playerColor === color} onClick={() => { g.setPlayerColor(color); g.setFlipped(color === 'b'); }}>
                <span className={`color-disc ${color === 'w' ? 'white-disc' : 'black-disc'}`} />{color === 'w' ? 'White' : 'Black'}{playerColor === color && <Check size={12} />}
              </button>)}
            </div>
          </div>
          <button className="primary-button start-button" onClick={g.startGame}><span>Let's play</span><span className="start-button-right"><kbd><CornerDownLeft size={12} /></kbd><ArrowRight size={18} /></span></button>
          <div className="no-pressure"><Sprout size={14} strokeWidth={1.5} />No clocks. No pressure. Just possibilities.</div>
        </motion.div> : <motion.div key="playing" initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="eyebrow panel-eyebrow playing-eyebrow"><span className={`status-dot ${thinking ? 'pulsing' : ''} ${phase !== 'playing' ? 'inactive-dot' : ''}`} />{phase === 'paused' ? 'A moment to yourself' : phase === 'over' ? 'Good game. Well played.' : thinking ? 'The club is thinking' : `${turn === 'w' ? 'White' : 'Black'} to move`}</div>
          <h2>{phase === 'paused' ? 'Room to breathe.' : phase === 'over' ? 'Worth every move.' : inCheck ? 'A little pressure.' : thinking ? 'A worthy rival.' : 'Make your move.'}</h2>
          <p className="panel-description">{phase === 'over' ? 'A little more experience. A new perspective.' : phase === 'paused' ? 'Even the best moves begin with a pause.' : thinking ? 'Good things take a little thought.' : inCheck ? 'Your king needs you. Find a way to safety.' : 'Trust your instincts. Enjoy the possibilities.'}</p>
          <div className="live-score">
            <div><span className="eyebrow">{mode === 'local' ? (result ? 'Final score' : "White's score") : 'Your score'}</span>
              <div className="score-number"><AnimatePresence mode="popLayout" initial={false}><motion.span key={score} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>{score.toString().padStart(4, '0')}</motion.span></AnimatePresence><small>pts</small></div>
            </div>
            <div className="score-personal-best"><Trophy size={17} strokeWidth={1.4} /><span>{mode === 'local' && !result ? "Black's score" : 'Personal best'}</span><strong>{mode === 'local' && !result ? calculateScore(history, 'b', hintsUsed.b).toLocaleString() : bestScore.toLocaleString()}</strong></div>
          </div>
          <div className="move-note"><Sparkles size={17} strokeWidth={1.5} /><span>{message}</span></div>
          <div className="session-line"><span>{mode === 'computer' ? `${DIFFICULTIES[difficulty].label} game` : 'A game with a friend'}</span><span>Move {Math.floor(history.length / 2) + 1}</span></div>
          <div className="session-actions">
            <button className="primary-button" onClick={phase === 'over' ? g.startGame : g.togglePause}>{phase === 'over' ? <RotateCcw size={16} /> : phase === 'paused' ? <Play size={16} fill="currentColor" /> : <Pause size={16} />}{phase === 'over' ? 'One more game' : phase === 'paused' ? 'Keep playing' : 'Take a pause'}<ArrowRight size={17} /></button>
            <button className="restart-button" onClick={g.startGame} title="Start a fresh game (R)" aria-label="Restart game"><RotateCcw size={18} /></button>
          </div>
          <div className="play-options">
            <label className="switch-label"><input type="checkbox" checked={showLegal} onChange={(event) => g.setShowLegal(event.target.checked)} /><span className="switch-track" /><span>Show legal moves</span></label>
            <button className="resign-button" onClick={() => phase === 'over' ? g.resetPosition('ready') : g.openModal('resign')}>{phase === 'over' ? <ArrowLeft size={13} /> : <Flag size={13} />}{phase === 'over' ? 'Back' : 'Resign'}</button>
          </div>
        </motion.div>}
      </>
    </div>

    <section className="scoresheet" aria-label="Game scoresheet">
      <div className="scoresheet-heading"><span className="eyebrow">The scoresheet</span><button onClick={() => g.openModal('scores')} title="See your local high scores"><Trophy size={13} strokeWidth={1.6} />Best: {bestScore.toLocaleString()}</button></div>
      <div className="scoresheet-tabs" role="tablist" aria-label="Scoresheet view">
        <button role="tab" id="moves-tab" aria-selected={tab === 'moves'} aria-controls="moves-panel" className={tab === 'moves' ? 'active' : ''} onClick={() => g.setTab('moves')}>Moves<span>{history.length}</span></button>
        <button role="tab" id="scores-tab" aria-selected={tab === 'scores'} aria-controls="scores-panel" className={tab === 'scores' ? 'active' : ''} onClick={() => g.setTab('scores')}>Best games<ChevronRight size={13} /></button>
      </div>
      {tab === 'moves' ? <div role="tabpanel" id="moves-panel" aria-labelledby="moves-tab">
        {history.length === 0 ? <div className="empty-state moves-empty"><ClubMark small /><p>Every good game starts somewhere.</p><span>Your first move looks good right here.</span></div>
          : <div className="history-list" ref={g.historyRef}><table className="move-table" aria-label="Move history"><thead><tr><th scope="col">#</th><th scope="col">White</th><th scope="col">Black</th></tr></thead><tbody>
            {Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => <tr key={i}><td>{i + 1}.</td>{[0, 1].map((offset) => <td key={offset} className={i * 2 + offset === history.length - 1 ? 'latest-move' : ''}>{history[i * 2 + offset]?.san ?? <span className="waiting-move">...</span>}</td>)}</tr>)}
          </tbody></table></div>}
      </div> : <div role="tabpanel" id="scores-panel" aria-labelledby="scores-tab"><ScoreTable records={records} compact />{records.length > 0 && <button className="all-scores-button" onClick={() => g.openModal('scores')}>The full scoresheet<ArrowRight size={13} /></button>}</div>}
    </section>
  </motion.aside>;
}