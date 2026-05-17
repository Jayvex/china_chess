export const BOARD_ROWS = 10;
export const BOARD_COLS = 9;

export enum Side {
  Red = 'red',
  Black = 'black',
}

export enum PieceType {
  King = 'king',
  Advisor = 'advisor',
  Elephant = 'elephant',
  Horse = 'horse',
  Rook = 'rook',
  Cannon = 'cannon',
  Pawn = 'pawn',
}

export interface Piece {
  type: PieceType;
  side: Side;
  id: string;
}

export type Board = (Piece | null)[][];

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  piece: Piece;
  from: Position;
  to: Position;
  captured?: Piece;
}

export type GameStatus = 'playing' | 'red_wins' | 'black_wins' | 'draw';

export function createPiece(type: PieceType, side: Side, index: number): Piece {
  return { type, side, id: `${side}-${type}-${index}` };
}

export function opponent(side: Side): Side {
  return side === Side.Red ? Side.Black : Side.Red;
}

export function inBoard(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS;
}

export function inRedPalace(row: number, col: number): boolean {
  return row >= 7 && row <= 9 && col >= 3 && col <= 5;
}

export function inBlackPalace(row: number, col: number): boolean {
  return row >= 0 && row <= 2 && col >= 3 && col <= 5;
}

export function inPalace(row: number, col: number, side: Side): boolean {
  return side === Side.Red ? inRedPalace(row, col) : inBlackPalace(row, col);
}

export function onRedSide(row: number): boolean {
  return row >= 5 && row <= 9;
}

export function onBlackSide(row: number): boolean {
  return row >= 0 && row <= 4;
}

export function initBoard(): Board {
  const board: Board = Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => null)
  );

  const place = (row: number, col: number, type: PieceType, side: Side, index: number) => {
    board[row][col] = createPiece(type, side, index);
  };

  let idx = 0;
  place(0, 0, PieceType.Rook, Side.Black, idx++);
  place(0, 1, PieceType.Horse, Side.Black, idx++);
  place(0, 2, PieceType.Elephant, Side.Black, idx++);
  place(0, 3, PieceType.Advisor, Side.Black, idx++);
  place(0, 4, PieceType.King, Side.Black, idx++);
  place(0, 5, PieceType.Advisor, Side.Black, idx++);
  place(0, 6, PieceType.Elephant, Side.Black, idx++);
  place(0, 7, PieceType.Horse, Side.Black, idx++);
  place(0, 8, PieceType.Rook, Side.Black, idx++);
  place(2, 1, PieceType.Cannon, Side.Black, idx++);
  place(2, 7, PieceType.Cannon, Side.Black, idx++);
  place(3, 0, PieceType.Pawn, Side.Black, idx++);
  place(3, 2, PieceType.Pawn, Side.Black, idx++);
  place(3, 4, PieceType.Pawn, Side.Black, idx++);
  place(3, 6, PieceType.Pawn, Side.Black, idx++);
  place(3, 8, PieceType.Pawn, Side.Black, idx++);

  idx = 0;
  place(9, 0, PieceType.Rook, Side.Red, idx++);
  place(9, 1, PieceType.Horse, Side.Red, idx++);
  place(9, 2, PieceType.Elephant, Side.Red, idx++);
  place(9, 3, PieceType.Advisor, Side.Red, idx++);
  place(9, 4, PieceType.King, Side.Red, idx++);
  place(9, 5, PieceType.Advisor, Side.Red, idx++);
  place(9, 6, PieceType.Elephant, Side.Red, idx++);
  place(9, 7, PieceType.Horse, Side.Red, idx++);
  place(9, 8, PieceType.Rook, Side.Red, idx++);
  place(7, 1, PieceType.Cannon, Side.Red, idx++);
  place(7, 7, PieceType.Cannon, Side.Red, idx++);
  place(6, 0, PieceType.Pawn, Side.Red, idx++);
  place(6, 2, PieceType.Pawn, Side.Red, idx++);
  place(6, 4, PieceType.Pawn, Side.Red, idx++);
  place(6, 6, PieceType.Pawn, Side.Red, idx++);
  place(6, 8, PieceType.Pawn, Side.Red, idx++);

  return board;
}