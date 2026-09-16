import type { PieceSymbol } from 'chess.js';
import { AnimatePresence } from 'framer-motion';
import { ArrowRight, Flag } from 'lucide-react';
import { CAPTURE_POINTS, PIECE_NAMES } from '../game/types';
import type { ChessGame } from '../game/useChessGame';
import { ChessPiece } from './ChessPiece';
import { Modal } from './Modal';
import { ScoreTable } from './ScoreTable';

const PIECE_GUIDE: [PieceSymbol, string, string][] = [
  ['p', 'Pawn', 'Forward one. Capture diagonally. Two steps on its first move.'],
  ['n', 'Knight', 'An L shape: two squares, then one. Jumps over pieces.'],
  ['b', 'Bishop', 'Any distance diagonally. Always on its own color.'],
  ['r', 'Rook', 'Any distance along a rank or file. Straight to the point.'],
  ['q', 'Queen', 'Any distance in a straight line or diagonal.'],
  ['k', 'King', 'One square in any direction. Keep it out of check.'],
];

export function GameDialogs({ g }: { g: ChessGame }) {
  const { modal, phase, mode, turn, records, storageAvailable, clearConfirm, promotion } = g;
  return <AnimatePresence>
    {modal === 'help' && <Modal key="help" title="A little know-how." eyebrow="Everyone starts somewhere" onClose={g.closeModal} className="help-modal">
      <p className="modal-intro">Keep your king safe. Corner theirs. That's the beautiful idea behind chess.</p>
      <div className="how-steps">
        <div><span>01</span><div><h3>Pick your piece.</h3><p>Tap or click a piece. The dots show every legal move.</p></div></div>
        <div><span>02</span><div><h3>Find your square.</h3><p>Tap a marked square, or drag your piece into place.</p></div></div>
        <div><span>03</span><div><h3>Think one move ahead.</h3><p>Checkmate the opposing king: put it under attack with no legal escape.</p></div></div>
      </div>
      <h3 className="help-section-title">Meet the pieces</h3>
      <div className="piece-guide">{PIECE_GUIDE.map(([type, name, description]) => <div key={type}><ChessPiece type={type} color="b" /><div><strong>{name}</strong><p>{description}</p></div></div>)}</div>
      <p className="special-rules">All the classics are here: castling, en passant, pawn promotion, stalemate, repetition, and the fifty-move rule.</p>
      <h3 className="help-section-title">A score worth chasing</h3>
      <p className="help-score-description">Every move earns 10 points. A check adds 50, promotion adds 200, a win adds 1,000, and a draw adds 200. Captures earn:</p>
      <div className="capture-values">{(['p', 'n', 'b', 'r', 'q'] as PieceSymbol[]).map((type) => <span key={type}><ChessPiece type={type} color="b" /><strong>{CAPTURE_POINTS[type]}</strong></span>)}</div>
      <p className="help-score-description">Hints cost 25 points. Undoing a move also removes its points. Your best 10 completed games stay on this device. In pass-and-play, the winner's score is saved; a draw saves White's.</p>
      <h3 className="help-section-title">At your fingertips</h3>
      <div className="keyboard-reference"><span>Move around the board<kbd>Arrow keys</kbd></span><span>Select / move<kbd>Enter / Space</kbd></span><span>Pause / resume<kbd>P</kbd></span><span>A little hint<kbd>H</kbd></span><span>Undo a move<kbd>U</kbd></span><span>Instant restart<kbd>R</kbd></span><span>Flip the board<kbd>F</kbd></span><span>Sound on / off<kbd>M</kbd></span></div>
      <button className="primary-button modal-cta" onClick={() => { g.closeModal(); if (phase === 'ready') g.startGame(); }}>Back to the board<ArrowRight size={17} /></button>
    </Modal>}
    {modal === 'scores' && <Modal key="scores" title="Your best, so far." eyebrow="The personal hall of fame" onClose={g.closeModal} className="records-modal">
      <p className="modal-intro">Not about being the best. Just a little better than yesterday.</p>
      <ScoreTable records={records} />
      <div className="records-footer"><span>{storageAvailable ? 'Your top 10 games, saved on this device.' : 'Storage is unavailable. Scores last for this visit only.'}</span>{records.length > 0 && <button className={clearConfirm ? 'clear-confirm' : ''} onClick={() => { if (clearConfirm) { g.setRecords([]); g.setClearConfirm(false); } else g.setClearConfirm(true); }}>{clearConfirm ? 'Yes, clear all scores' : 'Clear scores'}</button>}</div>
      {clearConfirm && <button className="cancel-clear" onClick={() => g.setClearConfirm(false)}>Keep my scores</button>}
    </Modal>}
    {modal === 'resign' && <Modal key="resign" title="Call it a game?" eyebrow="There's always a next time" onClose={g.closeModal} className="resign-modal">
      <p className="modal-intro">{mode === 'computer' ? 'This game will count as a loss, but every point you earned is yours to keep.' : `${turn === 'w' ? 'White' : 'Black'} will resign. The other player wins this round.`} Your score will be saved.</p>
      <div className="confirm-actions"><button className="secondary-button" onClick={g.closeModal}>Keep playing</button><button className="primary-button" onClick={g.resignGame}><Flag size={15} />Resign game</button></div>
    </Modal>}
    {promotion && <Modal key="promotion" title="A well-earned promotion." eyebrow="New possibilities" onClose={() => { g.setSelected(promotion.from); g.setPromotion(null); }} className="promotion-modal">
      <p className="modal-intro">Your pawn went the distance. What will it become?</p>
      <div className="promotion-choices">{(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((type) => <button key={type} onClick={() => g.commitMove({ ...promotion, promotion: type })}><ChessPiece type={type} color={promotion.color} /><strong>{PIECE_NAMES[type]}</strong><kbd>{type.toUpperCase()}</kbd></button>)}</div>
    </Modal>}
  </AnimatePresence>;
}