import type { Board, Position } from './types';
import { Side, PieceType } from './types';
import { getLegalMoves, movePiece, isInCheck, isCheckmate, isStalemate } from './moves';

const PIECE_VALUES: Record<PieceType, number> = {
  [PieceType.King]: 100000,
  [PieceType.Rook]: 900,
  [PieceType.Cannon]: 500,
  [PieceType.Horse]: 400,
  [PieceType.Elephant]: 200,
  [PieceType.Advisor]: 200,
  [PieceType.Pawn]: 100,
};

const PAWN_TABLE: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [90, 90, 110, 130, 130, 130, 110, 90, 90],
  [90, 100, 120, 130, 130, 130, 120, 100, 90],
  [90, 100, 120, 130, 130, 130, 120, 100, 90],
  [70, 90, 110, 120, 120, 120, 110, 90, 70],
  [60, 80, 100, 110, 110, 110, 100, 80, 60],
  [50, 60, 70, 80, 80, 80, 70, 60, 50],
  [20, 30, 40, 50, 50, 50, 40, 30, 20],
  [10, 10, 10, 10, 10, 10, 10, 10, 10],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const HORSE_TABLE: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 10, 20, 20, 20, 10, 0, 0],
  [0, 0, 10, 30, 40, 30, 10, 0, 0],
  [0, 10, 30, 50, 60, 50, 30, 10, 0],
  [0, 10, 30, 50, 60, 50, 30, 10, 0],
  [0, 10, 20, 30, 40, 30, 20, 10, 0],
  [0, 0, 10, 20, 20, 20, 10, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const CANNON_TABLE: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 10, 20, 20, 20, 10, 0, 0],
  [0, 0, 10, 20, 20, 20, 10, 0, 0],
  [0, 10, 20, 30, 30, 30, 20, 10, 0],
  [0, 10, 20, 30, 30, 30, 20, 10, 0],
  [0, 10, 20, 30, 30, 30, 20, 10, 0],
  [10, 20, 30, 40, 40, 40, 30, 20, 10],
  [10, 20, 30, 40, 40, 40, 30, 20, 10],
  [0, 10, 20, 20, 20, 20, 20, 10, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const ROOK_TABLE: number[][] = [
  [10, 10, 10, 20, 20, 20, 10, 10, 10],
  [20, 30, 30, 40, 40, 40, 30, 30, 20],
  [20, 30, 30, 40, 40, 40, 30, 30, 20],
  [20, 30, 30, 40, 40, 40, 30, 30, 20],
  [20, 30, 30, 40, 40, 40, 30, 30, 20],
  [20, 30, 30, 40, 40, 40, 30, 30, 20],
  [20, 30, 30, 40, 40, 40, 30, 30, 20],
  [20, 30, 30, 40, 40, 40, 30, 30, 20],
  [20, 30, 30, 40, 40, 40, 30, 30, 20],
  [10, 10, 10, 20, 20, 20, 10, 10, 10],
];

function evaluatePiece(board: Board, row: number, col: number): number {
  const piece = board[row][col];
  if (!piece) return 0;

  const baseValue = PIECE_VALUES[piece.type];
  let posValue = 0;

  const r = piece.side === Side.Red ? 9 - row : row;

  switch (piece.type) {
    case PieceType.Pawn:
      posValue = PAWN_TABLE[r][col];
      break;
    case PieceType.Horse:
      posValue = HORSE_TABLE[r][col];
      break;
    case PieceType.Cannon:
      posValue = CANNON_TABLE[r][col];
      break;
    case PieceType.Rook:
      posValue = ROOK_TABLE[r][col];
      break;
  }

  return piece.side === Side.Red ? baseValue + posValue : -(baseValue + posValue);
}

function evaluate(board: Board): number {
  let score = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      score += evaluatePiece(board, r, c);
    }
  }
  return score;
}

function getAllLegalMoves(board: Board, side: Side): { from: Position; to: Position }[] {
  const moves: { from: Position; to: Position }[] = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.side === side) {
        const from = { row: r, col: c };
        const legalMoves = getLegalMoves(board, from);
        for (const to of legalMoves) {
          moves.push({ from, to });
        }
      }
    }
  }
  return moves;
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  side: Side,
): number {
  if (depth === 0) return evaluate(board);

  const currentSide = maximizing ? side : (side === Side.Red ? Side.Black : Side.Red);

  if (isCheckmate(board, currentSide)) {
    return maximizing ? -99999 + (3 - depth) : 99999 - (3 - depth);
  }
  if (isStalemate(board, currentSide)) {
    return 0;
  }

  const moves = getAllLegalMoves(board, currentSide);

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const result = movePiece(board, move.from, move.to);
      const evalScore = minimax(result.board, depth - 1, alpha, beta, false, side);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const result = movePiece(board, move.from, move.to);
      const evalScore = minimax(result.board, depth - 1, alpha, beta, true, side);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getAIMove(board: Board, side: Side, depth: number = 3): { from: Position; to: Position } | null {
  const moves = getAllLegalMoves(board, side);
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = -Infinity;
  const alpha = -Infinity;
  const beta = Infinity;

  for (const move of moves) {
    const result = movePiece(board, move.from, move.to);
    const score = minimax(result.board, depth - 1, alpha, beta, false, side);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}