import { memo, useId } from 'react';
import type { Color, PieceSymbol } from 'chess.js';

export const ChessPiece = memo(function ChessPiece({ type, color, className = '' }: {
  type: PieceSymbol; color: Color; className?: string;
}) {
  const id = useId().replace(/:/g, '');
  const white = color === 'w';
  const line = white ? '#737c65' : '#182b22';
  const detail = white ? '#899078' : '#7a8b76';
  return (
    <svg className={`chess-piece ${className}`} viewBox="0 0 45 45" aria-hidden="true">
      <defs>
        <linearGradient id={`piece-${id}`} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor={white ? '#fffef5' : '#475947'} />
          <stop offset="100%" stopColor={white ? '#e8e9d8' : '#23372a'} />
        </linearGradient>
      </defs>
      <g fill={`url(#piece-${id})`} stroke={line} strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
        {type === 'p' && <>
          <path d="M22.5 8a4.5 4.5 0 0 0-3.2 7.65c-2.3 1-3.8 3.05-3.8 5.35 0 2.35 1.05 4.3 2.8 5.5-3.45 1.3-5.65 4.2-5.8 7.5h20c-.15-3.3-2.35-6.2-5.8-7.5 1.75-1.2 2.8-3.15 2.8-5.5 0-2.3-1.5-4.35-3.8-5.35A4.5 4.5 0 0 0 22.5 8Z" />
          <path d="M12 34h21l2 5H10l2-5Z" />
          <path d="M13 35.5h19" stroke={detail} strokeWidth="0.8" />
        </>}
        {type === 'r' && <>
          <path d="M9 8h6v4h5V8h5v4h5V8h6v8l-4 3v12l3 3v5H10v-5l3-3V19l-4-3V8Z" />
          <path d="M13 19h19M13 31h19M10 35h25M10 16h25" fill="none" />
          <path d="M15.5 21v8M14 36.5h18" stroke={detail} strokeWidth="0.85" />
        </>}
        {type === 'n' && <>
          <path d="M22 10c10.5 1 16.5 8 16 27H15c0-9 11-7 9-21" />
          <path d="M24 18c.4 2.9-5.6 7.4-8 9-3 2-2.8 4.3-5 4-1-.9 2.3-3 1-3-1 0 .2 1.2-1 2-1 0-4 1-4-4 0-2 6-12 6-12s1.9-1.9 2-3.5c-.7-1-.5-2-.5-3 1-.5 3 3 3 3h2s.8-2 2.5-3c1 0 1 3 1 3" />
          <path d="M9 26.5l2-.7M15 16l1 1" stroke={line} strokeWidth="2" />
          <path d="M27 14c5 3 7.5 10 7.3 19" fill="none" stroke={detail} strokeWidth="1" />
          <path d="M13 36h25l1 3H12l1-3Z" />
        </>}
        {type === 'b' && <>
          <path d="M22.5 7c-2.5 3.5-8 7.8-8 13 0 4.8 3.4 7 8 7s8-2.2 8-7c0-5.2-5.5-9.5-8-13Z" />
          <circle cx="22.5" cy="6.5" r="2" />
          <path d="m20 13 5 7" fill="none" stroke={line} strokeWidth="2" />
          <path d="M18 27h9l2 5H16l2-5ZM13 32h19l3 5c-7 3-18 3-25 0l3-5Z" />
          <path d="M15 35h15M18 24h9" fill="none" stroke={detail} strokeWidth="1" />
          <path d="M10 39c7-1.3 18-1.3 25 0" fill="none" />
        </>}
        {type === 'q' && <>
          <path d="m8 14 4 15h21l4-15-7 10V11l-5.5 13-2-16-2 16L15 11v13L8 14Z" />
          <circle cx="7" cy="11" r="2.4" /><circle cx="14.5" cy="8" r="2.4" />
          <circle cx="22.5" cy="5.5" r="2.4" /><circle cx="30.5" cy="8" r="2.4" /><circle cx="38" cy="11" r="2.4" />
          <path d="M12 29c6-2 15-2 21 0l-1 5 3 4c-7 2-18 2-25 0l3-4-1-5Z" />
          <path d="M13 33c5-1.5 14-1.5 19 0M12 36.5c6-1.5 15-1.5 21 0" fill="none" stroke={detail} strokeWidth="1" />
        </>}
        {type === 'k' && <>
          <path d="M22.5 3v9M19 6.5h7" fill="none" strokeWidth="2" />
          <path d="M22.5 13c-3.5-6-9-3-8 2 1 4 4.5 7 8 10 3.5-3 7-6 8-10 1-5-4.5-8-8-2Z" />
          <path d="M12 28c-2-4-6-8-3-12 3-4 10 1 13.5 7 3.5-6 10.5-11 13.5-7 3 4-1 8-3 12l-2 6 3 4c-7 2-17 2-24 0l3-4-1-6Z" />
          <path d="M12 28c6-2 15-2 21 0M13 33c5-1.5 14-1.5 19 0M12 36.5c6-1.5 15-1.5 21 0" fill="none" stroke={detail} strokeWidth="1" />
          <path d="M22.5 23v-8" fill="none" />
        </>}
      </g>
    </svg>
  );
});