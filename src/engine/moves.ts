import type { Board, Position, Piece } from './types';
import { Side, PieceType, inBoard, inPalace, onRedSide, onBlackSide, opponent } from './types';

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

function applyMoveRaw(board: Board, from: Position, to: Position): Board {
  const newBoard = cloneBoard(board);
  newBoard[to.row][to.col] = newBoard[from.row][from.col];
  newBoard[from.row][from.col] = null;
  return newBoard;
}

function findKing(board: Board, side: Side): Position | null {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.type === PieceType.King && p.side === side) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

function countBetween(board: Board, from: Position, to: Position): number {
  let count = 0;
  if (from.row === to.row) {
    const minC = Math.min(from.col, to.col);
    const maxC = Math.max(from.col, to.col);
    for (let c = minC + 1; c < maxC; c++) {
      if (board[from.row][c]) count++;
    }
  } else if (from.col === to.col) {
    const minR = Math.min(from.row, to.row);
    const maxR = Math.max(from.row, to.row);
    for (let r = minR + 1; r < maxR; r++) {
      if (board[r][from.col]) count++;
    }
  }
  return count;
}

export function kingsCanSeeEachOther(board: Board): boolean {
  const redKing = findKing(board, Side.Red);
  const blackKing = findKing(board, Side.Black);
  if (!redKing || !blackKing) return false;
  if (redKing.col !== blackKing.col) return false;
  return countBetween(board, redKing, blackKing) === 0;
}

export function isInCheck(board: Board, side: Side): boolean {
  const kingPos = findKing(board, side);
  if (!kingPos) return true;
  const opp = opponent(side);
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.side === opp) {
        const moves = getRawMoves(board, { row: r, col: c });
        if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function isMoveLegal(board: Board, from: Position, to: Position): boolean {
  const piece = board[from.row][from.col];
  if (!piece) return false;
  const newBoard = applyMoveRaw(board, from, to);
  if (kingsCanSeeEachOther(newBoard)) return false;
  return !isInCheck(newBoard, piece.side);
}

function getRawMoves(board: Board, pos: Position): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  switch (piece.type) {
    case PieceType.King: return getKingMoves(board, pos, piece.side);
    case PieceType.Advisor: return getAdvisorMoves(board, pos, piece.side);
    case PieceType.Elephant: return getElephantMoves(board, pos, piece.side);
    case PieceType.Horse: return getHorseMoves(board, pos);
    case PieceType.Rook: return getRookMoves(board, pos);
    case PieceType.Cannon: return getCannonMoves(board, pos);
    case PieceType.Pawn: return getPawnMoves(board, pos, piece.side);
    default: return [];
  }
}

function getKingMoves(board: Board, pos: Position, side: Side): Position[] {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const moves: Position[] = [];
  for (const [dr, dc] of dirs) {
    const nr = pos.row + dr;
    const nc = pos.col + dc;
    if (!inPalace(nr, nc, side)) continue;
    const target = board[nr][nc];
    if (target && target.side === side) continue;
    moves.push({ row: nr, col: nc });
  }
  return moves;
}

function getAdvisorMoves(board: Board, pos: Position, side: Side): Position[] {
  const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const moves: Position[] = [];
  for (const [dr, dc] of dirs) {
    const nr = pos.row + dr;
    const nc = pos.col + dc;
    if (!inPalace(nr, nc, side)) continue;
    const target = board[nr][nc];
    if (target && target.side === side) continue;
    moves.push({ row: nr, col: nc });
  }
  return moves;
}

function getElephantMoves(board: Board, pos: Position, side: Side): Position[] {
  const dirs: [number, number, number, number][] = [
    [-2, -2, -1, -1],
    [-2, 2, -1, 1],
    [2, -2, 1, -1],
    [2, 2, 1, 1],
  ];
  const moves: Position[] = [];
  for (const [dr, dc, eyer, eyec] of dirs) {
    const nr = pos.row + dr;
    const nc = pos.col + dc;
    if (!inBoard(nr, nc)) continue;
    if (side === Side.Red && !onRedSide(nr)) continue;
    if (side === Side.Black && !onBlackSide(nr)) continue;
    const eyeR = pos.row + eyer;
    const eyeC = pos.col + eyec;
    if (board[eyeR][eyeC]) continue;
    const target = board[nr][nc];
    if (target && target.side === side) continue;
    moves.push({ row: nr, col: nc });
  }
  return moves;
}

function getHorseMoves(board: Board, pos: Position): Position[] {
  const legs: [number, number, number, number][] = [
    [-2, -1, -1, 0],
    [-2, 1, -1, 0],
    [2, -1, 1, 0],
    [2, 1, 1, 0],
    [-1, -2, 0, -1],
    [1, -2, 0, -1],
    [-1, 2, 0, 1],
    [1, 2, 0, 1],
  ];
  const moves: Position[] = [];
  const piece = board[pos.row][pos.col]!;
  for (const [dr, dc, legR, legC] of legs) {
    const nr = pos.row + dr;
    const nc = pos.col + dc;
    if (!inBoard(nr, nc)) continue;
    const lr = pos.row + legR;
    const lc = pos.col + legC;
    if (board[lr][lc]) continue;
    const target = board[nr][nc];
    if (target && target.side === piece.side) continue;
    moves.push({ row: nr, col: nc });
  }
  return moves;
}

function getRookMoves(board: Board, pos: Position): Position[] {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const moves: Position[] = [];
  const piece = board[pos.row][pos.col]!;
  for (const [dr, dc] of dirs) {
    let r = pos.row + dr;
    let c = pos.col + dc;
    while (inBoard(r, c)) {
      const target = board[r][c];
      if (target) {
        if (target.side !== piece.side) moves.push({ row: r, col: c });
        break;
      }
      moves.push({ row: r, col: c });
      r += dr;
      c += dc;
    }
  }
  return moves;
}

function getCannonMoves(board: Board, pos: Position): Position[] {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const moves: Position[] = [];
  const piece = board[pos.row][pos.col]!;
  for (const [dr, dc] of dirs) {
    let r = pos.row + dr;
    let c = pos.col + dc;
    let jumped = false;
    while (inBoard(r, c)) {
      const target = board[r][c];
      if (target) {
        if (!jumped) {
          jumped = true;
        } else {
          if (target.side !== piece.side) moves.push({ row: r, col: c });
          break;
        }
      } else {
        if (!jumped) moves.push({ row: r, col: c });
      }
      r += dr;
      c += dc;
    }
  }
  return moves;
}

function getPawnMoves(board: Board, pos: Position, side: Side): Position[] {
  const moves: Position[] = [];
  const forward = side === Side.Red ? -1 : 1;
  const crossed = side === Side.Red ? !onRedSide(pos.row) : !onBlackSide(pos.row);

  const check = (r: number, c: number) => {
    if (!inBoard(r, c)) return;
    const target = board[r][c];
    if (target && target.side === side) return;
    moves.push({ row: r, col: c });
  };

  check(pos.row + forward, pos.col);
  if (crossed) {
    check(pos.row, pos.col - 1);
    check(pos.row, pos.col + 1);
  }
  return moves;
}

export function getLegalMoves(board: Board, pos: Position): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];
  const rawMoves = getRawMoves(board, pos);
  return rawMoves.filter(move => isMoveLegal(board, pos, move));
}

export function isCheckmate(board: Board, side: Side): boolean {
  if (!isInCheck(board, side)) return false;
  return !hasAnyLegalMove(board, side);
}

export function isStalemate(board: Board, side: Side): boolean {
  if (isInCheck(board, side)) return false;
  return !hasAnyLegalMove(board, side);
}

function hasAnyLegalMove(board: Board, side: Side): boolean {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.side === side) {
        if (getLegalMoves(board, { row: r, col: c }).length > 0) return true;
      }
    }
  }
  return false;
}

export function movePiece(board: Board, from: Position, to: Position): { board: Board; captured: Piece | null } {
  const captured = board[to.row][to.col];
  return { board: applyMoveRaw(board, from, to), captured };
}

/**
 * 轻量级检测：指定位置的棋子是否攻击对方将/帅
 * 比 isInCheck 遍历所有棋子更高效，仅检查单个棋子
 */
export function positionAttacksKing(board: Board, pos: Position): boolean {
  const piece = board[pos.row][pos.col];
  if (!piece) return false;
  const opp = opponent(piece.side);
  const kingPos = findKing(board, opp);
  if (!kingPos) return false;
  const rawMoves = getRawMoves(board, pos);
  return rawMoves.some(m => m.row === kingPos.row && m.col === kingPos.col);
}

export { getRawMoves, findKing, hasAnyLegalMove };