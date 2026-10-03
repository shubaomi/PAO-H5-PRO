# PAO记忆训练小程序 - 完整迁移需求文档

## 文档版本
- **版本**: v1.0
- **创建日期**: 2026-02-06
- **文档类型**: 微信小程序迁移需求

---

## 一、项目概述

### 1.1 项目背景
PAO（Person-Action-Object）记忆训练系统，旨在通过扑克牌和数字记忆训练提升用户大脑记忆能力。

### 1.2 核心价值
- **科学训练**: 采用PAO记忆法，结构化记忆训练
- **多模式选择**: 快速训练 + 马拉松挑战，满足不同需求
- **数据追踪**: 记录训练时间、准确率、历史成绩
- **易用性**: 移动端优先设计，操作简单直观

### 1.3 目标平台
- **主平台**: 微信小程序
- **开发框架**: uni-app (Vue 3)
- **兼容目标**: 微信APP、H5、其他小程序平台

---

## 二、功能需求

### 2.1 用户首页（pages/index/index.vue）
**页面路径**: `/pages/index/index`

**核心功能**:
1. 展示4种训练模式入口
2. 扑克牌记忆训练（快速模式）
3. 数字记忆训练（快速模式）
4. 马拉松扑克训练
5. 马拉松数字训练

**UI组件**:
- 训练卡片列表（4个卡片）
- 每个卡片包含：图标、标题、描述、箭头
- 点击卡片进入对应设置页

**交互流程**:
```
首页 → 点击卡片 → 设置页面
```

**状态管理**:
- 从全局状态读取当前选择训练类型

**数据需求**:
- 训练类型列表（配置化）
- 历史最佳成绩（可选）

---

### 2.2 扑克训练 - 设置页（pages/poker/settings.vue）
**页面路径**: `/pages/poker/settings`

**核心功能**:
1. 训练标题和描述
2. 分组大小设置（1-6张/组，滑块选择）
3. 帮助说明弹窗
4. 开始训练按钮
5. 返回首页按钮

**UI组件**:
- 标题区域（返回按钮 + 标题 + 帮助按钮）
- 设置卡片（分组大小滑块）
- 两个按钮（返回、开始）

**配置项**:
```javascript
{
  groupSize: {
    type: Number,
    default: 3,
    min: 1,
    max: 6,
    step: 1
  }
}
```

**交互流程**:
```
首页 → 设置页 → 记忆页
```

**状态管理**:
- 使用全局状态存储配置：`uni.getStorageSync('poker_settings')`

---

### 2.3 扑克训练 - 记忆页（pages/poker/memory.vue）
**页面路径**: `/pages/poker/memory`

**核心功能**:
1. 倒计时5秒
2. 分组显示扑克牌（每组groupSize张）
3. 上一组/下一组翻页
4. 记忆时间计时器
5. 完成记忆按钮
6. 返回设置确认弹窗

**UI组件**:
- 顶部导航（返回按钮、计时器显示）
- 倒计时屏幕（大数字）
- 训练屏幕（卡片网格、翻页按钮）
- 模态框（返回确认）

**卡片数据**:
```javascript
{
  suits: ['diamond', 'club', 'heart', 'spade'],
  ranks: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
  cards: 52 // 完整扑克牌
}
```

**关键逻辑**:
1. **分组算法**:
   ```javascript
   // 根据groupSize计算分页
   const totalPages = Math.ceil(52 / groupSize)
   const currentGroup = cards.slice(
     (currentPage - 1) * groupSize,
     currentPage * groupSize
   )
   ```

2. **倒计时**: 5秒后自动开始记忆
3. **计时器**: 精确到0.1秒
4. **进度显示**: "第 X / Y 组"

**交互流程**:
```
设置页 → 记忆页（倒计时） → 记忆页（训练） → 复原页
```

**状态保存**:
- 记忆时间存储到全局状态
- 打乱后的牌组存储

---

### 2.4 扑克训练 - 复原页（pages/poker/reconstruct.vue）
**页面路径**: `/pages/poker/reconstruct`

**核心功能**:
1. 按花色分组显示源卡牌（4行）
2. 52个槽位网格（复原区）
3. 卡牌放置逻辑：
   - 点击源卡牌放入槽位
   - 点击槽位选中（支持空槽）
   - 再次点击同一槽位取消选中
   - 选中后点击另一槽位交换内容
   - 选中后点击源卡牌替换内容
4. 记录已放置数量
5. 开始复原、完成提交、重置按钮
6. 操作说明弹窗
7. 返回设置确认弹窗

**UI组件**:
- 顶部导航（返回按钮、计时器、两个导航按钮、帮助按钮、计数）
- 左侧：4行源卡牌（每行一个花色）
- 右侧：52个槽位网格
- 底部操作按钮（开始、完成、重置）

**卡牌操作逻辑**:
```javascript
// 1. 放牌逻辑
function handleSourceCardClick(card, suit) {
  if (!isStarted) return

  if (selectedIndex !== null) {
    // 选中状态下：替换槽位内容
    // 选中新槽位，旧牌归回花色行
  } else {
    // 未选中：放入槽位
    // 查找下一个可用槽位
  }
}

// 2. 选槽逻辑
function handleReconstructCardClick(index) {
  if (!isStarted) return

  if (selectedIndex === null) {
    selectedIndex = index // 选中
  } else if (selectedIndex === index) {
    selectedIndex = null // 取消选中
  } else {
    // 交换两槽内容
  }
}
```

**关键逻辑**:
1. **槽位顺序**: 按数字从小到大填充
2. **花色排序**: 每行内部按牌面大小排序
3. **滑块滚动**: 顶部导航按钮快速定位

**交互流程**:
```
记忆页 → 复原页（未开始） → 复原页（进行中） → 结果页
```

**状态保存**:
- 复原时间存储到全局状态
- 已复原的牌组存储

---

### 2.5 扑克训练 - 结果页（pages/poker/result.vue）
**页面路径**: `/pages/poker/result`

**核心功能**:
1. 训练标题
2. 统计卡片：
   - 记忆时间
   - 复原时间
   - 正确数量
   - 错误数量
   - 准确率
3. 对比显示（原始牌组 vs 复原牌组）
4. 重新开始按钮
5. 返回首页按钮

**UI组件**:
- 顶部标题
- 统计卡片（时间统计、数量统计）
- 对比区域（两张卡片列表并排）
- 两个按钮（重新开始、返回首页）

**数据计算**:
```javascript
const result = {
  correct: 0,          // 正确数量
  incorrect: 52 - correct, // 错误数量
  accuracy: ((correct / 52) * 100).toFixed(1), // 准确率
  comparison: [...]   // 对比数组
}
```

**交互流程**:
```
复原页 → 结果页 → 记忆页（重新开始）
```

---

### 2.6 数字训练 - NumberTraining.vue（单文件完整流程）
**页面路径**: `/pages/number/index`

**核心功能**:
1. 配置区域（折叠/展开）：
   - 数字长度（20-60位）
   - 记忆时长（5-10分钟）
   - 训练模式（随机/不重复）
   - 分组大小（2-10位/组）
2. 生成数字并锁定
3. 记忆阶段：
   - 显示分组数字
   - 记忆时间倒计时
4. 复原阶段：
   - 每位数字对应一个槽位
   - 输入用户记忆的数字
   - 对比显示正确/错误/缺失/多余
5. 结果统计：
   - 准确率
   - 错误数量
   - 正确数量
   - 总时间
   - 对比视图
6. Toast通知
7. Modal确认弹窗
8. 帮助说明

**UI组件**:
- 顶部导航（返回按钮、计时器、帮助按钮）
- 配置区域（折叠面板）
- 记忆区域（分组数字显示）
- 复原区域（数字槽位输入）
- 底部按钮（生成、完成、重置）
- 全局组件（Toast、Modal）

**状态管理**:
- 4个核心状态：
  - generatedNumber: 生成的数字
  - userInput: 用户输入
  - trainingStatus: 'idle' | 'memorizing' | 'recalling' | 'finished'
  - results: 统计结果

**关键逻辑**:
1. **数字生成**:
   ```javascript
   // 根据长度生成随机数字
   const generatedNumber = Array.from(
     { length: length },
     () => Math.floor(Math.random() * 10)
   ).join('')
   ```

2. **分组显示**:
   ```javascript
   // 按groupSize分组显示
   const groups = formatGrouped(generatedNumber, groupSize)
   ```

3. **对比逻辑**:
   ```javascript
   const comparison = originalNumber.split('').map((char, index) => {
     const userChar = userInput[index] || ''
     return {
       char,
       userChar,
       status: userChar === char ? 'correct' : 'incorrect'
     }
   })
   ```

**交互流程**:
```
配置 → 生成数字（锁定） → 记忆阶段 → 复原阶段 → 结果统计 → 重置
```

---

### 2.7 马拉松训练模式
**页面结构**: 与快速训练完全一致，但在结果页增加历史记录

**2.7.1 马拉松扑克设置页** (pages/marathon/poker/settings.vue)
**2.7.2 马拉松扑克记忆页** (pages/marathon/poker/memory.vue)
**2.7.3 马拉松扑克复原页** (pages/marathon/poker/reconstruct.vue)
**2.7.4 马拉松扑克结果页** (pages/marathon/poker/result.vue)

**核心差异**:
- 历史记录保存
- 历史最佳成绩显示
- 多轮训练统计

**历史记录数据结构**:
```javascript
{
  id: 'timestamp',
  date: '2026-02-06 10:30:00',
  memoryTime: 15.3,
  reconstructTime: 32.1,
  correct: 45,
  accuracy: 86.5,
  score: 86.5
}
```

**2.7.5 马拉松数字设置页** (pages/marathon/number/settings.vue)
**2.7.6 马拉松数字训练页** (pages/marathon/number/index)

**核心差异**:
- 40位数字段
- 可配置段数（5-30段）
- 每段独立记忆时长（15s/30s/60s）
- 每段独立评分（完美/一般/错误）
- 总分计算

**段数据结构**:
```javascript
{
  segments: [
    {
      number: '12345678',
      duration: 30, // 秒
      score: 'perfect', // 'perfect' | 'half' | 'zero'
      memoryTime: 28,
      recallTime: 5
    }
  ],
  totalScore: 0,
  perfectSegments: 0,
  halfSegments: 0,
  zeroSegments: 0
}
```

---

## 三、技术架构设计

### 3.1 技术栈选择

**推荐框架**: uni-app (Vue 3)

**选择理由**:
1. ✅ **完全基于Vue 3生态**：可直接复用现有Vue代码
2. ✅ **开发效率高**：熟悉Vue API，学习成本低
3. ✅ **多端兼容**：一套代码发布到微信、H5、App等
4. ✅ **性能优秀**：使用编译优化，接近原生
5. ✅ **社区活跃**：丰富的插件和文档

**替代方案对比**:

| 方案 | 优势 | 劣势 | 推荐度 |
|------|------|------|--------|
| 原生小程序 | 性能最好、功能完全 | 开发效率低、无法复用Vue代码 | ⭐⭐ |
| uni-app | Vue生态、开发效率、多端 | 性能略低于原生 | ⭐⭐⭐⭐⭐ |
| Taro | 多端、类React体验 | 学习曲线陡、Vue不友好 | ⭐⭐⭐ |

### 3.2 项目目录结构

```
pages/
├── index/                 # 首页
│   └── index.vue
├── poker/                 # 扑克训练
│   ├── settings.vue
│   ├── memory.vue
│   ├── reconstruct.vue
│   └── result.vue
├── number/                # 数字训练（单文件）
│   └── index.vue
├── marathon/
│   ├── poker/             # 马拉松扑克
│   │   ├── settings.vue
│   │   ├── memory.vue
│   │   ├── reconstruct.vue
│   │   └── result.vue
│   └── number/            # 马拉松数字
│       ├── settings.vue
│       └── index.vue
└── components/            # 公共组件
    ├── PokerCard.vue
    ├── Toast.vue
    └── Modal.vue

components/
├── PokerCard.vue          # 扑克牌组件
├── Toast.vue              # 消息提示
├── Modal.vue              # 模态框
└── Loading.vue            # 加载状态

utils/
├── storage.js             # 本地存储封装
├── timer.js               # 计时器工具
├── format.js              # 格式化工具
└── storage.js             # 历史记录管理

api/
├── history.js             # 历史记录API
└── statistics.js          # 统计数据API

static/
├── images/                # 静态图片
└── icons/                 # 图标

styles/
├── common.css             # 全局样式
└── variables.css          # CSS变量

pages.json                 # 页面配置
App.vue                    # 应用入口
main.js                    # 主逻辑
manifest.json              # 应用配置
```

### 3.3 状态管理方案

**方案选择**: uni-app官方状态管理（替代Pinia）

**迁移策略**:
1. 将Pinia store逻辑迁移到uni-app store
2. 使用`uni.getStorageSync`/`uni.setStorageSync`替代`store.$state`

**状态结构**:
```javascript
// store/index.js
export default {
  state: {
    poker: {
      shuffledCards: [],
      reconstructedCards: [],
      memoryTime: 0,
      reconstructTime: 0,
      settings: {
        groupSize: 3
      }
    },
    marathonPoker: {
      history: []
    },
    marathonNumber: {
      history: []
    },
    numberTraining: {
      generatedNumber: '',
      userInput: '',
      trainingStatus: 'idle',
      results: {}
    }
  },

  actions: {
    setShuffledCards({ commit }, cards) {
      uni.setStorageSync('poker_shuffled_cards', cards)
    },
    // ...其他actions
  }
}
```

### 3.4 页面路由配置

**pages.json**:
```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "PAO记忆训练"
      }
    },
    {
      "path": "pages/poker/settings",
      "style": {
        "navigationBarTitleText": "快速扑克训练"
      }
    },
    {
      "path": "pages/poker/memory",
      "style": {
        "navigationBarTitleText": "记忆训练",
        "navigationBarBackgroundColor": "#3498db",
        "navigationBarTextStyle": "white"
      }
    }
    // ... 其他页面
  ]
}
```

### 3.5 关键功能映射表

| Vue 3 | uni-app 小程序 |
|-------|---------------|
| `import { ref } from 'vue'` | `const { ref } = Vue` |
| `onMounted(() => {})` | `onLoad(() => {})` |
| `onUnmounted(() => {})` | `onUnload(() => {})` |
| `router.push()` | `uni.navigateTo()` |
| `router.back()` | `uni.navigateBack()` |
| `localStorage.getItem()` | `uni.getStorageSync()` |
| `localStorage.setItem()` | `uni.setStorageSync()` |
| `window.scrollTo()` | `uni.pageScrollTo()` |
| `document.querySelector()` | `uni.createSelectorQuery()` |
| `performance.now()` | `Date.now()` |
| `computed()` | `computed()` |

### 3.6 性能优化策略

**1. 列表渲染优化**:
```javascript
// 使用key属性，避免重复渲染
<view v-for="card in cards" :key="card.id">
  <PokerCard :card="card" />
</view>

// 长列表虚拟滚动（如果有）
<scroll-view scroll-y="true" :scroll-into-view="scrollIntoView">
  <!-- 列表项 -->
</scroll-view>
```

**2. 图片优化**:
```javascript
// 使用uni-app图片组件
<image
  :src="card.image"
  mode="aspectFit"
  lazy-load
  webp
/>
```

**3. 计时器优化**:
```javascript
// 使用小程序的定时器
let timer = null

onLoad() {
  timer = setInterval(() => {
    // 更新UI
  }, 100)
}

onUnload() {
  clearInterval(timer)
}
```

**4. 数据缓存**:
```javascript
// 缓存已生成的历史数据
uni.setStorageSync('poker_history', history)

// 页面加载时读取缓存
const history = uni.getStorageSync('poker_history') || []
```

**5. 组件按需加载**:
```javascript
// 使用异步组件
const Result = () => import('./result.vue')

pages: [
  {
    path: 'pages/poker/result',
    style: {
      onLoad() {
        const Result = require('./result.vue').default
        // ...
      }
    }
  }
]
```

---

## 四、非功能需求

### 4.1 性能要求

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 首屏加载时间 | <2秒 | 真机性能测试 |
| 卡片渲染速度 | <100ms/张 | 性能监控 |
| 列表滚动流畅度 | 60fps | 性能监控 |
| 内存占用 | <100MB | 微信开发者工具 |

### 4.2 兼容性要求

**目标平台**:
- 微信小程序基础库 2.0+
- 微信APP
- H5浏览器

**最低支持设备**:
- iOS 11+
- Android 5.0+

### 4.3 用户体验要求

**交互设计**:
- 按钮点击反馈（active状态）
- 加载状态提示
- 错误提示友好
- 操作防误触（确认弹窗）

**视觉设计**:
- 移动端优先布局
- 大按钮，易于点击（最小44x44px）
- 清晰的视觉层级
- 统一的色彩规范

### 4.4 安全性要求

**数据安全**:
- 本地存储不存储敏感信息
- 密码等敏感数据加密（如有）

**用户隐私**:
- 不收集用户个人信息
- 不上传用户训练数据

---

## 五、开发规范

### 5.1 代码规范

**命名规范**:
- 页面文件: kebab-case（`poker-settings.vue`）
- 组件文件: PascalCase（`PokerCard.vue`）
- 变量/函数: camelCase（`currentCards`）
- 常量: UPPER_SNAKE_CASE（`MAX_GROUP_SIZE`）
- 样式类: kebab-case（`.poker-card`）

**代码组织**:
```vue
<script>
// 1. 导入
import { ref, computed } from 'vue'

// 2. Props
const props = defineProps({
  cards: Array
})

// 3. State
const cards = ref([])
const selectedIndex = ref(null)

// 4. Computed
const filteredCards = computed(() => {
  // ...
})

// 5. Methods
function handleClick(index) {
  // ...
}

// 6. Lifecycle
onLoad(() => {
  // ...
})
</script>

<template>
  <!-- Template -->
</template>

<style scoped>
/* Styles */
</style>
```

### 5.2 注释规范

**组件注释**:
```vue
<!-- 扑克牌组件
    功能：显示扑克牌花色和点数
    Props: suit (花色), rank (点数)
-->
```

**关键逻辑注释**:
```javascript
// 计算分组数量
const totalPages = Math.ceil(52 / groupSize)
```

**状态注释**:
```javascript
// 当前训练状态：idle-空闲, memorizing-记忆中, recalling-复原中
const trainingStatus = ref('idle')
```

### 5.3 Git提交规范

```
feat: 添加扑克训练功能
fix: 修复数字记忆复原时的错误
style: 优化卡片样式
refactor: 重构状态管理逻辑
test: 添加单元测试
docs: 更新API文档
```

---

## 六、测试计划

### 6.1 功能测试

**测试用例**:
- [ ] 首页4种训练模式可正常进入
- [ ] 扑克训练设置页分组大小可调整
- [ ] 记忆页倒计时正常，卡片分组正确
- [ ] 复原页卡牌放置、选中、交换功能正常
- [ ] 结果页对比显示正确
- [ ] 数字训练生成、记忆、复原流程完整
- [ ] 历史记录保存和读取正常
- [ ] Toast提示正常显示

### 6.2 性能测试

**测试项**:
- [ ] 首屏加载时间<2秒
- [ ] 卡片渲染<100ms/张
- [ ] 列表滚动流畅60fps
- [ ] 内存占用<100MB

### 6.3 兼容性测试

**测试设备**:
- [ ] iOS 11 (iPhone 8)
- [ ] iOS 14 (iPhone 12)
- [ ] Android 5.0 (小米8)
- [ ] Android 10 (华为Mate30)

---

## 七、部署计划

### 7.1 开发环境搭建

**开发工具**:
- 微信开发者工具
- VS Code (安装uni-app插件)

**开发流程**:
1. 克隆仓库
2. 安装依赖：`npm install`
3. 运行开发：`npm run dev:mp-weixin`
4. 在微信开发者工具中预览

### 7.2 预发布检查清单

- [ ] 所有功能测试通过
- [ ] 代码无console.log
- [ ] 图片资源已优化
- [ ] 路由配置完整
- [ ] 状态管理正常
- [ ] 性能达标
- [ ] 兼容性测试通过

### 7.3 发布流程

**版本号规范**:
```
v1.0.0 (主版本.次版本.修订号)
- 主版本：重大架构变更
- 次版本：新增功能
- 修订号：Bug修复
```

**发布步骤**:
1. 打tag：`git tag v1.0.0`
2. 推送tag：`git push origin v1.0.0`
3. GitHub Actions自动构建
4. 下载dist目录
5. 上传到微信公众平台后台

---

## 八、风险与应对

### 8.1 技术风险

**风险1**: Vue 3语法在小程序中的兼容性问题
- **应对**: 充分测试，使用uni-app提供的API替代不兼容语法

**风险2**: 性能瓶颈（大量数据渲染）
- **应对**: 使用虚拟滚动、分页加载、图片懒加载

**风险3**: 本地存储容量限制
- **应对**: 历史记录限制最近50条，定期清理

### 8.2 项目风险

**风险1**: 开发进度延迟
- **应对**: 优先实现核心功能，马拉松模式后续迭代

**风险2**: 用户体验不佳
- **应对**: 内测收集反馈，持续优化交互

---

## 九、后续规划

### 9.1 短期规划（1-3个月）

**功能增强**:
- [ ] 添加训练统计图表
- [ ] 支持自定义卡牌背景
- [ ] 增加多人PK模式
- [ ] 添加成就系统

### 9.2 中期规划（3-6个月）

**功能扩展**:
- [ ] 支持导入导出训练记录
- [ ] 添加学习路径推荐
- [ ] 增加AI辅助训练
- [ ] 对接微信登录和社交分享

### 9.3 长期规划（6-12个月）

**生态建设**:
- [ ] 开发PC端版本
- [ ] 开发Web端版本
- [ ] 开发移动端App
- [ ] 接入第三方训练平台

---

## 十、附录

### 10.1 术语表

| 术语 | 解释 |
|------|------|
| PAO | Person-Action-Object，一种记忆训练方法 |
| 记忆时间 | 训练者阅读/观察卡牌的总时长 |
| 复原时间 | 训练者根据记忆复原卡牌的总时长 |
| 准确率 | 正确卡牌数 / 总卡牌数 × 100% |
| 马拉松模式 | 多轮连续训练，追踪历史记录 |

### 10.2 参考资源

- [uni-app官方文档](https://uniapp.dcloud.net.cn/)
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Vue 3官方文档](https://cn.vuejs.org/)
- [PAO记忆法教程](https://example.com/pao-guide)

### 10.3 联系方式

**项目负责**: [姓名]
**技术支持**: [邮箱]
**问题反馈**: [GitHub Issues]
