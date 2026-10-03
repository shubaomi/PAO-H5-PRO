<script setup>
import { computed } from 'vue'

const props = defineProps({
  suit: String, // 'spade', 'heart', 'club', 'diamond'
  rank: [String, Number], // 'A', 2-10, 'J', 'Q', 'K'
  size: {
    type: String,
    default: 'normal' // 'small', 'normal', 'large'
  },
  isMismatched: Boolean,
  // 结果页：匹配高亮（编号绿色 + 绿色边框）
  isMatched: Boolean,
  // 结果页：编号展示
  index: Number,
  // 兼容旧传参：仍支持自定义编号颜色
  indexColor: String
})

const suitSymbols = {
  spade: '♠',
  heart: '♥',
  club: '♣',
  diamond: '♦'
}

const suitColors = {
  spade: '#000',
  heart: '#e74c3c',
  club: '#000',
  diamond: '#e74c3c'
}

const resolvedIndexColor = computed(() => {
  if (props.isMatched) return '#2ecc71'
  return props.indexColor || '#7f8c8d'
})
</script>

<template>
  <div class="poker-card-wrapper" :class="[size]">
    <div
      class="poker-card"
      :class="[size, { mismatched: isMismatched, matched: isMatched }]"
      :style="{ color: suitColors[suit] }"
    >
      <div class="top-rank">
        <div class="rank">{{ rank }}</div>
        <div class="suit">{{ suitSymbols[suit] }}</div>
      </div>
      <div class="center-suit">{{ suitSymbols[suit] }}</div>
    </div>

    <div v-if="index" class="card-index" :class="{ matched: isMatched }" :style="{ color: resolvedIndexColor }">
      {{ index }}
    </div>
  </div>
</template>

<style scoped>
.poker-card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

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
  border: 1px solid #ddd;
  overflow: hidden;
  box-sizing: border-box;
}

.poker-card.matched {
  border: 2px solid #2ecc71;
  box-shadow: 0 0 0 2px rgba(46, 204, 113, 0.2);
}

.poker-card.small {
  width: 45px;
  height: 65px;
  padding: 4px;
  border-radius: 4px;
}

.poker-card.large {
  width: 120px;
  height: 170px;
  padding: 12px;
}

.card-index {
  margin-top: 4px;
  font-size: 12px;
  font-family: monospace;
  text-align: center;
  opacity: 0.95;
  pointer-events: none;
}

.card-index.matched {
  font-weight: 700;
}

.small .card-index {
  font-size: 12px;
}

.large .card-index {
  font-size: 14px;
}

.top-rank {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1;
}

.rank {
  font-weight: bold;
  font-size: 1.2em;
}

.small .rank { font-size: 0.8em; }
.large .rank { font-size: 1.8em; }

.suit {
  font-size: 1em;
}

.small .suit { font-size: 0.7em; }
.large .suit { font-size: 1.5em; }

.center-suit {
  font-size: 3em;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.small .center-suit { font-size: 1.5em; }
.large .center-suit { font-size: 4.5em; }

.mismatched {
  transform: translateY(-10px);
  transition: transform 0.3s;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}
</style>

