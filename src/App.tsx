import { useState, useCallback, useEffect, useRef } from 'react';
import type { Board, Position, GameStatus, Move } from './engine/types';
import { Side, PieceType, initBoard } from './engine/types';
import { movePiece, isInCheck, isCheckmate, isStalemate, getLegalMoves } from './engine/moves';
import { getAIMove, resetAI } from './engine/ai';
import GameBoard from './components/GameBoard';
import './App.css';

export default function App() {
  const [board, setBoard] = useState<Board>(initBoard);
  const [currentSide, setCurrentSide] = useState<Side>(Side.Red);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [history, setHistory] = useState<Move[]>([]);
  const [capturedRed, setCapturedRed] = useState<string[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<string[]>([]);
  const [mode, setMode] = useState<'pvp' | 'pve'>('pvp');
  const [playerSide, setPlayerSide] = useState<Side>(Side.Red);
  const [aiDifficulty, setAiDifficulty] = useState(5);
  const [animateKey, setAnimateKey] = useState(0);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [aiThinkingState, setAiThinkingState] = useState(false);
  const aiThinking = useRef(false);
  const boardRef = useRef(board);
  boardRef.current = board;

  const isPlayerTurn = mode === 'pvp' || currentSide === playerSide;

  useEffect(() => {
    if (mode === 'pve' && currentSide !== playerSide && gameStatus === 'playing' && !aiThinking.current) {
      aiThinking.current = true;
      setAiThinkingState(true);
      const timer = setTimeout(() => {
        const aiMove = getAIMove(boardRef.current, currentSide, aiDifficulty);
        if (aiMove) {
          handleMove(aiMove.from, aiMove.to);
        }
        aiThinking.current = false;
        setAiThinkingState(false);
      }, 400);
      return () => {
        clearTimeout(timer);
        aiThinking.current = false;
        setAiThinkingState(false);
      };
    }
  }, [currentSide, mode, playerSide, gameStatus, aiDifficulty]);

  const handleMove = useCallback((from: Position, to: Position) => {
    setBoard(prev => {
      const piece = prev[from.row][from.col];
      if (!piece) return prev;

      const captured = prev[to.row][to.col];
      const result = movePiece(prev, from, to);
      const newBoard = result.board;

      const move: Move = { piece, from, to, captured: captured || undefined };

      setHistory(h => [...h, move]);

      if (captured) {
        const name = pieceTypeName(captured.type, captured.side);
        if (captured.side === Side.Red) {
          setCapturedRed(c => [...c, name]);
        } else {
          setCapturedBlack(c => [...c, name]);
        }
      }

      const oppSide = piece.side === Side.Red ? Side.Black : Side.Red;

      if (isCheckmate(newBoard, oppSide)) {
        setGameStatus(piece.side === Side.Red ? 'red_wins' : 'black_wins');
      } else if (isStalemate(newBoard, oppSide)) {
        setGameStatus('draw');
      }

      setCurrentSide(oppSide);
      setSelectedPos(null);
      setAnimateKey(k => k + 1);

      return newBoard;
    });
  }, []);

  const handleCellClick = useCallback((pos: Position) => {
    if (gameStatus !== 'playing') return;
    if (!isPlayerTurn) return;

    const clickedPiece = board[pos.row][pos.col];

    if (selectedPos) {
      if (clickedPiece && clickedPiece.side === currentSide) {
        setSelectedPos(pos);
        return;
      }
      const isLegal = getLegalMoves(board, selectedPos).some(m => m.row === pos.row && m.col === pos.col);
      if (isLegal) {
        handleMove(selectedPos, pos);
        return;
      }
      setSelectedPos(null);
      return;
    }

    if (clickedPiece && clickedPiece.side === currentSide) {
      setSelectedPos(pos);
    }
  }, [board, selectedPos, currentSide, gameStatus, isPlayerTurn, handleMove]);

  const undoMove = useCallback(() => {
    if (history.length === 0) return;
    if (mode === 'pve' && history.length < 2) return;

    const stepsToUndo = mode === 'pve' ? 2 : 1;

    setHistory(h => {
      const newHistory = [...h];
      let newBoard = initBoard();
      let redCaptured: string[] = [];
      let blackCaptured: string[] = [];

      for (let i = 0; i < newHistory.length - stepsToUndo; i++) {
        const m = newHistory[i];
        newBoard = movePiece(newBoard, m.from, m.to).board;
        if (m.captured) {
          const name = pieceTypeName(m.captured.type, m.captured.side);
          if (m.captured.side === Side.Red) {
            redCaptured.push(name);
          } else {
            blackCaptured.push(name);
          }
        }
      }

      setBoard(newBoard);
      setCapturedRed(redCaptured);
      setCapturedBlack(blackCaptured);
      setSelectedPos(null);
      setAnimateKey(k => k + 1);
      const newLen = newHistory.length - stepsToUndo;
      if (newLen > 0) {
        const lastMove = newHistory[newLen - 1];
        setCurrentSide(lastMove.piece.side === Side.Red ? Side.Black : Side.Red);
      } else {
        setCurrentSide(Side.Red);
      }

      return newHistory.slice(0, newHistory.length - stepsToUndo);
    });
  }, [history, mode]);

  const resetGame = useCallback(() => {
    setBoard(initBoard());
    setCurrentSide(Side.Red);
    setSelectedPos(null);
    setGameStatus('playing');
    setHistory([]);
    setCapturedRed([]);
    setCapturedBlack([]);
    setAnimateKey(k => k + 1);
    aiThinking.current = false;
    setAiThinkingState(false);
    resetAI(); // 重置开局库
  }, []);

  const switchMode = useCallback((newMode: 'pvp' | 'pve', side?: Side, depth?: number) => {
    setMode(newMode);
    if (newMode === 'pve') {
      setPlayerSide(side || Side.Red);
      setAiDifficulty(depth ?? 3);
    }
    setModeMenuOpen(false);
    resetGame();
  }, [resetGame]);

  const inCheck = isInCheck(board, currentSide);
  const statusText = getStatusText(gameStatus);

  return (
    <div className="app-container">
      <div className="game-header">
        <div className="title-section">
          <h1 className="game-title">中 国 象 棋</h1>
          <p className="game-subtitle">Chinese Chess</p>
        </div>
        <div className="mode-selector">
          <button
            className={`mode-btn ${mode === 'pvp' ? 'active' : ''}`}
            onClick={() => switchMode('pvp')}
          >
            👥 双人对战
          </button>
          <button
            className={`mode-btn ${mode === 'pve' ? 'active' : ''}`}
            onClick={() => { setMode('pve'); setModeMenuOpen(true); }}
          >
            🤖 AI 对战
          </button>
          {modeMenuOpen && mode === 'pve' && (
            <div className="side-popup">
              <div className="popup-header">难度</div>
              <button className={`diff-btn ${aiDifficulty === 3 ? 'active' : ''}`} onClick={() => setAiDifficulty(3)}>🟢 简单</button>
              <button className={`diff-btn ${aiDifficulty === 5 ? 'active' : ''}`} onClick={() => setAiDifficulty(5)}>🟡 普通</button>
              <button className={`diff-btn ${aiDifficulty === 7 ? 'active' : ''}`} onClick={() => setAiDifficulty(7)}>🔴 困难</button>
              <div className="popup-divider" />
              <div className="popup-header">执子</div>
              <button onClick={() => switchMode('pve', Side.Red, aiDifficulty)}>执红（先手）</button>
              <button onClick={() => switchMode('pve', Side.Black, aiDifficulty)}>执黑（后手）</button>
            </div>
          )}
        </div>
      </div>

      <div className="game-body">
        <div className="sidebar sidebar-left">
          <div className="captured-section">
            <h3>红方失子</h3>
            <div className="captured-pieces">
              {capturedRed.map((name, i) => (
                <span key={i} className="captured-piece red">{name}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="board-wrapper">
          <div className="turn-indicator">
            <div className={`turn-dot ${currentSide === Side.Red ? 'red' : 'black'} ${aiThinkingState ? 'ai-thinking' : ''}`} />
            <span className="turn-text">
              {aiThinkingState ? (
                <>🤔 AI 思考中...</>
              ) : (
                <>{currentSide === Side.Red ? '红方' : '黑方'}{inCheck ? ' (被将军!)' : ''}</>
              )}
            </span>
          </div>

          <GameBoard
            board={board}
            currentSide={currentSide}
            selectedPos={selectedPos}
            onCellClick={handleCellClick}
            animateKey={animateKey}
          />

          {gameStatus !== 'playing' && (
            <div className="game-over-overlay">
              <div className="game-over-modal">
                <h2>{statusText}</h2>
                <p className="game-over-sub">
                  {gameStatus === 'red_wins' ? '红方获胜！' :
                   gameStatus === 'black_wins' ? '黑方获胜！' : '平局！'}
                </p>
                <button className="btn-new-game" onClick={resetGame}>
                  再来一局
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar sidebar-right">
          <div className="captured-section">
            <h3>黑方失子</h3>
            <div className="captured-pieces">
              {capturedBlack.map((name, i) => (
                <span key={i} className="captured-piece black">{name}</span>
              ))}
            </div>
          </div>

          <div className="controls-section">
            <button className="ctrl-btn" onClick={undoMove} disabled={history.length === 0}>
              ↩ {mode === 'pve' ? '悔两步' : '悔棋'}
            </button>
            <button className="ctrl-btn danger" onClick={resetGame}>
              ⟳ 新局
            </button>
          </div>

          <div className="history-section">
            <h3>走棋记录</h3>
            <div className="move-history">
              {history.map((move, i) => (
                <div key={i} className="move-entry">
                  <span className="move-num">{i + 1}.</span>
                  <span className={`move-side ${move.piece.side}`}>
                    {move.piece.side === Side.Red ? '红' : '黑'}
                  </span>
                  <span className="move-name">
                    {pieceTypeName(move.piece.type, move.piece.side)}
                  </span>
                  <span className="move-pos">
                    {posStr(move.from)}→{posStr(move.to)}
                  </span>
                  {move.captured && (
                    <span className="move-capture">
                      吃{move.captured.side === Side.Red ? '红' : '黑'}{pieceTypeName(move.captured.type, move.captured.side)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function pieceTypeName(type: PieceType, side: Side): string {
  const names: Record<string, Record<string, string>> = {
    red: { king: '帅', advisor: '仕', elephant: '相', horse: '馬', rook: '車', cannon: '炮', pawn: '兵' },
    black: { king: '将', advisor: '士', elephant: '象', horse: '馬', rook: '車', cannon: '砲', pawn: '卒' },
  };
  return names[side]?.[type] ?? type;
}

function posStr(pos: Position): string {
  const colNames2 = ['1','2','3','4','5','6','7','8','9'];
  return `${colNames2[pos.col]}${9 - pos.row}`;
}

function getStatusText(status: GameStatus): string {
  switch (status) {
    case 'red_wins': return '红方胜';
    case 'black_wins': return '黑方胜';
    case 'draw': return '平局';
    default: return '对弈中';
  }
}