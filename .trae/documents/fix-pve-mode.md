# 单机版（PvE/AI 对战）功能修复计划

## 一、现状审计

### 已实现的功能（代码层面）

| 功能 | 状态 | 位置 |
|------|------|------|
| 模式切换 (PvP ↔ PvE) | ✅ 已有 | App.tsx L17, L159-166 |
| 执红/执黑选择 | ✅ 已有 | App.tsx L18, L191-196 |
| AI 引擎 (MiniMax + Alpha-Beta) | ✅ 已有 | ai.ts 全文 |
| AI 回合自动触发 | ✅ 已有 | App.tsx L25-40 (useEffect) |
| 玩家回合锁定 (`isPlayerTurn`) | ✅ 已有 | App.tsx L23, L82 |
| PvE 悔棋（悔两步） | ✅ 已有 | App.tsx L107, L109 |

### 发现的 Bug 和缺陷

#### 🔴 Bug 1（关键）：useEffect 闭包陷阱 — 缺少依赖项

**文件**: [App.tsx](src/App.tsx#L25-L40)

```typescript
// 当前代码 (L25-40):
useEffect(() => {
    if (mode === 'pve' && currentSide !== playerSide && gameStatus === 'playing' && !aiThinking.current) {
      aiThinking.current = true;
      const timer = setTimeout(() => {
        const aiMove = getAIMove(board, currentSide, 3); // ⚠️ board 来自闭包
        if (aiMove) {
          handleMove(aiMove.from, aiMove.to);           // ⚠️ handleMove 来自闭包
        }
        aiThinking.current = false;
      }, 400);
      return () => { clearTimeout(timer); aiThinking.current = false; };
    }
  }, [currentSide, mode, playerSide, gameStatus]);
  // ⚠️ 缺少 board, handleMove 依赖！
```

**问题**: `board` 和 `handleMove` 在 effect 内使用但未列入依赖数组。虽然 React 在 `currentSide` 变化时会重新创建 effect 闭包（此时 board 是新的），但这违反 React Hooks 规则，且在某些边界情况下可能读到过期状态。

**修复方案**: 将 `board` 加入依赖，或用 `useRef` 存储 latestBoard。

#### 🔴 Bug 2（重要）：缺少"AI 思考中"视觉反馈

**现象**: 用户走完一步后，AI 需要计算 400ms~数秒（取决于局面复杂度），但界面**完全无任何提示**。用户不知道：
- 是否轮到 AI 了？
- AI 是否正在计算？
- 程序是否卡死了？

**修复方案**: 添加 AI 思考指示器（动画文字/转圈图标），显示在回合指示器区域。

#### 🟡 Bug 3（体验）：执黑（后手）时 AI 首步无明显提示

当用户选择"执黑"时：
1. 游戏重置，`currentSide = Red`
2. AI（红方）应立即走出第一步
3. 但用户看到的是红方回合 + 无动作 → 可能困惑

需要确保 AI 首步触发正确，并有视觉引导。

#### 🟢 改进建议（非 Bug）：AI 难度可调

当前 AI 固定深度为 3，无法调整难度。建议增加简单/普通/困难三档。

---

## 二、实施计划

### Step 1: 修复 useEffect 闭包问题
**文件**: `src/App.tsx`

- 将 `board` 加入 useEffect 依赖数组
- 用 `useRef` 存储 `handleMove` 的最新引用避免不必要的 effect 重跑
- 或改用 `useRef` 存储最新 board，在 effect 内读取 ref

**推荐方案**: 使用 `useRef` 存最新 board + 最新 handleMove：

```typescript
const boardRef = useRef(board);
boardRef.current = board;

const handleMoveRef = useRef(handleMove);
handleMoveRef.current = handleMove;

useEffect(() => {
  if (mode === 'pve' && currentSide !== playerSide && gameStatus === 'playing' && !aiThinking.current) {
    aiThinking.current = true;
    setAiThinking(true); // 新增状态
    const timer = setTimeout(() => {
      const aiMove = getAIMove(boardRef.current, currentSide, 3);
      if (aiMove) {
        handleMoveRef.current(aiMove.from, aiMove.to);
      }
      aiThinking.current = false;
      setAiThinking(false);
    }, 400);
    return () => { clearTimeout(timer); aiThinking.current = false; setAiThinking(false); };
  }
}, [currentSide, mode, playerSide, gameStatus]); // 依赖干净
```

### Step 2: 添加 AI 思考状态和 UI 指示器
**文件**: `src/App.tsx`

- 新增 `const [aiThinkingState, setAiThinkingState] = useState(false)`
- 在回合指示器区域显示 AI 思考动画

```tsx
<div className="turn-indicator">
  <div className={`turn-dot ${currentSide === Side.Red ? 'red' : 'black'}`} />
  <span className="turn-text">
    {aiThinkingState ? (
      <>🤔 AI 思考中...</>
    ) : (
      <>{currentSide === Side.Red ? '红方' : '黑方'}{inCheck ? ' (被将军!)' : ''}</>
    )}
  </span>
</div>
```

**文件**: `src/App.css`

- 添加 `.ai-thinking` 动画样式（呼吸灯效果）

### Step 3: 添加 AI 难度选择
**文件**: `src/App.tsx`

在 AI 对战弹窗中增加难度选项：
- 🟢 简单 (depth=1)
- 🟡 普通 (depth=3, 默认)
- 🔴 困难 (depth=4)

```tsx
{modeMenuOpen && mode === 'pve' && (
  <div className="side-popup">
    <div className="difficulty-header">选择难度</div>
    <button onClick={() => switchMode('pve', Side.Red, 1)}>🟢 简单</button>
    <button onClick={() => switchMode('pve', Side.Red, 3)}>🟡 普通</button>
    <button onClick={() => switchMode('pve', Side.Red, 4)}>🔴 困难</button>
    <div className="popup-divider" />
    <div className="difficulty-header">选择执子</div>
    <button onClick={() => switchMode('pve', Side.Red, 3)}>执红（先手）</button>
    <button onClick={() => switchMode('pve', Side.Black, 3)}>执黑（后手）</button>
  </div>
)}
```

同步修改 `switchMode` 接受 `depth` 参数并存储到 state。

### Step 4: TypeScript 编译验证
```bash
npx tsc --noEmit
```

### Step 5: Vite 构建验证
```bash
npx vite build
```

### Step 6: 浏览器测试（agent-browser）
- 打开 localhost:5173
- 点击"AI 对战"
- 选择执红/执黑 + 验证 AI 自动响应
- 验证"AI 思考中"动画显示
- 测试不同难度档位
- 测试悔棋功能
- 验证游戏结束判定

---

## 三、预期效果

修复完成后，单机版将具备：
- ✅ **正确的 AI 回合逻辑** — 无闭包陷阱，AI 始终基于最新棋盘决策
- ✅ **清晰的 AI 思考反馈** — 用户能看到"AI 思考中..."提示，不会困惑
- ✅ **可选的 AI 难度** — 简单/普通/困难三档适应不同水平玩家
- ✅ **完整的对局流程** — 选模式 → 选难度/执子 → 走棋 → AI 回合 → 胜负判定