import type { Board, Position } from './types';
import { Side, PieceType } from './types';
import { getLegalMoves, movePiece, isInCheck, isCheckmate, isStalemate, positionAttacksKing } from './moves';
import { getOpeningMove, recordMove, resetOpeningBook } from './opening-book';

// ============================================================
// 棋子价值定义
// ============================================================

const PIECE_VALUES: Record<PieceType, number> = {
  [PieceType.King]: 100000,
  [PieceType.Rook]: 1000,
  [PieceType.Cannon]: 500,
  [PieceType.Horse]: 400,
  [PieceType.Elephant]: 200,
  [PieceType.Advisor]: 200,
  [PieceType.Pawn]: 100,
};

// ============================================================
// 位置价值表（更精细的评估）
// ============================================================

// 兵/卒位置价值表
const PAWN_TABLE: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [90, 90, 110, 130, 140, 130, 110, 90, 90],
  [90, 100, 120, 135, 140, 135, 120, 100, 90],
  [80, 95, 115, 130, 135, 130, 115, 95, 80],
  [70, 90, 110, 125, 130, 125, 110, 90, 70],
  [60, 80, 100, 115, 120, 115, 100, 80, 60],
  [40, 60, 80, 90, 100, 90, 80, 60, 40],
  [20, 30, 50, 60, 70, 60, 50, 30, 20],
  [10, 15, 25, 35, 45, 35, 25, 15, 10],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// 马位置价值表
const HORSE_TABLE: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 5, 10, 15, 15, 15, 10, 5, 0],
  [5, 15, 25, 35, 40, 35, 25, 15, 5],
  [10, 25, 40, 50, 55, 50, 40, 25, 10],
  [15, 30, 45, 55, 60, 55, 45, 30, 15],
  [15, 30, 45, 55, 60, 55, 45, 30, 15],
  [10, 25, 40, 50, 55, 50, 40, 25, 10],
  [5, 15, 25, 35, 40, 35, 25, 15, 5],
  [0, 5, 10, 20, 25, 20, 10, 5, 0],
  [0, 0, 5, 10, 15, 10, 5, 0, 0],
];

// 炮位置价值表
const CANNON_TABLE: number[][] = [
  [0, 0, 5, 10, 15, 10, 5, 0, 0],
  [5, 10, 20, 30, 35, 30, 20, 10, 5],
  [10, 20, 30, 40, 45, 40, 30, 20, 10],
  [15, 25, 35, 45, 50, 45, 35, 25, 15],
  [20, 30, 40, 50, 55, 50, 40, 30, 20],
  [20, 30, 40, 50, 55, 50, 40, 30, 20],
  [15, 25, 35, 45, 50, 45, 35, 25, 15],
  [10, 20, 30, 40, 45, 40, 30, 20, 10],
  [5, 10, 20, 30, 35, 30, 20, 10, 5],
  [0, 0, 5, 10, 15, 10, 5, 0, 0],
];

// 车位置价值表
const ROOK_TABLE: number[][] = [
  [20, 30, 35, 45, 50, 45, 35, 30, 20],
  [30, 45, 50, 60, 65, 60, 50, 45, 30],
  [35, 50, 55, 65, 70, 65, 55, 50, 35],
  [40, 55, 60, 70, 75, 70, 60, 55, 40],
  [40, 55, 60, 70, 75, 70, 60, 55, 40],
  [40, 55, 60, 70, 75, 70, 60, 55, 40],
  [40, 55, 60, 70, 75, 70, 60, 55, 40],
  [35, 50, 55, 65, 70, 65, 55, 50, 35],
  [30, 45, 50, 60, 65, 60, 50, 45, 30],
  [20, 30, 35, 45, 50, 45, 35, 30, 20],
];

// 将/帅位置价值表
const KING_TABLE: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 10, 15, 10, 0, 0, 0],
  [0, 0, 0, 20, 25, 20, 0, 0, 0],
  [0, 0, 0, 30, 40, 30, 0, 0, 0],
];

// 士/仕位置价值表
const ADVISOR_TABLE: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 20, 0, 20, 0, 0, 0],
  [0, 0, 0, 0, 25, 0, 0, 0, 0],
  [0, 0, 0, 20, 0, 20, 0, 0, 0],
];

// 象/相位置价值表
const ELEPHANT_TABLE: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 20, 0, 0, 0, 20, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [18, 0, 0, 0, 25, 0, 0, 0, 18],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 20, 0, 0, 0, 20, 0, 0],
];

// ============================================================
// 置换表（Transposition Table）
// ============================================================

interface TTEntry {
  key: number;
  depth: number;
  score: number;
  flag: 'exact' | 'alpha' | 'beta';
  bestMove?: { from: Position; to: Position };
}

class TranspositionTable {
  private table: Map<number, TTEntry> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 1000000) {
    this.maxSize = maxSize;
  }

  get(key: number, depth: number, alpha: number, beta: number): { score: number; bestMove?: { from: Position; to: Position } } | null {
    const entry = this.table.get(key);
    if (!entry || entry.depth < depth) return null;

    if (entry.flag === 'exact') {
      return { score: entry.score, bestMove: entry.bestMove };
    }
    if (entry.flag === 'alpha' && entry.score <= alpha) {
      return { score: alpha, bestMove: entry.bestMove };
    }
    if (entry.flag === 'beta' && entry.score >= beta) {
      return { score: beta, bestMove: entry.bestMove };
    }

    return { bestMove: entry.bestMove };
  }

  set(key: number, depth: number, score: number, flag: 'exact' | 'alpha' | 'beta', bestMove?: { from: Position; to: Position }) {
    if (this.table.size >= this.maxSize) {
      // 简单的清理策略：删除一半
      const entries = Array.from(this.table.entries());
      entries.sort((a, b) => a[1].depth - b[1].depth);
      for (let i = 0; i < entries.length / 2; i++) {
        this.table.delete(entries[i][0]);
      }
    }

    this.table.set(key, { key, depth, score, flag, bestMove });
  }

  clear() {
    this.table.clear();
  }
}

// ============================================================
// 杀手走法表
// ============================================================

class KillerMoves {
  private killers: Map<number, { from: Position; to: Position }[]> = new Map();

  get(depth: number): { from: Position; to: Position }[] {
    return this.killers.get(depth) || [];
  }

  add(depth: number, move: { from: Position; to: Position }) {
    const moves = this.killers.get(depth) || [];
    // 避免重复
    if (!moves.some(m => m.from.row === move.from.row && m.from.col === move.from.col &&
                          m.to.row === move.to.row && m.to.col === move.to.col)) {
      moves.unshift(move);
      if (moves.length > 2) moves.pop();
      this.killers.set(depth, moves);
    }
  }

  clear() {
    this.killers.clear();
  }
}

// ============================================================
// 历史启发表
// ============================================================

class HistoryTable {
  private history: Map<string, number> = new Map();

  get(from: Position, to: Position): number {
    const key = `${from.row},${from.col}-${to.row},${to.col}`;
    return this.history.get(key) || 0;
  }

  update(from: Position, to: Position, depth: number) {
    const key = `${from.row},${from.col}-${to.row},${to.col}`;
    const current = this.history.get(key) || 0;
    this.history.set(key, current + depth * depth);
  }

  clear() {
    this.history.clear();
  }
}

// ============================================================
// 全局实例
// ============================================================

const tt = new TranspositionTable(500000);
const killers = new KillerMoves();
const history = new HistoryTable();

// ============================================================
// 棋盘哈希函数
// ============================================================

function boardHash(board: Board): number {
  let hash = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (piece) {
        const pieceIndex = (piece.side === Side.Red ? 0 : 1) * 7 +
                          [PieceType.King, PieceType.Advisor, PieceType.Elephant,
                           PieceType.Horse, PieceType.Rook, PieceType.Cannon,
                           PieceType.Pawn].indexOf(piece.type);
        hash = (hash * 31 + r * 9 + c * 7 + pieceIndex * 13) & 0xFFFFFFFF;
      }
    }
  }
  return hash;
}

// ============================================================
// 评估函数
// ============================================================

function evaluatePiece(board: Board, row: number, col: number): number {
  const piece = board[row][col];
  if (!piece) return 0;

  const baseValue = PIECE_VALUES[piece.type];
  let posValue = 0;

  // 根据棋子颜色翻转位置表
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
    case PieceType.King:
      posValue = KING_TABLE[r][col];
      break;
    case PieceType.Advisor:
      posValue = ADVISOR_TABLE[r][col];
      break;
    case PieceType.Elephant:
      posValue = ELEPHANT_TABLE[r][col];
      break;
  }

  return piece.side === Side.Red ? baseValue + posValue : -(baseValue + posValue);
}

function evaluate(board: Board): number {
  let score = 0;

  // 基础物质价值 + 位置价值
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      score += evaluatePiece(board, r, c);
    }
  }

  // 机动性评估
  score += evaluateMobility(board) * 3;

  // 将/帅安全评估
  score += evaluateKingSafety(board);

  // 配合评估
  score += evaluateCoordination(board);

  return score;
}

// 评估机动性
function evaluateMobility(board: Board): number {
  let redMoves = 0;
  let blackMoves = 0;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (piece) {
        const moves = getLegalMoves(board, { row: r, col: c });
        if (piece.side === Side.Red) {
          redMoves += moves.length;
        } else {
          blackMoves += moves.length;
        }
      }
    }
  }

  return redMoves - blackMoves;
}

// 评估将/帅安全
function evaluateKingSafety(board: Board): number {
  let score = 0;

  // 检查是否被将军
  if (isInCheck(board, Side.Red)) {
    score -= 80;
  }
  if (isInCheck(board, Side.Black)) {
    score += 80;
  }

  return score;
}

// 评估配合（车炮配合、马炮配合等）
function evaluateCoordination(board: Board): number {
  let score = 0;

  // 车的价值在开局和中局更高
  let redRooks = 0, blackRooks = 0;
  let redCannons = 0, blackCannons = 0;
  let redHorses = 0, blackHorses = 0;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      if (piece.side === Side.Red) {
        if (piece.type === PieceType.Rook) redRooks++;
        if (piece.type === PieceType.Cannon) redCannons++;
        if (piece.type === PieceType.Horse) redHorses++;
      } else {
        if (piece.type === PieceType.Rook) blackRooks++;
        if (piece.type === PieceType.Cannon) blackCannons++;
        if (piece.type === PieceType.Horse) blackHorses++;
      }
    }
  }

  // 双车优势
  if (redRooks === 2) score += 50;
  if (blackRooks === 2) score -= 50;

  // 车炮配合
  if (redRooks > 0 && redCannons > 0) score += 30;
  if (blackRooks > 0 && blackCannons > 0) score -= 30;

  // 马炮配合
  if (redHorses > 0 && redCannons > 0) score += 20;
  if (blackHorses > 0 && blackCannons > 0) score -= 20;

  return score;
}

// ============================================================
// 走法生成与排序
// ============================================================

interface Move {
  from: Position;
  to: Position;
  score: number;
}

function getAllLegalMoves(board: Board, side: Side): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.side === side) {
        const from = { row: r, col: c };
        const legalMoves = getLegalMoves(board, from);
        for (const to of legalMoves) {
          moves.push({ from, to, score: 0 });
        }
      }
    }
  }
  return moves;
}

function sortMoves(board: Board, moves: Move[], depth: number, ttBestMove?: { from: Position; to: Position }): Move[] {
  for (const move of moves) {
    let score = 0;

    // 1. 置换表最佳走法优先
    if (ttBestMove &&
        move.from.row === ttBestMove.from.row && move.from.col === ttBestMove.from.col &&
        move.to.row === ttBestMove.to.row && move.to.col === ttBestMove.to.col) {
      score += 10000000;
    }

    // 2. 吃子走法（MVV-LVA）
    const captured = board[move.to.row][move.to.col];
    if (captured) {
      const attacker = board[move.from.row][move.from.col]!;
      score += PIECE_VALUES[captured.type] * 10 - PIECE_VALUES[attacker.type] + 1000000;
    }

    // 3. 杀手走法
    const killerMoves = killers.get(depth);
    for (const killer of killerMoves) {
      if (move.from.row === killer.from.row && move.from.col === killer.from.col &&
          move.to.row === killer.to.row && move.to.col === killer.to.col) {
        score += 500000;
        break;
      }
    }

    // 4. 历史启发
    score += history.get(move.from, move.to);

    // 5. 将军走法（轻量检测：目标位置是否攻击对方将/帅）
    const piece = board[move.from.row][move.from.col];
    if (piece) {
      // 在目标位置临时放置棋子检测是否将军
      const savedFrom = board[move.from.row][move.from.col];
      const savedTo = board[move.to.row][move.to.col];
      board[move.to.row][move.to.col] = piece;
      board[move.from.row][move.from.col] = null;
      if (positionAttacksKing(board, move.to)) {
        score += 100000;
      }
      // 恢复棋盘
      board[move.from.row][move.from.col] = savedFrom;
      board[move.to.row][move.to.col] = savedTo;
    }

    move.score = score;
  }

  // 按分数降序排序
  return moves.sort((a, b) => b.score - a.score);
}

// ============================================================
// 静态搜索（Quiescence Search）
// ============================================================

function quiescenceSearch(board: Board, alpha: number, beta: number, side: Side, depth: number = 0): number {
  const standPat = evaluate(board) * (side === Side.Red ? 1 : -1);

  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;

  // 限制静态搜索深度
  if (depth >= 4) return alpha;

  // 只搜索吃子走法
  const moves = getAllLegalMoves(board, side);
  const captureMoves = moves.filter(m => board[m.to.row][m.to.col] !== null);

  // 按MVV-LVA排序
  captureMoves.sort((a, b) => {
    const capturedA = board[a.to.row][a.to.col];
    const capturedB = board[b.to.row][b.to.col];
    const valueA = capturedA ? PIECE_VALUES[capturedA.type] : 0;
    const valueB = capturedB ? PIECE_VALUES[capturedB.type] : 0;
    return valueB - valueA;
  });

  for (const move of captureMoves) {
    const result = movePiece(board, move.from, move.to);
    const score = -quiescenceSearch(result.board, -beta, -alpha, side === Side.Red ? Side.Black : Side.Red, depth + 1);

    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }

  return alpha;
}

// ============================================================
// Alpha-Beta 搜索（带增强功能）
// ============================================================

function alphaBeta(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  side: Side,
  isRoot: boolean = false,
  allowNullMove: boolean = true,
): number {
  const hash = boardHash(board);
  const isMaximizing = side === Side.Red;
  const opponentSide = side === Side.Red ? Side.Black : Side.Red;

  // 检查置换表
  const ttEntry = tt.get(hash, depth, alpha, beta);
  if (ttEntry && !isRoot) {
    if (ttEntry.score !== undefined) {
      return ttEntry.score;
    }
  }

  // 终止条件
  if (depth <= 0) {
    return quiescenceSearch(board, alpha, beta, side);
  }

  // 检查是否将死
  if (isCheckmate(board, side)) {
    return isMaximizing ? -999999 + depth : 999999 - depth;
  }

  // 检查是否和棋
  if (isStalemate(board, side)) {
    return 0;
  }

  // 空着剪枝（Null Move Pruning）
  if (allowNullMove && depth >= 3 && !isInCheck(board, side)) {
    const R = 2; // 空着剪枝深度缩减
    const nullScore = -alphaBeta(board, depth - 1 - R, -beta, -beta + 1, opponentSide, false, false);
    if (nullScore >= beta) {
      return beta;
    }
  }

  // 获取并排序走法
  let moves = getAllLegalMoves(board, side);
  moves = sortMoves(board, moves, depth, ttEntry?.bestMove);

  let bestScore = isMaximizing ? -Infinity : Infinity;
  let bestMove: { from: Position; to: Position } | undefined;
  let ttFlag: 'exact' | 'alpha' | 'beta' = 'alpha';

  for (const move of moves) {
    const result = movePiece(board, move.from, move.to);

    // PVS（主要变例搜索）
    let score: number;
    if (bestMove) {
      // 先用零窗口搜索
      score = -alphaBeta(result.board, depth - 1, -alpha - 1, -alpha, opponentSide, false, true);
      if (score > alpha && score < beta) {
        // 如果零窗口搜索失败，重新搜索
        score = -alphaBeta(result.board, depth - 1, -beta, -alpha, opponentSide, false, true);
      }
    } else {
      score = -alphaBeta(result.board, depth - 1, -beta, -alpha, opponentSide, false, true);
    }

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = { from: move.from, to: move.to };
      }
      if (score > alpha) {
        alpha = score;
        ttFlag = 'exact';
      }
      if (alpha >= beta) {
        ttFlag = 'beta';
        // 更新杀手走法
        if (!board[move.to.row][move.to.col]) {
          killers.add(depth, { from: move.from, to: move.to });
          history.update(move.from, move.to, depth);
        }
        break;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = { from: move.from, to: move.to };
      }
      if (score < beta) {
        beta = score;
        ttFlag = 'exact';
      }
      if (beta <= alpha) {
        ttFlag = 'alpha';
        // 更新杀手走法
        if (!board[move.to.row][move.to.col]) {
          killers.add(depth, { from: move.from, to: move.to });
          history.update(move.from, move.to, depth);
        }
        break;
      }
    }
  }

  // 保存到置换表
  tt.set(hash, depth, bestScore, ttFlag, bestMove);

  return bestScore;
}

// ============================================================
// 迭代加深搜索
// ============================================================

export function getAIMove(board: Board, side: Side, maxDepth: number = 5): { from: Position; to: Position } | null {
  // 1. 首先检查开局库
  const openingMove = getOpeningMove(board, side);
  if (openingMove) {
    recordMove(openingMove.from, openingMove.to);
    return openingMove;
  }

  // 2. 清空辅助表
  killers.clear();
  history.clear();
  // 不清空置换表，保留之前搜索的结果

  // 3. 获取所有合法走法
  const moves = getAllLegalMoves(board, side);
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = -Infinity;

  // 4. 迭代加深
  for (let depth = 1; depth <= maxDepth; depth++) {
    let currentBestMove = moves[0];
    let currentBestScore = -Infinity;
    const alpha = -Infinity;
    const beta = Infinity;

    // 对每个走法进行搜索
    const sortedMoves = sortMoves(board, moves, depth, bestMove ? { from: bestMove.from, to: bestMove.to } : undefined);

    for (const move of sortedMoves) {
      const result = movePiece(board, move.from, move.to);
      const score = -alphaBeta(result.board, depth - 1, -beta, -alpha, side === Side.Red ? Side.Black : Side.Red, false, true);

      if (score > currentBestScore) {
        currentBestScore = score;
        currentBestMove = move;
      }
    }

    bestMove = currentBestMove;
    bestScore = currentBestScore;

    // 如果找到必胜走法，提前终止
    if (bestScore > 999900) break;
  }

  // 记录走法
  recordMove(bestMove.from, bestMove.to);

  return { from: bestMove.from, to: bestMove.to };
}

// 重置AI（新游戏时调用）
export function resetAI() {
  resetOpeningBook();
  tt.clear();
  killers.clear();
  history.clear();
}

// 导出评估函数供外部使用
export { evaluate };
