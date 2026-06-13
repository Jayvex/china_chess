import type { Board, Position } from './types';
import { Side, PieceType } from './types';
import { getLegalMoves } from './moves';

/**
 * 中国象棋开局库
 * 包含大量专业棋谱的开局走法
 */

interface OpeningMove {
  from: Position;
  to: Position;
  name: string;
}

interface OpeningLine {
  moves: OpeningMove[];
  weight: number;
  name: string;
}

// 走法历史记录
let moveHistory: { from: Position; to: Position }[] = [];

// 大量开局库数据
const OPENING_LINES: OpeningLine[] = [
  // ============================================
  // 中炮局系列（最主流的开局）
  // ============================================

  // 中炮对屏风马
  { name: '中炮对屏风马', weight: 10, moves: [
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' }
  ]},
  { name: '中炮对屏风马', weight: 9, moves: [
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' }
  ]},
  { name: '中炮对屏风马', weight: 9, moves: [
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
    { from: { row: 9, col: 0 }, to: { row: 9, col: 1 }, name: '车一平二' }
  ]},
  { name: '中炮对屏风马', weight: 8, moves: [
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
    { from: { row: 9, col: 0 }, to: { row: 9, col: 1 }, name: '车一平二' },
    { from: { row: 9, col: 7 }, to: { row: 7, col: 6 }, name: '马八进七' }
  ]},
  { name: '中炮对屏风马', weight: 7, moves: [
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
    { from: { row: 9, col: 0 }, to: { row: 9, col: 1 }, name: '车一平二' },
    { from: { row: 9, col: 7 }, to: { row: 7, col: 6 }, name: '马八进七' },
    { from: { row: 7, col: 1 }, to: { row: 7, col: 6 }, name: '炮八平七' }
  ]},
  { name: '中炮对屏风马', weight: 7, moves: [
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
    { from: { row: 9, col: 0 }, to: { row: 9, col: 1 }, name: '车一平二' },
    { from: { row: 9, col: 7 }, to: { row: 7, col: 6 }, name: '马八进七' },
    { from: { row: 7, col: 7 }, to: { row: 6, col: 7 }, name: '车二进六' }
  ]},

  // 中炮对反宫马
  { name: '中炮对反宫马', weight: 8, moves: [
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' },
    { from: { row: 7, col: 1 }, to: { row: 7, col: 4 }, name: '炮八平五' }
  ]},
  { name: '中炮对反宫马', weight: 7, moves: [
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
    { from: { row: 9, col: 7 }, to: { row: 7, col: 6 }, name: '马八进九' }
  ]},

  // 中炮直车
  { name: '中炮直车', weight: 8, moves: [
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' },
    { from: { row: 9, col: 0 }, to: { row: 9, col: 1 }, name: '车一平二' }
  ]},
  { name: '中炮直车', weight: 7, moves: [
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' },
    { from: { row: 9, col: 0 }, to: { row: 9, col: 1 }, name: '车一平二' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' }
  ]},

  // 中炮横车
  { name: '中炮横车', weight: 7, moves: [
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' },
    { from: { row: 9, col: 0 }, to: { row: 8, col: 0 }, name: '车一进一' }
  ]},
  { name: '中炮横车', weight: 6, moves: [
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' },
    { from: { row: 9, col: 0 }, to: { row: 8, col: 0 }, name: '车一进一' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' }
  ]},

  // 中炮巡河车
  { name: '中炮巡河车', weight: 7, moves: [
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' },
    { from: { row: 9, col: 0 }, to: { row: 9, col: 1 }, name: '车一平二' },
    { from: { row: 9, col: 1 }, to: { row: 8, col: 1 }, name: '车二进四' }
  ]},

  // 中炮过河车
  { name: '中炮过河车', weight: 8, moves: [
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
    { from: { row: 9, col: 0 }, to: { row: 9, col: 1 }, name: '车一平二' },
    { from: { row: 9, col: 1 }, to: { row: 6, col: 1 }, name: '车二进六' }
  ]},

  // 中炮盘头马
  { name: '中炮盘头马', weight: 8, moves: [
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
    { from: { row: 6, col: 4 }, to: { row: 5, col: 4 }, name: '兵五进一' }
  ]},

  // ============================================
  // 飞相局系列（稳健型开局）
  // ============================================

  { name: '飞相局', weight: 8, moves: [
    { from: { row: 9, col: 2 }, to: { row: 7, col: 0 }, name: '相三进一' }
  ]},
  { name: '飞相局', weight: 7, moves: [
    { from: { row: 9, col: 2 }, to: { row: 7, col: 0 }, name: '相三进一' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' }
  ]},
  { name: '飞相局', weight: 7, moves: [
    { from: { row: 9, col: 2 }, to: { row: 7, col: 0 }, name: '相三进一' },
    { from: { row: 9, col: 7 }, to: { row: 7, col: 6 }, name: '马八进七' }
  ]},
  { name: '飞相局', weight: 6, moves: [
    { from: { row: 9, col: 2 }, to: { row: 7, col: 0 }, name: '相三进一' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
    { from: { row: 9, col: 7 }, to: { row: 7, col: 6 }, name: '马八进七' }
  ]},
  { name: '飞相局', weight: 6, moves: [
    { from: { row: 9, col: 2 }, to: { row: 7, col: 0 }, name: '相三进一' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
    { from: { row: 9, col: 3 }, to: { row: 8, col: 3 }, name: '仕四进五' }
  ]},

  // 飞相对左中炮
  { name: '飞相对左中炮', weight: 7, moves: [
    { from: { row: 9, col: 2 }, to: { row: 7, col: 0 }, name: '相三进一' },
    { from: { row: 9, col: 3 }, to: { row: 8, col: 3 }, name: '仕四进五' }
  ]},

  // 飞相三步虎
  { name: '飞相三步虎', weight: 7, moves: [
    { from: { row: 9, col: 2 }, to: { row: 7, col: 0 }, name: '相三进一' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
    { from: { row: 7, col: 7 }, to: { row: 7, col: 1 }, name: '炮二平六' }
  ]},

  // 飞相转角马
  { name: '飞相转角马', weight: 6, moves: [
    { from: { row: 9, col: 2 }, to: { row: 7, col: 0 }, name: '相三进一' },
    { from: { row: 9, col: 1 }, to: { row: 8, col: 0 }, name: '马二进四' }
  ]},

  // ============================================
  // 仙人指路系列（灵活型开局）
  // ============================================

  { name: '仙人指路', weight: 8, moves: [
    { from: { row: 6, col: 6 }, to: { row: 5, col: 6 }, name: '兵七进一' }
  ]},
  { name: '仙人指路对卒底炮', weight: 8, moves: [
    { from: { row: 6, col: 6 }, to: { row: 5, col: 6 }, name: '兵七进一' },
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' }
  ]},
  { name: '仙人指路对卒底炮', weight: 7, moves: [
    { from: { row: 6, col: 6 }, to: { row: 5, col: 6 }, name: '兵七进一' },
    { from: { row: 9, col: 7 }, to: { row: 7, col: 6 }, name: '马八进七' }
  ]},
  { name: '仙人指路转中炮', weight: 8, moves: [
    { from: { row: 6, col: 6 }, to: { row: 5, col: 6 }, name: '兵七进一' },
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' }
  ]},
  { name: '仙人指路对飞象', weight: 7, moves: [
    { from: { row: 6, col: 6 }, to: { row: 5, col: 6 }, name: '兵七进一' },
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
    { from: { row: 9, col: 0 }, to: { row: 9, col: 1 }, name: '车一平二' }
  ]},

  // 仙人指路对还中炮
  { name: '仙人指路对还中炮', weight: 7, moves: [
    { from: { row: 6, col: 6 }, to: { row: 5, col: 6 }, name: '兵七进一' },
    { from: { row: 9, col: 7 }, to: { row: 7, col: 6 }, name: '马八进七' },
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' }
  ]},

  // 仙人指路三步虎
  { name: '仙人指路三步虎', weight: 7, moves: [
    { from: { row: 6, col: 6 }, to: { row: 5, col: 6 }, name: '兵七进一' },
    { from: { row: 9, col: 7 }, to: { row: 7, col: 6 }, name: '马八进七' },
    { from: { row: 7, col: 1 }, to: { row: 7, col: 6 }, name: '炮八平七' }
  ]},

  // ============================================
  // 起马局系列（均衡型开局）
  // ============================================

  { name: '起马局', weight: 7, moves: [
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' }
  ]},
  { name: '起马局', weight: 7, moves: [
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
    { from: { row: 7, col: 7 }, to: { row: 4, col: 4 }, name: '炮二平五' }
  ]},
  { name: '起马局', weight: 6, moves: [
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
    { from: { row: 9, col: 7 }, to: { row: 7, col: 6 }, name: '马八进七' }
  ]},
  { name: '起马对挺卒', weight: 7, moves: [
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
    { from: { row: 6, col: 6 }, to: { row: 5, col: 6 }, name: '兵七进一' }
  ]},
  { name: '起马三步虎', weight: 7, moves: [
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
    { from: { row: 7, col: 7 }, to: { row: 7, col: 1 }, name: '炮二平六' },
    { from: { row: 9, col: 0 }, to: { row: 9, col: 1 }, name: '车一平二' }
  ]},

  // ============================================
  // 士角炮系列
  // ============================================

  { name: '士角炮', weight: 7, moves: [
    { from: { row: 7, col: 1 }, to: { row: 7, col: 4 }, name: '炮八平五' }
  ]},
  { name: '士角炮', weight: 6, moves: [
    { from: { row: 7, col: 1 }, to: { row: 7, col: 4 }, name: '炮八平五' },
    { from: { row: 9, col: 7 }, to: { row: 7, col: 6 }, name: '马八进七' }
  ]},
  { name: '士角炮', weight: 6, moves: [
    { from: { row: 7, col: 1 }, to: { row: 7, col: 4 }, name: '炮八平五' },
    { from: { row: 9, col: 7 }, to: { row: 7, col: 6 }, name: '马八进七' },
    { from: { row: 9, col: 8 }, to: { row: 9, col: 7 }, name: '车九平八' }
  ]},

  // ============================================
  // 过宫炮系列
  // ============================================

  { name: '过宫炮', weight: 7, moves: [
    { from: { row: 7, col: 7 }, to: { row: 7, col: 1 }, name: '炮二平六' }
  ]},
  { name: '过宫炮', weight: 6, moves: [
    { from: { row: 7, col: 7 }, to: { row: 7, col: 1 }, name: '炮二平六' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' }
  ]},
  { name: '过宫炮', weight: 6, moves: [
    { from: { row: 7, col: 7 }, to: { row: 7, col: 1 }, name: '炮二平六' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
    { from: { row: 9, col: 0 }, to: { row: 9, col: 1 }, name: '车一平二' }
  ]},

  // ============================================
  // 仕角炮系列
  // ============================================

  { name: '仕角炮', weight: 6, moves: [
    { from: { row: 7, col: 7 }, to: { row: 8, col: 6 }, name: '炮二平九' }
  ]},
  { name: '仕角炮', weight: 5, moves: [
    { from: { row: 7, col: 7 }, to: { row: 8, col: 6 }, name: '炮二平九' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' }
  ]},

  // ============================================
  // 巡河炮系列
  // ============================================

  { name: '巡河炮', weight: 6, moves: [
    { from: { row: 7, col: 7 }, to: { row: 6, col: 7 }, name: '炮二进二' }
  ]},
  { name: '巡河炮', weight: 5, moves: [
    { from: { row: 7, col: 7 }, to: { row: 6, col: 7 }, name: '炮二进二' },
    { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' }
  ]},

  // ============================================
  // 边马局系列
  // ============================================

  { name: '边马局', weight: 5, moves: [
    { from: { row: 9, col: 1 }, to: { row: 7, col: 0 }, name: '马二进一' }
  ]},

  // ============================================
  // 边兵局系列
  // ============================================

  { name: '边兵局', weight: 5, moves: [
    { from: { row: 6, col: 8 }, to: { row: 5, col: 8 }, name: '兵九进一' }
  ]},

  // ============================================
  // 三兵系列
  // ============================================

  { name: '三兵', weight: 6, moves: [
    { from: { row: 6, col: 6 }, to: { row: 5, col: 6 }, name: '兵七进一' },
    { from: { row: 6, col: 4 }, to: { row: 5, col: 4 }, name: '兵五进一' }
  ]},

  // ============================================
  // 双兵系列
  // ============================================

  { name: '双兵', weight: 6, moves: [
    { from: { row: 6, col: 6 }, to: { row: 5, col: 6 }, name: '兵七进一' },
    { from: { row: 6, col: 2 }, to: { row: 5, col: 2 }, name: '兵三进一' }
  ]},

  // ============================================
  // 黑方常见应法（当AI执黑时）
  // ============================================

  // 屏风马应中炮
  { name: '屏风马', weight: 10, moves: [
    { from: { row: 0, col: 1 }, to: { row: 2, col: 2 }, name: '马2进3' }
  ]},
  { name: '屏风马', weight: 9, moves: [
    { from: { row: 0, col: 1 }, to: { row: 2, col: 2 }, name: '马2进3' },
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' }
  ]},
  { name: '屏风马', weight: 8, moves: [
    { from: { row: 0, col: 1 }, to: { row: 2, col: 2 }, name: '马2进3' },
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' },
    { from: { row: 3, col: 6 }, to: { row: 4, col: 6 }, name: '卒7进1' }
  ]},

  // 反宫马应中炮
  { name: '反宫马', weight: 8, moves: [
    { from: { row: 0, col: 1 }, to: { row: 2, col: 2 }, name: '马2进3' },
    { from: { row: 2, col: 7 }, to: { row: 2, col: 4 }, name: '炮8平5' }
  ]},
  { name: '反宫马', weight: 7, moves: [
    { from: { row: 0, col: 1 }, to: { row: 2, col: 2 }, name: '马2进3' },
    { from: { row: 2, col: 7 }, to: { row: 2, col: 4 }, name: '炮8平5' },
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' }
  ]},

  // 单提马应中炮
  { name: '单提马', weight: 7, moves: [
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' }
  ]},
  { name: '单提马', weight: 6, moves: [
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' },
    { from: { row: 0, col: 1 }, to: { row: 2, col: 2 }, name: '马2进3' }
  ]},

  // 顺手炮应中炮
  { name: '顺手炮', weight: 9, moves: [
    { from: { row: 2, col: 7 }, to: { row: 4, col: 4 }, name: '炮8平5' }
  ]},
  { name: '顺手炮', weight: 8, moves: [
    { from: { row: 2, col: 7 }, to: { row: 4, col: 4 }, name: '炮8平5' },
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' }
  ]},
  { name: '顺手炮', weight: 7, moves: [
    { from: { row: 2, col: 7 }, to: { row: 4, col: 4 }, name: '炮8平5' },
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' },
    { from: { row: 0, col: 8 }, to: { row: 0, col: 7 }, name: '车9平8' }
  ]},

  // 列手炮应中炮
  { name: '列手炮', weight: 8, moves: [
    { from: { row: 2, col: 1 }, to: { row: 4, col: 4 }, name: '炮2平5' }
  ]},
  { name: '列手炮', weight: 7, moves: [
    { from: { row: 2, col: 1 }, to: { row: 4, col: 4 }, name: '炮2平5' },
    { from: { row: 0, col: 1 }, to: { row: 2, col: 2 }, name: '马2进3' }
  ]},

  // 卒底炮应仙人指路（炮2平3：黑炮从(2,1)平移到(2,2)）
  { name: '卒底炮', weight: 9, moves: [
    { from: { row: 2, col: 1 }, to: { row: 2, col: 2 }, name: '炮2平3' }
  ]},
  { name: '卒底炮', weight: 8, moves: [
    { from: { row: 2, col: 1 }, to: { row: 2, col: 2 }, name: '炮2平3' },
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' }
  ]},

  // 飞象应仙人指路
  { name: '飞象应仙人指路', weight: 7, moves: [
    { from: { row: 0, col: 2 }, to: { row: 2, col: 4 }, name: '象3进5' }
  ]},

  // 挺卒应起马
  { name: '挺卒应起马', weight: 8, moves: [
    { from: { row: 3, col: 6 }, to: { row: 4, col: 6 }, name: '卒7进1' }
  ]},
  { name: '挺卒应起马', weight: 7, moves: [
    { from: { row: 3, col: 6 }, to: { row: 4, col: 6 }, name: '卒7进1' },
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' }
  ]},

  // 飞象应飞相
  { name: '飞象应飞相', weight: 7, moves: [
    { from: { row: 0, col: 2 }, to: { row: 2, col: 4 }, name: '象3进5' }
  ]},
  { name: '飞象应飞相', weight: 6, moves: [
    { from: { row: 0, col: 2 }, to: { row: 2, col: 4 }, name: '象3进5' },
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' }
  ]},

  // 进马应飞相
  { name: '进马应飞相', weight: 8, moves: [
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' }
  ]},
  { name: '进马应飞相', weight: 7, moves: [
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' },
    { from: { row: 0, col: 1 }, to: { row: 2, col: 2 }, name: '马2进3' }
  ]},

  // 中炮应飞相
  { name: '中炮应飞相', weight: 8, moves: [
    { from: { row: 2, col: 7 }, to: { row: 4, col: 4 }, name: '炮8平5' }
  ]},
  { name: '中炮应飞相', weight: 7, moves: [
    { from: { row: 2, col: 7 }, to: { row: 4, col: 4 }, name: '炮8平5' },
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' }
  ]},

  // 过宫炮应飞相
  { name: '过宫炮应飞相', weight: 6, moves: [
    { from: { row: 2, col: 1 }, to: { row: 2, col: 7 }, name: '炮2平8' }
  ]},

  // 士角炮应飞相
  { name: '士角炮应飞相', weight: 6, moves: [
    { from: { row: 2, col: 7 }, to: { row: 2, col: 4 }, name: '炮8平5' }
  ]},

  // 挺卒应仙人指路
  { name: '挺卒应仙人指路', weight: 7, moves: [
    { from: { row: 3, col: 6 }, to: { row: 4, col: 6 }, name: '卒7进1' }
  ]},

  // 跳马应仙人指路
  { name: '跳马应仙人指路', weight: 7, moves: [
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' }
  ]},

  // 中炮应起马
  { name: '中炮应起马', weight: 7, moves: [
    { from: { row: 2, col: 7 }, to: { row: 4, col: 4 }, name: '炮8平5' }
  ]},

  // 跳马应起马
  { name: '跳马应起马', weight: 7, moves: [
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' }
  ]}
];

// 匹配开局走法
function findOpeningMove(board: Board, side: Side): OpeningMove | null {
  // 只在开局阶段使用（前8步）
  if (moveHistory.length >= 8) return null;

  const matchingMoves: { move: OpeningMove; weight: number }[] = [];

  for (const line of OPENING_LINES) {
    // 检查这个开局线路的长度是否匹配当前局面
    if (line.moves.length !== moveHistory.length + 1) continue;

    // 检查之前的走法是否匹配
    let match = true;
    for (let i = 0; i < moveHistory.length; i++) {
      const historyMove = moveHistory[i];
      const lineMove = line.moves[i];
      if (historyMove.from.row !== lineMove.from.row ||
          historyMove.from.col !== lineMove.from.col ||
          historyMove.to.row !== lineMove.to.row ||
          historyMove.to.col !== lineMove.to.col) {
        match = false;
        break;
      }
    }

    if (match) {
      const nextMove = line.moves[moveHistory.length];
      // 验证走法是否合法（棋子存在、属于当前方、且走法符合规则）
      const piece = board[nextMove.from.row][nextMove.from.col];
      if (piece && piece.side === side) {
        const legalMoves = getLegalMoves(board, nextMove.from);
        const isLegal = legalMoves.some(m => m.row === nextMove.to.row && m.col === nextMove.to.col);
        if (isLegal) {
          matchingMoves.push({ move: nextMove, weight: line.weight });
        }
      }
    }
  }

  if (matchingMoves.length === 0) return null;

  // 按权重随机选择
  const totalWeight = matchingMoves.reduce((sum, m) => sum + m.weight, 0);
  let random = Math.random() * totalWeight;

  for (const { move, weight } of matchingMoves) {
    random -= weight;
    if (random <= 0) {
      return move;
    }
  }

  return matchingMoves[0].move;
}

// 记录走法
export function recordMove(from: Position, to: Position) {
  moveHistory.push({ from, to });
}

// 重置开局库
export function resetOpeningBook() {
  moveHistory = [];
}

// 获取开局走法
export function getOpeningMove(board: Board, side: Side): { from: Position; to: Position } | null {
  const move = findOpeningMove(board, side);
  if (move) {
    return { from: move.from, to: move.to };
  }
  return null;
}

// 获取开局名称
export function getOpeningName(): string | null {
  if (moveHistory.length === 0) return null;

  for (const line of OPENING_LINES) {
    if (line.moves.length < moveHistory.length) continue;

    let match = true;
    for (let i = 0; i < moveHistory.length; i++) {
      const historyMove = moveHistory[i];
      const lineMove = line.moves[i];
      if (historyMove.from.row !== lineMove.from.row ||
          historyMove.from.col !== lineMove.from.col ||
          historyMove.to.row !== lineMove.to.row ||
          historyMove.to.col !== lineMove.to.col) {
        match = false;
        break;
      }
    }

    if (match) {
      return line.name;
    }
  }

  return null;
}
