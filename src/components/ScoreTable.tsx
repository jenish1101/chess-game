import { Trophy } from 'lucide-react';
import { DIFFICULTIES, type ScoreRecord } from '../game/types';

export function ScoreTable({ records, compact = false }: { records: ScoreRecord[]; compact?: boolean }) {
  if (!records.length) return <div className={`empty-state ${compact ? 'compact-empty' : ''}`}>
    <Trophy size={27} strokeWidth={1.25} />
    <p>Your first chapter awaits.</p>
    <span>Finish a game to put your name on the board.</span>
  </div>;

  return <div className="score-table-wrap"><table className={`score-table ${compact ? 'compact-table' : ''}`}>
    <thead><tr><th scope="col">#</th><th scope="col">Game</th>{!compact && <th scope="col">Moves</th>}<th scope="col">Score</th></tr></thead>
    <tbody>{records.slice(0, compact ? 4 : 10).map((record, index) => <tr key={record.id}>
      <td className={index === 0 ? 'first-place' : ''}>{index === 0 ? <Trophy size={15} /> : String(index + 1).padStart(2, '0')}</td>
      <td><span className={`result-label ${record.outcome.toLowerCase()}`}>{record.outcome}</span><span className="record-detail">{record.mode === 'local' ? `${record.side === 'w' ? 'White' : 'Black'} vs. friend` : DIFFICULTIES[record.difficulty].label} <span aria-hidden="true">/</span> {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></td>
      {!compact && <td>{record.moves}</td>}
      <td className="record-score">{record.score.toLocaleString()}</td>
    </tr>)}</tbody>
  </table></div>;
}