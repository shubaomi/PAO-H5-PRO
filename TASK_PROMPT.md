# 马拉松扑克训练和马拉松数字训练功能开发任务

## 一、项目背景与现有架构

### 1.1 项目概述
这是一个基于 **Vue 3 + Vite + Vue Router 4 + Pinia** 的 H5 记忆训练应用，采用 **Composition API** 和 **`<script setup>`** 语法。

### 1.2 现有功能
- **首页 (Home.vue)**: 展示训练项目列表入口
- **扑克牌记忆训练**: 记忆 52 张牌（1 副），分组展示，计时记忆
- **快速数字训练**: 记忆 40 位数字，限时 5 分钟

### 1.3 技术规范
- 语言：JavaScript ES2022+ (ES Modules)
- 组件：单文件 `.vue`，使用 `<script setup>`
- 样式：Scoped CSS，移动优先响应式设计
- 状态管理：Pinia，使用 Options API 风格 (state + actions)
- 路由：Vue Router 4，createWebHistory，base: '/braintranning/'
- 命名规范：
  - 组件：PascalCase (如 `MarathonPokerMemory.vue`)
  - 变量/函数：camelCase (如 `deckCount`, `startTraining()`)
  - CSS 类：kebab-case (如 `.marathon-container`)
  - Store：use + PascalCase + Store (如 `useMarathonPokerStore`)
- 导入顺序：1) Vue 生态 2) 内部 stores 3) 内部组件 4) 工具函数

### 1.4 现有代码参考
**首页卡片样式 (Home.vue)**:
- 卡片背景：白色，圆角 12px，阴影 `0 4px 15px rgba(0,0,0,0.05)`
- 悬停效果：`transform: translateY(-2px)`，阴影增强
- 布局：Flexbox，左侧图标、中间标题+描述、右侧箭头
- 字体：标题 `#2c3e50`，描述 `#7f8c8d`

**Pinia Store 模式 (store/index.js)**:
```javascript
export const usePokerStore = defineStore('poker', {
  state: () => ({
    shuffledCards: [],
    reconstructedCards: [],
    memoryTime: 0,
    settings: { groupSize: 3 }
  }),
  actions: {
    setShuffledCards(cards) { this.shuffledCards = cards }
  }
})
```

**Vue 组件结构模式**:
```vue
<script setup>
// 1. Imports
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// 2. State
const count = ref(0)

// 3. Methods
const handleClick = () => { }
</script>

<template>
  <div class="container">...</div>
</template>

<style scoped>
/* 移动优先，使用 flexbox */
</style>
```

---

## 二、新功能需求：马拉松训练模式

### 2.1 功能定义
**马拉松扑克训练**: 记忆多副扑克牌（支持 2-10 副，即 104-520 张牌），按顺序复原。
**马拉松数字训练**: 记忆大量数字序列（支持 100-1000 位数字），按顺序复原。

### 2.2 与现有模式的区别
| 特性 | 现有扑克/数字训练 | 马拉松训练 |
|------|------------------|-----------|
| 数量 | 固定（52 张 / 40 位） | 可配置（2-10 副 / 100-1000 位） |
| 显示方式 | 一次性展示 | 分页/分组展示 |
| 计时方式 | 倒计时 | 正计时（记录总用时） |
| 设置复杂度 | 简单 | 需要配置数量参数 |

---

## 三、详细开发任务

### 任务 1: 在首页添加两个新的训练入口

**文件**: `src/views/Home.vue`

**修改内容**:
1. 在 `trainingOptions` 数组中添加两个新选项：
   - 马拉松扑克训练: 图标 '🃏', 路径 '/marathon/poker/settings'
   - 马拉松数字训练: 图标 '🔢', 路径 '/marathon/number/settings'

**样式要求**: 与现有两个训练卡片完全一致，使用相同的 CSS 类。

---

### 任务 2: 创建新的路由配置

**文件**: `src/router/index.js`

**添加路由**:
```javascript
// 马拉松扑克训练
{ path: '/marathon/poker/settings', name: 'MarathonPokerSettings', component: () => import('../views/marathon/poker/Settings.vue') },
{ path: '/marathon/poker/memory', name: 'MarathonPokerMemory', component: () => import('../views/marathon/poker/Memory.vue') },
{ path: '/marathon/poker/reconstruct', name: 'MarathonPokerReconstruct', component: () => import('../views/marathon/poker/Reconstruct.vue') },
{ path: '/marathon/poker/result', name: 'MarathonPokerResult', component: () => import('../views/marathon/poker/Result.vue') },

// 马拉松数字训练
{ path: '/marathon/number/settings', name: 'MarathonNumberSettings', component: () => import('../views/marathon/number/Settings.vue') },
{ path: '/marathon/number/memory', name: 'MarathonNumberMemory', component: () => import('../views/marathon/number/Memory.vue') },
{ path: '/marathon/number/reconstruct', name: 'MarathonNumberReconstruct', component: () => import('../views/marathon/number/Reconstruct.vue') },
{ path: '/marathon/number/result', name: 'MarathonNumberResult', component: () => import('../views/marathon/number/Result.vue') },
```

---

### 任务 3: 创建 Pinia Store

**文件**: `src/store/marathonPoker.js`

**数据结构**:
```javascript
export const useMarathonPokerStore = defineStore('marathonPoker', {
  state: () => ({
    // 设置
    settings: {
      deckCount: 2,        // 副牌数量 (2-10)
      cardsPerPage: 52,    // 每页显示牌数
      groupSize: 3         // 分组大小
    },
    // 数据
    allCards: [],          // 所有洗牌后的牌（多副）
    reconstructedCards: [], // 用户复原的牌
    // 计时
    memoryStartTime: 0,
    memoryEndTime: 0,
    reconstructStartTime: 0,
    reconstructEndTime: 0,
    // 分页
    currentPage: 0,
    totalPages: 0,
    // 状态
    trainingStatus: 'idle' // idle, settings, memorizing, recalling, finished
  }),
  actions: {
    // 生成多副牌（根据 deckCount）
    generateCards() {
      // 创建多副标准扑克牌，洗牌，存入 allCards
    },
    // 更新设置
    updateSettings(newSettings) { ... },
    // 计时控制
    startMemory() { ... },
    stopMemory() { ... },
    // 分页
    nextPage() { ... },
    prevPage() { ... },
    // 复原
    addReconstructedCard(card) { ... },
    removeLastCard() { ... },
    // 计算结果
    calculateResults() { ... },
    // 重置
    reset() { ... }
  }
})
```

**文件**: `src/store/marathonNumber.js`

**数据结构**:
```javascript
export const useMarathonNumberStore = defineStore('marathonNumber', {
  state: () => ({
    settings: {
      digitCount: 100,     // 数字位数 (100-1000)
      digitsPerPage: 40,   // 每页显示位数
      groupSize: 6         // 分组大小
    },
    generatedNumber: '',   // 生成的完整数字字符串
    userInput: '',         // 用户输入
    // 计时
    memoryStartTime: 0,
    memoryEndTime: 0,
    reconstructStartTime: 0,
    reconstructEndTime: 0,
    // 分页
    currentPage: 0,
    totalPages: 0,
    // 状态
    trainingStatus: 'idle'
  }),
  actions: {
    generateNumber() {
      // 根据 digitCount 生成随机数字序列
    },
    // 其他类似马拉松扑克的 actions
  }
})
```

---

### 任务 4: 创建设置页面

**文件**: `src/views/marathon/poker/Settings.vue` 和 `src/views/marathon/number/Settings.vue`

**功能**:
1. 选择训练参数（马拉松扑克：副牌数量 2-10；马拉松数字：位数 100-1000）
2. 显示预计难度/时间提示
3. "开始训练" 按钮，跳转到记忆页面

**样式要求**:
- 白色卡片容器，圆角 12px，阴影
- 使用滑动条或步进器选择数值
- 标题居中，使用 `#2c3e50` 颜色
- 按钮：蓝色渐变背景（参考现有项目中按钮颜色）

**交互**:
- 滑动条实时显示当前数值
- 底部显示"预计记忆时间：约 X 分钟"提示

---

### 任务 5: 创建记忆页面

**文件**: `src/views/marathon/poker/Memory.vue` 和 `src/views/marathon/number/Memory.vue`

**核心功能**:
1. **分页显示**：由于牌/数字太多，需要分页显示
   - 马拉松扑克：每页显示 52 张（1 副），底部显示页码指示器（如 "第 1 / 5 页"）
   - 马拉松数字：每页显示 40-60 位，大字体显示
2. **计时器**：正计时，显示已用时间（格式：MM:SS）
3. **分组显示**：按 groupSize 分组，组间留空隙（参考现有数字训练的分组逻辑）
4. **导航**："下一页"、"上一页" 按钮，或滑动切换
5. **完成记忆**："我已记完" 按钮，记录记忆用时，跳转到复原页

**样式要求**:
- 页眉显示进度 "副牌 3/10" 或 "第 200-400 位"
- 卡片使用 `PokerCard.vue` 组件（复用现有组件）
- 数字使用等宽字体，大字号（参考现有数字训练样式）
- 底部固定栏显示计时器和完成按钮

**交互细节**:
- 滑动切换页面（移动端）或点击按钮（桌面端）
- 完成每一页时给轻微提示（如进度条前进）
- 最后一页显示"最后一页，准备复原"提示

---

### 任务 6: 创建复原页面

**文件**: `src/views/marathon/poker/Reconstruct.vue` 和 `src/views/marathon/number/Reconstruct.vue`

**核心功能**:
1. **输入方式**：
   - 马拉松扑克：使用牌选择器（网格显示所有 52 张牌的花色+点数，点击选择），类似虚拟键盘
   - 马拉松数字：数字键盘（0-9），显示当前输入进度
2. **进度显示**：
   - 已输入数量 / 总数量
   - 进度条
3. **已输入预览**：顶部显示已选择的牌/数字，支持回退删除
4. **分页切换**：可以回顾之前输入的内容（查看模式，不可编辑）
5. **提交**："完成提交"按钮，跳转到结果页

**样式要求**:
- 已输入区域：水平滚动，小尺寸预览（扑克牌用小尺寸模式）
- 选择器区域：网格布局，4 列（扑克花色）或 3 列（数字键盘）
- 当前选中项高亮显示
- 提交按钮固定在底部

**交互细节**:
- 点击牌/数字立即添加到序列
- 支持手势左滑删除最后一个（可选）
- 满额时自动提示是否提交
- 提供"返回修改"按钮可以回到之前输入的位置

---

### 任务 7: 创建结果页面

**文件**: `src/views/marathon/poker/Result.vue` 和 `src/views/marathon/number/Result.vue`

**核心功能**:
1. **成绩统计**：
   - 正确率：正确数量 / 总数量
   - 记忆用时
   - 复原用时
   - 总用时
   - 每秒记忆效率（牌/秒 或 位/秒）
2. **对比视图**：
   - 分屏显示原始序列和用户输入
   - 错误项用红色标记
   - 支持分页查看（与记忆页分页对应）
3. **操作按钮**：
   - "再次训练"（清空数据，回到设置页）
   - "返回首页"

**样式要求**:
- 顶部大字体显示正确率（如 "85%"）
- 统计信息用网格卡片展示
- 对比视图左侧原始（灰色），右侧用户输入（正确绿色/错误红色）
- 错误处显示正确值提示

---

### 任务 8: 复用和创建通用组件

**复用现有组件**:
- `PokerCard.vue`：在记忆页和复原预览中使用

**新建通用组件（可选，视复杂度决定）**:
- `MarathonProgress.vue`：进度条组件，显示当前进度（第 X 副/页，共 Y）
- `Timer.vue`：计时器组件，正计时显示 MM:SS
- `PaginationIndicator.vue`：分页指示器（点或页码）

---

## 四、样式一致性检查清单

确保所有新页面遵循以下样式规范：

- [ ] 容器最大宽度 600px，居中 `margin: 0 auto`
- [ ] 卡片使用白色背景，圆角 12px，阴影 `0 4px 15px rgba(0,0,0,0.05)`
- [ ] 标题颜色 `#2c3e50`，正文字颜色 `#7f8c8d`
- [ ] 主按钮使用渐变色或蓝色系（参考现有项目）
- [ ] 页面内边距 20px
- [ ] 移动优先，所有元素在 375px 宽度下正常显示
- [ ] 使用 `box-sizing: border-box`
- [ ] Flexbox 布局，避免使用 float

---

## 五、开发顺序建议

1. **第一步**：修改 `Home.vue`，添加两个新入口
2. **第二步**：添加路由配置
3. **第三步**：创建两个新的 Pinia store
4. **第四步**：创建设置页面（Settings.vue）
5. **第五步**：创建记忆页面（Memory.vue）
6. **第六步**：创建复原页面（Reconstruct.vue）
7. **第七步**：创建结果页面（Result.vue）
8. **第八步**：端到端测试，确保流程完整

---

## 六、注意事项

1. **数据持久化**：页面刷新会丢失状态（与现有行为一致），如需持久化可以使用 localStorage（可选）
2. **性能优化**：如果生成 520 张牌或 1000 位数字，确保分页加载，不要一次性渲染
3. **移动端适配**：所有按钮大小至少 44px，方便触摸
4. **中文界面**：所有文案使用中文
5. **不要引入新依赖**：使用现有技术栈（Vue 3, Pinia, Vue Router），如需特殊 UI 组件可手写

---

## 七、文件创建清单

需要创建以下文件：

```
src/
├── store/
│   ├── marathonPoker.js           # 马拉松扑克状态管理
│   └── marathonNumber.js          # 马拉松数字状态管理
└── views/
    └── marathon/
        ├── poker/
        │   ├── Settings.vue       # 扑克设置页
        │   ├── Memory.vue         # 扑克记忆页
        │   ├── Reconstruct.vue    # 扑克复原页
        │   └── Result.vue         # 扑克结果页
        └── number/
            ├── Settings.vue       # 数字设置页
            ├── Memory.vue         # 数字记忆页
            ├── Reconstruct.vue    # 数字复原页
            └── Result.vue         # 数字结果页
```

需要修改的文件：
- `src/views/Home.vue`           # 添加两个新入口
- `src/router/index.js`          # 添加 8 个新路由

---

**提示给 AI 工具**: 请按照以上详细规范开发功能，确保代码风格与现有项目完全一致。优先实现核心流程，样式细节可以迭代优化。如有不确定的地方，参考 `src/views/Home.vue` 和 `src/store/index.js` 中的代码模式。
