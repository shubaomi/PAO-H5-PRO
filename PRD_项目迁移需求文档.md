# PAO-H5 项目迁移 PRD（产品需求文档）

## 一、项目概述

### 1.1 项目名称
中国 PAO 训练系统（pao-h5）

### 1.2 项目定位
基于 PAO（Person-Action-Object）记忆法的 H5 记忆训练应用，主打**扑克牌记忆训练**功能。用户通过记忆随机洗牌的 52 张扑克牌序列，再按顺序复原，以提升大脑记忆能力。

### 1.3 技术栈
| 类型 | 技术 |
|------|------|
| 框架 | Vue 3（Composition API，`<script setup>`） |
| 构建工具 | Vite（当前使用 rolldown-vite 7.2.5） |
| 路由 | Vue Router 4（createWebHistory） |
| 状态管理 | Pinia |
| 语言 | JavaScript（ES Module） |
| 样式 | CSS（scoped + 全局 style.css） |

### 1.4 路由与部署
- **base path**：`/braintranning/`（开发和生产均使用）
- **路由模式**：createWebHistory

---

## 二、功能模块与页面结构

### 2.1 整体流程

```
首页 (Home)
    ↓ 点击「扑克牌记忆训练」
记忆页 (Memory)
    ↓ 记忆完成后点击「记好了」
复原页 (Reconstruct)
    ↓ 完成复原后点击「完成提交」
结果页 (Result)
    ↓ 「再次训练」→ 记忆页；「返回首页」→ 首页
```

### 2.2 页面清单

| 路径 | 名称 | 说明 |
|------|------|------|
| `/` | 首页 | 训练项目列表入口 |
| `/poker/memory` | 扑克牌记忆 | 分组展示 52 张牌，计时记忆 |
| `/poker/reconstruct` | 扑克牌复原 | 将卡牌按记忆顺序放入 52 个槽位 |
| `/poker/result` | 训练结果 | 对比原始序列与复原序列，展示正确率 |

---

## 三、详细功能需求

### 3.1 首页 (Home.vue)

**功能描述**：展示训练项目列表，点击进入对应训练。

**UI 结构**：
- 头部：标题「中国 PAO 训练系统」，副标题「提升你的记忆极限」
- 主内容：训练卡片列表

**训练卡片（当前仅扑克牌）**：
- 图标：♠️
- 标题：扑克牌记忆训练
- 描述：训练大脑对扑克牌序列的记忆能力
- 右侧箭头：→
- 点击跳转：`/poker/memory`

**交互**：
- 卡片 hover：轻微上移、阴影增强
- 点击卡片：路由跳转

**样式要点**：
- 背景：`#f5f7fa`
- 卡片：白底、圆角 12px、padding 20px、box-shadow
- 主色：`#2c3e50`、`#3498db`、`#7f8c8d`

---

### 3.2 扑克牌记忆页 (Memory.vue)

#### 3.2.1 流程与状态
1. **未开始**：显示「扑克牌记忆训练」「准备好后点击开始按钮」「开始记忆」按钮
2. **倒计时**：5 → 4 → 3 → 2 → 1，每秒递减，显示「即将开始...」
3. **记忆中**：展示当前组卡牌，支持翻页，显示计时器

#### 3.2.2 卡牌分组逻辑（重要业务规则）

- 使用 52 张扑克牌（4 花色 × 13 点数）
- 花色：`diamond`（♦）、`club`（♣）、`heart`（♥）、`spade`（♠）
- 点数：`A`、`2`～`10`、`J`、`Q`、`K`
- **分组规则**：
  - 用户可设置「每组显示张数」（1～52），默认 3
  - 若 `52 % 每组张数 === 1`（最后一组只剩 1 张），则：
    - 将该张牌合并到上一组
    - 总组数 = `Math.floor(52 / 每组张数)`（即减少一组）
  - 否则总组数 = `Math.ceil(52 / 每组张数)`
  - 示例：每组 3 张 → 17 组（前 16 组各 3 张，第 17 组 4 张）

#### 3.2.3 记忆页 UI 元素

- **Header**：左「🏠」回首页、中计时器（记忆中显示）、右「⚙️」打开设置
- **设置弹窗**：
  - 标题：训练设置
  - 输入：每组显示张数（number，min=1，max=52）
  - 按钮：确定（关闭弹窗）
- **记忆区域**：
  - 卡牌网格：flex-wrap、gap 15px、居中
  - 分页：显示「第 X / Y 组」
  - 底部按钮：「上一组」「下一组」或「记好了」（最后一组时）

#### 3.2.4 交互与逻辑
- 开始记忆：触发 5 秒倒计时，结束后洗牌、保存到 store、启动计时
- 上一组/下一组：切换 `currentPage`，禁用上一组在首页时
- 记好了：停止计时、保存记忆时间、保存 groupSize 到 store、跳转 `/poker/reconstruct`
- 设置：仅在未开始时可打开

#### 3.2.5 样式要点
- 计时器：monospace、`#e74c3c`、1.5rem
- 倒计时数字：8rem、`#3498db`
- primary 按钮：`#3498db`
- finish 按钮：`#2ecc71`
- modal：半透明遮罩 `rgba(0,0,0,0.5)`，内容区白底、圆角 12px、padding 30px

---

### 3.3 扑克牌复原页 (Reconstruct.vue)

#### 3.3.1 布局
- **Header**：左返回记忆页、中「卡牌区/复原区」导航 + 计时、右「已放 X/52」+ 帮助
- **主区域**：
  - 卡牌区（source-area）：4 花色行，每行按点数排序
  - 复原区（reconstruct-area）：52 个槽位，带序号

#### 3.3.2 操作说明（帮助弹窗）
1. 点击花色区卡牌：未选中槽位时，放入最大已放编号后的第一个空槽；若 52 已满则放入最小空槽
2. 点击复原区槽位：选中/取消选中
3. 选中后再点另一槽位：两槽互换（含空槽）
4. 选中后再点花色卡牌：用新牌替换选中槽位，旧牌归回对应花色行并排序
5. 「卡牌区/复原区」可快速滚动；问号可固定/关闭说明

#### 3.3.3 交互逻辑

- **放入卡牌**：未选中时，从花色区点卡牌 → 按规则放入下一个空槽
- **选中槽位**：点复原区槽位 → 选中（高亮）
- **互换**：选中槽位 A，再点槽位 B → A、B 内容互换
- **替换**：选中槽位，再点花色区卡牌 → 新牌放入选中槽，旧牌回到花色行并排序
- **开始复原**：点击「开始复原」→ 启动计时
- **完成提交**：若不足 52 张，弹出确认 `你当前只放了 X 张牌，确定要完成吗？`；确认后保存到 store，跳转结果页
- **重置**：点击「重置」→ 显示自定义确认弹窗「确定要重置当前复原进度吗？」→ 确定则清空复原、重置计时和状态

#### 3.3.4 重置确认弹窗（自定义，非原生 confirm）
- 遮罩 + 白底圆角内容区
- 文案：确定要重置当前复原进度吗？
- 取消 / 确定（红色，`#e74c3c`）

#### 3.3.5 样式要点
- 花色标签：♦️ ♣️ ♥️ ♠️
- 槽位：aspect-ratio 45/65，虚线边框，选中时 outline `#3498db`
- 说明弹窗：右上角固定，白底、蓝边框
- 响应式：小屏时 suit-label 缩小、nav-btn 缩小

---

### 3.4 训练结果页 (Result.vue)

#### 3.4.1 统计卡片
- 记忆时间（秒.毫秒）
- 复原时间（秒.毫秒）
- 正确数量（绿色 `#2ecc71`）
- 错误数量（红色 `#e74c3c`）
- 正确率（蓝色 `#3498db`，百分数一位小数）

#### 3.4.2 详细核对
- 两行横向滚动区域：「原始序列」「你的复原」
- 每行 52 个卡位，一一对应
- 正确：卡牌绿色边框、序号绿色
- 错误：卡牌 `isMismatched` 样式（上移、红阴影）
- **滚动联动**：任一行横向滚动时，另一行同步滚动

#### 3.4.3 底部按钮
- 返回首页：跳转 `/`
- 再次训练：跳转 `/poker/memory`

---

## 四、全局状态（Pinia Store）

### 4.1 poker store

| 字段 | 类型 | 说明 |
|------|------|------|
| shuffledCards | Array | 记忆页洗牌后的 52 张牌序列 |
| reconstructedCards | Array | 复原页提交的 52 张牌序列 |
| memoryTime | number | 记忆耗时（毫秒） |
| reconstructTime | number | 复原耗时（毫秒） |
| settings.groupSize | number | 每组卡牌张数，默认 3 |

**actions**：
- `setShuffledCards(cards)`
- `setReconstructedCards(cards)`
- `setMemoryTime(time)`
- `setReconstructTime(time)`
- `updateSettings(newSettings)`

---

## 五、公共组件

### 5.1 PokerCard.vue

**Props**：
| 名称 | 类型 | 默认 | 说明 |
|------|------|------|------|
| suit | String | - | 花色：diamond/club/heart/spade |
| rank | String/Number | - | 点数：A/2-10/J/Q/K |
| size | String | 'normal' | small / normal / large |
| isMismatched | Boolean | false | 错误高亮样式 |

**花色符号与颜色**：
- spade ♠ #000
- heart ♥ #e74c3c
- club ♣ #000
- diamond ♦ #e74c3c

**尺寸**：
- small：45×65px
- normal：80×110px
- large：120×170px

**布局**：左上角 rank + suit，中央大 suit 符号

### 5.2 HelloWorld.vue
项目中未使用，可视为 Vue 脚手架默认文件，迁移时可忽略或删除。

---

## 六、全局样式与主题

### 6.1 style.css（全局）
- 字体：Inter, system-ui, Avenir, Helvetica, Arial, sans-serif
- 背景：`#f5f7fa`
- 主色：`#2c3e50`
- 按钮继承字体

### 6.2 App.vue
- `#app`：100vw × 100vh，居中文字，无 margin/padding
- body：`#f5f7fa`
- `* { box-sizing: border-box }`

### 6.3 通用配色
| 用途 | 色值 |
|------|------|
| 主蓝 | #3498db |
| 成功/正确 | #2ecc71 |
| 危险/错误 | #e74c3c |
| 灰色文字 | #7f8c8d、#bdc3c7 |
| 背景 | #f5f7fa、#f0f3f6 |

---

## 七、HTML 与静态资源

### 7.1 index.html
- lang="en"
- charset UTF-8
- viewport: width=device-width, initial-scale=1.0
- favicon: `/pao.png`
- title: 中国 PAO 训练系统
- 入口：`<div id="app"></div>`，script `/src/main.js` type="module"

### 7.2 public 目录
- `pao.png`：网站图标（favicon）
- `vite.svg`：可选保留或替换

---

## 八、Vite 配置要点

- base: `/braintranning/`
- alias: `@` → `./src`
- outDir: `dist`
- assetsDir: `assets`
- minify: terser（drop_console: false）
- server.base: `/braintranning/`

---

## 九、迁移实施检查清单

1. **路由**：实现 4 个页面及 base path `/braintranning/`
2. **Store**：实现 poker store 及上述字段与 actions
3. **PokerCard**：实现 suit/rank/size/isMismatched 及三种尺寸
4. **记忆页**：倒计时、分组逻辑（含「最后一组 1 张合并」规则）、设置弹窗、计时
5. **复原页**：花色区、52 槽位、选中/互换/替换逻辑、完成确认、重置自定义弹窗、帮助说明
6. **结果页**：统计、双行对比、滚动联动
7. **样式**：按上述配色与布局还原，含响应式
8. **favicon**：使用 pao.png 或等价图标

---

## 十、附录：卡牌数据格式

单张卡牌对象：
```js
{
  suit: 'diamond' | 'club' | 'heart' | 'spade',
  rank: 'A' | '2' | '3' | ... | '10' | 'J' | 'Q' | 'K'
}
```

复原页花色区卡牌额外字段：
```js
{
  ...card,
  id: `${suit}-${rank}`  // 用于唯一标识
}
```
