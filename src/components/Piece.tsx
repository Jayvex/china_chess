import type { Piece as PieceData } from '../engine/types';
import { Side } from '../engine/types';

const PIECE_CHARS: Record<string, Record<string, string>> = {
  [Side.Red]: {
    king: '帅',
    advisor: '仕',
    elephant: '相',
    horse: '馬',
    rook: '車',
    cannon: '炮',
    pawn: '兵',
  },
  [Side.Black]: {
    king: '将',
    advisor: '士',
    elephant: '象',
    horse: '馬',
    rook: '車',
    cannon: '砲',
    pawn: '卒',
  },
};

interface PieceProps {
  piece: PieceData;
  selected: boolean;
  onClick: () => void;
}

export default function Piece({ piece, selected, onClick }: PieceProps) {
  const char = PIECE_CHARS[piece.side]?.[piece.type] ?? '?';
  const isRed = piece.side === Side.Red;

  return (
    <div
      onClick={onClick}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        background: isRed
          ? 'radial-gradient(circle at 35% 35%, #fff5e6, #f5d6a8, #e8b86d)'
          : 'radial-gradient(circle at 35% 35%, #e8e0d0, #4a4a4a, #2a2a2a)',
        color: isRed ? '#c0392b' : '#f5f5f5',
        fontSize: 'clamp(14px, 2.2vw, 22px)',
        fontWeight: 700,
        boxShadow: selected
          ? '0 0 0 3px #f1c40f, 0 0 0 5px #f39c12, 0 4px 12px rgba(0,0,0,0.4)'
          : '0 2px 8px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.3)',
        border: `2px solid ${isRed ? '#8b4513' : '#1a1a1a'}`,
        transition: 'box-shadow 0.15s ease',
        textShadow: isRed ? '0 1px 1px rgba(255,255,255,0.5)' : '0 1px 2px rgba(0,0,0,0.5)',
        letterSpacing: 1,
        fontFamily: '"Noto Serif SC", "STSong", serif',
        position: 'relative',
        zIndex: selected ? 5 : 2,
      }}
    >
      {char}
    </div>
  );
}