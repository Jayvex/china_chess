import type { Board, Position, Side } from '../engine/types';
import { getLegalMoves, isInCheck } from '../engine/moves';
import Piece from './Piece';

interface GameBoardProps {
  board: Board;
  currentSide: Side;
  selectedPos: Position | null;
  onCellClick: (pos: Position) => void;
  animateKey: number;
}

export default function GameBoard({ board, currentSide, selectedPos, onCellClick, animateKey: _animateKey }: GameBoardProps) {
  const legalMoves = selectedPos ? getLegalMoves(board, selectedPos) : [];

  const isLegalTarget = (row: number, col: number) =>
    legalMoves.some(m => m.row === row && m.col === col);

  const cellSize = Math.min(
    (typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.085, 70) : 60),
    70
  );

  return (
    <div
      style={{
        position: 'relative',
        padding: cellSize * 1.2,
        background: 'linear-gradient(135deg, #d4a855 0%, #c49a45 25%, #b8893a 50%, #c49a45 75%, #d4a855 100%)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
        border: '3px solid #6b4226',
      }}
    >
      <svg
        width={cellSize * 8}
        height={cellSize * 9}
        style={{
          position: 'absolute',
          top: cellSize * 1.2,
          left: cellSize * 1.2,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <defs>
          <pattern id="woodGrain" patternUnits="userSpaceOnUse" width="200" height="200">
            <rect width="200" height="200" fill="none" />
            {Array.from({ length: 30 }, (_, i) => (
              <line
                key={i}
                x1={0}
                y1={i * 7 + Math.sin(i * 0.5) * 3}
                x2={200}
                y2={i * 7 + Math.sin(i * 0.8) * 3 + 5}
                stroke="rgba(139,90,43,0.08)"
                strokeWidth={1.5}
              />
            ))}
          </pattern>
        </defs>

        <rect width={cellSize * 8} height={cellSize * 9} fill="url(#woodGrain)" />

        {Array.from({ length: 10 }, (_, r) => (
          <line
            key={`h${r}`}
            x1={0}
            y1={r * cellSize}
            x2={cellSize * 8}
            y2={r * cellSize}
            stroke="#5a3a1a"
            strokeWidth={1.2}
            opacity={0.7}
          />
        ))}

        {Array.from({ length: 9 }, (_, c) => (
          <line
            key={`v${c}`}
            x1={c * cellSize}
            y1={0}
            x2={c * cellSize}
            y2={cellSize * 4}
            stroke="#5a3a1a"
            strokeWidth={1.2}
            opacity={0.7}
          />
        ))}
        {Array.from({ length: 9 }, (_, c) => (
          <line
            key={`v${c}b`}
            x1={c * cellSize}
            y1={cellSize * 5}
            x2={c * cellSize}
            y2={cellSize * 9}
            stroke="#5a3a1a"
            strokeWidth={1.2}
            opacity={0.7}
          />
        ))}

        <line x1={0} y1={cellSize * 4} x2={cellSize * 8} y2={cellSize * 4} stroke="#5a3a1a" strokeWidth={1.5} opacity={0.7} />
        <line x1={0} y1={cellSize * 5} x2={cellSize * 8} y2={cellSize * 5} stroke="#5a3a1a" strokeWidth={1.5} opacity={0.7} />

        <line x1={cellSize * 3} y1={0} x2={cellSize * 5} y2={cellSize * 2} stroke="#5a3a1a" strokeWidth={1.2} opacity={0.7} />
        <line x1={cellSize * 5} y1={0} x2={cellSize * 3} y2={cellSize * 2} stroke="#5a3a1a" strokeWidth={1.2} opacity={0.7} />
        <line x1={cellSize * 3} y1={cellSize * 7} x2={cellSize * 5} y2={cellSize * 9} stroke="#5a3a1a" strokeWidth={1.2} opacity={0.7} />
        <line x1={cellSize * 5} y1={cellSize * 7} x2={cellSize * 3} y2={cellSize * 9} stroke="#5a3a1a" strokeWidth={1.2} opacity={0.7} />

        <text
          x={cellSize * 4}
          y={cellSize * 4.65}
          textAnchor="middle"
          fontSize={cellSize * 0.55}
          fill="#5a3a1a"
          opacity={0.5}
          fontFamily='"STKaiti", "KaiTi", serif'
          fontWeight={700}
          letterSpacing={cellSize * 0.35}
        >
          楚河　　　　漢界
        </text>

        {selectedPos && (
          <rect
            x={selectedPos.col * cellSize - cellSize * 0.45}
            y={selectedPos.row * cellSize - cellSize * 0.45}
            width={cellSize * 0.9}
            height={cellSize * 0.9}
            fill="none"
            stroke="#f1c40f"
            strokeWidth={2.5}
            rx={4}
            opacity={0.8}
          />
        )}

        {legalMoves.map((move, i) => {
          const isCapture = !!board[move.row][move.col];
          return isCapture ? (
            <circle
              key={`m${i}`}
              cx={move.col * cellSize}
              cy={move.row * cellSize}
              r={cellSize * 0.44}
              fill="none"
              stroke="#e74c3c"
              strokeWidth={3}
              opacity={0.7}
              strokeDasharray={`${cellSize * 0.15} ${cellSize * 0.1}`}
            />
          ) : (
            <circle
              key={`m${i}`}
              cx={move.col * cellSize}
              cy={move.row * cellSize}
              r={cellSize * 0.12}
              fill="rgba(46, 204, 113, 0.7)"
            />
          );
        })}

        {isInCheck(board, currentSide) && (
          <text
            x={cellSize * 0.3}
            y={cellSize * 0.5}
            fontSize={cellSize * 0.25}
            fill="#e74c3c"
            fontWeight={700}
            fontFamily='"Noto Serif SC", serif'
          >
            将
          </text>
        )}
      </svg>

      <div
        style={{
          position: 'relative',
          width: cellSize * 8,
          height: cellSize * 9,
          zIndex: 1,
        }}
      >
        {board.flatMap((row, r) =>
          row.map((piece, c) =>
            piece ? (
              <div
                key={piece.id}
                style={{
                  position: 'absolute',
                  left: c * cellSize,
                  top: r * cellSize,
                  width: cellSize * 0.82,
                  height: cellSize * 0.82,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <Piece
                  piece={piece}
                  selected={selectedPos?.row === r && selectedPos?.col === c}
                  onClick={() => onCellClick({ row: r, col: c })}
                />
              </div>
            ) : null
          )
        )}

        {Array.from({ length: 10 }, (_, row) =>
          Array.from({ length: 9 }, (_, col) => {
            const piece = board[row][col];
            const legal = isLegalTarget(row, col);
            return (
              <div
                key={`hit-${row}-${col}`}
                style={{
                  position: 'absolute',
                  left: col * cellSize - cellSize / 2,
                  top: row * cellSize - cellSize / 2,
                  width: cellSize,
                  height: cellSize,
                  cursor: legal || (piece && piece.side === currentSide) ? 'pointer' : 'default',
                }}
                onClick={() => onCellClick({ row, col })}
              />
            );
          })
        )}
      </div>
    </div>
  );
}