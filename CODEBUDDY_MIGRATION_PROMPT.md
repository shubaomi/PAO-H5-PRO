# 微信小程序迁移开发提示词 - CodeBuddy专用

> **使用方法**: 复制以下所有内容，粘贴到CodeBuddy工具中，即可开始完整的小程序项目重构和开发

---

# PAO记忆训练小程序 - CodeBuddy开发任务

## 一、任务概述

将现有的Vue 3 H5 PAO记忆训练应用迁移到微信小程序，使用uni-app框架，保留原有业务逻辑和用户体验。

## 二、项目背景

**当前技术栈**:
- Vue 3 + Vite + Vue Router + Pinia
- H5移动端应用（43个Vue/JS文件）
- 4种训练模式：快速扑克、快速数字、马拉松扑克、马拉松数字

**核心功能**:
1. 扑克训练：Settings → Memory → Reconstruct → Result
2. 数字训练：单文件完整流程
3. 状态管理：Pinia stores
4. UI组件：PokerCard、Toast、Modal

**目标平台**: 微信小程序（兼容微信APP、H5）

## 三、技术栈选择

**必须使用**:
- **框架**: uni-app (Vue 3)
- **状态管理**: uni-app官方状态管理（替代Pinia）
- **路由**: uni-app页面导航
- **本地存储**: `uni.getStorageSync` / `uni.setStorageSync`

**禁止使用**:
- ❌ Vue Router
- ❌ Pinia
- ❌ Vue CLI
- ❌ Vite

## 四、迁移映射表

### 4.1 Vue 3 → uni-app 关键API映射

```javascript
// Vue 3
import { ref, computed, onMounted, onUnmounted } from 'vue'
const timer = setInterval(() => {}, 1000)
window.scrollTo(0, 0)
localStorage.getItem('key')

// uni-app
const { ref, computed } = Vue
const timer = setInterval(() => {}, 1000)
uni.pageScrollTo({ scrollTop: 0 })
uni.getStorageSync('key')

// 生命周期
onMounted() → onLoad()
onUnmounted() → onUnload()
```

### 4.2 路由导航

```javascript
// Vue 3
router.push('/poker/memory')
router.back()

// uni-app
uni.navigateTo({ url: '/pages/poker/memory' })
uni.navigateBack({ delta: 1 })
```

### 4.3 本地存储

```javascript
// Pinia
store.setShuffledCards(cards)

// uni-app
uni.setStorageSync('poker_shuffled_cards', cards)

// 获取
uni.getStorageSync('poker_shuffled_cards')
```

## 五、项目结构要求

```
pages/
├── index/                 # 首页
├── poker/                 # 扑克训练（4个页面）
├── number/                # 数字训练（单文件）
├── marathon/
│   ├── poker/             # 马拉松扑克（4个页面）
│   └── number/            # 马拉松数字（2个页面）

components/                # 公共组件
├── PokerCard.vue
├── Toast.vue
└── Modal.vue

utils/                     # 工具函数
├── storage.js
├── timer.js
└── format.js

api/                       # API接口
├── history.js
└── statistics.js

App.vue                    # 应用入口
main.js                    # 主逻辑
pages.json                 # 页面配置
manifest.json              # 应用配置
```

## 六、开发步骤（按顺序执行）

### Step 1: 初始化项目

**要求**:
1. 使用uni-app初始化项目
2. Vue 3版本
3. 目标平台：微信小程序
4. 安装必要依赖

```bash
# 在CodeBuddy中执行
npm init -y
npm install vue@latest
npm install @dcloudio/uni-app@latest
# 其他依赖...
```

**关键配置**:
```json
// package.json
{
  "scripts": {
    "dev:mp-weixin": "uni",
    "build:mp-weixin": "uni build"
  }
}
```

### Step 2: 创建基础页面结构

**必须创建的页面**:
1. `pages/index/index.vue` - 首页（4种训练模式入口）
2. `pages/poker/settings.vue` - 扑克训练设置页
3. `pages/poker/memory.vue` - 扑克训练记忆页
4. `pages/poker/reconstruct.vue` - 扑克训练复原页
5. `pages/poker/result.vue` - 扑克训练结果页
6. `pages/number/index.vue` - 数字训练（单文件完整流程）
7. `pages/marathon/poker/settings.vue`
8. `pages/marathon/poker/memory.vue`
9. `pages/marathon/poker/reconstruct.vue`
10. `pages/marathon/poker/result.vue`
11. `pages/marathon/number/settings.vue`
12. `pages/marathon/number/index.vue`

**pages.json配置**:
```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "PAO记忆训练"
      }
    },
    // ...其他页面配置
  ],
  "tabBar": {
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页"
      }
    ]
  }
}
```

### Step 3: 实现公共组件

**PokerCard.vue** (复用现有逻辑):
```vue
<template>
  <view class="poker-card" :class="size">
    <view class="top-rank">
      <view class="rank">{{ rank }}</view>
      <view class="suit">{{ suitSymbol }}</view>
    </view>
    <view class="center-suit">{{ suitSymbol }}</view>
    <view v-if="index" class="card-index">{{ index }}</view>
  </view>
</template>

<script>
const suitSymbols = { spade: '♠', heart: '♥', club: '♣', diamond: '♦' }
export default {
  props: ['suit', 'rank', 'size', 'isMatched', 'index'],
  data() { return { suitSymbols } }
}
</script>
```

**Toast.vue**:
```vue
<template>
  <view v-if="visible" class="toast" :class="type">
    {{ message }}
  </view>
</template>
```

**Modal.vue**:
```vue
<template>
  <view v-if="visible" class="modal-overlay" @click="onCancel">
    <view class="modal-content" @click.stop>
      <view class="modal-title">{{ title }}</view>
      <view class="modal-message">{{ message }}</view>
      <view class="modal-actions">
        <button @click="onCancel">{{ cancelText }}</button>
        <button @click="onConfirm" type="primary">{{ confirmText }}</button>
      </view>
    </view>
  </view>
</template>
```

### Step 4: 实现首页

**pages/index/index.vue**:
```vue
<script>
export default {
  data() {
    return {
      trainingOptions: [
        {
          id: 'poker',
          title: '快速扑克训练',
          description: '训练大脑对扑克牌序列的记忆能力',
          icon: '♠️',
          path: '/pages/poker/settings'
        },
        // ...其他3个选项
      ]
    }
  },
  methods: {
    navigateTo(path) {
      uni.navigateTo({ url: path })
    }
  }
}
</script>

<template>
  <view class="home-container">
    <view class="training-list">
      <view
        v-for="option in trainingOptions"
        :key="option.id"
        class="training-card"
        @click="navigateTo(option.path)"
      >
        <view class="icon">{{ option.icon }}</view>
        <view class="info">
          <view class="title">{{ option.title }}</view>
          <view class="description">{{ option.description }}</view>
        </view>
      </view>
    </view>
  </view>
</template>
```

### Step 5: 实现扑克训练

**5.1 Settings页** (pages/poker/settings.vue)
```vue
<script>
export default {
  data() {
    return {
      groupSize: 3
    }
  },
  onLoad() {
    // 从本地存储读取配置
    const settings = uni.getStorageSync('poker_settings') || {}
    this.groupSize = settings.groupSize || 3
  },
  methods: {
    startTraining() {
      // 保存配置
      uni.setStorageSync('poker_settings', {
        groupSize: this.groupSize
      })
      uni.navigateTo({ url: '/pages/poker/memory' })
    },
    goHome() {
      uni.navigateBack()
    }
  }
}
</script>
```

**5.2 Memory页** (pages/poker/memory.vue)
```vue
<script>
export default {
  data() {
    return {
      isStarted: false,
      isCountingDown: false,
      countdown: 5,
      currentPage: 0,
      groupSize: 3,
      allCards: [],
      timerInterval: null
    }
  },
  computed: {
    currentGroup() {
      const start = this.currentPage * this.groupSize
      return this.allCards.slice(start, start + this.groupSize)
    },
    totalPages() {
      return Math.ceil(52 / this.groupSize)
    }
  },
  onLoad() {
    // 读取配置
    const settings = uni.getStorageSync('poker_settings')
    this.groupSize = settings?.groupSize || 3
  },
  methods: {
    generateCards() {
      const suits = ['diamond', 'club', 'heart', 'spade']
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
      const cards = []
      suits.forEach(suit => {
        ranks.forEach(rank => {
          cards.push({ suit, rank })
        })
      })
      return cards
    },
    shuffle(array) {
      const arr = [...array]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    },
    startTraining() {
      this.isCountingDown = true
      const interval = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          clearInterval(interval)
          this.isCountingDown = false
          this.isStarted = true
          this.allCards = this.shuffle(this.generateCards())
          uni.setStorageSync('poker_shuffled_cards', this.allCards)
          this.startTimer()
        }
      }, 1000)
    },
    startTimer() {
      const startTime = Date.now()
      this.timerInterval = setInterval(() => {
        this.currentTime = (Date.now() - startTime) / 1000
      }, 100)
    },
    nextPage() {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++
      }
    },
    finishMemory() {
      clearInterval(this.timerInterval)
      const memoryTime = this.currentTime
      uni.setStorageSync('poker_memory_time', memoryTime)
      uni.setStorageSync('poker_settings', { groupSize: this.groupSize })
      uni.navigateTo({ url: '/pages/poker/reconstruct' })
    }
  },
  onUnload() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }
  }
}
</script>
```

**5.3 Reconstruct页** (pages/poker/reconstruct.vue)
```vue
<script>
export default {
  data() {
    return {
      isStarted: false,
      currentTime: 0,
      timerInterval: null,
      selectedIndex: null,
      suits: ['diamond', 'club', 'heart', 'spade'],
      ranks: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
      sourceRows: {},
      reconstructionRow: new Array(52).fill(null),
      showInstructions: false
    }
  },
  computed: {
    placedCount() {
      return this.reconstructionRow.filter(c => c !== null).length
    }
  },
  onLoad() {
    this.initSourceRows()
    const shuffledCards = uni.getStorageSync('poker_shuffled_cards')
    if (shuffledCards) {
      this.reconstructionRow = shuffledCards
    }
  },
  methods: {
    initSourceRows() {
      const generateSortedSuit = (suit) => {
        return this.ranks.map(rank => ({ suit, rank, id: `${suit}-${rank}` }))
      }
      this.sourceRows = {
        diamond: generateSortedSuit('diamond'),
        club: generateSortedSuit('club'),
        heart: generateSortedSuit('heart'),
        spade: generateSortedSuit('spade')
      }
    },
    getNextSlotIndex() {
      const filled = this.reconstructionRow.map((c, i) => (c ? i : -1)).filter(i => i >= 0)
      if (filled.length === 0) {
        return this.reconstructionRow.findIndex(slot => slot === null)
      }
      const maxIdx = Math.max(...filled)
      for (let i = maxIdx + 1; i < this.reconstructionRow.length; i++) {
        if (this.reconstructionRow[i] === null) return i
      }
      return this.reconstructionRow.findIndex(slot => slot === null)
    },
    handleSourceCardClick(card, suit) {
      if (!this.isStarted) return

      if (this.selectedIndex !== null) {
        // 替换逻辑
        const originalCard = this.reconstructionRow[this.selectedIndex]
        const sourceIndex = this.sourceRows[suit].findIndex(c => c.id === card.id)
        if (sourceIndex !== -1) {
          const [newCard] = this.sourceRows[suit].splice(sourceIndex, 1)
          this.reconstructionRow[this.selectedIndex] = newCard
          if (originalCard) {
            this.sourceRows[originalCard.suit].push(originalCard)
            this.sourceRows[originalCard.suit].sort((a, b) => {
              return this.ranks.indexOf(a.rank) - this.ranks.indexOf(b.rank)
            })
          }
          this.selectedIndex = null
        }
      } else {
        // 放牌逻辑
        const targetIndex = this.getNextSlotIndex()
        if (targetIndex !== -1) {
          const sourceIndex = this.sourceRows[suit].findIndex(c => c.id === card.id)
          if (sourceIndex !== -1) {
            const [removed] = this.sourceRows[suit].splice(sourceIndex, 1)
            this.reconstructionRow[targetIndex] = removed
          }
        }
      }
    },
    handleReconstructCardClick(index) {
      if (!this.isStarted) return

      if (this.selectedIndex === null) {
        this.selectedIndex = index
      } else if (this.selectedIndex === index) {
        this.selectedIndex = null
      } else {
        const temp = this.reconstructionRow[this.selectedIndex]
        this.reconstructionRow[this.selectedIndex] = this.reconstructionRow[index]
        this.reconstructionRow[index] = temp
        this.selectedIndex = null
      }
    },
    startTimer() {
      this.isStarted = true
      const startTime = Date.now()
      this.timerInterval = setInterval(() => {
        this.currentTime = (Date.now() - startTime) / 1000
      }, 100)
    },
    formatTime(ms) {
      const seconds = Math.floor(ms / 1000)
      const milliseconds = Math.floor((ms % 1000) / 10)
      return `${seconds}.${milliseconds.toString().padStart(2, '0')}`
    },
    finishReconstruct() {
      const finalCards = this.reconstructionRow.filter(c => c !== null)
      if (finalCards.length < 52) {
        uni.showModal({
          title: '提示',
          content: `你当前只放了 ${finalCards.length} 张牌，确定要完成吗？`
        })
        return
      }
      clearInterval(this.timerInterval)
      const reconstructTime = this.currentTime
      uni.setStorageSync('poker_reconstruct_time', reconstructTime)
      uni.setStorageSync('poker_reconstructed_cards', finalCards)
      uni.navigateTo({ url: '/pages/poker/result' })
    }
  },
  onUnload() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }
  }
}
</script>
```

**5.4 Result页** (pages/poker/result.vue)
```vue
<script>
export default {
  data() {
    return {
      shuffledCards: [],
      reconstructedCards: []
    }
  },
  computed: {
    result() {
      let correct = 0
      const comparison = []

      for (let i = 0; i < 52; i++) {
        const original = this.shuffledCards[i]
        const reconstructed = this.reconstructedCards[i]

        const isMatch = original && reconstructed &&
                        original.suit === reconstructed.suit &&
                        original.rank === reconstructed.rank

        if (isMatch) correct++
        comparison.push({ original, reconstructed, isMatch })
      }

      return {
        correct,
        incorrect: 52 - correct,
        accuracy: ((correct / 52) * 100).toFixed(1),
        comparison
      }
    }
  },
  onLoad() {
    this.shuffledCards = uni.getStorageSync('poker_shuffled_cards') || []
    this.reconstructedCards = uni.getStorageSync('poker_reconstructed_cards') || []
  },
  methods: {
    formatTime(ms) {
      const seconds = Math.floor(ms / 1000)
      const milliseconds = Math.floor((ms % 1000) / 10)
      return `${seconds}.${milliseconds.toString().padStart(2, '0')}`
    },
    restart() {
      uni.navigateTo({ url: '/pages/poker/memory' })
    },
    goHome() {
      uni.switchTab({ url: '/pages/index/index' })
    }
  }
}
</script>
```

### Step 6: 实现数字训练

**pages/number/index.vue** (单文件完整流程，复用Vue版本逻辑，改为uni-app API)

**关键修改**:
- `onMounted` → `onLoad`
- `onUnmounted` → `onUnload`
- `router.push` → `uni.navigateTo`
- `localStorage` → `uni.getStorageSync`

### Step 7: 实现马拉松训练

**要求**:
- 与快速训练结构完全一致
- 在结果页增加历史记录显示
- 使用独立的存储key（`marathon_poker_...`）

**历史记录存储**:
```javascript
// 保存历史
const history = uni.getStorageSync('marathon_poker_history') || []
history.push({
  date: new Date().toLocaleString(),
  memoryTime: 15.3,
  reconstructTime: 32.1,
  correct: 45,
  accuracy: 86.5,
  score: 86.5
})
uni.setStorageSync('marathon_poker_history', history)
```

### Step 8: 实现状态管理

**store/index.js**:
```javascript
const getDefaultState = () => ({
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
})

const state = getDefaultState()

export default {
  namespaced: true,
  state,
  mutations: {
    SET_POKER_STATE(state, { key, value }) {
      state.poker[key] = value
      uni.setStorageSync('poker_' + key, value)
    }
  },
  actions: {
    setShuffledCards({ commit }, cards) {
      commit('SET_POKER_STATE', { key: 'shuffledCards', value: cards })
    }
  }
}
```

### Step 9: 全局样式

**styles/common.css**:
```css
/* 重置样式 */
page {
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

/* 通用组件样式 */
.poker-card {
  width: 80px;
  height: 110px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  padding: 8px;
  position: relative;
  user-select: none;
}

.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 16px 32px;
  border-radius: 8px;
  z-index: 9999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 80%;
  max-width: 400px;
}
```

## 七、开发规范

### 7.1 命名规范
- 页面文件：kebab-case（`poker-settings.vue`）
- 组件文件：PascalCase（`PokerCard.vue`）
- 变量/函数：camelCase（`currentCards`）
- 常量：UPPER_SNAKE_CASE（`MAX_GROUP_SIZE`）
- 样式类：kebab-case（`.poker-card`）

### 7.2 代码组织
```vue
<script>
// 1. 导入
import { ref, computed } from 'vue'

// 2. Props
const props = defineProps({})

// 3. State
const state = ref([])

// 4. Computed
const computedValue = computed(() => {})

// 5. Methods
function method() {}

// 6. Lifecycle
onLoad(() => {})
</script>

<template>
  <!-- Template -->
</template>

<style scoped>
/* Styles */
</style>
```

### 7.3 生命周期顺序
```javascript
onLoad()          // 页面加载
onShow()          // 页面显示
onReady()         // 页面初次渲染完成
onHide()          // 页面隐藏
onUnload()        // 页面卸载
```

## 八、测试要求

### 8.1 功能测试清单
- [ ] 所有页面可正常进入和退出
- [ ] 扑克训练流程完整（设置→记忆→复原→结果）
- [ ] 数字训练流程完整（生成→记忆→复原→结果）
- [ ] 历史记录保存和读取正常
- [ ] Toast提示正常显示
- [ ] Modal确认弹窗正常
- [ ] 倒计时功能正常
- [ ] 计时器功能正常
- [ ] 卡牌分组逻辑正确

### 8.2 性能要求
- [ ] 首屏加载时间<2秒
- [ ] 卡片渲染流畅
- [ ] 无明显卡顿

## 九、注意事项

### 9.1 禁止事项
- ❌ 使用`console.log`（生产环境会保留）
- ❌ 使用`window`/`document`对象
- ❌ 使用`performance.now()`（使用`Date.now()`替代）
- ❌ 使用`router.push`（使用`uni.navigateTo`）
- ❌ 使用`localStorage`（使用`uni.getStorageSync`）

### 9.2 关键差异
1. **事件处理**：小程序中`@click`与Vue相同，但需注意`stopPropagation`
2. **样式作用域**：小程序不支持scoped，需要使用组件内部样式
3. **异步操作**：小程序需要处理异步加载
4. **生命周期**：小程序有更多生命周期钩子可用

### 9.3 调试技巧
- 使用微信开发者工具的调试器
- 检查`onLoad`、`onShow`等生命周期是否正确触发
- 检查`uni.setStorageSync`和`uni.getStorageSync`是否正常
- 检查`uni.navigateTo`路由跳转是否成功

## 十、验收标准

### 10.1 代码质量
- [ ] 所有Vue 3语法正确转换为uni-app语法
- [ ] 无`console.log`残留
- [ ] 代码格式统一
- [ ] 注释清晰

### 10.2 功能完整性
- [ ] 4种训练模式完整实现
- [ ] 所有交互流程正常
- [ ] 状态管理正常
- [ ] 历史记录功能正常

### 10.3 性能达标
- [ ] 首屏加载<2秒
- [ ] 渲染流畅

---

## 开始开发

现在，请按照上述步骤，开始完整的小程序迁移开发工作。

**重要提示**：
1. **按顺序执行**：不要跳过步骤，每个步骤完成后才能进入下一步
2. **实时验证**：每完成一个功能立即在微信开发者工具中测试
3. **及时反馈**：遇到问题立即调整代码，不要积累问题
4. **完整实现**：确保所有功能和交互都正常工作

开始执行吧！
