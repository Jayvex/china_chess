# 中国象棋棋子位置对齐修复计划

## 问题诊断

### 🔴 核心Bug：SVG 棋盘线与 CSS Grid 棋子层存在 **半个格子的偏移**

通过对比截图和代码，发现棋子没有精确落在交叉点上：

| 层 | 尺寸 | 坐标系 |
|---|------|--------|
| **SVG 网格层** | `cellSize×8` × `cellSize×9` | 交点在 `(col×cellSize, row×cellSize)` |
| **CSS Grid 棋子层** | `9×cellSize` × `10×cellSize` | 棋子在格子中心 `(col×cellSize + cellSize/2, row×cellSize + cellSize/2)` |

**偏移量：每个棋子向右下偏移了 `cellSize/2`（约 30px）！**

这就是为什么截图中：
- 最右边一列的棋子（車、卒、兵）超出了棋盘边界
- 所有棋子看起来都"浮"在线条之间而不是落在线上

### 📋 数据模型验证（types.ts initBoard）

逐行对比标准中国象棋开局：

```
标准布局 vs 当前代码：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Row 0 (黑方底线):
  車 馬 象 士 将 士 象 馬 車    ✅ 全部正确

Row 1: (空)                       ✅ 正确

Row 2 (黑炮):
  空 砲 空 空 空 空 空 砲 空      ✅ 全部正确

Row 3 (黑卒):
  卒 空 卒 空 卒 空 卒 空 卒      ✅ 全部正确

Row 4: (空)                       ✅ 正确

Row 5: (楚河汉界)                  ✅ 正确

Row 6 (红兵):
  兵 空 兵 空 兵 空 兵 空 兵      ✅ 全部正确

Row 7 (红炮):
  空 炮 空 空 空 空 空 炮 空      ✅ 全部正确

Row 8: (空)                       ✅ 正确

Row 9 (红方底线):
  車 馬 相 仕 帅 仕 相 馬 車     ✅ 全部正确
```

**结论：数据模型（initBoard）完全正确，无需修改。问题出在视觉渲染层。**

---

## 修复方案

### 方案：用绝对定位替代 CSS Grid，使棋子中心与 SVG 交点精确重合

#### 修改文件：`src/components/GameBoard.tsx`

**核心改动：**
1. 移除 CSS Grid 布局
2. 改用绝对定位，每颗棋子的中心放在 `(col × cellSize, row × cellSize)`
3. 用 `transform: translate(-50%, -50%)` 使棋子居中于该坐标点
4. 外容器尺寸统一为 SVG 的 `cellSize×8 × cellSize×9`

**具体改动：**

```tsx
// 之前 (CSS Grid — 有偏移):
<div style={{ display: 'grid', gridTemplateColumns: `repeat(9, ${cellSize}px)`, ... }}>
  {Array.from({ length: 10 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => (
      <div style={{ width: cellSize, height: cellSize }}>
        <Piece ... />
      </div>
    ))
  )}
</div>

// 之后 (绝对定位 — 无偏移):
<div style={{
  position: 'relative',
  width: cellSize * 8,
  height: cellSize * 9,
}}>
  {board.flatMap((row, r) =>
    row.map((piece, c) =>
      piece ? (
        <div key={piece.id} style={{
          position: 'absolute',
          left: c * cellSize,
          top: r * cellSize,
          width: cellSize * 0.82,
          height: cellSize * 0.82,
          transform: 'translate(-50%, -50%)',
        }}>
          <Piece ... />
        </div>
      ) : null
    )
  )}
  {/* 点击热区层 */}
  {Array.from({ length: 10 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => (
      <div key={`hit-${row}-${col}`} style={{
        position: 'absolute',
        left: col * cellSize - cellSize / 2,
        top: row * cellSize - cellSize / 2,
        width: cellSize,
        height: cellSize,
        cursor: ...,
      }} onClick={() => onCellClick({row, col})} />
    ))
  )}
</div>
```

#### 同步修改：选中框和走法提示的位置计算

SVG 层中的选中框和走法提示已经使用 `col * cellSize` / `row * cellSize` 定位（正确），无需修改。

但需要确保点击热区覆盖整个格子区域，让用户可以点击。

---

## 实施步骤

### Step 1: 重写 GameBoard.tsx 的布局部分
- 文件: `src/components/GameBoard.tsx`
- 将第 178-217 行的 CSS Grid 替换为绝对定位布局
- 棋子层 + 点击热区层分开渲染
- 保持 SVG 层不变

### Step 2: 验证编译
- 运行 `npx tsc --noEmit` 确认无类型错误
- 运行 `npx vite build` 确认构建成功

### Step 3: 浏览器视觉验证
- 使用 agent-browser 打开页面截图
- 确认棋子精确落在交叉点上
- 确认边缘棋子不溢出
- 验证点击交互正常工作

## 预期效果

修复后：
- ✅ 所有棋子精确落在网格线交叉点上
- ✅ 边缘列（col=0 和 col=8）的棋子完整显示在棋盘内
- ✅ 选中高亮框精确包围目标棋子
- ✅ 走法提示点（绿点/红圈）精确落在目标交叉点
- ✅ 点击热区覆盖合理，交互流畅